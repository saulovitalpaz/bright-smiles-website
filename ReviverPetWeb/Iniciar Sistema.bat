@echo off
setlocal
cd /d %~dp0
echo ==========================================
echo    REVIVER PET - Iniciando Sistema
echo ==========================================
echo.
echo [1/4] Verificando dependencias...
:: Verifica Frontend
if not exist "petreviver-flow\node_modules\" (
    echo Instalando dependencias do Frontend...
    cd petreviver-flow
    call npm install --quiet
    cd ..
)
:: Verifica Backend
python -m pip install -r requirements.txt --quiet

echo [2/4] Iniciando Servidor de Dados (Backend)...
:: Inicia o uvicorn na porta 8000
start "ReviverPet Backend" /min python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

echo [3/4] Iniciando Interface (Frontend)...
:: Inicia o Vite na porta 5173
cd petreviver-flow
start "ReviverPet Frontend" /min npm run dev -- --port 5173
cd ..

echo [4/4] Aguardando o sistema estabilizar...
timeout /T 8 /NOBREAK > nul

echo.
echo Abrindo o sistema...
:: O Frontend (Vite) roda em localhost:5173
start chrome.exe --app=http://localhost:5173
if %ERRORLEVEL% NEQ 0 (
    start http://localhost:5173
)

echo.
echo Pronto! Você pode minimizar esta janela.
echo O sistema esta rodando em: http://localhost:5173
timeout /T 5 > nul
exit
