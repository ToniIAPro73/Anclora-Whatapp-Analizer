# 📦 WhatsApp AI Analyzer MVP - Paquete Completo

## ✅ Contenido del Paquete

Has descargado el proyecto completo listo para ejecutar. El archivo incluye:

### 📁 Estructura completa
- ✅ Código fuente completo (18 archivos)
- ✅ Configuración base (.env.example)
- ✅ Schema de base de datos (PostgreSQL)
- ✅ Scripts de testing y utilidades
- ✅ Documentación completa

### 📝 Archivos principales
- `README.md` - Documentación completa
- `QUICKSTART.md` - Guía de inicio rápido
- `CHANGELOG.md` - Historial de versiones
- `package.json` - Dependencias Node.js
- `index.js` - Punto de entrada
- `sql/schema.sql` - Schema PostgreSQL

---

## 🚀 Pasos de Instalación

### 1. Descomprimir

```bash
# Descomprime en tu directorio preferido
cd ~/
tar -xzf whatsapp-ai-analyzer-mvp.tar.gz
cd whatsapp-ai-analyzer-mvp
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará:
- `@whiskeysockets/baileys` - WhatsApp
- `playwright` - Web scraping
- `pg` - PostgreSQL client
- `winston` - Logging
- Y todas las demás dependencias

### 3. Instalar navegador Playwright

```bash
npx playwright install chromium
npx playwright install-deps chromium
```

### 4. Configurar PostgreSQL

```bash
# Conecta a tu container PostgreSQL existente
docker exec -it [nombre_tu_container] psql -U postgres

# Dentro de psql:
CREATE DATABASE whatsapp_ai_analyzer;
\c whatsapp_ai_analyzer
\q

# Aplica el schema (desde tu terminal)
docker exec -i [nombre_tu_container] psql -U postgres -d whatsapp_ai_analyzer < sql/schema.sql
```

### 5. Configurar variables de entorno

```bash
cp .env.example .env
nano .env  # O usa tu editor preferido
```

**Configura estos valores:**

```env
# PostgreSQL (tu configuración actual)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_actual
DB_NAME=whatsapp_ai_analyzer

# Ollama (ajusta según tu modelo)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b  # ⚠️ Usa el modelo que tengas instalado

# WhatsApp
WHATSAPP_SESSION_PATH=./auth_info

# Opcional
LOG_LEVEL=info
SCRAPING_TIMEOUT=30000
MAX_RETRIES=2
```

### 6. Verificar instalación

```bash
# Test PostgreSQL
npm run test-db

# Test Ollama (IMPORTANTE: asegúrate que el modelo en .env existe)
npm run test-ollama
```

**Ambos deben mostrar ✅**

### 7. ¡Iniciar!

```bash
npm start
```

**Aparecerá un código QR. Escanéalo con WhatsApp:**
1. Abre WhatsApp en tu móvil
2. Configuración → Dispositivos vinculados
3. Vincular dispositivo
4. Escanea el QR

---

## 🎯 Antes de empezar: LISTA DE VERIFICACIÓN

Antes de ejecutar `npm start`, asegúrate de tener:

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] Docker con PostgreSQL corriendo (`docker ps | grep postgres`)
- [ ] Base de datos `whatsapp_ai_analyzer` creada
- [ ] Schema SQL aplicado (tabla `link_analysis` existe)
- [ ] Ollama corriendo (`ollama list`)
- [ ] Modelo Ollama descargado y configurado en `.env`
- [ ] `.env` configurado con tus credenciales
- [ ] Playwright instalado (`npx playwright --version`)

**Verifica todo con:**

```bash
# Este comando debe pasar sin errores
npm run test-db && npm run test-ollama
```

---

## 📊 Primer Uso

### 1. Envíate un mensaje de prueba

Una vez conectado, envíate un mensaje con una URL:

```
https://github.com/nodejs/node
```

### 2. Observa los logs

Verás en la terminal cómo se procesa:
- 📥 Scraping del contenido
- 🤖 Análisis con Ollama
- 💾 Almacenamiento en PostgreSQL

### 3. Consulta resultados

```bash
# Abre una nueva terminal
npm run stats
```

O directamente en PostgreSQL:

```bash
docker exec -it [tu_container] psql -U postgres -d whatsapp_ai_analyzer

# Consulta los 10 más relevantes
SELECT title, categoria, relevancia, url 
FROM link_analysis 
ORDER BY relevancia DESC 
LIMIT 10;
```

---

## 🔧 Modelos Ollama Recomendados

### Según tu VRAM (4GB):

**Opción 1: Llama 3.1 8B (Recomendado)**
```bash
ollama pull llama3.1:8b
```
- Mejor balance calidad/velocidad
- ~5-10s de inferencia
- 4.7GB de VRAM

**Opción 2: Mistral 7B**
```bash
ollama pull mistral:7b
```
- Más rápido
- ~3-7s de inferencia
- 4.1GB de VRAM

**Opción 3: Qwen 2.5 7B**
```bash
ollama pull qwen2.5:7b
```
- Excelente para español
- ~5-10s de inferencia
- 4.4GB de VRAM

**⚠️ IMPORTANTE:** Después de descargar, actualiza `OLLAMA_MODEL` en `.env`

---

## 🆘 Solución de Problemas Rápida

### Error: "Ollama model not found"

```bash
# 1. Lista tus modelos
ollama list

# 2. Verifica que el nombre en .env coincide EXACTAMENTE
# Ejemplo: si ves "llama3.1:8b", usa eso en .env

# 3. Si no tienes modelos, descarga uno:
ollama pull llama3.1:8b
```

### Error: "PostgreSQL connection failed"

```bash
# 1. Verifica que está corriendo
docker ps | grep postgres

# 2. Si no está corriendo:
docker start [nombre_container]

# 3. Prueba la conexión
npm run test-db
```

### Error: "Module not found"

```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

### QR no aparece

```bash
# Limpia sesión anterior
rm -rf ./auth_info
npm start
```

---

## 📚 Documentación Adicional

Una vez instalado, lee estos documentos para profundizar:

1. **README.md** - Documentación completa
   - Arquitectura detallada
   - Configuración avanzada
   - Personalización de prompts
   - Consultas SQL útiles

2. **QUICKSTART.md** - Guía rápida de 5 minutos
   - Comandos condensados
   - Troubleshooting express

3. **CHANGELOG.md** - Historial y roadmap
   - Características actuales
   - Próximas mejoras
   - Decisiones de diseño

---

## 🎓 Próximos Pasos

Una vez que todo funcione:

1. **Personaliza el prompt** de análisis en `src/ai/ollama-client.js`
2. **Ajusta categorías** según tus intereses
3. **Crea consultas SQL** personalizadas para tus necesidades
4. **Automatiza reportes** con cron jobs de `npm run stats`
5. **Explora** agregar más plataformas de scraping

---

## 💡 Consejos Finales

- **Logs**: Todo se guarda en `logs/combined.log` y `logs/error.log`
- **Sesión WhatsApp**: Se guarda en `./auth_info` - no la borres
- **Base de datos**: Haz backups periódicos con `pg_dump`
- **Modelos**: Experimenta con diferentes modelos para encontrar el mejor balance
- **GPU**: Verifica con `nvidia-smi` que Ollama usa la GPU durante inferencia

---

## 🎉 ¡Listo para usar!

Si todo está configurado correctamente, ya tienes un sistema completo de análisis automatizado de enlaces usando IA 100% local y privado.

**¿Problemas?** Revisa el README.md completo o los logs en `./logs/`

**¿Todo funciona?** ¡Disfruta tu nuevo asistente de análisis! 🚀

---

**Desarrollado por Toni Ballesteros**  
antonio@anclora.com
