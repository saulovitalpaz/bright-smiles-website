import os
import subprocess
import sys
import platform

def run_command(command):
    try:
        subprocess.check_call(command, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar comando: {e}")
        return False
    return True

def setup():
    print("--- Iniciando Setup ReviverPet ---")
    
    # 1. Instalar dependências
    print("Instalando dependências do Python...")
    if not run_command("pip install -r requirements.txt"):
        print("Falha ao instalar dependências.")
        return

    # 2. Inicializar Banco de Dados (SQLite)
    print("Inicializando banco de dados SQLite local...")
    try:
        from backend.database import engine, Base
        from backend import models
        Base.metadata.create_all(bind=engine)
        print("Banco de dados local criado/verificado com sucesso.")
    except Exception as e:
        print(f"Erro ao inicializar banco de dados: {e}")


    # 3. Criar atalho na Área de Trabalho (Windows)
    if platform.system() == "Windows":
        try:
            import winshell
            from win32com.client import Dispatch

            desktop = winshell.desktop()
            path = os.path.join(desktop, "Iniciar ReviverPet.lnk")
            target = os.path.join(os.getcwd(), "Iniciar Sistema.bat")
            wDir = os.getcwd()
            icon = os.path.join(os.getcwd(), "logo.ico")

            shell = Dispatch('WScript.Shell')
            shortcut = shell.CreateShortCut(path)
            shortcut.Targetpath = target
            shortcut.WorkingDirectory = wDir
            shortcut.IconLocation = icon
            shortcut.save()
            print(f"Atalho criado na área de trabalho: {path}")
        except ImportError:
            print("Bibliotecas winshell/pywin32 não encontradas. Atalho não será criado automaticamente.")
            print("Para criar o atalho, instale: pip install winshell pywin32")

    print("\n--- Setup Concluído com Sucesso! ---")
    print("Agora você pode usar o atalho na área de trabalho ou rodar 'Iniciar Sistema.bat'.")

if __name__ == "__main__":
    setup()
