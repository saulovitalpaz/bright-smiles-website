@echo off
setlocal
cd /d %~dp0

title Instalador ReviverPet

echo.
echo ==================================================
echo       REVIVERPET - INSTALADOR DE DEPENDENCIAS
echo ==================================================
echo.
echo Este script ira configurar o ambiente para o sistema.
echo.

:: 1. Verificar se Python esta instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python nao foi localizado neste computador.
    echo.
    echo Este sistema e portatil (SQLite) e precisa apenas do Python para rodar.
    echo Siga estes passos simples:
    echo 1. O instalador sera baixado ou o site abrira agora.
    echo 2. Execute o instalador do Python.
    echo 3. *** MUITO IMPORTANTE ***: Marque a caixa "Add Python to PATH" antes de clicar em Instalar.
    echo 4. Apos terminar, feche e abra este "Instalador_Geral.bat" novamente.
    echo.
    echo Abrindo site oficial para voce...
    start https://www.python.org/ftp/python/3.12.1/python-3.12.1-amd64.exe
    pause
    exit
)


echo [+] Python detectado.
echo.
echo [+] Instalando bibliotecas do sistema (isso pode levar um minuto)...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [!] Falha ao instalar bibliotecas. Verifique a internet e tente novamente.
    pause
    exit
)

echo.
echo [+] Configurando Banco de Dados e Atalhos...
python setup.py

echo.
echo ==================================================
echo     INSTALACAO CONCLUIDA COM SUCESSO!
echo ==================================================
echo.
echo Agora voce pode usar o atalho "Iniciar ReviverPet" 
echo que foi criado na sua Area de Trabalho.
echo.
pause
