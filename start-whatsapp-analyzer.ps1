# Crea: start-whatsapp-analyzer.ps1

@"
# Script de inicio - WhatsApp AI Analyzer

Write-Host "🚀 Iniciando WhatsApp AI Analyzer..." -ForegroundColor Cyan

# 1. Cierra LM Studio si está abierto
Write-Host "`n1. Verificando LM Studio..." -ForegroundColor Yellow
`$lmProcesses = Get-Process | Where-Object {`$_.ProcessName -like "*LM Studio*"}
if (`$lmProcesses) {
    Write-Host "   ⚠️  LM Studio detectado - Cerrando..." -ForegroundColor Red
    Stop-Process -Name "LM Studio" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
} else {
    Write-Host "   ✅ LM Studio no está ejecutándose" -ForegroundColor Green
}

# 2. Verifica memoria GPU disponible
Write-Host "`n2. Memoria GPU disponible:" -ForegroundColor Yellow
`$gpuMem = nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits
Write-Host "   `$gpuMem MB libres" -ForegroundColor Green

if ([int]`$gpuMem -lt 2000) {
    Write-Host "   ⚠️  Poca memoria libre. Reiniciando Ollama..." -ForegroundColor Yellow
    Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 5
}

# 3. Navega al proyecto
Write-Host "`n3. Iniciando proyecto..." -ForegroundColor Yellow
cd C:\Users\Usuario\Workspace\01_Proyectos\Anclora-Whatapp-Analizer

# 4. Test rápido
Write-Host "`n4. Test de sistema..." -ForegroundColor Yellow
npm run test-ollama

Write-Host "`n✅ Sistema listo. Ejecuta 'npm start' cuando quieras comenzar." -ForegroundColor Green
"@ | Out-File -FilePath start-whatsapp-analyzer.ps1 -Encoding UTF8

Write-Host "✅ Script creado: start-whatsapp-analyzer.ps1" -ForegroundColor Green