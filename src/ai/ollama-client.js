const fetch = require("node-fetch");
const logger = require("../utils/logger");

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
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

  // Aumentado a 5000 caracteres para análisis más completo
  const truncatedContent =
    content.length > 5000 ? content.substring(0, 5000) + "..." : content;

  const systemPrompt = `Eres un analista experto en contenido de inteligencia artificial, tecnología y Real Estate.

CONTEXTO DEL USUARIO:
- Consultor especializado en IA generativa y Real Estate
- Desarrolla productos innovadores bajo la marca Anclora (Press, Nexus, Kairon)
- Promociona complejo residencial Playa Viva dirigido a mercados español y latinoamericano
- Intereses profesionales: AI Agents, RAG, automatización, LLMs, desarrollo de aplicaciones, PropTech

TAREA:
Analiza en profundidad el siguiente contenido de ${platform} y genera un análisis estructurado y detallado en español.

URL: ${url}

CONTENIDO A ANALIZAR:
${truncatedContent}

INSTRUCCIONES PARA EL ANÁLISIS:

1. RESUMEN EJECUTIVO (5-8 frases):
   - Primera frase: Idea principal del contenido
   - Contexto y relevancia del tema
   - Argumentos o puntos clave desarrollados
   - Conclusiones o takeaways principales
   - Aplicabilidad práctica

2. TEMAS PRINCIPALES (4-6 tags):
   - Identifica los conceptos centrales
   - Usa terminología precisa y técnica
   - Máximo 3 palabras por tag

3. INSIGHTS CLAVE (5-7 puntos):
   - Cada insight debe ser específico y accionable
   - Enfócate en información que pueda aplicarse a proyectos de Anclora o Playa Viva
   - Incluye datos, estadísticas o casos concretos mencionados
   - Relaciona con tendencias actuales del sector
   - Identifica oportunidades de negocio o mejoras técnicas

4. ANÁLISIS DE RELEVANCIA (1-5):
   - 5 = Directamente aplicable a proyectos actuales (Anclora, Playa Viva). Información crítica o altamente valiosa.
   - 4 = Herramienta/técnica muy útil para trabajo diario. Conocimiento aplicable a corto plazo.
   - 3 = Conocimiento general valioso en IA/tech. Útil para cultura técnica y contexto del sector.
   - 2 = Tangencialmente relacionado con áreas de interés. Puede ser útil en el futuro.
   - 1 = Poco o nada relevante para el contexto profesional actual.

5. CATEGORIZACIÓN:
   - Selecciona la categoría que mejor represente el contenido
   - Considera el enfoque principal y la aplicabilidad

RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO (sin markdown, sin bloques de código, sin explicaciones adicionales):

{
  "resumen_ejecutivo": "Resumen detallado en 5-8 frases que capture la esencia completa del contenido, su contexto, desarrollo y conclusiones principales.",
  "temas_principales": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "insights_clave": [
    "Insight 1: Descripción detallada del punto clave con contexto específico y aplicabilidad práctica",
    "Insight 2: Segundo punto importante con detalles técnicos o datos concretos mencionados",
    "Insight 3: Tercer insight accionable con relación a tendencias o casos de uso",
    "Insight 4: Cuarto punto relevante con implicaciones para el negocio o desarrollo técnico",
    "Insight 5: Quinto insight con enfoque en oportunidades o mejoras identificables"
  ],
  "relevancia": 4,
  "categoria": "AI Agents",
  "tipo_contenido": "Tutorial"
}

CATEGORÍAS VÁLIDAS (selecciona la MÁS ESPECÍFICA):
- "AI Agents" → Sistemas agénticos, frameworks como LangChain/CrewAI/AutoGPT, orquestación de agentes
- "LLMs" → Modelos de lenguaje, fine-tuning, prompting avanzado, optimización de modelos
- "MLOps" → Deployment de ML, monitoring, infraestructura, CI/CD para ML
- "Computer Vision" → Visión por computador, detección de objetos, procesamiento de imágenes
- "NLP" → Procesamiento de lenguaje natural, embeddings, análisis de texto
- "RAG" → Retrieval Augmented Generation, bases de datos vectoriales, búsqueda semántica
- "Automation" → Automatización de procesos, RPA, workflows, integración de sistemas
- "Real Estate Tech" → PropTech, CRM inmobiliario, marketing digital inmobiliario, análisis de mercado
- "Desarrollo Software" → Frameworks, herramientas de desarrollo, metodologías, arquitecturas
- "Data Science" → Análisis de datos, visualización, estadística, data engineering
- "Otro" → Si no encaja claramente en las categorías anteriores

TIPOS DE CONTENIDO VÁLIDOS (selecciona el MÁS PRECISO):
- "Tutorial" → Guía paso a paso, instructivo práctico, how-to detallado
- "Noticia" → Anuncio reciente, novedad del sector, actualización de producto/servicio
- "Opinión" → Artículo de opinión, análisis crítico, perspectiva personal del autor
- "Investigación" → Paper académico, estudio científico, whitepaper técnico
- "Herramienta" → Presentación de nueva tool, librería, framework o software
- "Case Study" → Caso de uso real, implementación práctica, resultado de proyecto
- "Debate" → Discusión de múltiples perspectivas, controversia, análisis comparativo

IMPORTANTE:
- Genera SOLO el objeto JSON, sin texto adicional
- Los insights deben ser detallados (mínimo 15-20 palabras cada uno)
- El resumen ejecutivo debe ser comprehensivo y autosuficiente
- Prioriza información accionable y aplicable
- Sé específico con datos, nombres, conceptos técnicos mencionados`;

  try {
    logger.info("🤖 Llamando a Ollama...");

    // Fuerza GPU
    process.env.OLLAMA_NUM_GPU = "1";
    process.env.OLLAMA_GPU_LAYERS = "999";

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: systemPrompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.4, // Aumentado para más creatividad
          top_p: 0.9,
          top_k: 40,
          num_ctx: 4096, // Aumentado para análisis más completo
          num_predict: 1024, // Aumentado significativamente (antes 200)
          num_gpu: 1,
          num_thread: 4,
          repeat_penalty: 1.1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama HTTP error: ${response.status} ${response.statusText}`
      );
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
        logger.error(
          "Respuesta no es JSON válido:",
          data.response.substring(0, 200)
        );
        throw new Error("No se pudo parsear respuesta JSON de Ollama");
      }
    }

    // Valida campos requeridos
    const required = [
      "resumen_ejecutivo",
      "temas_principales",
      "insights_clave",
      "relevancia",
      "categoria",
      "tipo_contenido",
    ];

    for (const field of required) {
      if (!parsed[field]) {
        throw new Error(`Campo requerido faltante en respuesta: ${field}`);
      }
    }

    // Valida tipos
    if (
      !Array.isArray(parsed.temas_principales) ||
      !Array.isArray(parsed.insights_clave)
    ) {
      throw new Error("temas_principales e insights_clave deben ser arrays");
    }

    if (
      typeof parsed.relevancia !== "number" ||
      parsed.relevancia < 1 ||
      parsed.relevancia > 5
    ) {
      throw new Error("relevancia debe ser número entre 1 y 5");
    }

    return {
      ...parsed,
      processing_time_seconds: parseFloat(inferenceTime),
    };
  } catch (error) {
    logger.error("❌ Error en análisis Ollama:", error.message);
    return null;
  }
}

/**
 * Prueba conexión con Ollama y valida modelo
 * @returns {Promise<boolean>} True si está operativo
 */
async function testOllama() {
  try {
    logger.info("Verificando Ollama...");

    const response = await fetch(`${OLLAMA_HOST}/api/tags`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.models || data.models.length === 0) {
      logger.error("✗ No hay modelos instalados en Ollama");
      logger.error("  Ejecuta: ollama pull llama3.1:8b");
      return false;
    }

    const modelExists = data.models.some((m) => m.name === OLLAMA_MODEL);

    if (!modelExists) {
      logger.error(`✗ Modelo '${OLLAMA_MODEL}' no encontrado`);
      logger.error("  Modelos disponibles:");
      data.models.forEach((m) => {
        logger.error(`    - ${m.name} (${(m.size / 1e9).toFixed(2)} GB)`);
      });
      logger.error(
        `  Cambia OLLAMA_MODEL en .env o ejecuta: ollama pull ${OLLAMA_MODEL}`
      );
      return false;
    }

    const selectedModel = data.models.find((m) => m.name === OLLAMA_MODEL);
    logger.info(`✓ Ollama operativo`);
    logger.info(`  Modelo: ${OLLAMA_MODEL}`);
    logger.info(`  Tamaño: ${(selectedModel.size / 1e9).toFixed(2)} GB`);
    logger.info(
      `  Modificado: ${new Date(selectedModel.modified_at).toLocaleString()}`
    );

    return true;
  } catch (error) {
    logger.error("✗ Error conectando con Ollama:", error.message);
    logger.error("  Verifica que Ollama esté ejecutándose: ollama serve");
    return false;
  }
}

module.exports = { analyzeContent, testOllama };
