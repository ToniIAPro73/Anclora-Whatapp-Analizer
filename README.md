# 🤖 WhatsApp AI Analyzer MVP

Sistema automatizado para analizar enlaces que **tú mismo te compartes** en WhatsApp, usando IA local (Ollama) y scraping inteligente.

**Caso de uso principal:** Guarda y analiza artículos/URLs interesantes enviándotelos a ti mismo en WhatsApp como tu "Read It Later" personal con análisis IA automático.

## 📋 Características

- ✅ **Integración WhatsApp** vía Baileys (sin API oficial)
- ✅ **Análisis de mensajes propios** - Procesa URLs que TÚ te envías a ti mismo
- ✅ **Scraping inteligente** con Playwright + Readability
- ✅ **Análisis IA local detallado** usando Ollama
- ✅ **Soporte múltiples plataformas**: LinkedIn, Twitter/X, Medium, GitHub, etc.
- ✅ **Almacenamiento PostgreSQL** con búsqueda full-text en español
- ✅ **Cero dependencias cloud** - 100% local y privado
- ✅ **Análisis profundo**: Resumen ejecutivo de 5-8 frases, 5-7 insights detallados, categorización automática

## 🎯 Requisitos

### Hardware Recomendado

- **RAM**: 16GB mínimo, 32GB recomendado
- **GPU**: NVIDIA con 4GB+ VRAM (opcional, mejora velocidad)
- **Almacenamiento**: 20GB+ libres

### Software

- **Node.js**: v18+
- **Docker** con PostgreSQL corriendo
- **Ollama**: Instalado con modelo descargado
- **Git**: Para clonar el proyecto

## 🚀 Instalación Rápida

### 1. Clonar proyecto

```bash
git clone [URL_DEL_REPO]
cd whatsapp-ai-analyzer-mvp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Instalar navegadores Playwright

```bash
npx playwright install chromium
npx playwright install-deps chromium
```

### 4. Configurar PostgreSQL

**Si ya tienes PostgreSQL en Docker:**

```bash
# Conecta a tu container
docker exec -it [nombre_container] psql -U postgres

# Crea la base de datos
CREATE DATABASE whatsapp_ai_analyzer;
\q

# Aplica el schema
docker exec -i [nombre_container] psql -U postgres -d whatsapp_ai_analyzer < sql/schema.sql
```

**Si no tienes PostgreSQL:**

```bash
# Crea container PostgreSQL
docker run --name postgres-whatsapp \
  -e POSTGRES_PASSWORD=tu_password \
  -p 5432:5432 \
  -d postgres:15

# Espera 5 segundos
sleep 5

# Crea base de datos
docker exec -it postgres-whatsapp createdb -U postgres whatsapp_ai_analyzer

# Aplica schema
docker exec -i postgres-whatsapp psql -U postgres -d whatsapp_ai_analyzer < sql/schema.sql
```

### 5. Configurar Ollama

**Modelo recomendado para 4GB VRAM:**

```bash
# Descarga modelo ligero y eficiente
ollama pull llama3.2:latest

# Verifica instalación
ollama list
```

**Alternativas según tu VRAM:**

| VRAM | Modelo            | Tamaño | Comando                          |
| ---- | ----------------- | ------ | -------------------------------- |
| 4GB  | `llama3.2:latest` | 2GB    | `ollama pull llama3.2:latest` ✅ |
| 4GB  | `gemma2:2b`       | 1.6GB  | `ollama pull gemma2:2b`          |
| 6GB+ | `phi3:3.8b-mini`  | 2.4GB  | `ollama pull phi3:3.8b-mini`     |

### 6. Configurar variables de entorno

```bash
cp .env.example .env
nano .env  # o usa tu editor preferido
```

**Configura estos valores:**

```env
# PostgreSQL (ajusta según tu configuración)
DB_HOST=localhost
DB_PORT=5432              # O tu puerto personalizado
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=whatsapp_ai_analyzer

# Ollama - IMPORTANTE: usa el modelo que descargaste
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest

# WhatsApp
WHATSAPP_SESSION_PATH=./auth_info

# Opcional - Recomendado para uso personal
LOG_LEVEL=info
SCRAPING_TIMEOUT=30000
MAX_RETRIES=2
SEND_CONFIRMATIONS=false  # No necesitas confirmaciones
SEND_RESULTS=false        # Trabaja en silencio
SEND_ERRORS=false
```

### 7. Verificar instalación

```bash
# Test PostgreSQL
npm run test-db

# Test Ollama (verifica que el modelo funcione)
npm run test-ollama
```

**Ambos deben mostrar ✅**

### 8. Iniciar sistema

```bash
npm start
```

**Aparecerá un código QR. Escanéalo con WhatsApp:**

1. Abre WhatsApp en tu móvil
2. Ve a **Configuración** → **Dispositivos vinculados**
3. Toca **"Vincular dispositivo"**
4. Escanea el código QR de la terminal

**¡Listo!** El sistema quedará esperando que **TÚ te envíes URLs**.

## 📖 Uso

### Funcionamiento básico

**IMPORTANTE:** Este sistema está configurado para procesar **SOLO mensajes que TÚ te envías a ti mismo**. Ignora mensajes de otros contactos.

**Workflow típico:**

1. **Encuentras un artículo interesante** en tu móvil/ordenador
2. **Lo compartes a WhatsApp** (a ti mismo - tu propio contacto)
3. El sistema **detecta automáticamente** la URL
4. **Extrae el contenido** completo del enlace (~5-15s)
5. **Analiza con IA** generando resumen detallado, insights y categorización (~15-25s)
6. **Guarda en PostgreSQL** con búsqueda full-text

**Tiempo total:** 25-40 segundos por URL (análisis completo y detallado)

### Ejemplo de mensaje

Abre WhatsApp, busca tu propio contacto y envía:

```text
Interesante artículo sobre RAG:
https://www.pinecone.io/learn/retrieval-augmented-generation/
```

O simplemente:

```text
https://github.com/langchain-ai/langchain
```

El sistema procesará automáticamente cualquier URL que te envíes.

### ¿Qué pasa con mensajes de otros?

**Se ignoran completamente.** Si alguien te envía una URL, el sistema la detecta pero no la procesa. Verás en logs:

```text
⏭️  IGNORADO: No es mensaje propio
```

Esto evita procesar spam, mensajes de grupos, etc.

## 📊 Consultar resultados

### Ver estadísticas completas

```bash
npm run stats
```

**Muestra:**

- Total URLs procesadas
- Top 10 más relevantes
- Top categorías
- Tags más frecuentes
- Últimos 10 procesados
- Estadísticas últimos 7 días

### Consultas SQL directas

```bash
# Conecta a PostgreSQL
docker exec -it [nombre_container] psql -U postgres -d whatsapp_ai_analyzer
```

**Consultas útiles:**

```sql
-- Top 10 más relevantes
SELECT
  id,
  title,
  categoria,
  relevancia,
  TO_CHAR(created_at, 'YYYY-MM-DD') as fecha,
  url
FROM link_analysis
WHERE relevancia >= 4
ORDER BY relevancia DESC, created_at DESC
LIMIT 10;

-- Buscar por categoría
SELECT
  title,
  resumen_ejecutivo,
  array_to_string(temas_principales, ', ') as temas,
  url
FROM link_analysis
WHERE categoria = 'AI Agents'
ORDER BY relevancia DESC
LIMIT 20;

-- Buscar por palabra clave (full-text)
SELECT
  title,
  categoria,
  relevancia,
  url,
  ts_rank(
    to_tsvector('spanish', contenido_completo),
    plainto_tsquery('spanish', 'langchain')
  ) AS rank
FROM link_analysis
WHERE to_tsvector('spanish', contenido_completo)
  @@ plainto_tsquery('spanish', 'langchain')
ORDER BY rank DESC, relevancia DESC
LIMIT 15;

-- Ver insights de un artículo específico
SELECT
  title,
  resumen_ejecutivo,
  unnest(insights_clave) as insight
FROM link_analysis
WHERE id = 1;

-- Artículos recientes por categoría
SELECT
  categoria,
  COUNT(*) as total,
  ROUND(AVG(relevancia), 2) as relevancia_promedio
FROM link_analysis
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY categoria
ORDER BY total DESC;
```

## 🔧 Scripts disponibles

| Comando                | Descripción                                    |
| ---------------------- | ---------------------------------------------- |
| `npm start`            | Inicia el sistema completo                     |
| `npm run test-db`      | Verifica conexión PostgreSQL                   |
| `npm run test-ollama`  | Verifica Ollama y realiza inferencia de prueba |
| `npm run test-scraper` | Prueba scrapers con URLs de ejemplo            |
| `npm run stats`        | Muestra estadísticas completas del sistema     |

## 🏗️ Arquitectura

```text
WhatsApp (Baileys)
    ↓
Filtro: Solo fromMe=true
    ↓
URL Detector
    ↓
Router por Plataforma
    ↓
┌─────────────────┬─────────────────┐
│   Twitter       │    Universal    │
│   (Nitter)      │  (Playwright)   │
└─────────────────┴─────────────────┘
    ↓
Content Cleaner (5000+ caracteres)
    ↓
Ollama (Análisis detallado)
 - Resumen: 5-8 frases
 - Insights: 5-7 puntos extensos
 - Categorización inteligente
    ↓
PostgreSQL Storage
```

## 📁 Estructura del proyecto

```text
whatsapp-ai-analyzer-mvp/
├── src/
│   ├── whatsapp.js           # Integración WhatsApp + filtro fromMe
│   ├── processor.js          # Orquestador principal
│   ├── scrapers/
│   │   ├── universal.js      # Scraper Playwright + Readability
│   │   └── twitter.js        # Scraper Nitter especializado
│   ├── ai/
│   │   └── ollama-client.js  # Cliente Ollama (análisis mejorado)
│   ├── database/
│   │   └── postgres.js       # Cliente PostgreSQL
│   └── utils/
│       ├── logger.js         # Sistema logging con Winston
│       └── url-detector.js   # Detector y limpieza URLs
├── scripts/
│   ├── test-db.js           # Test conexión PostgreSQL
│   ├── test-ollama.js       # Test Ollama con inferencia
│   ├── test-scraper.js      # Test scrapers
│   └── show-stats.js        # Dashboard estadísticas
├── sql/
│   └── schema.sql           # Schema PostgreSQL completo
├── logs/                    # Logs aplicación
├── auth_info/               # Sesión WhatsApp (no versionar)
├── .env                     # Configuración (no versionar)
├── .gitignore
├── index.js                 # Entry point
├── package.json
├── README.md
└── CHANGELOG.md
```

## ⚙️ Configuración avanzada

### Personalizar categorías y análisis

Edita `src/ai/ollama-client.js` línea ~15 para ajustar:

- Categorías válidas según tus intereses
- Tipos de contenido
- Criterios de relevancia
- Instrucciones del prompt

### Ajustar rendimiento vs calidad

En `src/ai/ollama-client.js`, línea ~130:

```javascript
options: {
    temperature: 0.4,      // 0.3-0.5: creatividad vs consistencia
    num_ctx: 4096,         // Contexto (más = mayor memoria)
    num_predict: 1024,     // Longitud respuesta (más = más detalle)
    num_gpu: 1,            // Forzar GPU
    num_thread: 4          // CPUs usados si no hay GPU
}
```

**Perfiles recomendados:**

| Perfil         | num_ctx | num_predict | Tiempo | Calidad           |
| -------------- | ------- | ----------- | ------ | ----------------- |
| **Rápido**     | 2048    | 512         | ~15s   | ⭐⭐⭐            |
| **Balanceado** | 4096    | 1024        | ~25s   | ⭐⭐⭐⭐ (actual) |
| **Completo**   | 8192    | 2048        | ~45s   | ⭐⭐⭐⭐⭐        |

### Agregar más plataformas

Crea un nuevo scraper en `src/scrapers/` siguiendo el patrón de `twitter.js`.

Ejemplo para Instagram:

```javascript
// src/scrapers/instagram.js
async function scrapeInstagram(url) {
  // Tu lógica de scraping
  return {
    title: "...",
    content: "...",
    author: "...",
    excerpt: "...",
  };
}
```

Luego registra en `src/processor.js`:

```javascript
if (platform === "instagram") {
  scraped = await scrapeInstagram(url);
}
```

## 🐛 Solución de problemas

### Error: "Ollama model not found"

```bash
# Lista modelos instalados
ollama list

# Si no aparece llama3.2:latest
ollama pull llama3.2:latest

# Actualiza .env
OLLAMA_MODEL=llama3.2:latest
```

### Error: "PostgreSQL connection failed"

```bash
# Verifica container corriendo
docker ps | grep postgres

# Si no está corriendo
docker start [nombre_container]

# Test conexión
npm run test-db
```

### QR code no aparece

```bash
# Asegura terminal con soporte UTF-8
# En Windows: usa Windows Terminal

# Limpia sesión anterior
rm -rf ./auth_info
npm start
```

### Sistema no procesa URLs

**Verifica que:**

1. El mensaje lo envías **TÚ a ti mismo** (no desde otro contacto)
2. El mensaje contiene una URL válida (http:// o https://)
3. La sesión WhatsApp está activa (aparece "✅ WHATSAPP CONECTADO")

**En logs debe aparecer:**

```text
✅ ES MENSAJE PROPIO - Continuando...
URLs encontradas: 1
```

Si dice "IGNORADO: No es mensaje propio", estás enviando desde otro número.

### Análisis tarda mucho (>60s)

```bash
# Reduce calidad para mayor velocidad
# En src/ai/ollama-client.js:
num_ctx: 2048        # (en lugar de 4096)
num_predict: 512     # (en lugar de 1024)

# O usa modelo más pequeño
ollama pull gemma2:2b
# Actualiza .env: OLLAMA_MODEL=gemma2:2b
```

### GPU no se usa (laptop se calienta)

**En Windows, Ollama API usa CPU por defecto.** Es normal. El sistema funciona correctamente en CPU.

Si quieres forzar GPU (puede no funcionar en Windows):

```bash
# Variables de entorno
$env:OLLAMA_NUM_GPU = "1"
$env:OLLAMA_GPU_LAYERS = "999"
ollama serve
```

## 📊 Rendimiento típico

| Fase          | Tiempo     | Descripción                       |
| ------------- | ---------- | --------------------------------- |
| Detección URL | <1s        | Extracción de URLs del mensaje    |
| Scraping      | 5-15s      | Extracción de contenido web       |
| Análisis IA   | 15-30s     | Generación de insights detallados |
| Guardado DB   | <1s        | Almacenamiento en PostgreSQL      |
| **TOTAL**     | **25-40s** | Por URL procesada                 |

**Hardware de referencia:** Intel i7, 32GB RAM, NVIDIA 3050 4GB, SSD

## 🎓 Casos de uso

**✅ Perfecto para:**

- Curación de contenido técnico (artículos AI/ML/dev)
- Investigación de mercado inmobiliario
- Seguimiento de competencia
- Archivo de recursos útiles
- Knowledge base personal

**❌ No recomendado para:**

- Procesar mensajes de grupos (se ignoran automáticamente)
- Análisis en tiempo real (<5s)
- Contenido multimedia (videos, PDFs complejos)
- URLs que requieren login

## 📈 Roadmap

### Completado ✅

- [x] Sistema base de análisis automatizado
- [x] Integración WhatsApp con Baileys
- [x] Scraping multi-plataforma
- [x] Análisis IA local con Ollama
- [x] Análisis detallado y profundo
- [x] Filtro para solo mensajes propios
- [x] Almacenamiento PostgreSQL
- [x] Full-text search en español
- [x] Sistema de estadísticas

### Próximas versiones 🚀

- [ ] Dashboard web con React
- [ ] API REST para consultas externas
- [ ] Exportar reportes PDF/Markdown
- [ ] Sistema de alertas (Telegram/Email) para contenido muy relevante
- [ ] Soporte para PDFs y documentos
- [ ] Clustering automático de contenido similar
- [ ] Resúmenes semanales automatizados
- [ ] Integración con Notion/Obsidian

## 🤝 Contribuciones

Proyecto personal MVP. Si encuentras bugs o tienes sugerencias, abre un issue.

## 📄 Licencia

MIT License - Uso libre para proyectos personales y comerciales.

## 👤 Autor

**Toni Ballesteros**

- Consultor IA Generativa & Real Estate
- Fundador: Anclora (Press, Nexus, Kairon)
- Email: <antonio@anclora.com>

---

## 💡 Tips de uso

**Organización recomendada:**

1. **Envíate URLs durante el día** mientras navegas
2. **Revisa estadísticas semanalmente:** `npm run stats`
3. **Busca por categorías** cuando necesites info específica
4. **Usa full-text search** para encontrar conceptos técnicos

**Consulta SQL favorita (copia/pega en psql):**

```sql
-- Tus 20 mejores recursos por relevancia
SELECT
  '⭐' || relevancia || ' - ' || categoria as tag,
  title,
  array_to_string(temas_principales, ' | ') as temas,
  url
FROM link_analysis
WHERE relevancia >= 4
ORDER BY relevancia DESC, created_at DESC
LIMIT 20;
```

---

**⭐ ¿Te resulta útil? Dale una estrella al repo y compártelo con quien le pueda servir!**

**🐛 ¿Problemas?** Revisa la sección "Solución de problemas" o abre un issue.

**💬 ¿Sugerencias?** PRs bienvenidos o contacta directamente.
