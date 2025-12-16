require('dotenv').config();
const { connectWhatsApp } = require('./src/whatsapp');
const { testConnection } = require('./src/database/postgres');
const { testOllama } = require('./src/ai/ollama-client');
const { checkNitterAvailability } = require('./src/scrapers/twitter');
const logger = require('./src/utils/logger');

/**
 * Valida variables de entorno requeridas
 * @returns {boolean} True si todas las variables están presentes
 */
function validateEnv() {
    const required = [
        'DB_HOST',
        'DB_PORT',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME',
        'OLLAMA_MODEL'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        logger.error('❌ Variables de entorno faltantes:');
        missing.forEach(key => logger.error(`   - ${key}`));
        logger.error('\n💡 Copia .env.example a .env y configúralo');
        return false;
    }
    
    return true;
}

/**
 * Muestra banner de inicio
 */
function showBanner() {
    const banner = `
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🤖  WHATSAPP AI ANALYZER MVP                                   ║
║                                                                   ║
║   Análisis automatizado de enlaces usando IA local               ║
║   Versión: 1.0.0                                                 ║
║   Autor: Toni Ballesteros                                        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`;
    
    console.log(banner);
}

/**
 * Inicializa y arranca el sistema
 */
async function main() {
    showBanner();
    
    logger.info('🚀 Iniciando sistema...\n');
    
    // PASO 1: Validar configuración
    logger.info('📋 PASO 1/4: Validando configuración...');
    logger.info('─'.repeat(70));
    
    if (!validateEnv()) {
        process.exit(1);
    }
    
    logger.info('✓ Variables de entorno validadas\n');
    
    // PASO 2: Verificar PostgreSQL
    logger.info('📋 PASO 2/4: Verificando PostgreSQL...');
    logger.info('─'.repeat(70));
    
    const dbOk = await testConnection();
    if (!dbOk) {
        logger.error('\n❌ ABORTANDO: PostgreSQL no disponible');
        logger.error('💡 Verifica que tu container Docker esté corriendo:');
        logger.error('   docker ps | grep postgres');
        logger.error('\n💡 Si no existe la base de datos, créala:');
        logger.error('   psql -U postgres -c "CREATE DATABASE whatsapp_ai_analyzer"');
        logger.error('   psql -U postgres -d whatsapp_ai_analyzer -f sql/schema.sql');
        process.exit(1);
    }
    
    logger.info('');
    
    // PASO 3: Verificar Ollama
    logger.info('📋 PASO 3/4: Verificando Ollama...');
    logger.info('─'.repeat(70));
    
    const ollamaOk = await testOllama();
    if (!ollamaOk) {
        logger.error('\n❌ ABORTANDO: Ollama no disponible o modelo incorrecto');
        logger.error('💡 Verifica que Ollama esté ejecutándose:');
        logger.error('   ollama serve');
        logger.error('\n💡 Lista tus modelos instalados:');
        logger.error('   ollama list');
        logger.error('\n💡 Si falta el modelo, descárgalo:');
        logger.error(`   ollama pull ${process.env.OLLAMA_MODEL}`);
        process.exit(1);
    }
    
    logger.info('');
    
    // PASO 4: Verificar Nitter (opcional, no crítico)
    logger.info('📋 PASO 4/4: Verificando servicios adicionales...');
    logger.info('─'.repeat(70));
    
    const nitterInstance = await checkNitterAvailability();
    if (nitterInstance) {
        logger.info(`✓ Nitter disponible: ${nitterInstance}`);
        logger.info('  (Para scraping optimizado de Twitter/X)');
    } else {
        logger.warn('⚠️  Nitter no disponible');
        logger.warn('  (Se usará scraper universal para Twitter/X)');
    }
    
    logger.info('');
    
    // RESUMEN DE CONFIGURACIÓN
    logger.info('\n' + '═'.repeat(70));
    logger.info('📊 RESUMEN DE CONFIGURACIÓN');
    logger.info('═'.repeat(70));
    logger.info(`  Base de datos: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    logger.info(`  Modelo Ollama: ${process.env.OLLAMA_MODEL}`);
    logger.info(`  Sesión WhatsApp: ${process.env.WHATSAPP_SESSION_PATH}`);
    logger.info(`  Log level: ${process.env.LOG_LEVEL || 'info'}`);
    logger.info(`  Timeout scraping: ${process.env.SCRAPING_TIMEOUT || 30000}ms`);
    logger.info(`  Max reintentos: ${process.env.MAX_RETRIES || 2}`);
    logger.info('═'.repeat(70) + '\n');
    
    // CONFIRMAR INICIO
    logger.info('✅ TODOS LOS COMPONENTES OPERATIVOS\n');
    logger.info('═'.repeat(70));
    logger.info('🚀 INICIANDO CONEXIÓN WHATSAPP...');
    logger.info('═'.repeat(70) + '\n');
    
    // CONECTAR WHATSAPP
    try {
        await connectWhatsApp();
        
        // Sistema listo
        logger.info('\n' + '🎉'.repeat(35));
        logger.info('🎉 SISTEMA COMPLETAMENTE OPERATIVO 🎉');
        logger.info('🎉'.repeat(35) + '\n');
        
        logger.info('📱 Envíate mensajes con URLs para comenzar el análisis\n');
        
        // Estadísticas periódicas (cada 30 minutos)
        if (process.env.SHOW_STATS === 'true') {
            setInterval(showStats, 30 * 60 * 1000);
        }
        
    } catch (error) {
        logger.error('❌ ERROR FATAL iniciando WhatsApp:', error);
        process.exit(1);
    }
}

/**
 * Muestra estadísticas del sistema
 */
async function showStats() {
    try {
        const { getStats, pool } = require('./src/database/postgres');
        
        logger.info('\n' + '📊'.repeat(35));
        logger.info('📊 ESTADÍSTICAS DEL SISTEMA');
        logger.info('📊'.repeat(35));
        
        // Total procesados
        const totalQuery = await pool.query(
            'SELECT COUNT(*) as total FROM link_analysis WHERE processed_at IS NOT NULL'
        );
        logger.info(`\n   Total procesados: ${totalQuery.rows[0].total}`);
        
        // Últimas 24h
        const last24hQuery = await pool.query(`
            SELECT COUNT(*) as total
            FROM link_analysis
            WHERE processed_at >= NOW() - INTERVAL '24 hours'
        `);
        logger.info(`   Últimas 24h: ${last24hQuery.rows[0].total}`);
        
        // Por categoría
        const categoryQuery = await pool.query(`
            SELECT categoria, COUNT(*) as total
            FROM link_analysis
            WHERE processed_at IS NOT NULL
            GROUP BY categoria
            ORDER BY total DESC
            LIMIT 5
        `);
        
        logger.info('\n   Top 5 categorías:');
        categoryQuery.rows.forEach((row, i) => {
            logger.info(`   ${i + 1}. ${row.categoria}: ${row.total}`);
        });
        
        logger.info('═'.repeat(70) + '\n');
        
    } catch (error) {
        logger.error('Error mostrando estadísticas:', error);
    }
}

// === MANEJO DE SEÑALES DEL SISTEMA ===

process.on('unhandledRejection', (error) => {
    logger.error('❌ Unhandled Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('SIGINT', () => {
    logger.info('\n\n👋 Señal SIGINT recibida. Cerrando gracefully...');
    logger.info('Esperando que terminen procesos activos...\n');
    
    setTimeout(() => {
        logger.info('✓ Aplicación cerrada correctamente\n');
        process.exit(0);
    }, 2000);
});

process.on('SIGTERM', () => {
    logger.info('\n\n👋 Señal SIGTERM recibida. Cerrando...\n');
    process.exit(0);
});

// === INICIAR APLICACIÓN ===
main().catch(error => {
    logger.error('❌ Error fatal en main():', error);
    process.exit(1);
});
