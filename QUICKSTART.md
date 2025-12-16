# ⚡ Guía de Inicio Rápido (5 minutos)

## 🎯 Pre-requisitos verificados
- ✅ Node.js 18+ instalado
- ✅ Docker con PostgreSQL corriendo
- ✅ Ollama instalado con un modelo

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

### 2. Verificar (1 minuto)

```bash
# Test rápido
npm run test-db && npm run test-ollama
```

Si ambos muestran ✅, continúa.

### 3. Iniciar (2 minutos)

```bash
npm start
```

**Escanea el QR que aparece con WhatsApp.**

### 4. Probar

Envíate un mensaje con una URL:

```
https://github.com/nodejs/node
```

Verás en los logs cómo se procesa automáticamente.

### 5. Ver resultados

```bash
npm run stats
```

## 🎓 Siguiente paso

Lee el [README.md](README.md) completo para:
- Personalizar prompts
- Agregar más plataformas  
- Optimizar rendimiento
- Consultas SQL avanzadas

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

---

**¿Todo funcionó?** Ahora tienes un sistema completo de análisis automatizado de enlaces 🎉

**¿Problemas?** Revisa el [README.md](README.md) sección "Solución de problemas"
