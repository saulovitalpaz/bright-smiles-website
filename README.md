# Núcleo Odontológico Especializado & Harmonização

> Website institucional e plataforma de gestão para o consultório odontológico da Dra. Ana Karolina Vital da Paz.

[![Status](https://img.shields.io/badge/status-ativo-brightgreen)](https://www.odontoeharmonizacao.com.br)
[![Stack](https://img.shields.io/badge/stack-React%20+%20Vite%20+%20Node.js-blue)](https://vitejs.dev)
[![Deployment](https://img.shields.io/badge/hospedagem-Railway%20+%20Cloudflare-orange)](https://railway.app)

---

## 📋 Sobre o Projeto

Website desenvolvido para o **Núcleo Odontológico Especializado & Harmonização**, focado em proporcionar uma experiência premium para pacientes de odontologia e harmonização facial.

- **Domínio Principal**: [www.odontoeharmonizacao.com.br](https://www.odontoeharmonizacao.com.br)
- **Localização**: Sala 206
- **Profissionais**: 
  - Dra. Ana Karolina Vital da Paz (CRO/MG 60.514)

### 🚀 Funcionalidades Principais
- **Landing Page Premium**: Design moderno, responsivo e focado em conversão.
- **Blog Integrado**: Sistema de gerenciamento de posts para SEO e educação de pacientes.
- **Gestão de Agendamentos**: Painel administrativo para visualização e controle de leads.
- **Segurança SSL**: Certificação via Cloudflare para navegação segura HTTPS.

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológica
- **Frontend**: React + Vite + TypeScript + Tailwind CSS (Shadcn UI)
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Infraestrutura**:
  - **Railway**: Hospedagem da aplicação e banco de dados.
  - **Cloudflare**: Gestão de DNS, CNAME Flattening (para domínio sem www) e SSL.

---

## 🛠️ Configuração de Desenvolvimento

### Requisitos
- Node.js / Bun
- PostgreSQL

### Execução Local
1. **Clonar e Instalar**:
   ```bash
   git clone [URL_DO_REPO]
   npm install
   ```

2. **Variáveis de Ambiente**:
   Crie um arquivo `.env` na pasta `server/` e na raiz:
   ```env
   # Backend (.env em /server)
   DATABASE_URL="postgresql://..."
   PORT=3001

   # Frontend (.env na raiz)
   VITE_API_URL="http://localhost:3001"
   ```

3. **Iniciar**:
   ```bash
   # Rodar backend
   cd server && npm run dev
   # Rodar frontend (em outro terminal)
   npm run dev
   ```

---

## 🤝 Créditos
- **Desenvolvedor**: Saulo
- **Proprietária**: Dra. Ana Karolina Vital da Paz

---

© 2026 Núcleo Odontológico Especializado & Harmonização. Todos os direitos reservados.
