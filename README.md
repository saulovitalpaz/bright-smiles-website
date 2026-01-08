# Vitalité - Odontologia & Harmonização

> Website institucional e plataforma de captação de leads para consultório odontológico

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)](https://github.com)
[![Stack](https://img.shields.io/badge/stack-Next.js%2015-black)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-Propriet%C3%A1rio-red)](LICENSE)

---

## 📋 Sobre o Projeto

Website profissional para o consultório **Vitalité Odontologia & Harmonização**, localizado na Sala 206, com foco em:

- **Captação inteligente de pacientes** através de marketing digital
- **Blog educativo** para posicionamento no Google (SEO)
- **Rastreamento de origem** de cada lead (Google Ads, Instagram, Facebook, indicações)
- **Painel administrativo** para gestão de conteúdo e contatos

### 👩‍⚕️ Profissionais

- **Dra. Ana Karolina Vital da Paz** - CRO/MG 60.514
- **Dra. Clara Lima de Souza** - CRO/MG 60.938

---

## 🎯 Objetivos Estratégicos

### Público-Alvo Principal
- **Nova geração de pacientes** (18-40 anos) que buscam informações em redes sociais
- Usuários de **TikTok e Instagram** para descoberta de serviços
- Pacientes que valorizam **transparência e educação** sobre procedimentos

### Diferenciais Competitivos
1. **Marketing de Conteúdo**: Artigos educativos que atraem pacientes organicamente
2. **Rastreamento UTM**: Saber exatamente qual campanha trouxe cada paciente
3. **Autonomia**: Atualizar site sem depender de agência/programador
4. **Integração com Redes Sociais**: Links diretos do Instagram/TikTok para páginas de tratamento

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológica

```
Frontend:     Next.js 15 (React 19) + TypeScript 5
Estilização:  Tailwind CSS v4
Backend:      Next.js API Routes + Prisma ORM
Banco de Dados: PostgreSQL (Railway)
Autenticação: NextAuth.js
Hospedagem:   Vercel (frontend) + Railway (banco)
```

### Por Que Essa Stack?

| Aspecto | Benefício |
|---------|-----------|
| **Performance** | Lighthouse Score 95+ (Google prioriza sites rápidos) |
| **SEO Nativo** | SSR (Server-Side Rendering) = indexação perfeita no Google |
| **Segurança** | Código fechado, sem plugins vulneráveis (vs WordPress) |
| **Custo** | ~R$ 20-50/mês (vs R$ 150+ de hosting tradicional) |
| **Manutenção** | Atualizações simples, sem conflito de plugins |

---

## 📦 Funcionalidades Planejadas

### 🌐 Site Público

- [x] Página inicial institucional
- [ ] Páginas de tratamentos odontológicos:
  - Clínica geral e cirurgia
  - Bruxismo e placa miorrelaxante
  - Prótese dentária e implantes
- [ ] Páginas de harmonização facial:
  - Botox terapêutico e estético
  - Preenchimento com ácido hialurônico
  - Bioestimuladores de colágeno
- [ ] Seção "Sobre Nós" com perfil das profissionais
- [ ] Formulário de contato com captura de UTM
- [ ] Integração WhatsApp Business

### 📝 Blog Educativo

- [ ] Sistema de categorias e tags
- [ ] Editor visual (Tiptap) para criação de artigos
- [ ] SEO automático (meta tags, URLs amigáveis)
- [ ] Artigos relacionados automáticos
- [ ] Contador de visualizações
- [ ] Tempo de leitura estimado

### 📊 Painel Administrativo

- [ ] Dashboard com estatísticas de leads
- [ ] Gestão de artigos do blog
- [ ] Lista de contatos com filtros por origem
- [ ] Marcação de status de leads (novo → contactado → convertido)
- [ ] Exportação de dados para Excel/CSV
- [ ] Gestão financeira (receitas, despesas, NFe)
- [ ] Portal médico para registro de atendimentos (LGPD compliant)

### 🎯 Rastreamento de Marketing

- [ ] Captura automática de parâmetros UTM
- [ ] Identificação de origem: Google Ads (gclid), Facebook/Instagram (fbclid)
- [ ] Relatórios de ROI por campanha
- [ ] Análise de qual canal traz mais conversões

---

## 📂 Estrutura do Projeto (Planejada)

```
site/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (public)/          # Rotas públicas
│   │   │   ├── page.tsx       # Home
│   │   │   ├── tratamentos/   # Páginas de serviços
│   │   │   ├── blog/          # Listagem e artigos
│   │   │   └── contato/       # Formulário
│   │   ├── admin/             # Painel administrativo
│   │   │   ├── dashboard/
│   │   │   ├── posts/
│   │   │   ├── leads/
│   │   │   └── financeiro/
│   │   └── api/               # API Routes
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilitários e configurações
│   └── styles/                # Estilos globais
├── prisma/
│   └── schema.prisma          # Modelagem do banco
├── public/
│   ├── images/                # Imagens estáticas
│   └── logo/                  # Logos do consultório
└── docs/
    └── escopo-original.html   # Documentação atual (index.html)
```

---

## 🚀 Roadmap de Desenvolvimento

### Fase 1: Fundação (Semanas 1-2)
- [ ] Configurar projeto Next.js 15 + TypeScript
- [ ] Configurar Tailwind CSS v4
- [ ] Criar design system (cores, tipografia, componentes base)
- [ ] Configurar banco PostgreSQL + Prisma
- [ ] Implementar autenticação (NextAuth.js)

### Fase 2: Frontend Público (Semanas 3-4)
- [ ] Página inicial responsiva
- [ ] Páginas de tratamentos (templates reutilizáveis)
- [ ] Formulário de contato com validação
- [ ] Integração WhatsApp
- [ ] Otimização SEO (meta tags, sitemap, robots.txt)

### Fase 3: Blog (Semana 5)
- [ ] Listagem de artigos com paginação
- [ ] Página individual de artigo
- [ ] Sistema de categorias e tags
- [ ] Artigos relacionados

### Fase 4: Painel Admin (Semanas 6-7)
- [ ] Dashboard com métricas
- [ ] CRUD de artigos com editor visual
- [ ] Gestão de leads com filtros
- [ ] Upload de imagens

### Fase 5: Rastreamento & Analytics (Semana 8)
- [ ] Captura de UTM parameters
- [ ] Relatórios de origem de leads
- [ ] Integração Google Analytics 4
- [ ] Pixel do Facebook/Instagram

### Fase 6: Testes & Deploy (Semana 9)
- [ ] Testes de responsividade (mobile, tablet, desktop)
- [ ] Testes de performance (Lighthouse)
- [ ] Deploy Vercel + Railway
- [ ] Configuração de domínio personalizado

---

## 🎨 Identidade Visual

### Branding Atual

**Nome**: Vitalité (sugestão de domínio: `vitaliteodonto.com.br` ou `clinicavitalite.com.br`)

**Cores** (baseadas na placa do consultório):
- Dourado: `#D4AF37` (elegância, confiança)
- Preto: `#1C1917` (sofisticação)
- Branco: `#FAFAF9` (limpeza, saúde)

**Tipografia**:
- Títulos: Inter (moderna, clean)
- Corpo: Inter (legibilidade)
- Destaques: IBM Plex Mono (técnico, profissional)

### Logo
- Símbolo: Dente estilizado com perfil feminino (harmonização)
- Formato: Horizontal para header, vertical para redes sociais

---

## 📊 Métricas de Sucesso

### KPIs Principais
- **Taxa de conversão**: Visitantes → Leads (meta: 3-5%)
- **Origem de leads**: % por canal (Google, Instagram, Facebook, Direto)
- **ROI por campanha**: Custo de anúncio vs. pacientes convertidos
- **Posicionamento SEO**: Palavras-chave na 1ª página do Google

### Palavras-Chave Alvo (SEO)
- "dentista [cidade]"
- "tratamento bruxismo [cidade]"
- "harmonização facial [cidade]"
- "implante dentário [cidade]"
- "botox para bruxismo [cidade]"

---

## 🔒 Segurança & LGPD

### Conformidade Legal
- [ ] Política de Privacidade
- [ ] Termos de Uso
- [ ] Consentimento de cookies (LGPD)
- [ ] Criptografia de senhas (bcrypt)
- [ ] Proteção de dados sensíveis (prontuários médicos)

### Backup & Recuperação
- Backup automático diário (Railway)
- Versionamento de código (Git)
- Plano de recuperação de desastres

---

## 🛠️ Como Executar (Quando Implementado)

```bash
# 1. Clonar repositório
git clone [URL_DO_REPO]
cd site

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com credenciais do banco

# 4. Rodar migrações do banco
npx prisma migrate dev

# 5. Iniciar servidor de desenvolvimento
npm run dev

# Acessar: http://localhost:3000
```

---

## 📝 Documentação Adicional

- **Escopo Técnico Detalhado**: Veja `index.html` (documentação atual)
- **Modelagem de Banco**: Veja seção "Banco de Dados" no escopo
- **Fluxo de Captação**: Veja seção "Como Funciona na Prática" no escopo

---

## 🤝 Equipe de Desenvolvimento

- **Desenvolvedor**: Saulo
- **Cliente**: Dra. Ana Karolina Vital da Paz & Dra. Clara Lima de Souza
- **Consultório**: Vitalité Odontologia & Harmonização

---

## 📞 Contato

**Consultório**: Sala 206  
**Profissionais**: Dra. Ana Karolina & Dra. Clara  
**Especialidades**: Odontologia Especializada & Harmonização Facial

---

## 📄 Licença

© 2026 Vitalité Odontologia & Harmonização. Todos os direitos reservados.  
Este é um projeto proprietário desenvolvido exclusivamente para o consultório.

---

**Última atualização**: Janeiro 2026  
**Versão do escopo**: 1.0.0  
**Status**: 🟡 Em planejamento
