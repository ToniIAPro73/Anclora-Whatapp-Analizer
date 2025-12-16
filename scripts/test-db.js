require('dotenv').config();
const { testConnection, pool } = require('../src/database/postgres');
const logger = require('../src/utils/logger');

async function testDatabase() {
    logger.info('🧪 Testing PostgreSQL Connection...\n');
    
    const connected = await testConnection();
    
    if (!connected) {
        logger.error('❌ Test fallido\n');
        process.exit(1);
    }
    
    // Verifica que existe la tabla
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'link_analysis'
        `);
        
        if (result.rows.length === 0) {
            logger.warn('⚠️  Tabla link_analysis no existe');
            logger.warn('   Ejecuta: npm run setup-db');
        } else {
            logger.info('✓ Tabla link_analysis existe');
            
            // Cuenta registros
            const count = await pool.query('SELECT COUNT(*) FROM link_analysis');
            logger.info(`✓ Registros en DB: ${count.rows[0].count}`);
        }
    } catch (error) {
        logger.error('Error verificando tablas:', error.message);
    }
    
    await pool.end();
    logger.info('\n✅ Test completado\n');
}

testDatabase();
