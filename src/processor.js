const { scrapeUrl } = require('./scrapers/universal');
const { scrapeTwitter } = require('./scrapers/twitter');
const { analyzeContent } = require('./ai/ollama-client');
const { saveAnalysis, urlExists, logError } = require('./database/postgres');
const { isScrapeable } = require('./utils/url-detector');
const logger = require('./utils/logger');

const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 2;

/**
 * Procesa una URL completa: scraping → análisis → almacenamiento
 * @param {string} url - URL a procesar
 * @param {string} platform - Plataforma detectada
 * @param {string} senderId - ID del remitente WhatsApp
 * @returns {Promise<void>}
 */
async function processUrl(url, platform, senderId) {
    const startTime = Date.now();
    
    logger.info('\n' + '='.repeat(70));
    logger.info(`🔄 PROCESANDO: ${url}`);
    logger.info(`   Plataforma: ${platform} | Remitente: ${senderId}`);
    logger.info('='.repeat(70));
    
    try {
        // VALIDACIÓN 1: Verifica si ya fue procesada
        const exists = await urlExists(url);
        if (exists) {
            logger.info('⏭️  URL ya procesada previamente - Saltando');
            logger.info('='.repeat(70) + '\n');
            return;
        }
        
        // VALIDACIÓN 2: Verifica si es scrapeable
        if (!isScrapeable(url)) {
            logger.warn('⚠️  URL no scrapeable (requiere login o es privada)');
            await logError(url, platform, 'URL requiere autenticación');
            logger.info('='.repeat(70) + '\n');
            return;
        }
        
        // PASO 1: SCRAPING
        logger.info('\n📥 PASO 1/3: Extracción de contenido');
        logger.info('-'.repeat(70));
        
        const scraped = await scrapeWithRetry(url, platform);
        
        if (!scraped || !scraped.content) {
            throw new Error('No se pudo extraer contenido después de reintentos');
        }
        
        // Validación de contenido mínimo
        if (scraped.content.length < 50) {
            throw new Error('Contenido extraído demasiado corto (< 50 caracteres)');
        }
        
        logger.info(`✓ Contenido extraído:`);
        logger.info(`  - Método: ${scraped.scraping_method || 'unknown'}`);
        logger.info(`  - Título: ${scraped.title ? scraped.title.substring(0, 60) : 'N/A'}...`);
        logger.info(`  - Autor: ${scraped.author || 'Desconocido'}`);
        logger.info(`  - Longitud: ${scraped.content.length} caracteres`);
        
        // PASO 2: ANÁLISIS IA
        logger.info('\n🤖 PASO 2/3: Análisis con Ollama');
        logger.info('-'.repeat(70));
        
        const analysis = await analyzeContent(scraped.content, url, platform);
        
        if (!analysis) {
            throw new Error('Error en análisis AI - respuesta nula');
        }
        
        logger.info(`✓ Análisis completado:`);
        logger.info(`  - Categoría: ${analysis.categoria}`);
        logger.info(`  - Tipo: ${analysis.tipo_contenido}`);
        logger.info(`  - Relevancia: ${analysis.relevancia}/5 ${'⭐'.repeat(analysis.relevancia)}`);
        logger.info(`  - Temas: ${analysis.temas_principales.join(', ')}`);
        logger.info(`  - Insights: ${analysis.insights_clave.length} puntos clave`);
        logger.info(`  - Tiempo inferencia: ${analysis.processing_time_seconds}s`);
        
        // PASO 3: ALMACENAMIENTO
        logger.info('\n💾 PASO 3/3: Guardando en PostgreSQL');
        logger.info('-'.repeat(70));
        
        const recordId = await saveAnalysis({
            url,
            platform,
            author: scraped.author,
            title: scraped.title,
            resumen_ejecutivo: analysis.resumen_ejecutivo,
            temas_principales: analysis.temas_principales,
            insights_clave: analysis.insights_clave,
            relevancia: analysis.relevancia,
            categoria: analysis.categoria,
            tipo_contenido: analysis.tipo_contenido,
            contenido_completo: scraped.content,
            whatsapp_sender: senderId,
            processing_time_seconds: analysis.processing_time_seconds
        });
        
        logger.info(`✓ Registro guardado con ID: ${recordId}`);
        
        // RESUMEN FINAL
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info('\n✅ PROCESAMIENTO COMPLETADO EXITOSAMENTE');
        logger.info(`   Tiempo total: ${totalTime}s`);
        logger.info(`   Relevancia: ${analysis.relevancia}/5`);
        logger.info('='.repeat(70) + '\n');
        
        // Log especial para contenido muy relevante
        if (analysis.relevancia >= 4) {
            logger.info(`⭐ CONTENIDO ALTAMENTE RELEVANTE DETECTADO`);
            logger.info(`   ${analysis.categoria}: ${scraped.title}`);
            logger.info(`   ${analysis.resumen_ejecutivo}`);
            logger.info('='.repeat(70) + '\n');
        }
        
    } catch (error) {
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        logger.error('\n❌ ERROR EN PROCESAMIENTO');
        logger.error(`   URL: ${url}`);
        logger.error(`   Error: ${error.message}`);
        logger.error(`   Tiempo transcurrido: ${totalTime}s`);
        logger.error('='.repeat(70) + '\n');
        
        // Registra error en base de datos
        try {
            await logError(url, platform, error.message);
        } catch (dbError) {
            logger.error('No se pudo registrar error en DB:', dbError.message);
        }
    }
}

/**
 * Scraping con sistema de reintentos
 * @param {string} url - URL a scrapear
 * @param {string} platform - Plataforma
 * @returns {Promise<Object>} Contenido extraído
 */
async function scrapeWithRetry(url, platform) {
    let lastError;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            logger.info(`  Intento ${attempt}/${MAX_RETRIES}`);
            
            let scraped;
            
            // Usa scraper especializado para Twitter
            if (platform === 'twitter') {
                scraped = await scrapeTwitter(url);
                
                // Si Nitter falla, fallback a scraper universal
                if (!scraped) {
                    logger.warn('  Nitter falló, intentando scraper universal...');
                    scraped = await scrapeUrl(url, platform);
                }
            } else {
                scraped = await scrapeUrl(url, platform);
            }
            
            if (scraped && scraped.content) {
                return scraped;
            }
            
            throw new Error('Scraping retornó contenido vacío');
            
        } catch (error) {
            lastError = error;
            logger.warn(`  ⚠ Intento ${attempt} falló: ${error.message}`);
            
            if (attempt < MAX_RETRIES) {
                const waitTime = attempt * 2; // Espera progresiva: 2s, 4s
                logger.info(`  ⏳ Esperando ${waitTime}s antes de reintentar...`);
                await sleep(waitTime * 1000);
            }
        }
    }
    
    throw new Error(`Scraping falló después de ${MAX_RETRIES} intentos: ${lastError.message}`);
}

/**
 * Procesa múltiples URLs en secuencia
 * @param {string[]} urls - Array de URLs
 * @param {string} senderId - ID del remitente
 * @returns {Promise<Object>} Resumen de procesamiento
 */
async function processBatch(urls, senderId) {
    const results = {
        total: urls.length,
        exitosos: 0,
        fallidos: 0,
        saltados: 0
    };
    
    logger.info(`\n${'═'.repeat(70)}`);
    logger.info(`📦 PROCESAMIENTO BATCH: ${urls.length} URLs`);
    logger.info(`${'═'.repeat(70)}\n`);
    
    for (let i = 0; i < urls.length; i++) {
        logger.info(`\n[${i + 1}/${urls.length}] `);
        
        try {
            await processUrl(urls[i], 'unknown', senderId);
            results.exitosos++;
        } catch (error) {
            results.fallidos++;
        }
        
        // Pequeña pausa entre URLs para no saturar
        if (i < urls.length - 1) {
            await sleep(1000);
        }
    }
    
    logger.info(`\n${'═'.repeat(70)}`);
    logger.info('📊 RESUMEN BATCH');
    logger.info(`${'═'.repeat(70)}`);
    logger.info(`   Total procesadas: ${results.total}`);
    logger.info(`   Exitosas: ${results.exitosos} ✓`);
    logger.info(`   Fallidas: ${results.fallidos} ✗`);
    logger.info(`   Saltadas: ${results.saltados} ⏭`);
    logger.info(`${'═'.repeat(70)}\n`);
    
    return results;
}

/**
 * Utilidad para pausas
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { 
    processUrl,
    processBatch
};
