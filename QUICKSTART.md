# ⚡ Guía de Inicio Rápido (5 minutos)

## 🎯 Pre-requisitos verificados

- ✅ Node.js 18+ instalado
- ✅ Docker con PostgreSQL corriendo
- ✅ Ollama instalado y corriendo

## 📦 Instalación Express

### 1. Instalar y configurar (2 minutos)

```bash
# 1. Navega al directorio
cd whatsapp-ai-analyzer-mvp

# 2. Instala dependencias
npm install

# 3. Instala navegador Playwright
npx playwright install chromium

# 4. Configura .env
cp .env.example .env
nano .env  # Edita con tus credenciales

# 5. Crea base de datos
docker exec -i [tu_container_postgres] psql -U postgres << EOF
CREATE DATABASE whatsapp_ai_analyzer;
\c whatsapp_ai_analyzer
EOF

# 6. Aplica schema
docker exec -i [tu_container_postgres] psql -U postgres -d whatsapp_ai_analyzer < sql/schema.sql
```

### 2. Configurar Ollama (1 minuto)

```bash
# Descarga modelo recomendado para 4GB VRAM
ollama pull llama3.2:latest

# Verifica
ollama list

# Actualiza .env
# OLLAMA_MODEL=llama3.2:latest
```

### 3. Verificar (30 segundos)

```bash
# Test rápido
npm run test-db && npm run test-ollama
```

Si ambos muestran ✅, continúa.

### 4. Iniciar (30 segundos)

```bash
npm start
```

**Escanea el QR que aparece con WhatsApp.**

### 5. Probar

**IMPORTANTE:** Envíate el mensaje **A TI MISMO** (tu propio contacto en WhatsApp).

Abre WhatsApp en tu móvil, busca tu propio contacto y envía:

```text
https://github.com/nodejs/node
```

**NO** envíes el mensaje a otro contacto, el sistema solo procesa URLs que **TÚ te envías a ti mismo**.

Verás en los logs cómo se procesa automáticamente.

### 6. Ver resultados

```bash
npm run stats
```

## 🎯 Configuración mínima .env

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=whatsapp_ai_analyzer

# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest

# WhatsApp
WHATSAPP_SESSION_PATH=./auth_info

# Opcional (recomendado para uso personal)
SEND_CONFIRMATIONS=false
SEND_RESULTS=false
SEND_ERRORS=false
```

## 💡 Caso de Uso Principal

Este sistema está diseñado como tu **"Read It Later" personal con IA**:

1. **Encuentras un artículo interesante** → Lo compartes a WhatsApp (a ti mismo)
2. **Bot lo procesa automáticamente** en background (~30s)
3. **Consultas cuando quieras** con `npm run stats` o SQL

**El sistema IGNORA mensajes de otros contactos** - solo procesa lo que TÚ te envías.

## 🎓 Siguiente paso

Lee el [README.md](README.md) completo para:

- Personalizar prompts y categorías
- Consultas SQL avanzadas
- Optimizar rendimiento
- Solucionar problemas

## 🆘 Ayuda Rápida

**Error PostgreSQL:**

```bash
docker start [nombre_container]
npm run test-db
```

**Error Ollama:**

```bash
ollama serve  # En terminal separada
ollama list   # Verifica modelos
npm run test-ollama
```

**QR no aparece:**

```bash
rm -rf ./auth_info
npm start
```

**Sistema no procesa URLs:**

```bash
# Verifica que te envíes el mensaje A TI MISMO
# NO a otro contacto

# En logs debe aparecer:
# ✅ ES MENSAJE PROPIO - Continuando...

# Si dice "IGNORADO: No es mensaje propio"
# → Estás enviando desde/hacia otro número
```

**Análisis muy básico:**

```bash
# El sistema está configurado para análisis PROFUNDO
# Tiempo: 25-40s por URL
# Calidad: Resumen de 5-8 frases + 5-7 insights detallados

# Si necesitas más velocidad (menos calidad):
# Edita src/ai/ollama-client.js:
# num_ctx: 2048 (en lugar de 4096)
# num_predict: 512 (en lugar de 1024)
```

## 📊 Consultas SQL Rápidas

```bash
# Conéctate a PostgreSQL
docker exec -it [container] psql -U postgres -d whatsapp_ai_analyzer

# Top 5 más relevantes
SELECT title, categoria, relevancia, url
FROM link_analysis
ORDER BY relevancia DESC
LIMIT 5;

# Buscar por palabra
SELECT title, url FROM link_analysis
WHERE to_tsvector('spanish', contenido_completo)
  @@ plainto_tsquery('spanish', 'langchain');
```

---

**¿Todo funcionó?** Ahora tienes un sistema completo de análisis automatizado 🎉

**¿Problemas?** Revisa el [README.md](README.md) sección "Solución de problemas"

**💡 Recuerda:** El sistema solo procesa URLs que **TÚ te envías a ti mismo** en WhatsApp.
