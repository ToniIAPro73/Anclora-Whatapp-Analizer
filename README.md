# 🤖 WhatsApp AI Analyzer MVP

Sistema automatizado para analizar enlaces compartidos en WhatsApp usando IA local (Ollama) y scraping inteligente.

## 📋 Características

- ✅ **Integración WhatsApp** vía Baileys (sin API oficial)
- ✅ **Scraping inteligente** con Playwright + Readability
- ✅ **Análisis AI local** usando Ollama con aceleración GPU
- ✅ **Soporte múltiples plataformas**: LinkedIn, Twitter/X, Instagram, Medium, etc.
- ✅ **Almacenamiento PostgreSQL** con búsqueda full-text
- ✅ **Cero dependencias cloud** - 100% local y privado
- ✅ **Procesamiento asíncrono** con cola de tareas

## 🎯 Requisitos

### Hardware
- **RAM**: 16GB mínimo, 32GB recomendado
- **GPU**: NVIDIA con 4GB+ VRAM (opcional pero recomendado)
- **Almacenamiento**: 20GB+ libres

### Software
- **Node.js**: v18+ 
- **Docker** con PostgreSQL
- **Ollama**: Instalado con modelo descargado
- **Git**: Para clonar el proyecto

## 🚀 Instalación Rápida

### 1. Clonar proyecto

```bash
cd ~
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

### 4. Configurar base de datos

#### Si ya tienes PostgreSQL en Docker:

```bash
# Conecta a tu container
docker exec -it [nombre_container_postgres] psql -U postgres

# Crea la base de datos
CREATE DATABASE whatsapp_ai_analyzer;
\q

# Aplica el schema
docker exec -i [nombre_container_postgres] psql -U postgres -d whatsapp_ai_analyzer < sql/schema.sql
```

#### Si no tienes PostgreSQL:

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

```bash
# Lista modelos disponibles
ollama list

# Si no tienes modelos, descarga uno recomendado:
# Para 4GB VRAM:
ollama pull llama3.1:8b

# Para 8GB+ VRAM:
ollama pull llama3.1:70b
```

### 6. Configurar variables de entorno

```bash
cp .env.example .env
nano .env
```

Configura los valores según tu setup:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=whatsapp_ai_analyzer

# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b  # Usa el modelo que descargaste

# WhatsApp
WHATSAPP_SESSION_PATH=./auth_info

# Opcional
LOG_LEVEL=info
SCRAPING_TIMEOUT=30000
MAX_RETRIES=2
```

### 7. Verificar instalación

```bash
# Test PostgreSQL
npm run test-db

# Test Ollama
npm run test-ollama

# Test Scrapers (opcional)
npm run test-scraper
```

### 8. Iniciar sistema

```bash
npm start
```

**Se mostrará un código QR. Escanéalo con WhatsApp:**

1. Abre WhatsApp en tu teléfono
2. Ve a **Configuración** → **Dispositivos vinculados**
3. Toca **"Vincular dispositivo"**
4. Escanea el código QR de la terminal

¡Listo! El sistema ya está esperando mensajes con URLs.

## 📖 Uso

### Funcionamiento básico

1. **Envíate un mensaje** con una o varias URLs
2. El sistema **detecta automáticamente** las URLs
3. **Extrae el contenido** de cada enlace
4. **Analiza con IA** el contenido
5. **Guarda en PostgreSQL** con resumen estructurado

### Ejemplo de mensaje

```
Mira estos artículos interesantes:

https://example.com/ai-agents-tutorial
https://twitter.com/user/status/12345
https://medium.com/@author/llm-article
```

El sistema procesará las 3 URLs automáticamente.

## 📊 Consultar resultados

### Ver estadísticas

```bash
npm run stats
```

Muestra:
- Total procesados
- Top categorías
- Top 10 más relevantes
- Últimos procesados
- Tags más frecuentes

### Consultas SQL directas

```bash
# Conecta a PostgreSQL
docker exec -it [nombre_container] psql -U postgres -d whatsapp_ai_analyzer

# Top 10 más relevantes
SELECT title, categoria, relevancia, url 
FROM link_analysis 
WHERE relevancia >= 4 
ORDER BY relevancia DESC, created_at DESC 
LIMIT 10;

# Buscar por categoría
SELECT title, resumen_ejecutivo, url
FROM link_analysis
WHERE categoria = 'AI Agents'
ORDER BY relevancia DESC;

# Buscar por palabra clave
SELECT title, url, categoria
FROM link_analysis
WHERE to_tsvector('spanish', contenido_completo) @@ plainto_tsquery('spanish', 'langchain')
LIMIT 20;
```

## 🔧 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el sistema completo |
| `npm run test-db` | Verifica conexión PostgreSQL |
| `npm run test-ollama` | Verifica Ollama y realiza inferencia de prueba |
| `npm run test-scraper` | Prueba scrapers con URLs |
| `npm run stats` | Muestra estadísticas completas |

## 🏗️ Arquitectura

```
WhatsApp (Baileys)
    ↓
URL Detector
    ↓
Router por Plataforma
    ↓
┌─────────────────┬─────────────────┐
│   Twitter       │    Generic      │
│   (Nitter)      │  (Playwright)   │
└─────────────────┴─────────────────┘
    ↓
Content Cleaner
    ↓
Ollama (Local LLM) ← GPU Acceleration
    ↓
PostgreSQL Storage
```

## 📁 Estructura del proyecto

```
whatsapp-ai-analyzer-mvp/
├── src/
│   ├── whatsapp.js           # Integración WhatsApp
│   ├── processor.js          # Orquestador principal
│   ├── scrapers/
│   │   ├── universal.js      # Scraper Playwright
│   │   └── twitter.js        # Scraper Nitter
│   ├── ai/
│   │   └── ollama-client.js  # Cliente Ollama
│   ├── database/
│   │   └── postgres.js       # Cliente PostgreSQL
│   └── utils/
│       ├── logger.js         # Sistema logging
│       └── url-detector.js   # Detector URLs
├── scripts/
│   ├── test-db.js           # Test PostgreSQL
│   ├── test-ollama.js       # Test Ollama
│   ├── test-scraper.js      # Test scrapers
│   └── show-stats.js        # Estadísticas
├── sql/
│   └── schema.sql           # Schema PostgreSQL
├── logs/                    # Logs aplicación
├── auth_info/               # Sesión WhatsApp
├── .env                     # Configuración
├── index.js                 # Entry point
└── package.json
```

## ⚙️ Configuración avanzada

### Optimización GPU

Para verificar que Ollama usa tu GPU:

```bash
# Durante inferencia, ejecuta:
nvidia-smi

# Deberías ver uso de VRAM en el proceso Ollama
```

Si no usa GPU:

```bash
# Reinstala Ollama con soporte CUDA
curl -fsSL https://ollama.com/install.sh | sh
```

### Ajustar modelo según VRAM

| VRAM | Modelo recomendado | Comando |
|------|-------------------|---------|
| 4GB | `llama3.1:8b` o `mistral:7b` | `ollama pull llama3.1:8b` |
| 6GB | `qwen2.5:14b` | `ollama pull qwen2.5:14b` |
| 8GB+ | `llama3.1:70b` | `ollama pull llama3.1:70b` |

### Personalizar prompts

Edita `src/ai/ollama-client.js` línea ~50 para ajustar el system prompt según tus necesidades.

### Agregar más plataformas

Crea un nuevo scraper en `src/scrapers/` siguiendo el patrón de `twitter.js`.

## 🐛 Solución de problemas

### Error: "Ollama not available"

```bash
# Verifica que Ollama está corriendo
ollama serve

# En otra terminal:
ollama list
```

### Error: "PostgreSQL connection failed"

```bash
# Verifica que el container está corriendo
docker ps | grep postgres

# Si no está corriendo:
docker start [nombre_container]
```

### Error: "QR code not showing"

```bash
# Asegúrate que la terminal soporta caracteres UTF-8
# En Windows, usa Windows Terminal o WSL

# Elimina sesión anterior y reinicia
rm -rf ./auth_info
npm start
```

### Scraping muy lento

```bash
# Aumenta timeout en .env
SCRAPING_TIMEOUT=60000

# O reduce número de reintentos
MAX_RETRIES=1
```

### Inferencia muy lenta (>30s)

1. Verifica uso de GPU con `nvidia-smi`
2. Usa modelo más pequeño (`llama3.1:8b` en lugar de `70b`)
3. Reduce `num_ctx` en `src/ai/ollama-client.js`

## 📈 Roadmap futuro

- [ ] Dashboard web con React
- [ ] API REST para consultas
- [ ] Soporte Instagram scraping
- [ ] Exportar reportes PDF
- [ ] Sistema de alertas (Telegram/Email)
- [ ] Multi-idioma (inglés)
- [ ] Clustering automático de contenido
- [ ] Integración con Make.com

## 🤝 Contribuciones

Este es un proyecto personal MVP. Si encuentras bugs o tienes sugerencias, siéntete libre de abrir issues.

## 📄 Licencia

MIT License - Uso libre para proyectos personales y comerciales.

## 👤 Autor

**Toni Ballesteros**
- Consultor IA Generativa & Real Estate
- Fundador: Anclora (Press, Nexus, Kairon)
- Email: antonio@anclora.com

---

**⭐ Si te resulta útil, considera darle una estrella al repo!**
