const { chromium } = require('playwright');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const logger = require('../utils/logger');

const SCRAPING_TIMEOUT = parseInt(process.env.SCRAPING_TIMEOUT) || 30000;
const MAX_CONTENT_LENGTH = 15000; // Caracteres máximos de contenido

/**
 * Extrae contenido de una URL usando Playwright y Readability
 * @param {string} url - URL a scrapear
 * @param {string} platform - Plataforma detectada
 * @returns {Promise<Object>} Contenido extraído
 */
async function scrapeUrl(url, platform) {
    logger.info(`📥 Scraping ${platform}: ${url.substring(0, 60)}...`);
    
    let browser;
    const startTime = Date.now();
    
    try {
        browser = await chromium.launch({ 
            headless: true,
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'es-ES'
        });
        
        const page = await context.newPage();
        
        // Bloquea recursos innecesarios para acelerar
        await page.route('**/*', (route) => {
            const resourceType = route.request().resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                route.abort();
            } else {
                route.continue();
            }
        });
        
        // Configuración específica por plataforma
        const waitConfig = getWaitConfig(platform);
        
        logger.info(`  Cargando página (timeout: ${waitConfig.timeout / 1000}s)...`);
        
        await page.goto(url, { 
            waitUntil: waitConfig.waitUntil, 
            timeout: waitConfig.timeout 
        });
        
        // Espera adicional para contenido dinámico
        await page.waitForTimeout(waitConfig.extraWait);
        
        const html = await page.content();
        const pageTitle = await page.title();
        
        // Intenta extraer con Readability
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        
        let result;
        
        if (article && article.content && article.textContent.length > 100) {
            // Éxito con Readability
            const textContent = cleanText(article.textContent);
            
            result = {
                title: article.title || pageTitle,
                content: truncateContent(textContent),
                excerpt: article.excerpt || textContent.substring(0, 300),
                author: article.byline || extractAuthorFallback(page, platform),
                scraping_method: 'readability'
            };
            
            logger.info(`  ✓ Extraído con Readability: ${result.content.length} caracteres`);
        } else {
            // Fallback: extrae texto visible
            logger.warn('  ⚠ Readability falló, usando fallback');
            
            const bodyText = await page.evaluate(() => {
                // Elimina scripts, styles, nav, footer
                const removeSelectors = 'script, style, nav, footer, header, aside, iframe';
                document.querySelectorAll(removeSelectors).forEach(el => el.remove());
                
                return document.body.innerText;
            });
            
            const cleanedText = cleanText(bodyText);
            
            result = {
                title: pageTitle,
                content: truncateContent(cleanedText),
                excerpt: cleanedText.substring(0, 300),
                author: await extractAuthorFallback(page, platform),
                scraping_method: 'fallback'
            };
            
            logger.info(`  ✓ Extraído con fallback: ${result.content.length} caracteres`);
        }
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`  ⏱ Scraping completado en ${elapsedTime}s`);
        
        return result;
        
    } catch (error) {
        logger.error(`❌ Error scraping ${url}:`, error.message);
        
        // Si es timeout, indica específicamente
        if (error.message.includes('Timeout')) {
            logger.error('  Timeout excedido. Considera aumentar SCRAPING_TIMEOUT en .env');
        }
        
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Obtiene configuración de espera según plataforma
 * @param {string} platform - Plataforma
 * @returns {Object} Configuración de timeouts
 */
function getWaitConfig(platform) {
    const configs = {
        'linkedin': {
            waitUntil: 'networkidle',
            timeout: 60000,
            extraWait: 3000
        },
        'twitter': {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
            extraWait: 2000
        },
        'instagram': {
            waitUntil: 'networkidle',
            timeout: 45000,
            extraWait: 2000
        },
        'medium': {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
            extraWait: 1000
        },
        'default': {
            waitUntil: 'domcontentloaded',
            timeout: SCRAPING_TIMEOUT,
            extraWait: 2000
        }
    };
    
    return configs[platform] || configs['default'];
}

/**
 * Limpia texto eliminando espacios excesivos y caracteres especiales
 * @param {string} text - Texto a limpiar
 * @returns {string} Texto limpio
 */
function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')  // Múltiples espacios → 1 espacio
        .replace(/\n{3,}/g, '\n\n')  // Múltiples saltos → máximo 2
        .replace(/[^\S\n]+/g, ' ')  // Espacios no visibles
        .trim();
}

/**
 * Trunca contenido a longitud máxima manteniendo párrafos completos
 * @param {string} content - Contenido a truncar
 * @returns {string} Contenido truncado
 */
function truncateContent(content) {
    if (content.length <= MAX_CONTENT_LENGTH) {
        return content;
    }
    
    // Trunca en el último punto antes del límite
    const truncated = content.substring(0, MAX_CONTENT_LENGTH);
    const lastPeriod = truncated.lastIndexOf('.');
    
    if (lastPeriod > MAX_CONTENT_LENGTH * 0.8) {
        return truncated.substring(0, lastPeriod + 1) + '...';
    }
    
    return truncated + '...';
}

/**
 * Intenta extraer autor usando selectores específicos por plataforma
 * @param {Page} page - Página Playwright
 * @param {string} platform - Plataforma
 * @returns {Promise<string|null>} Nombre del autor
 */
async function extractAuthorFallback(page, platform) {
    const selectors = {
        'linkedin': [
            '.feed-shared-actor__name',
            '.update-components-actor__name',
            '[data-control-name="actor"]'
        ],
        'medium': [
            'a[rel="author"]',
            '.author-name',
            '[data-testid="authorName"]'
        ],
        'twitter': [
            '[data-testid="User-Name"]',
            '.css-901oao.r-1awozwy'
        ],
        'default': [
            '[rel="author"]',
            '.author',
            '.by-author',
            '[itemprop="author"]'
        ]
    };
    
    const platformSelectors = selectors[platform] || selectors['default'];
    
    for (const selector of platformSelectors) {
        try {
            const element = await page.$(selector);
            if (element) {
                const text = await element.textContent();
                if (text && text.trim()) {
                    return text.trim();
                }
            }
        } catch (e) {
            // Continúa con siguiente selector
        }
    }
    
    return null;
}

module.exports = { scrapeUrl };
