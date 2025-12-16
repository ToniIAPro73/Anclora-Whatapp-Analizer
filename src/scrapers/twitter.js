const fetch = require('node-fetch');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

// Instancias públicas de Nitter (frontends alternativos de Twitter)
const NITTER_INSTANCES = [
    'nitter.poast.org',
    'nitter.privacydev.net',
    'nitter.net',
    'nitter.unixfox.eu'
];

/**
 * Extrae contenido de un tweet usando Nitter
 * @param {string} url - URL de Twitter/X
 * @returns {Promise<Object>} Contenido del tweet
 */
async function scrapeTwitter(url) {
    logger.info(`🐦 Scraping Twitter: ${url.substring(0, 60)}...`);
    
    // Intenta cada instancia de Nitter hasta que una funcione
    for (const instance of NITTER_INSTANCES) {
        const nitterUrl = convertToNitter(url, instance);
        
        try {
            logger.info(`  Intentando instancia: ${instance}`);
            
            const response = await fetch(nitterUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'es-ES,es;q=0.9'
                },
                timeout: 15000
            });
            
            if (!response.ok) {
                logger.warn(`  ⚠ ${instance} retornó ${response.status}`);
                continue;
            }
            
            const html = await response.text();
            const $ = cheerio.load(html);
            
            // Extrae componentes del tweet
            const tweetText = $('.tweet-content').first().text().trim();
            const fullName = $('.fullname').first().text().trim();
            const username = $('.username').first().text().trim();
            const timestamp = $('.tweet-date a').first().attr('title');
            const stats = extractStats($);
            
            if (!tweetText || tweetText.length < 10) {
                logger.warn(`  ⚠ ${instance} no retornó contenido válido`);
                continue;
            }
            
            // Extrae hilos si existen
            const threadTweets = [];
            $('.timeline-item .tweet-content').each((i, elem) => {
                if (i > 0) {  // Salta el primero (ya capturado)
                    const threadText = $(elem).text().trim();
                    if (threadText) threadTweets.push(threadText);
                }
            });
            
            // Construye contenido completo
            let content = tweetText;
            if (threadTweets.length > 0) {
                content += '\n\n' + threadTweets.join('\n\n');
            }
            
            const result = {
                title: `Tweet de ${fullName || username}`,
                content: content,
                excerpt: tweetText.substring(0, 200),
                author: fullName || username,
                metadata: {
                    username: username,
                    timestamp: timestamp,
                    stats: stats,
                    is_thread: threadTweets.length > 0,
                    thread_length: threadTweets.length + 1
                }
            };
            
            logger.info(`  ✓ Tweet extraído exitosamente desde ${instance}`);
            logger.info(`  📊 Stats: ${stats.replies} respuestas, ${stats.retweets} RTs, ${stats.likes} likes`);
            
            return result;
            
        } catch (error) {
            logger.warn(`  ⚠ Error con ${instance}: ${error.message}`);
            continue;
        }
    }
    
    // Si todas las instancias fallaron
    logger.error('❌ Todas las instancias de Nitter fallaron');
    logger.error('   Fallback: Se usará scraper universal (puede tener limitaciones)');
    
    return null;
}

/**
 * Convierte URL de Twitter/X a Nitter
 * @param {string} url - URL original
 * @param {string} instance - Instancia de Nitter
 * @returns {string} URL de Nitter
 */
function convertToNitter(url, instance) {
    return url
        .replace('twitter.com', instance)
        .replace('x.com', instance)
        .replace('mobile.twitter.com', instance)
        .replace('www.twitter.com', instance);
}

/**
 * Extrae estadísticas del tweet (likes, RTs, respuestas)
 * @param {CheerioAPI} $ - Objeto Cheerio
 * @returns {Object} Estadísticas
 */
function extractStats($) {
    const stats = {
        replies: 0,
        retweets: 0,
        likes: 0
    };
    
    try {
        // Nitter usa iconos y spans para las stats
        $('.tweet-stats .icon-container').each((i, elem) => {
            const text = $(elem).text().trim();
            const value = parseInt(text.replace(/,/g, '')) || 0;
            
            if ($(elem).find('.icon-comment').length > 0) {
                stats.replies = value;
            } else if ($(elem).find('.icon-retweet').length > 0) {
                stats.retweets = value;
            } else if ($(elem).find('.icon-heart').length > 0) {
                stats.likes = value;
            }
        });
    } catch (e) {
        logger.warn('  ⚠ No se pudieron extraer estadísticas');
    }
    
    return stats;
}

/**
 * Verifica si Nitter está disponible
 * @returns {Promise<string|null>} Instancia disponible o null
 */
async function checkNitterAvailability() {
    for (const instance of NITTER_INSTANCES) {
        try {
            const response = await fetch(`https://${instance}`, {
                timeout: 5000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            if (response.ok) {
                return instance;
            }
        } catch (e) {
            continue;
        }
    }
    return null;
}

module.exports = { 
    scrapeTwitter,
    checkNitterAvailability
};
