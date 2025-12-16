const { Pool } = require('pg');
const logger = require('../utils/logger');

// Pool de conexiones PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

/**
 * Prueba la conexión a PostgreSQL
 * @returns {Promise<boolean>} True si la conexión es exitosa
 */
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        client.release();
        
        logger.info('✓ Conexión PostgreSQL establecida');
        logger.info(`  Versión: ${result.rows[0].pg_version.split(',')[0]}`);
        logger.info(`  Hora servidor: ${result.rows[0].current_time}`);
        
        return true;
    } catch (error) {
        logger.error('✗ Error conexión PostgreSQL:');
        logger.error(`  ${error.message}`);
        return false;
    }
}

/**
 * Guarda un análisis en la base de datos
 * @param {Object} data - Datos del análisis
 * @returns {Promise<number>} ID del registro insertado
 */
async function saveAnalysis(data) {
    const query = `
        INSERT INTO link_analysis (
            url, platform, author, title, 
            resumen_ejecutivo, temas_principales, insights_clave,
            relevancia, categoria, tipo_contenido, 
            contenido_completo, whatsapp_sender, 
            processing_time_seconds, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (url) DO UPDATE SET
            processed_at = $14,
            relevancia = $8,
            resumen_ejecutivo = $5,
            categoria = $9
        RETURNING id;
    `;
    
    const values = [
        data.url,
        data.platform,
        data.author,
        data.title,
        data.resumen_ejecutivo,
        data.temas_principales,
        data.insights_clave,
        data.relevancia,
        data.categoria,
        data.tipo_contenido,
        data.contenido_completo,
        data.whatsapp_sender,
        data.processing_time_seconds,
        new Date()
    ];
    
    try {
        const result = await pool.query(query, values);
        const id = result.rows[0].id;
        logger.info(`✓ Guardado en DB con ID: ${id}`);
        return id;
    } catch (error) {
        logger.error('Error guardando análisis en DB:', error.message);
        throw error;
    }
}

/**
 * Verifica si una URL ya fue procesada
 * @param {string} url - URL a verificar
 * @returns {Promise<boolean>} True si existe
 */
async function urlExists(url) {
    const query = 'SELECT id, created_at FROM link_analysis WHERE url = $1';
    const result = await pool.query(query, [url]);
    return result.rows.length > 0;
}

/**
 * Obtiene estadísticas de los últimos 7 días
 * @returns {Promise<Array>} Array con estadísticas diarias
 */
async function getStats() {
    const query = 'SELECT * FROM stats_daily LIMIT 7';
    const result = await pool.query(query);
    return result.rows;
}

/**
 * Busca análisis por categoría
 * @param {string} categoria - Categoría a buscar
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Array de análisis
 */
async function searchByCategory(categoria, limit = 10) {
    const query = `
        SELECT 
            id, url, title, resumen_ejecutivo, 
            relevancia, created_at, platform
        FROM link_analysis
        WHERE categoria = $1
        ORDER BY relevancia DESC, created_at DESC
        LIMIT $2
    `;
    const result = await pool.query(query, [categoria, limit]);
    return result.rows;
}

/**
 * Busca análisis por relevancia mínima
 * @param {number} minRelevancia - Relevancia mínima (1-5)
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Array de análisis
 */
async function searchByRelevance(minRelevancia = 4, limit = 20) {
    const query = `
        SELECT 
            id, url, title, resumen_ejecutivo, 
            categoria, relevancia, created_at, platform
        FROM link_analysis
        WHERE relevancia >= $1
        ORDER BY relevancia DESC, created_at DESC
        LIMIT $2
    `;
    const result = await pool.query(query, [minRelevancia, limit]);
    return result.rows;
}

/**
 * Búsqueda full-text en contenido
 * @param {string} searchTerm - Término a buscar
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Array de análisis
 */
async function fullTextSearch(searchTerm, limit = 10) {
    const query = `
        SELECT 
            id, url, title, resumen_ejecutivo, 
            categoria, relevancia, created_at,
            ts_rank(to_tsvector('spanish', contenido_completo), 
                    plainto_tsquery('spanish', $1)) AS rank
        FROM link_analysis
        WHERE to_tsvector('spanish', contenido_completo) @@ plainto_tsquery('spanish', $1)
        ORDER BY rank DESC, relevancia DESC
        LIMIT $2
    `;
    const result = await pool.query(query, [searchTerm, limit]);
    return result.rows;
}

/**
 * Registra un error de procesamiento
 * @param {string} url - URL que falló
 * @param {string} platform - Plataforma
 * @param {string} error - Mensaje de error
 */
async function logError(url, platform, error) {
    const query = `
        INSERT INTO link_analysis (url, platform, error_log, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (url) DO UPDATE SET
            error_log = $3,
            created_at = $4
    `;
    
    try {
        await pool.query(query, [url, platform, error, new Date()]);
    } catch (err) {
        logger.error('Error registrando fallo:', err.message);
    }
}

module.exports = { 
    testConnection, 
    saveAnalysis, 
    urlExists, 
    getStats,
    searchByCategory,
    searchByRelevance,
    fullTextSearch,
    logError,
    pool 
};
