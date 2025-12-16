require('dotenv').config();
const { scrapeUrl } = require('../src/scrapers/universal');
const { scrapeTwitter } = require('../src/scrapers/twitter');
const logger = require('../src/utils/logger');

// URLs de prueba por plataforma
const TEST_URLS = {
    generic: 'https://example.com',
    medium: 'https://medium.com/@example/test-article',
    github: 'https://github.com/nodejs/node',
    // Agrega URLs reales aquí para testing
};

async function testScrapers() {
    logger.info('🧪 Testing Scrapers...\n');
    logger.info('═'.repeat(70));
    logger.info('NOTA: Usa URLs reales para obtener mejores resultados');
    logger.info('═'.repeat(70) + '\n');
    
    // Test scraper universal
    logger.info('Test 1: Scraper Universal\n');
    
    try {
        logger.info(`Scraping: ${TEST_URLS.github}`);
        const result = await scrapeUrl(TEST_URLS.github, 'github');
        
        if (result && result.content) {
            logger.info('\n✓ Scraping exitoso:');
            logger.info(`  - Título: ${result.title}`);
            logger.info(`  - Autor: ${result.author || 'N/A'}`);
            logger.info(`  - Contenido: ${result.content.length} caracteres`);
            logger.info(`  - Método: ${result.scraping_method}`);
            logger.info(`  - Excerpt: ${result.excerpt.substring(0, 100)}...`);
        } else {
            logger.error('✗ Scraping falló - resultado vacío');
        }
    } catch (error) {
        logger.error('✗ Error en scraping:', error.message);
    }
    
    logger.info('\n' + '─'.repeat(70) + '\n');
    
    // Test Twitter scraper
    logger.info('Test 2: Twitter Scraper (Nitter)\n');
    logger.info('Para este test, proporciona una URL real de Twitter/X\n');
    
    const twitterUrl = process.argv[2]; // Acepta URL como argumento
    
    if (twitterUrl && (twitterUrl.includes('twitter.com') || twitterUrl.includes('x.com'))) {
        try {
            logger.info(`Scraping: ${twitterUrl}`);
            const result = await scrapeTwitter(twitterUrl);
            
            if (result && result.content) {
                logger.info('\n✓ Scraping exitoso:');
                logger.info(`  - Título: ${result.title}`);
                logger.info(`  - Autor: ${result.author}`);
                logger.info(`  - Contenido: ${result.content.length} caracteres`);
                logger.info(`  - Tweet: ${result.content.substring(0, 200)}...`);
                
                if (result.metadata) {
                    logger.info(`  - Es hilo: ${result.metadata.is_thread ? 'Sí' : 'No'}`);
                    if (result.metadata.stats) {
                        logger.info(`  - Stats: ${result.metadata.stats.likes} likes, ${result.metadata.stats.retweets} RTs`);
                    }
                }
            } else {
                logger.warn('⚠️  Nitter no disponible - se usaría scraper universal');
            }
        } catch (error) {
            logger.error('✗ Error en scraping Twitter:', error.message);
        }
    } else {
        logger.warn('⚠️  No se proporcionó URL de Twitter para test');
        logger.warn('   Uso: npm run test-scraper https://twitter.com/user/status/123456');
    }
    
    logger.info('\n═'.repeat(70));
    logger.info('✅ Tests de scraping completados\n');
    logger.info('💡 Para testing completo, ejecuta con URLs reales:');
    logger.info('   node scripts/test-scraper.js https://url-real.com\n');
}

testScrapers();
