const fetch = require('node-fetch');
const logger = require('../utils/logger');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

/**
 * Analiza contenido usando Ollama
 * @param {string} content - Contenido a analizar
 * @param {string} url - URL del contenido
 * @param {string} platform - Plataforma de origen
 * @returns {Promise<Object>} Análisis estructurado
 */
async function analyzeContent(content, url, platform) {
    const startTime = Date.now();
    
    // Trunca contenido si es muy largo (optimización para inferencia)
    const truncatedContent = content.length > 8000 
        ? content.substring(0, 8000) + '...' 
        : content;
    
    const systemPrompt = `Eres un analista experto en contenido de inteligencia artificial, tecnología y Real Estate.

CONTEXTO DEL USUARIO:
- Trabaja en consultoría de IA generativa y Real Estate
- Desarrolla productos bajo la marca Anclora (Press, Nexus, Kairon, etc)
- Promociona complejo residencial Playa Viva para mercados español y latinoamericano
- Interés especial en: AI Agents, RAG, automatización, LLMs, desarrollo de aplicaciones

TAREA:
Analiza el siguiente contenido de ${platform} y genera un resumen estructurado en español.

URL: ${url}

CONTENIDO:
${truncatedContent}

RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO (sin markdown, sin explicaciones):
{
  "resumen_ejecutivo": "Resumen conciso en máximo 3 frases",
  "temas_principales": ["tag1", "tag2", "tag3"],
  "insights_clave": [
    "Insight 1: Punto específico y accionable",
    "Insight 2: Punto específico y accionable", 
    "Insight 3: Punto específico y accionable"
  ],
  "relevancia": 4,
  "categoria": "AI Agents",
  "tipo_contenido": "Tutorial"
}

CATEGORÍAS VÁLIDAS (selecciona UNA):
- "AI Agents" (sistemas agénticos, LangChain, CrewAI, AutoGPT)
- "LLMs" (modelos de lenguaje, fine-tuning, prompting)
- "MLOps" (deployment, monitoring, infraestructura ML)
- "Computer Vision" (visión por computador, detección objetos)
- "NLP" (procesamiento lenguaje natural, embeddings)
- "RAG" (Retrieval Augmented Generation, vectores, búsqueda)
- "Automation" (automatización, RPA, workflows)
- "Real Estate Tech" (proptech, CRM inmobiliario, marketing)
- "Desarrollo Software" (frameworks, herramientas, metodologías)
- "Data Science" (análisis datos, visualización, estadística)
- "Otro" (si no encaja en anteriores)

TIPOS DE CONTENIDO VÁLIDOS (selecciona UNO):
- "Tutorial" (guía paso a paso, how-to)
- "Noticia" (anuncio, novedad, actualización)
- "Opinión" (artículo de opinión, análisis personal)
- "Investigación" (paper, estudio, whitepaper)
- "Herramienta" (nuevo tool, librería, framework)
- "Case Study" (caso de uso, implementación real)
- "Debate" (discusión, controversia, múltiples perspectivas)

CRITERIOS DE RELEVANCIA (1-5):
5 = Directamente aplicable a proyectos actuales (Anclora, Playa Viva)
4 = Técnica/herramienta muy útil para el trabajo diario
3 = Conocimiento general valioso en IA/tech
2 = Tangencialmente relacionado con áreas de interés
1 = No relevante para el contexto profesional

IMPORTANTE:
- Solo JSON, sin markdown ni bloques de código
- Insights deben ser específicos y accionables
- Tags concisos (1-3 palabras máximo)
- Prioriza calidad sobre cantidad`;

    try {
        logger.info('🤖 Llamando a Ollama...');
        
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: systemPrompt,
                stream: false,
                format: 'json',
                options: {
                    temperature: 0.3,
                    top_p: 0.9,
                    top_k: 40,
                    num_ctx: 4096,
                    num_gpu: 1,  // Fuerza uso de GPU
                    num_thread: 8
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama HTTP error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const inferenceTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        logger.info(`  Inferencia completada en ${inferenceTime}s`);

        // Parse respuesta JSON
        let parsed;
        try {
            parsed = JSON.parse(data.response);
        } catch (e) {
            // Intenta extraer JSON si viene con texto adicional
            const jsonMatch = data.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                logger.error('Respuesta no es JSON válido:', data.response.substring(0, 200));
                throw new Error('No se pudo parsear respuesta JSON de Ollama');
            }
        }

        // Valida campos requeridos
        const required = [
            'resumen_ejecutivo', 
            'temas_principales', 
            'insights_clave', 
            'relevancia', 
            'categoria', 
            'tipo_contenido'
        ];
        
        for (const field of required) {
            if (!parsed[field]) {
                throw new Error(`Campo requerido faltante en respuesta: ${field}`);
            }
        }

        // Valida tipos
        if (!Array.isArray(parsed.temas_principales) || !Array.isArray(parsed.insights_clave)) {
            throw new Error('temas_principales e insights_clave deben ser arrays');
        }

        if (typeof parsed.relevancia !== 'number' || parsed.relevancia < 1 || parsed.relevancia > 5) {
            throw new Error('relevancia debe ser número entre 1 y 5');
        }

        return {
            ...parsed,
            processing_time_seconds: parseFloat(inferenceTime)
        };

    } catch (error) {
        logger.error('❌ Error en análisis Ollama:', error.message);
        return null;
    }
}

/**
 * Prueba conexión con Ollama y valida modelo
 * @returns {Promise<boolean>} True si está operativo
 */
async function testOllama() {
    try {
        logger.info('Verificando Ollama...');
        
        const response = await fetch(`${OLLAMA_HOST}/api/tags`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.models || data.models.length === 0) {
            logger.error('✗ No hay modelos instalados en Ollama');
            logger.error('  Ejecuta: ollama pull llama3.1:8b');
            return false;
        }
        
        const modelExists = data.models.some(m => m.name === OLLAMA_MODEL);
        
        if (!modelExists) {
            logger.error(`✗ Modelo '${OLLAMA_MODEL}' no encontrado`);
            logger.error('  Modelos disponibles:');
            data.models.forEach(m => {
                logger.error(`    - ${m.name} (${(m.size / 1e9).toFixed(2)} GB)`);
            });
            logger.error(`  Cambia OLLAMA_MODEL en .env o ejecuta: ollama pull ${OLLAMA_MODEL}`);
            return false;
        }
        
        const selectedModel = data.models.find(m => m.name === OLLAMA_MODEL);
        logger.info(`✓ Ollama operativo`);
        logger.info(`  Modelo: ${OLLAMA_MODEL}`);
        logger.info(`  Tamaño: ${(selectedModel.size / 1e9).toFixed(2)} GB`);
        logger.info(`  Modificado: ${new Date(selectedModel.modified_at).toLocaleString()}`);
        
        return true;
    } catch (error) {
        logger.error('✗ Error conectando con Ollama:', error.message);
        logger.error('  Verifica que Ollama esté ejecutándose: ollama serve');
        return false;
    }
}

module.exports = { analyzeContent, testOllama };
