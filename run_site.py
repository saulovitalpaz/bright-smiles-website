import subprocess
import sys
import os

def run_dev():
    print("Iniciando o servidor de desenvolvimento do site...")
    print("Pressione Ctrl+C para encerrar.")
    
    try:
        # Check if node_modules exists
        if not os.path.exists("node_modules"):
            print("Pastas de dependências não encontradas. Executando 'npm install'...")
            subprocess.run(["npm", "install"], shell=True)
        
        # Run vite dev server
        subprocess.run(["npm", "run", "dev"], shell=True)
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
    except Exception as e:
        print(f"Erro ao iniciar o servidor: {e}")

if __name__ == "__main__":
    run_dev()
