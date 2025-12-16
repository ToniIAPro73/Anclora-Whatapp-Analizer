require('dotenv').config();
const { testOllama, analyzeContent } = require('../src/ai/ollama-client');
const logger = require('../src/utils/logger');

async function testOllamaFull() {
    logger.info('🧪 Testing Ollama Connection & Inference...\n');
    
    // Test 1: Conexión
    logger.info('Test 1: Verificando conexión y modelo...');
    const connected = await testOllama();
    
    if (!connected) {
        logger.error('\n❌ Test fallido\n');
        process.exit(1);
    }
    
    logger.info('\n✓ Conexión OK\n');
    
    // Test 2: Inferencia simple
    logger.info('Test 2: Probando inferencia con texto de ejemplo...\n');
    
    const sampleText = `
Introducción a los Agentes de IA con LangChain

Los agentes de IA representan el siguiente nivel en sistemas de inteligencia artificial.
A diferencia de los modelos tradicionales, los agentes pueden tomar decisiones, usar herramientas
y ejecutar acciones de forma autónoma para lograr objetivos complejos.

LangChain proporciona un framework robusto para construir estos agentes, permitiendo:
- Integración con múltiples LLMs (OpenAI, Anthropic, etc)
- Sistema de herramientas extensible
- Memoria persistente entre interacciones
- Cadenas de razonamiento complejas

Este tutorial cubre la implementación práctica de un agente que puede buscar en internet,
procesar documentos y ejecutar código Python de forma segura.
    `;
    
    const sampleUrl = 'https://ejemplo.com/tutorial-langchain-agents';
    const samplePlatform = 'medium';
    
    logger.info('Contenido de prueba:');
    logger.info(`- URL: ${sampleUrl}`);
    logger.info(`- Plataforma: ${samplePlatform}`);
    logger.info(`- Longitud: ${sampleText.length} caracteres`);
    logger.info('');
    logger.info('Ejecutando análisis...\n');
    
    const startTime = Date.now();
    const analysis = await analyzeContent(sampleText, sampleUrl, samplePlatform);
    const inferenceTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!analysis) {
        logger.error('❌ Inferencia falló\n');
        process.exit(1);
    }
    
    logger.info('✅ Análisis completado!\n');
    logger.info('═'.repeat(70));
    logger.info('RESULTADO DEL ANÁLISIS');
    logger.info('═'.repeat(70));
    logger.info(`\n📝 Resumen Ejecutivo:`);
    logger.info(`   ${analysis.resumen_ejecutivo}`);
    logger.info(`\n🏷️  Temas Principales:`);
    analysis.temas_principales.forEach(tema => {
        logger.info(`   - ${tema}`);
    });
    logger.info(`\n💡 Insights Clave:`);
    analysis.insights_clave.forEach((insight, i) => {
        logger.info(`   ${i + 1}. ${insight}`);
    });
    logger.info(`\n⭐ Relevancia: ${analysis.relevancia}/5 ${'★'.repeat(analysis.relevancia)}${'☆'.repeat(5 - analysis.relevancia)}`);
    logger.info(`📂 Categoría: ${analysis.categoria}`);
    logger.info(`📄 Tipo: ${analysis.tipo_contenido}`);
    logger.info(`⏱️  Tiempo inferencia: ${inferenceTime}s`);
    logger.info('═'.repeat(70));
    
    logger.info('\n✅ Todos los tests pasaron exitosamente!\n');
    logger.info('💡 TIP: Si el tiempo de inferencia es muy alto (>20s),');
    logger.info('   considera usar un modelo más pequeño o verificar que');
    logger.info('   la GPU está siendo utilizada correctamente.\n');
}

testOllamaFull();
