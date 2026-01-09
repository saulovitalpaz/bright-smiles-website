# Guia de Deploy e Conexão Backend (Bright Smiles / NOEH)

Este documento orienta o processo de colocar o portal online e conectar todas as rotas frontend ao banco de dados e APIs reais.

## 🏗️ 1. Infraestrutura Escolhida

*   **Frontend & Backend:** [Railway](https://railway.app/) (Recomendado pela facilidade com Node.js/Vite/Next.js).
*   **Banco de Dados:** [Google Cloud SQL](https://cloud.google.com/sql) (PostgreSQL) ou [Railway Internal DB](https://railway.app/databases).
*   **Domínio:** [GoDaddy](https://www.godaddy.com/) (Apontando DNS para Railway).

---

## 🚀 2. Passo a Passo do Deploy

### No Railway:
1.  Crie um novo projeto e conecte seu repositório Git.
2.  O Railway detectará o `package.json` e iniciará o build automaticamente.
3.  **Variáveis de Ambiente (Configuração):** Adicione no painel `Variables`:
    *   `DATABASE_URL`: URL de conexão do Google Cloud ou Railway DB.
    *   `VITE_API_URL`: URL do seu backend no Railway (ex: `https://seu-backend.up.railway.app`).
    *   `JWT_SECRET`: Uma chave segura para o login do Admin.

### No GoDaddy:
1.  Acesse as configurações de DNS do seu domínio.
2.  Adicione um registro **CNAME** chamado `www` apontando para o domínio gerado pelo Railway.
3.  Adicione um registro **A** ou **Redirect** para o domínio principal (sem www).

---

## 🔗 3. Conectando as Rotas Frontend

Todas as páginas que criei (`AdminFinance`, `AdminAnalytics`, `AdminStories`) estão prontas para receber dados dinâmicos.

*   **Lógica de Substituição:** Atualmente, os dados estão em `useState` com mocks. Para conectar ao backend, você deve substituir as chamadas `setTransactions`, `setAppointments`, etc., por chamadas `fetch` ou `axios` para o endpoint `/api/finance`, `/api/leads`.

---

## 🛠️ 4. Scripts de Automação

Criei o arquivo `setup_backend.py` (ou `update_env.py`) na raiz do seu projeto para ajudar a configurar as chaves de API sem expor dados sensíveis no Git.

---

## 📌 5. Dados Necessários para o Setup
*   **GoDaddy:** Login e Senha para edição de DNS.
*   **Railway:** API Token (se for usar o CLI).
*   **Google Cloud:** Arquivo de Service Account (`credentials.json`) para acesso ao banco de dados se não for público.

> [!IMPORTANT]
> Nunca publique seu arquivo `.env` no GitHub. Use o segredo do Railway para isso!
