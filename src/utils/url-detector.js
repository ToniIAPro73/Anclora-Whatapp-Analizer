const logger = require('./logger');

/**
 * Extrae y limpia URLs de un texto
 * @param {string} text - Texto que puede contener URLs
 * @returns {string[]} Array de URLs limpias
 */
function extractUrls(text) {
    if (!text) return [];
    
    // Regex mejorada para detectar URLs
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
    const urls = text.match(urlRegex) || [];
    
    // Limpia y normaliza URLs
    return urls.map(url => {
        try {
            const parsed = new URL(url);
            
            // Parámetros esenciales a mantener por plataforma
            const essentialParams = {
                'youtube.com': ['v'],
                'youtu.be': [],
                'linkedin.com': [],
                'twitter.com': ['status'],
                'x.com': ['status'],
                'instagram.com': ['p'],
                'tiktok.com': ['video'],
                'facebook.com': ['posts']
            };
            
            // Detecta dominio
            const hostname = parsed.hostname.toLowerCase();
            const paramsToKeep = Object.entries(essentialParams)
                .find(([domain]) => hostname.includes(domain))?.[1] || [];
            
            // Reconstruye parámetros
            const newParams = new URLSearchParams();
            paramsToKeep.forEach(param => {
                if (parsed.searchParams.has(param)) {
                    newParams.set(param, parsed.searchParams.get(param));
                }
            });
            
            parsed.search = newParams.toString();
            
            // Elimina hash fragments innecesarios
            if (parsed.hash && !parsed.hash.includes('post')) {
                parsed.hash = '';
            }
            
            return parsed.toString();
        } catch (e) {
            logger.warn(`URL inválida o malformada: ${url}`);
            return url;
        }
    }).filter(url => {
        // Filtra URLs muy cortas o sospechosas
        try {
            const parsed = new URL(url);
            return parsed.hostname.includes('.') && parsed.pathname.length > 1;
        } catch {
            return false;
        }
    });
}

/**
 * Detecta la plataforma de una URL
 * @param {string} url - URL a analizar
 * @returns {string} Nombre de la plataforma
 */
function detectPlatform(url) {
    const urlLower = url.toLowerCase();
    
    const platforms = {
        'linkedin.com': 'linkedin',
        'twitter.com': 'twitter',
        'x.com': 'twitter',
        'instagram.com': 'instagram',
        'tiktok.com': 'tiktok',
        'facebook.com': 'facebook',
        'youtube.com': 'youtube',
        'youtu.be': 'youtube',
        'medium.com': 'medium',
        'substack.com': 'substack',
        'github.com': 'github'
    };
    
    for (const [domain, platform] of Object.entries(platforms)) {
        if (urlLower.includes(domain)) {
            return platform;
        }
    }
    
    return 'generic';
}

/**
 * Valida si una URL es accesible para scraping
 * @param {string} url - URL a validar
 * @returns {boolean} True si es scrapeable
 */
function isScrapeable(url) {
    const blockedPatterns = [
        'login',
        'signin',
        'signup',
        'register',
        'auth',
        'private'
    ];
    
    const urlLower = url.toLowerCase();
    return !blockedPatterns.some(pattern => urlLower.includes(pattern));
}

module.exports = { 
    extractUrls, 
    detectPlatform,
    isScrapeable
};
