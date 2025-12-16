require("dotenv").config();
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const logger = require("../src/utils/logger");

function execDocker(command, description) {
  try {
    logger.info(`📝 ${description}...`);
    const output = execSync(command, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    logger.info(`✓ ${description} completado`);
    if (output && output.trim()) {
      logger.info(`   Salida: ${output.trim()}`);
    }
    return { success: true, output };
  } catch (error) {
    const errorMessage = error.stderr ? error.stderr.toString() : error.message;

    // Ignorar errores de "ya existe"
    if (
      errorMessage.includes("already exists") ||
      errorMessage.includes("ya existe")
    ) {
      logger.warn(`⚠️  ${description} - Ya existe, continuando...`);
      return { success: true, output: errorMessage, warning: true };
    }

    logger.error(`❌ Error en ${description}`);
    logger.error(`   ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

async function setupDatabase() {
  // Validar variables requeridas
  const requiredEnvVars = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
  ];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error("❌ Variables de entorno faltantes en .env:");
    missing.forEach((key) => logger.error(`   - ${key}`));
    process.exit(1);
  }

  logger.info("🔧 Iniciando setup de base de datos...\n");
  logger.info("📋 Configuración:");
  logger.info(`   DB_HOST: ${process.env.DB_HOST}`);
  logger.info(`   DB_PORT: ${process.env.DB_PORT}`);
  logger.info(`   DB_USER: ${process.env.DB_USER}`);
  logger.info(`   DB_PASSWORD: ***${process.env.DB_PASSWORD.slice(-3)}`);
  logger.info(`   DB_NAME: ${process.env.DB_NAME}\n`);

  // Detectar nombre del contenedor
  const containerName = "anclora-postgres"; // Ajusta si es diferente

  logger.info(`🐳 Usando contenedor Docker: ${containerName}\n`);

  // Verificar que el contenedor está corriendo
  try {
    execSync(`docker ps --filter name=${containerName} --format "{{.Names}}"`, {
      encoding: "utf8",
    });
    logger.info("✓ Contenedor PostgreSQL está corriendo\n");
  } catch (error) {
    logger.error("❌ El contenedor PostgreSQL no está corriendo");
    logger.error(`   Ejecuta: docker start ${containerName}`);
    process.exit(1);
  }

  logger.info("═".repeat(70));
  logger.info("EJECUTANDO SETUP CON COMANDOS DOCKER");
  logger.info("═".repeat(70) + "\n");

  // PASO 1: Crear usuario
  const createUser = execDocker(
    `docker exec -i ${containerName} psql -U postgres -c "CREATE USER ${process.env.DB_USER} WITH PASSWORD '${process.env.DB_PASSWORD}';"`,
    `Creando usuario: ${process.env.DB_USER}`
  );

  if (!createUser.success && !createUser.warning) {
    logger.error("\n❌ No se pudo crear el usuario");
    process.exit(1);
  }

  // PASO 2: Crear base de datos
  const createDB = execDocker(
    `docker exec -i ${containerName} psql -U postgres -c "CREATE DATABASE ${process.env.DB_NAME} OWNER ${process.env.DB_USER};"`,
    `Creando base de datos: ${process.env.DB_NAME}`
  );

  if (!createDB.success && !createDB.warning) {
    logger.error("\n❌ No se pudo crear la base de datos");
    process.exit(1);
  }

  // PASO 3: Conceder privilegios
  const grantPrivs = execDocker(
    `docker exec -i ${containerName} psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${process.env.DB_NAME} TO ${process.env.DB_USER};"`,
    "Asignando privilegios"
  );

  if (!grantPrivs.success) {
    logger.error("\n❌ No se pudieron asignar privilegios");
    process.exit(1);
  }

  // PASO 4: Configurar permisos en schema
  logger.info("\n📝 Configurando permisos en schema public...");

  const schemaPerms = execDocker(
    `docker exec -i ${containerName} psql -U postgres -d ${process.env.DB_NAME} -c "GRANT ALL ON SCHEMA public TO ${process.env.DB_USER}; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${process.env.DB_USER}; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${process.env.DB_USER};"`,
    "Configurando permisos schema"
  );

  if (!schemaPerms.success) {
    logger.error("\n❌ No se pudieron configurar permisos del schema");
    process.exit(1);
  }

  // PASO 5: Aplicar schema SQL
  logger.info("\n📝 Aplicando schema SQL...");

  const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");

  if (!fs.existsSync(schemaPath)) {
    logger.error(`❌ Archivo schema.sql no encontrado en: ${schemaPath}`);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  logger.info(`   Archivo leído: ${schemaSql.length} caracteres`);

  try {
    // Escribir SQL a stdin de psql
    const applySchema = execSync(
      `docker exec -i ${containerName} psql -U ${process.env.DB_USER} -d ${process.env.DB_NAME}`,
      {
        input: schemaSql,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );
    logger.info("✓ Schema aplicado exitosamente");
  } catch (error) {
    logger.error("❌ Error aplicando schema");
    logger.error(`   ${error.message}`);
    process.exit(1);
  }

  // PASO 6: Verificar instalación
  logger.info("\n📝 Verificando instalación...");

  try {
    const verifyTable = execSync(
      `docker exec -i ${containerName} psql -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'link_analysis';"`,
      { encoding: "utf8" }
    );

    const tableCount = parseInt(verifyTable.trim());

    if (tableCount === 0) {
      throw new Error("Tabla link_analysis no fue creada");
    }

    logger.info("✓ Tabla link_analysis creada correctamente");

    const verifyCount = execSync(
      `docker exec -i ${containerName} psql -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -t -c "SELECT COUNT(*) FROM link_analysis;"`,
      { encoding: "utf8" }
    );

    logger.info(`✓ Registros iniciales: ${verifyCount.trim()}`);
  } catch (error) {
    logger.error("❌ Error verificando instalación");
    logger.error(`   ${error.message}`);
    process.exit(1);
  }

  // RESUMEN
  logger.info("\n" + "═".repeat(70));
  logger.info("✅ SETUP COMPLETADO EXITOSAMENTE");
  logger.info("═".repeat(70));
  logger.info(`Usuario: ${process.env.DB_USER}`);
  logger.info(`Base de datos: ${process.env.DB_NAME}`);
  logger.info(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  logger.info(`Contenedor: ${containerName}`);
  logger.info("═".repeat(70) + "\n");

  logger.info("📋 Próximos pasos:");
  logger.info("1. Ejecuta: npm run test-db");
  logger.info("2. Ejecuta: npm run test-ollama");
  logger.info("3. Ejecuta: npm start\n");
}

// Ejecutar
setupDatabase().catch((error) => {
  console.error("\n❌ Error fatal:", error);
  process.exit(1);
});
