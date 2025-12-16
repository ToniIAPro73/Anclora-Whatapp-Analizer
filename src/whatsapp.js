const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const logger = require('./utils/logger');
const { extractUrls, detectPlatform } = require('./utils/url-detector');
const { processUrl } = require('./processor');

let sock = null;
let isProcessing = false;
const processingQueue = [];

/**
 * Conecta con WhatsApp usando Baileys
 * @returns {Promise<WASocket>} Socket de WhatsApp
 */
async function connectWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(
        process.env.WHATSAPP_SESSION_PATH || './auth_info'
    );
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Lo mostramos nosotros con mejor formato
        logger: pino({ level: 'silent' }), // Silencia logs de Baileys
        browser: ['WhatsApp AI Analyzer', 'Chrome', '120.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true
    });
    
    // === MANEJO DE CONEXIÓN ===
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            logger.info('\n' + '═'.repeat(70));
            logger.info('📱 ESCANEA EL CÓDIGO QR CON WHATSAPP');
            logger.info('═'.repeat(70) + '\n');
            
            // Muestra QR en terminal
            qrcode.generate(qr, { small: true });
            
            logger.info('\n' + '═'.repeat(70));
            logger.info('INSTRUCCIONES:');
            logger.info('1. Abre WhatsApp en tu teléfono');
            logger.info('2. Ve a Configuración > Dispositivos vinculados');
            logger.info('3. Toca "Vincular dispositivo"');
            logger.info('4. Escanea el código QR de arriba');
            logger.info('═'.repeat(70) + '\n');
        }
        
        if (connection === 'close') {
            const shouldReconnect = 
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            logger.warn(`⚠️  Conexión cerrada. Razón: ${lastDisconnect?.error?.message}`);
            
            if (shouldReconnect) {
                logger.info('🔄 Reconectando en 5 segundos...');
                setTimeout(() => connectWhatsApp(), 5000);
            } else {
                logger.error('❌ Sesión cerrada. Elimina ./auth_info y vuelve a escanear QR');
            }
        } else if (connection === 'open') {
            logger.info('\n' + '✅'.repeat(35));
            logger.info('✅ WHATSAPP CONECTADO EXITOSAMENTE ✅');
            logger.info('✅'.repeat(35) + '\n');
            
            // Obtiene info del usuario conectado
            const user = sock.user;
            if (user) {
                logger.info(`👤 Usuario: ${user.name || user.id}`);
                logger.info(`📱 Número: ${user.id.split(':')[0]}`);
            }
            
            logger.info('\n🚀 Sistema listo. Esperando mensajes...\n');
            logger.info('💡 TIP: Envíate un mensaje con URLs para probar\n');
        }
    });
    
    // === GUARDAR CREDENCIALES ===
    sock.ev.on('creds.update', saveCreds);
    
    // === PROCESAMIENTO DE MENSAJES ===
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        // Solo procesa mensajes nuevos
        if (type !== 'notify') return;
        
        for (const msg of messages) {
            await handleMessage(msg);
        }
    });
    
    // === MANEJO DE ERRORES ===
    sock.ev.on('call', async (calls) => {
        // Auto-rechaza llamadas para evitar interrupciones
        for (const call of calls) {
            await sock.rejectCall(call.id, call.from);
            logger.info('📞 Llamada auto-rechazada de:', call.from);
        }
    });
    
    return sock;
}

/**
 * Maneja mensajes entrantes
 * @param {Object} msg - Mensaje de WhatsApp
 */
async function handleMessage(msg) {
    try {
        // Ignora mensajes propios
        if (msg.key.fromMe) return;
        
        // Ignora mensajes de estado/broadcast
        if (msg.key.remoteJid === 'status@broadcast') return;
        
        // Extrae texto del mensaje (soporta múltiples tipos)
        const text = extractMessageText(msg);
        
        if (!text) return;
        
        // Detecta URLs en el mensaje
        const urls = extractUrls(text);
        
        if (urls.length === 0) return;
        
        // Información del remitente
        const senderId = msg.key.remoteJid.split('@')[0];
        const isGroup = msg.key.remoteJid.includes('@g.us');
        const chatType = isGroup ? '👥 Grupo' : '👤 Personal';
        
        logger.info('\n' + '🔔'.repeat(35));
        logger.info(`📱 MENSAJE RECIBIDO (${chatType})`);
        logger.info('🔔'.repeat(35));
        logger.info(`   De: ${senderId}`);
        logger.info(`   URLs detectadas: ${urls.length}`);
        logger.info('─'.repeat(70) + '\n');
        
        // Envía confirmación al usuario (opcional)
        if (process.env.SEND_CONFIRMATIONS === 'true') {
            await sendMessage(msg.key.remoteJid, 
                `🤖 Detecté ${urls.length} URL(s). Procesando...`
            );
        }
        
        // Agrega a cola de procesamiento
        for (const url of urls) {
            const platform = detectPlatform(url);
            processingQueue.push({ url, platform, senderId, chatId: msg.key.remoteJid });
        }
        
        // Inicia procesamiento si no está activo
        if (!isProcessing) {
            processQueue();
        }
        
    } catch (error) {
        logger.error('Error manejando mensaje:', error);
    }
}

/**
 * Procesa cola de URLs secuencialmente
 */
async function processQueue() {
    if (processingQueue.length === 0) {
        isProcessing = false;
        return;
    }
    
    isProcessing = true;
    
    const task = processingQueue.shift();
    const { url, platform, senderId, chatId } = task;
    
    try {
        await processUrl(url, platform, senderId);
        
        // Opcional: Notifica éxito
        if (process.env.SEND_RESULTS === 'true') {
            await sendMessage(chatId, `✅ Procesado: ${url.substring(0, 50)}...`);
        }
        
    } catch (error) {
        logger.error(`Error procesando ${url}:`, error);
        
        // Opcional: Notifica error
        if (process.env.SEND_ERRORS === 'true') {
            await sendMessage(chatId, `❌ Error procesando: ${url.substring(0, 50)}...`);
        }
    }
    
    // Pequeña pausa entre procesamiento
    await delay(2000);
    
    // Continúa con siguiente en cola
    processQueue();
}

/**
 * Extrae texto de diferentes tipos de mensajes
 * @param {Object} msg - Mensaje de WhatsApp
 * @returns {string} Texto extraído
 */
function extractMessageText(msg) {
    if (!msg.message) return '';
    
    // Mensaje de texto simple
    if (msg.message.conversation) {
        return msg.message.conversation;
    }
    
    // Mensaje de texto extendido
    if (msg.message.extendedTextMessage?.text) {
        return msg.message.extendedTextMessage.text;
    }
    
    // Imagen con caption
    if (msg.message.imageMessage?.caption) {
        return msg.message.imageMessage.caption;
    }
    
    // Video con caption
    if (msg.message.videoMessage?.caption) {
        return msg.message.videoMessage.caption;
    }
    
    // Documento con caption
    if (msg.message.documentMessage?.caption) {
        return msg.message.documentMessage.caption;
    }
    
    return '';
}

/**
 * Envía un mensaje de WhatsApp
 * @param {string} chatId - ID del chat
 * @param {string} text - Texto a enviar
 */
async function sendMessage(chatId, text) {
    if (!sock) {
        logger.warn('Socket no disponible para enviar mensaje');
        return;
    }
    
    try {
        await sock.sendMessage(chatId, { text });
    } catch (error) {
        logger.error('Error enviando mensaje:', error);
    }
}

/**
 * Obtiene info de conexión
 * @returns {Object} Estado de conexión
 */
function getConnectionInfo() {
    return {
        isConnected: sock && sock.user ? true : false,
        user: sock?.user || null,
        queueLength: processingQueue.length,
        isProcessing
    };
}

module.exports = { 
    connectWhatsApp,
    getConnectionInfo,
    sendMessage
};
