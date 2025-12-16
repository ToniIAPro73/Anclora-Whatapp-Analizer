# 📝 Changelog

Todos los cambios notables en este proyecto serán documentados aquí.

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
- Aceleración GPU NVIDIA
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

### [1.1.0] - Planificado
- [ ] Dashboard web con React
- [ ] Exportar reportes PDF
- [ ] Sistema de alertas
- [ ] Mejoras en Instagram scraping

### [1.2.0] - Planificado
- [ ] API REST
- [ ] Multi-idioma (inglés)
- [ ] Clustering de contenido
- [ ] Integración Make.com

### [2.0.0] - Planificado
- [ ] Soporte múltiples usuarios
- [ ] Sistema de recomendaciones
- [ ] ML para auto-categorización
- [ ] Mobile app

---

## Notas de Desarrollo

### Decisiones de Diseño

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

## Contribuciones

Versión actual desarrollada por **Toni Ballesteros** para uso personal/profesional.

## Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.
