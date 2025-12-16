require('dotenv').config();
const { getStats, pool, searchByRelevance } = require('../src/database/postgres');
const logger = require('../src/utils/logger');

async function showCompleteStats() {
    logger.info('\n' + '═'.repeat(70));
    logger.info('📊 ESTADÍSTICAS WHATSAPP AI ANALYZER');
    logger.info('═'.repeat(70) + '\n');
    
    try {
        // 1. Estadísticas generales
        logger.info('📈 RESUMEN GENERAL\n');
        
        const totalQuery = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as procesados,
                COUNT(*) FILTER (WHERE error_log IS NOT NULL) as errores,
                AVG(relevancia) as relevancia_promedio,
                AVG(processing_time_seconds) as tiempo_promedio
            FROM link_analysis
        `);
        
        const stats = totalQuery.rows[0];
        
        logger.info(`   Total URLs: ${stats.total}`);
        logger.info(`   Procesados exitosamente: ${stats.procesados}`);
        logger.info(`   Errores: ${stats.errores}`);
        logger.info(`   Relevancia promedio: ${parseFloat(stats.relevancia_promedio || 0).toFixed(2)}/5`);
        logger.info(`   Tiempo promedio: ${parseFloat(stats.tiempo_promedio || 0).toFixed(2)}s`);
        
        // 2. Estadísticas últimos 7 días
        logger.info('\n' + '─'.repeat(70));
        logger.info('📅 ÚLTIMOS 7 DÍAS\n');
        
        const dailyStats = await getStats();
        
        if (dailyStats.length > 0) {
            dailyStats.forEach(day => {
                logger.info(`   ${day.fecha}:`);
                logger.info(`     • Procesados: ${day.total_procesados}`);
                logger.info(`     • Relevancia: ${day.relevancia_promedio}/5`);
                logger.info(`     • Tiempo: ${day.tiempo_promedio_seg}s`);
                logger.info('');
            });
        } else {
            logger.info('   No hay datos disponibles\n');
        }
        
        // 3. Top categorías
        logger.info('─'.repeat(70));
        logger.info('🏷️  TOP CATEGORÍAS\n');
        
        const categories = await pool.query(`
            SELECT 
                categoria,
                COUNT(*) as total,
                ROUND(AVG(relevancia)::numeric, 2) as relevancia_promedio
            FROM link_analysis
            WHERE processed_at IS NOT NULL
            GROUP BY categoria
            ORDER BY total DESC
            LIMIT 10
        `);
        
        if (categories.rows.length > 0) {
            categories.rows.forEach((cat, i) => {
                logger.info(`   ${i + 1}. ${cat.categoria} (${cat.total} posts, ${cat.relevancia_promedio}/5)`);
            });
        } else {
            logger.info('   No hay datos disponibles');
        }
        
        // 4. Top plataformas
        logger.info('\n' + '─'.repeat(70));
        logger.info('📱 TOP PLATAFORMAS\n');
        
        const platforms = await pool.query(`
            SELECT 
                platform,
                COUNT(*) as total
            FROM link_analysis
            WHERE processed_at IS NOT NULL
            GROUP BY platform
            ORDER BY total DESC
        `);
        
        if (platforms.rows.length > 0) {
            platforms.rows.forEach((plat, i) => {
                logger.info(`   ${i + 1}. ${plat.platform}: ${plat.total} posts`);
            });
        } else {
            logger.info('   No hay datos disponibles');
        }
        
        // 5. Top 10 más relevantes
        logger.info('\n' + '─'.repeat(70));
        logger.info('⭐ TOP 10 MÁS RELEVANTES\n');
        
        const topRelevant = await searchByRelevance(4, 10);
        
        if (topRelevant.length > 0) {
            topRelevant.forEach((item, i) => {
                logger.info(`   ${i + 1}. [${'★'.repeat(item.relevancia)}] ${item.categoria}`);
                logger.info(`      ${item.title || 'Sin título'}`);
                logger.info(`      ${item.resumen_ejecutivo.substring(0, 100)}...`);
                logger.info(`      ${item.url.substring(0, 60)}...`);
                logger.info('');
            });
        } else {
            logger.info('   No hay posts con relevancia >= 4\n');
        }
        
        // 6. Últimos procesados
        logger.info('─'.repeat(70));
        logger.info('🕐 ÚLTIMOS 10 PROCESADOS\n');
        
        const recent = await pool.query(`
            SELECT 
                title, url, categoria, relevancia, 
                TO_CHAR(processed_at, 'YYYY-MM-DD HH24:MI') as fecha
            FROM link_analysis
            WHERE processed_at IS NOT NULL
            ORDER BY processed_at DESC
            LIMIT 10
        `);
        
        if (recent.rows.length > 0) {
            recent.rows.forEach((item, i) => {
                logger.info(`   ${i + 1}. [${item.relevancia}/5] ${item.fecha}`);
                logger.info(`      ${item.categoria}: ${item.title || 'Sin título'}`);
                logger.info(`      ${item.url.substring(0, 60)}...`);
                logger.info('');
            });
        } else {
            logger.info('   No hay datos disponibles\n');
        }
        
        // 7. Tags más frecuentes
        logger.info('─'.repeat(70));
        logger.info('🔖 TAGS MÁS FRECUENTES\n');
        
        const tags = await pool.query(`
            SELECT 
                unnest(temas_principales) as tag,
                COUNT(*) as frecuencia
            FROM link_analysis
            WHERE temas_principales IS NOT NULL
            GROUP BY tag
            ORDER BY frecuencia DESC
            LIMIT 15
        `);
        
        if (tags.rows.length > 0) {
            tags.rows.forEach((tag, i) => {
                logger.info(`   ${i + 1}. ${tag.tag} (${tag.frecuencia}x)`);
            });
        } else {
            logger.info('   No hay datos disponibles');
        }
        
        logger.info('\n' + '═'.repeat(70) + '\n');
        
    } catch (error) {
        logger.error('Error generando estadísticas:', error);
    } finally {
        await pool.end();
    }
}

showCompleteStats();
