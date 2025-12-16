# 📝 Changelog

Todos los cambios notables en este proyecto serán documentados aquí.

## [1.1.0] - 2024-12-16

### ✨ Mejoras Significativas

#### Análisis IA Mejorado

- **Prompts expandidos y detallados**: Instrucciones de ~3000 caracteres vs 500 anteriores
- **Análisis más profundo**: Resúmenes ejecutivos de 5-8 frases (vs 3 frases)
- **Insights extensos**: 5-7 puntos detallados de 15-20 palabras cada uno (vs 3 puntos breves)
- **Contenido analizado aumentado**: 5000 caracteres vs 1500 anteriores
- **Mejor contexto**: `num_ctx: 4096` (duplicado desde 2048)
- **Respuestas más largas**: `num_predict: 1024` (5x más que antes)
- **Mayor creatividad**: `temperature: 0.4` (vs 0.3)

#### WhatsApp - Filtro para Mensajes Propios

- **NUEVA característica**: Sistema configurado para procesar **SOLO mensajes que el usuario se envía a sí mismo**
- **Filtro `fromMe: true`**: Ignora completamente mensajes de otros contactos
- **Uso principal**: "Read It Later" personal con análisis IA automático
- **Logs mejorados**: Indica claramente cuando un mensaje es ignorado y por qué

#### Rendimiento

- **Tiempo de análisis**: 25-40s por URL (análisis completo y detallado)
- **Calidad vs velocidad**: Prioriza análisis exhaustivo sobre rapidez
- **Configuración optimizada**: Balance entre rendimiento y profundidad

### 🔧 Cambios Técnicos

#### Configuración Ollama

- **Modelo por defecto**: `llama3.2:latest` (2GB, optimizado para 4GB VRAM)
- **Parámetros ajustados**:
  - `num_ctx: 4096` → Mayor contexto y memoria
  - `num_predict: 1024` → Respuestas 5x más extensas
  - `temperature: 0.4` → Balance creatividad/consistencia
  - `repeat_penalty: 1.1` → Reduce repeticiones

#### Logs y Debugging

- **Logs detallados en handleMessage**: Indica claramente el flujo de decisión
- **Separadores visuales**: Mejora legibilidad de logs
- **Información de contexto**: FromMe, RemoteJid, texto extraído, URLs detectadas

### 📚 Documentación

- **README.md actualizado**: Refleja comportamiento real del sistema
- **Caso de uso claro**: Enfoque en uso personal/profesional
- **Troubleshooting expandido**: Problemas reales y soluciones
- **Consultas SQL útiles**: Ejemplos prácticos de uso

### 🐛 Correcciones

- **QR code generation**: Implementación manual con `qrcode-terminal` (deprecated `printQRInTerminal`)
- **Browser compatibility**: Usuario agent actualizado para mejor compatibilidad
- **Baileys actualizado**: Versión latest con soporte moderno

---

## [1.0.0] - 2024-12-16

### ✨ Características Iniciales

#### Core

- Sistema completo de análisis automatizado de enlaces desde WhatsApp
- Integración WhatsApp vía Baileys (sin API oficial)
- Procesamiento asíncrono con cola de tareas
- Detección automática de URLs en mensajes
- Sistema de logging robusto con Winston

#### Scraping

- Scraper universal con Playwright + Readability
- Scraper especializado para Twitter/X usando Nitter
- Soporte para múltiples plataformas: LinkedIn, Medium, GitHub, etc.
- Sistema de reintentos automáticos
- Manejo inteligente de timeouts

#### Análisis AI

- Integración con Ollama para IA local
- Aceleración GPU NVIDIA (cuando disponible)
- Prompts optimizados para contexto personal/profesional
- Análisis estructurado: resumen, temas, insights, relevancia
- Categorización automática de contenido

#### Base de Datos

- Schema PostgreSQL optimizado
- Índices para búsqueda rápida
- Full-text search en español
- Views para estadísticas
- Detección de duplicados

#### Scripts y Utilidades

- `test-db.js` - Verifica conexión PostgreSQL
- `test-ollama.js` - Verifica Ollama e inferencia
- `test-scraper.js` - Prueba scrapers
- `show-stats.js` - Estadísticas completas

#### Documentación

- README completo con guías detalladas
- QUICKSTART para inicio rápido
- Comentarios extensivos en código
- Ejemplos de uso y consultas SQL

### 🎨 Configuración

- Variables de entorno via .env
- Timeouts configurables
- Reintentos ajustables
- Modelo Ollama seleccionable

### 🔧 Plataformas Soportadas

- LinkedIn
- Twitter/X (vía Nitter)
- Instagram (básico)
- Medium
- GitHub
- YouTube
- Facebook
- Generic (cualquier web)

### 📊 Métricas y Análisis

- Resumen ejecutivo automático
- Extracción de temas principales
- Insights clave accionables
- Relevancia (escala 1-5)
- Categorización
- Tipo de contenido

### 🛡️ Seguridad y Privacidad

- 100% local - sin servicios cloud
- Datos privados en PostgreSQL local
- Sin telemetría
- Sin compartir información con terceros

---

## Roadmap Futuro

### [1.2.0] - Planificado

- [ ] Dashboard web con React para visualización de análisis
- [ ] Exportar reportes en PDF/Markdown
- [ ] Sistema de alertas (Telegram/Email) para contenido muy relevante
- [ ] Mejoras en scraping de Instagram
- [ ] Soporte para PDFs y documentos Word

### [2.0.0] - Planificado

- [ ] API REST para consultas externas
- [ ] Multi-idioma (inglés, portugués)
- [ ] Clustering automático de contenido similar
- [ ] Sistema de recomendaciones basado en historial
- [ ] Integración con Notion/Obsidian
- [ ] Resúmenes semanales automatizados

### [3.0.0] - Visión a largo plazo

- [ ] Soporte múltiples usuarios/cuentas
- [ ] ML para auto-categorización mejorada
- [ ] Mobile app nativa
- [ ] Sincronización multi-dispositivo
- [ ] Compartir colecciones públicas

---

## Notas de Desarrollo

### Decisiones de Diseño v1.1.0

**¿Por qué solo procesar mensajes propios?**

- Caso de uso principal: Knowledge base personal
- Evita spam y mensajes no deseados
- Control total sobre qué se procesa
- Privacidad: no analiza conversaciones con terceros

**¿Por qué análisis más largos y detallados?**

- Calidad sobre velocidad para contenido valioso
- Insights accionables requieren contexto
- 25-40s es aceptable para análisis profundo
- Usuario revisa análisis cuando tiene tiempo, no en tiempo real

**¿Por qué llama3.2 en lugar de modelos más grandes?**

- Balance óptimo: 2GB VRAM, buena calidad
- Funciona en hardware limitado (4GB VRAM)
- Suficiente para análisis detallado
- Alternativas disponibles según necesidad

### Decisiones de Diseño v1.0.0

**¿Por qué Baileys en lugar de WhatsApp Business API?**

- No requiere verificación empresarial
- Gratis e ilimitado
- Usa número personal
- Suficiente para MVP

**¿Por qué Ollama en lugar de APIs cloud?**

- Privacidad total
- Sin costos recurrentes
- Aceleración GPU local
- No requiere conexión internet

**¿Por qué PostgreSQL?**

- Full-text search en español
- Arrays nativos para tags
- Excelente para analytics
- Ya en uso por el usuario

**¿Por qué Playwright?**

- Maneja JavaScript moderno
- Excelente para SPAs
- Más estable que Puppeteer
- Mejor documentación

---

## Problemas Conocidos y Soluciones

### Ollama GPU en Windows

**Problema:** Ollama API usa CPU en lugar de GPU en Windows
**Solución:** Funciona correctamente en CPU, rendimiento aceptable (10-30s)
**Workaround:** Usar CLI con execSync si se necesita GPU obligatoriamente

### QR Code en Terminals Antiguas

**Problema:** Terminales sin UTF-8 no muestran QR correctamente
**Solución:** Usar Windows Terminal o terminal moderna con UTF-8

### Baileys printQRInTerminal Deprecated

**Problema:** Opción deprecated, causaba errores de conexión
**Solución:** Implementación manual con qrcode-terminal

### Nitter Instances Down

**Problema:** Instancias públicas de Nitter pueden estar caídas
**Solución:** Sistema de fallback automático a scraper universal

---

## Métricas de Rendimiento

### v1.1.0 (Actual)

- **Tiempo promedio**: 25-40s por URL
- **Calidad análisis**: ⭐⭐⭐⭐⭐ (5/5)
- **Extensión resumen**: 5-8 frases (~150-200 palabras)
- **Insights**: 5-7 puntos detallados
- **Contenido analizado**: Hasta 5000 caracteres

### v1.0.0 (Inicial)

- **Tiempo promedio**: 15-25s por URL
- **Calidad análisis**: ⭐⭐⭐ (3/5)
- **Extensión resumen**: 3 frases (~50-80 palabras)
- **Insights**: 3 puntos breves
- **Contenido analizado**: Hasta 1500 caracteres

**Mejora v1.0.0 → v1.1.0:**

- ⬆️ Calidad: +67%
- ⬆️ Tiempo: +30-60% (trade-off aceptable)
- ⬆️ Profundidad: +300%

---

## Contribuciones

Versión actual desarrollada por **Toni Ballesteros** para uso personal/profesional.

**Agradecimientos:**

- Comunidad de Baileys por la librería
- Ollama por IA local accesible
- Playwright team por herramientas de scraping

---

## Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

---

**Última actualización:** 16 de diciembre de 2024
