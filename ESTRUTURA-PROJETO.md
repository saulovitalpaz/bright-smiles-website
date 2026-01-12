# Estrutura de Pastas Sugerida

```
vitalite-site/
│
├── 📁 .github/                      # GitHub Actions (CI/CD)
│   └── workflows/
│       └── deploy.yml
│
├── 📁 public/                       # Arquivos estáticos
│   ├── images/
│   │   ├── logo/
│   │   │   ├── logo-horizontal.svg
│   │   │   ├── logo-vertical.svg
│   │   │   ├── logo-mono.svg
│   │   │   └── favicon.ico
│   │   ├── team/
│   │   │   ├── dra-ana-karolina.jpg
│   │   │   └── dra-clara-lima.jpg
│   │   ├── clinic/
│   │   │   ├── recepcao.jpg
│   │   │   ├── sala-atendimento.jpg
│   │   │   └── equipamentos.jpg
│   │   └── treatments/
│   │       ├── bruxismo.jpg
│   │       ├── implante.jpg
│   │       └── harmonizacao.jpg
│   ├── robots.txt
│   └── sitemap.xml
│
├── 📁 src/
│   │
│   ├── 📁 app/                      # Next.js 15 App Router
│   │   ├── layout.tsx               # Layout raiz
│   │   ├── page.tsx                 # Home page
│   │   ├── globals.css              # Estilos globais
│   │   │
│   │   ├── 📁 (public)/             # Grupo de rotas públicas
│   │   │   ├── layout.tsx
│   │   │   │
│   │   │   ├── 📁 sobre/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── 📁 tratamentos/
│   │   │   │   ├── page.tsx         # Listagem
│   │   │   │   ├── 📁 bruxismo/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── 📁 implante/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── 📁 protese/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── 📁 [slug]/       # Rota dinâmica
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── 📁 harmonizacao/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── 📁 botox/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── 📁 preenchimento/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── 📁 bioestimulador/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── 📁 blog/
│   │   │   │   ├── page.tsx         # Listagem de artigos
│   │   │   │   ├── 📁 [slug]/
│   │   │   │   │   └── page.tsx     # Artigo individual
│   │   │   │   └── 📁 categoria/
│   │   │   │       └── 📁 [slug]/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   └── 📁 contato/
│   │   │       └── page.tsx
│   │   │
│   │   ├── 📁 admin/                # Painel administrativo
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Dashboard
│   │   │   │
│   │   │   ├── 📁 posts/
│   │   │   │   ├── page.tsx         # Listagem
│   │   │   │   ├── 📁 novo/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── 📁 [id]/
│   │   │   │       └── editar/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── 📁 leads/
│   │   │   │   ├── page.tsx
│   │   │   │   └── 📁 [id]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── 📁 categorias/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── 📁 configuracoes/
│   │   │       └── page.tsx
│   │   │
│   │   └── 📁 api/                  # API Routes
│   │       ├── 📁 auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── 📁 leads/
│   │       │   ├── route.ts         # POST /api/leads
│   │       │   └── 📁 [id]/
│   │       │       └── route.ts     # GET/PUT/DELETE
│   │       ├── 📁 posts/
│   │       │   ├── route.ts
│   │       │   └── 📁 [id]/
│   │       │       └── route.ts
│   │       └── 📁 upload/
│   │           └── route.ts
│   │
│   ├── 📁 components/               # Componentes React
│   │   ├── 📁 layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileMenu.tsx
│   │   │
│   │   ├── 📁 ui/                   # Componentes base
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Badge.tsx
│   │   │
│   │   ├── 📁 forms/
│   │   │   ├── ContactForm.tsx
│   │   │   ├── LeadForm.tsx
│   │   │   └── PostEditor.tsx
│   │   │
│   │   ├── 📁 blog/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostList.tsx
│   │   │   ├── CategoryBadge.tsx
│   │   │   └── RelatedPosts.tsx
│   │   │
│   │   └── 📁 admin/
│   │       ├── DashboardStats.tsx
│   │       ├── LeadTable.tsx
│   │       └── PostTable.tsx
│   │
│   ├── 📁 lib/                      # Utilitários e configurações
│   │   ├── prisma.ts                # Cliente Prisma
│   │   ├── auth.ts                  # Configuração NextAuth
│   │   ├── utils.ts                 # Funções auxiliares
│   │   ├── validations.ts           # Schemas Zod
│   │   └── constants.ts             # Constantes
│   │
│   ├── 📁 hooks/                    # Custom React Hooks
│   │   ├── useLeads.ts
│   │   ├── usePosts.ts
│   │   └── useUTM.ts
│   │
│   ├── 📁 types/                    # TypeScript types
│   │   ├── index.ts
│   │   ├── lead.ts
│   │   ├── post.ts
│   │   └── user.ts
│   │
│   └── 📁 styles/                   # Estilos adicionais
│       └── editor.css               # Estilos do editor de posts
│
├── 📁 prisma/
│   ├── schema.prisma                # Modelagem do banco
│   ├── seed.ts                      # Dados iniciais
│   └── 📁 migrations/               # Migrações do banco
│
├── 📁 docs/                         # Documentação
│   ├── escopo-original.html         # index.html atual
│   ├── content-original.js          # content.js atual
│   ├── API.md                       # Documentação da API
│   └── DEPLOYMENT.md                # Guia de deploy
│
├── 📁 tests/                        # Testes (opcional)
│   ├── unit/
│   └── integration/
│
├── .env.example                     # Exemplo de variáveis de ambiente
├── .env.local                       # Variáveis locais (não commitar)
├── .gitignore
├── next.config.js                   # Configuração Next.js
├── tailwind.config.ts               # Configuração Tailwind
├── tsconfig.json                    # Configuração TypeScript
├── package.json
├── README.md                        # Documentação principal
├── ANALISE-ESCOPO.md               # Este documento
└── LICENSE
```

---

## 📝 Explicação das Pastas Principais

### `/public`
Arquivos estáticos acessíveis diretamente via URL.
- **Exemplo**: `/public/images/logo.svg` → `https://site.com/images/logo.svg`

### `/src/app`
Estrutura de rotas do Next.js 15 (App Router).
- Cada pasta = uma rota
- `page.tsx` = página renderizada
- `layout.tsx` = layout compartilhado

### `/src/components`
Componentes React reutilizáveis.
- **`/layout`**: Header, Footer, Sidebar
- **`/ui`**: Botões, inputs, cards (design system)
- **`/forms`**: Formulários específicos
- **`/blog`**: Componentes do blog
- **`/admin`**: Componentes do painel

### `/src/lib`
Lógica de negócio e utilitários.
- **`prisma.ts`**: Conexão com banco
- **`auth.ts`**: Autenticação
- **`utils.ts`**: Funções auxiliares (formatação, validação)

### `/prisma`
Tudo relacionado ao banco de dados.
- **`schema.prisma`**: Define tabelas e relacionamentos
- **`migrations/`**: Histórico de alterações no banco

---

## 🎯 Convenções de Nomenclatura

### Arquivos
```
✅ Correto:
- ContactForm.tsx (PascalCase para componentes)
- utils.ts (camelCase para utilitários)
- api/leads/route.ts (lowercase para rotas)

❌ Evitar:
- contact-form.tsx
- Utils.ts
- API/Leads/Route.ts
```

### Componentes
```tsx
// ✅ Correto
export default function ContactForm() { ... }

// ❌ Evitar
export default function contactForm() { ... }
```

### Variáveis
```tsx
// ✅ Correto
const userName = "Ana";
const MAX_LEADS = 100;

// ❌ Evitar
const UserName = "Ana";
const max_leads = 100;
```

---

## 🔄 Fluxo de Dados Típico

```
1. Usuário acessa /tratamentos/bruxismo
   ↓
2. Next.js renderiza src/app/(public)/tratamentos/bruxismo/page.tsx
   ↓
3. Componente busca dados via API: /api/posts?slug=bruxismo
   ↓
4. API usa Prisma para consultar PostgreSQL
   ↓
5. Dados retornam e página é renderizada
   ↓
6. HTML é enviado ao navegador
```

---

## 📦 Dependências Principais (package.json)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^5.0.0",
    "zod": "^3.22.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "prisma": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/node": "^20.0.0"
  }
}
```

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor local para desenvolvimento

# Banco de Dados
npx prisma migrate dev   # Cria/aplica migrações
npx prisma studio        # Interface visual do banco
npx prisma generate      # Gera cliente Prisma

# Build & Deploy
npm run build            # Cria versão de produção
npm run start            # Inicia servidor de produção

# Linting & Formatação
npm run lint             # Verifica erros de código
npm run format           # Formata código (Prettier)
```

---

## 📊 Estimativa de Tamanho

```
Projeto completo (estimativa):
├── Código-fonte:        ~150 arquivos
├── Componentes React:   ~40 componentes
├── Rotas de API:        ~15 endpoints
├── Páginas públicas:    ~12 páginas
├── Páginas admin:       ~8 páginas
└── Tamanho total:       ~50-80 MB (com node_modules)
```

---

**Última atualização**: Janeiro 2026
