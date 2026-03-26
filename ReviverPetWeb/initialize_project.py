import os

# Define o diretório base (ajustado para Documents por permissão)
BASE_DIR = os.path.expanduser("~/Documents/ReviverPet")

# Estrutura de pastas conforme sugerido pelo Gemini
folders = [
    os.path.join(BASE_DIR, "backend"),
    os.path.join(BASE_DIR, "frontend"),
    os.path.join(BASE_DIR, "docs"),
]

def initialize():
    print(f"Iniciando inicialização em: {BASE_DIR}")
    
    # Cria as pastas
    for folder in folders:
        if not os.path.exists(folder):
            os.makedirs(folder)
            print(f"Pasta criada: {folder}")

    # Cria o arquivo Iniciar Sistema.bat
    bat_content = f"@echo off\ncd /d {os.path.join(BASE_DIR, 'backend')}\npython main.py\npause"
    with open(os.path.join(BASE_DIR, "Iniciar Sistema.bat"), "w") as f:
        f.write(bat_content)
    print("Arquivo 'Iniciar Sistema.bat' criado.")

    # Cria um main.py básico para teste
    with open(os.path.join(BASE_DIR, "backend", "main.py"), "w") as f:
        f.write("print('Sistema ReviverPet Iniciado!')")
    print("Arquivo 'backend/main.py' criado.")

if __name__ == "__main__":
    initialize()
