# Relatório curto — upgrade PWA administrativo

## Escopo

- Manifest exclusivo de `/admin/`, sem alteração no `index.html` público.
- Metadata, favicon e `apple-touch-icon` inseridos dinamicamente enquanto qualquer rota `/admin` está montada e restaurados na saída.
- CTA condicionado a `beforeinstallprompt`, estado standalone e fallback manual para iPhone/iPad.
- Ícones PNG reais gerados a partir de `public/images/logo-oficial.png`, sem dependência permanente.
- Sem Service Worker, cache offline, alteração Prisma ou cache de dados autenticados.

## Arquivos PWA

- `src/components/admin/AdminPwaProvider.tsx`
- `src/components/admin/AdminPwaProvider.test.tsx`
- `src/App.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/pages/AdminLogin.tsx`
- `public/admin/manifest.webmanifest`
- `public/admin/icons/{apple-touch-icon.png,pwa-192x192.png,pwa-512x512.png,pwa-maskable-512x512.png,favicon-32x32.png,favicon-16x16.png}`

## Evidências

- Testes focados: `npm test -- src/components/admin/AdminPwaProvider.test.tsx` — 5 testes aprovados.
- Build: `npm run build` — aprovado; apenas avisos existentes de Browserslist/chunk size.
- Lint: `npm run lint` — aprovado.
- Typecheck: `npx tsc -p tsconfig.app.json --noEmit` — ainda falha em erros preexistentes fora do escopo PWA (`CalendarView`, odontograma, prescrição, attendance, blog e usuários); nenhum erro reportado nos arquivos PWA.
- Os seis PNGs foram validados no teste pelo cabeçalho PNG nas dimensões 180, 192, 512, 512, 32 e 16.
- `git diff --check` não acusa arquivos PWA; acusa whitespace preexistente em artefatos `.superpowers/sdd` do checkout compartilhado.

## Limitações

- Não houve commit, push ou deploy, conforme solicitado.
- A validação de instalação nativa em Chrome/Android/Safari permanece manual e depende de HTTPS e dos critérios do navegador.
