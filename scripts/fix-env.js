const fs = require("fs");
const path = require("path");

console.log("🔧 Verificando y limpiando archivo .env...\n");

const envPath = path.join(__dirname, "..", ".env");

// Lee el archivo .env
let envContent = fs.readFileSync(envPath, "utf8");

console.log("📝 Contenido original del .env:");
console.log("─".repeat(70));
console.log(envContent);
console.log("─".repeat(70));

// Limpia el contenido
let cleaned = envContent
  .split("\n")
  .map((line) => {
    // Elimina espacios al inicio y final de cada línea
    line = line.trim();

    // Ignora líneas vacías y comentarios
    if (!line || line.startsWith("#")) {
      return line;
    }

    // Elimina espacios alrededor del =
    if (line.includes("=")) {
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("="); // Por si el valor tiene =
      return `${key.trim()}=${value.trim()}`;
    }

    return line;
  })
  .join("\n");

// Asegura que termina con nueva línea
if (!cleaned.endsWith("\n")) {
  cleaned += "\n";
}

// Guarda el archivo limpio
fs.writeFileSync(envPath, cleaned, "utf8");

console.log("\n✅ Archivo .env limpiado\n");

// Verifica que se puede leer correctamente
require("dotenv").config();

console.log("📋 Variables leídas por dotenv:");
console.log("─".repeat(70));
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD
    ? "***" + process.env.DB_PASSWORD.slice(-3)
    : "NO DEFINIDA"
);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("POSTGRES_USER:", process.env.POSTGRES_USER);
console.log(
  "POSTGRES_PASSWORD:",
  process.env.POSTGRES_PASSWORD
    ? "***" + process.env.POSTGRES_PASSWORD.slice(-3)
    : "NO DEFINIDA"
);
console.log("─".repeat(70));

// Valida que todas las variables críticas existen
const required = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.log("\n❌ Variables faltantes:", missing.join(", "));
  process.exit(1);
} else {
  console.log("\n✅ Todas las variables requeridas están presentes\n");
}
