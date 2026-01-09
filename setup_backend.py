import os
import json

def setup_environment():
    """
    Script para auxiliar na configuração do ambiente de produção/staging.
    Gerencia a criação do arquivo .env e prepara os dados para o deploy.
    """
    print("🦷 Bright Smiles - Setup de Backend 🚀")
    print("-" * 30)

    # Exemplo de configuração de variáveis
    config = {
        "VITE_API_URL": "http://localhost:3001", # Alterar para URL do Railway no deploy
        "DB_HOST": "google_cloud_ip",
        "DATABASE_NAME": "bright_smiles_db",
        "ADMIN_SECRET": "gerar_chave_aleatoria_aqui"
    }

    env_content = ""
    for key, value in config.items():
        env_content += f"{key}={value}\n"

    try:
        with open(".env", "w") as f:
            f.write(env_content)
        print("✅ Arquivo .env criado/atualizado com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao criar arquivo: {e}")

    # Guia para os dados do usuário
    print("\n📝 Próximos passos para você, Saulo:")
    print("1. Insira os IPs do Google Cloud no arquivo .env se necessário.")
    print("2. Verifique o CNAME no GoDaddy apontando para o link do Railway.")
    print("3. Execute 'npm run build' para validar se as rotas estão íntegras.")

if __name__ == "__main__":
    setup_environment()
