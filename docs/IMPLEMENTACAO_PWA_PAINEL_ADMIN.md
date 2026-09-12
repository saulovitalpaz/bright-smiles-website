# Especificação de Implementação — PWA instalável apenas na área `/admin/`

## Objetivo

Adicionar ao projeto existente Vite/React + Express/Prisma a opção de instalar **somente a área administrativa `/admin/`** como Web App/PWA.

A homepage pública `/` e demais rotas públicas **não devem**:
- anunciar um Web App Manifest;
- exibir botão/CTA de instalação;
- registrar funcionalidade PWA global;
- ser tratadas como parte do aplicativo instalado.

O aplicativo instalado deve abrir diretamente em `/admin/` e continuar usando o backend Express/Prisma existente sem alteração arquitetural.

---

## Requisito principal de arquitetura

O escopo da PWA deve ser explicitamente:

```text
/admin/
```

Configurar no manifest:

```json
{
  "id": "/admin/",
  "start_url": "/admin/",
  "scope": "/admin/",
  "display": "standalone"
}
```

### Atenção: SPA Vite com `index.html` compartilhado

Se `/` e `/admin/` usam o mesmo `index.html`, **não inserir `<link rel="manifest">` diretamente no `index.html`**.

Isso anunciaria a PWA também na homepage pública.

O manifest deve ser anexado ao `<head>` dinamicamente quando o shell/layout da área `/admin/` estiver montado e removido ao sair dessa área.

---

# Estratégia recomendada

## Fase 1 — instalação PWA sem offline/cache

Implementar primeiro apenas a capacidade de instalação.

Não adicionar cache de API, sessões, páginas autenticadas ou respostas Prisma/Express nesta fase.

Um Service Worker não é necessário para a instalação nos navegadores modernos que seguem os critérios atuais de PWA. Evitar Service Worker nesta primeira etapa reduz o risco de:

- assets administrativos obsoletos;
- respostas autenticadas cacheadas;
- inconsistência após deploy;
- comportamento inesperado durante logout/login;
- cache acidental de `/api/*`.

### Dependências

A implementação mínima pode ser feita sem biblioteca adicional.

**Não adicionar `vite-plugin-pwa` apenas para esta etapa**, salvo se houver uma necessidade concreta identificada no repositório.

Se o projeto já utilizar `vite-plugin-pwa`, impedir injeção global automática. Preferencialmente:

```ts
VitePWA({
  manifest: false,
  injectRegister: false
})
```

ou remover a configuração PWA global e controlar o manifest manualmente.

---

# 1. Criar manifest exclusivo do admin

Criar:

```text
public/
└── admin/
    ├── manifest.webmanifest
    └── icons/
        ├── pwa-192x192.png
        ├── pwa-512x512.png
        ├── pwa-maskable-512x512.png
        ├── apple-touch-icon.png
        ├── favicon-32x32.png
        └── favicon-16x16.png
```

Exemplo inicial:

```json
{
  "id": "/admin/",
  "name": "NOME_DO_SISTEMA",
  "short_name": "NOME_CURTO",
  "description": "Área administrativa",
  "lang": "pt-BR",
  "dir": "ltr",
  "start_url": "/admin/",
  "scope": "/admin/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "prefer_related_applications": false,
  "icons": [
    {
      "src": "/admin/icons/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/admin/icons/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/admin/icons/pwa-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Antes de finalizar:
- substituir nome, descrição e cores pelos dados reais do projeto;
- manter `lang: "pt-BR"` salvo se o projeto tiver configuração internacional diferente;
- manter `id`, `start_url` e `scope` em `/admin/`;
- reutilizar a identidade visual existente;
- gerar ícones reais, sem placeholders;
- não usar favicon genérico do Vite.

## 1.1 Fonte visual obrigatória dos ícones

Antes de criar qualquer ícone novo, o Agent deve localizar no repositório **a imagem atualmente utilizada como logo do projeto/interface**.

Exemplos possíveis:

```text
src/assets/logo.svg
src/assets/logo.png
public/logo.svg
public/logo.png
```

ou equivalente identificado pela inspeção do código.

A imagem já usada como logo deve ser a **fonte visual dos ícones da PWA**.

Não redesenhar o logo e não substituir a identidade visual por um ícone arbitrário.

### Se os arquivos de ícone ainda não existirem

O Agent deve gerá-los automaticamente a partir do logo atual:

```text
apple-touch-icon.png       180 x 180
pwa-192x192.png            192 x 192
pwa-512x512.png            512 x 512
pwa-maskable-512x512.png   512 x 512
favicon-32x32.png           32 x 32
favicon-16x16.png           16 x 16
```

Pode usar uma ferramenta já disponível no projeto ou ambiente, por exemplo:
- `sharp`;
- ImageMagick;
- Pillow;
- ferramenta equivalente já instalada.

Evitar adicionar uma dependência permanente apenas para gerar arquivos estáticos, se isso não for necessário.

### Regras de transformação

- preservar proporção da imagem;
- não esticar;
- não deformar;
- não alterar cores do logo;
- não substituir por texto;
- não aplicar efeitos visuais novos;
- não recortar partes importantes;
- se o logo não for quadrado, centralizá-lo em canvas quadrado;
- utilizar fundo coerente com a identidade visual ou transparência quando tecnicamente apropriado;
- garantir boa legibilidade em tamanho reduzido.

Se o logo atual for um wordmark horizontal com símbolo + texto e o repositório também possuir o mesmo **símbolo/marca isolado**, preferir o símbolo já existente para os ícones pequenos. Isso não autoriza criar uma nova marca.

Se não houver símbolo separado, usar o logo atual centralizado e dimensionado proporcionalmente, sem deformação.

### Ícone `maskable`

O arquivo:

```text
/admin/icons/pwa-maskable-512x512.png
```

deve usar a mesma identidade visual, porém com área de segurança suficiente para que Android/launchers possam aplicar máscaras circulares, squircle ou outras sem cortar a parte principal do logo.

Não simplesmente duplicar uma imagem que encoste nas bordas.

## 1.2 Favicon não é o mesmo recurso do ícone instalado

Tratar separadamente:

```text
favicon
→ aba/janela do navegador

manifest icons
→ aplicativo instalado em desktop/Android e outras superfícies PWA

apple-touch-icon
→ ícone explicitamente fornecido para iPhone/iPad
```

Todos devem derivar da **mesma imagem/logo atual do projeto**, para manter identidade visual consistente.

Não assumir que o `favicon.ico` sozinho será usado como ícone do aplicativo instalado.

## 1.3 Metadata exclusiva da área `/admin/`

Como `/` e `/admin/` podem compartilhar o mesmo `index.html`, os metadados específicos do Web App administrativo devem ser controlados pelo shell/provider de `/admin/`, e não adicionados permanentemente ao HTML global.

Durante `/admin/`, inserir/ajustar conforme necessário:

```html
<link
  rel="manifest"
  href="/admin/manifest.webmanifest"
/>

<link
  rel="apple-touch-icon"
  sizes="180x180"
  href="/admin/icons/apple-touch-icon.png"
/>

<link
  rel="icon"
  type="image/png"
  sizes="32x32"
  href="/admin/icons/favicon-32x32.png"
/>

<link
  rel="icon"
  type="image/png"
  sizes="16x16"
  href="/admin/icons/favicon-16x16.png"
/>

<meta
  name="theme-color"
  content="COR_REAL_DO_PROJETO"
/>
```

O Agent também deve avaliar o título exibido no contexto administrativo.

Se a área admin possuir nome/título próprio, pode ajustar dinamicamente:

```ts
document.title = 'NOME_DO_SISTEMA'
```

e restaurar o título anterior ao sair de `/admin/`.

Para compatibilidade Apple, pode ser usado:

```html
<meta
  name="apple-mobile-web-app-title"
  content="NOME_CURTO"
/>
```

desde que:
- seja adicionado apenas no contexto `/admin/`;
- seja removido/restaurado ao sair;
- o valor seja coerente com `short_name`.

Não adicionar metatags Apple antigas/depreciadas apenas por hábito se o manifest moderno já fornecer o comportamento necessário.

---

# 2. Criar um gerenciador PWA exclusivo do Admin

Criar componente/hook de responsabilidade isolada, por exemplo:

```text
src/
└── admin/
    └── pwa/
        ├── AdminPwaProvider.tsx
        ├── useAdminInstallPrompt.ts
        └── pwaTypes.ts
```

Adaptar nomes à organização real do repositório.

## Responsabilidades do `AdminPwaProvider`

Quando a área `/admin/` montar:

1. adicionar ao `<head>`:

```html
<link
  rel="manifest"
  href="/admin/manifest.webmanifest"
/>
```

2. adicionar/ajustar:

```html
<meta name="theme-color" content="..." />
```

3. adicionar os metadados/ícones específicos do admin:

```html
<link
  rel="apple-touch-icon"
  sizes="180x180"
  href="/admin/icons/apple-touch-icon.png"
/>

<link
  rel="icon"
  type="image/png"
  sizes="32x32"
  href="/admin/icons/favicon-32x32.png"
/>

<link
  rel="icon"
  type="image/png"
  sizes="16x16"
  href="/admin/icons/favicon-16x16.png"
/>
```

4. se aplicável, ajustar dinamicamente `document.title` e `apple-mobile-web-app-title`;

5. registrar listener para:

```text
beforeinstallprompt
```

6. registrar listener para:

```text
appinstalled
```

7. disponibilizar para os componentes:
   - `canInstall`
   - `isInstalled`
   - `install()`
   - `platform`
   - indicação de fluxo manual para iOS/iPadOS

Ao desmontar o shell `/admin/`:
- remover o `<link rel="manifest">` criado pelo provider;
- remover listeners;
- restaurar `theme-color` anterior, se ele tiver sido alterado;
- remover `apple-touch-icon` criado especificamente pelo admin;
- remover favicons administrativos criados pelo provider;
- remover/restaurar `apple-mobile-web-app-title`, se utilizado;
- restaurar `document.title`, se tiver sido modificado.

Não remover tags globais legítimas do projeto.

Ao substituir temporariamente um favicon ou metadata já existente, guardar a configuração anterior e restaurá-la ao desmontar o contexto `/admin/`.

---

# 3. Captura do `beforeinstallprompt`

Criar tipagem local, se TypeScript:

```ts
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>

  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}
```

Lógica esperada:

```ts
const [deferredPrompt, setDeferredPrompt] =
  useState<BeforeInstallPromptEvent | null>(null)

useEffect(() => {
  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault()
    setDeferredPrompt(event as BeforeInstallPromptEvent)
  }

  const handleInstalled = () => {
    setDeferredPrompt(null)
    // marcar estado instalado
  }

  window.addEventListener(
    'beforeinstallprompt',
    handleBeforeInstallPrompt
  )

  window.addEventListener(
    'appinstalled',
    handleInstalled
  )

  return () => {
    window.removeEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    )

    window.removeEventListener(
      'appinstalled',
      handleInstalled
    )
  }
}, [])
```

Função de instalação:

```ts
async function installAdminApp() {
  if (!deferredPrompt) return

  await deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice

  if (choice.outcome === 'accepted') {
    setDeferredPrompt(null)
  }
}
```

Não disparar o prompt automaticamente.

O usuário deve iniciar a instalação por uma ação explícita, como um botão.

---

# 4. Detectar se já está executando como aplicativo

Criar helper:

```ts
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((navigator as Navigator & {
    standalone?: boolean
  }).standalone)
```

Quando `isStandalone === true`:
- esconder o CTA "Instalar aplicativo";
- não mostrar instruções de instalação;
- manter a UI administrativa normal.

Também atualizar estado após `appinstalled`.

---

# 5. Botão de instalação

Adicionar o CTA somente em uma área apropriada da interface `/admin/`, por exemplo:

- menu de usuário;
- configurações;
- sidebar;
- menu "Mais";
- tela inicial do dashboard.

Texto sugerido:

```text
Instalar aplicativo
```

ou:

```text
Instalar no dispositivo
```

## Regras de exibição

### Chromium/Edge/Chrome/Android

Se existir `deferredPrompt`:

```text
mostrar botão
```

Ao clicar:

```text
deferredPrompt.prompt()
```

### Aplicativo já instalado

```text
não mostrar botão
```

### Homepage pública

```text
nunca mostrar botão
```

### Navegador sem suporte ao prompt programático

Não mostrar um botão que não funcione.

---

# 6. iPhone/iPad

`beforeinstallprompt` não é disponibilizado no iOS/iPadOS.

Quando estiver em `/admin/`, não estiver em modo standalone e o dispositivo for iOS/iPadOS, fornecer uma UI auxiliar específica, por exemplo:

```text
Instalar no iPhone/iPad
```

Ao clicar, abrir modal/popover com instruções curtas para:

```text
Compartilhar → Adicionar à Tela de Início
```

Não mostrar esse auxílio fora de `/admin/`.

Não tentar simular um prompt nativo inexistente.

---

# 7. Integração com o roteamento

Preferir montar o Provider no layout raiz da área administrativa.

Exemplo conceitual com React Router:

```tsx
<Route
  path="/admin/*"
  element={
    <AdminPwaProvider>
      <AdminLayout />
    </AdminPwaProvider>
  }
/>
```

Não montar o Provider no `App` global se isso fizer com que `/` também receba manifest ou comportamento PWA.

Se a arquitetura atual não possuir `AdminLayout`, identificar o ponto comum mais alto compartilhado exclusivamente pelas rotas `/admin/*`.

---

# 8. Autenticação

A PWA instalada deve abrir em:

```text
/admin/
```

O fluxo de autenticação existente deve continuar sendo a fonte de verdade.

Exemplo:

```text
usuário abre app instalado
        ↓
     /admin/
        ↓
 sessão válida?
   ↙        ↘
 sim        não
 ↓           ↓
dashboard   login/redirect atual
```

Não armazenar credenciais especificamente para a PWA.

Não criar um segundo mecanismo de autenticação.

Não modificar Prisma ou o modelo de sessão apenas para suportar instalação.

---

# 9. Navegação para fora do escopo

O manifest deve conter:

```json
"scope": "/admin/"
```

Rotas como:

```text
/admin/
/admin/dashboard
/admin/pacientes
/admin/configuracoes
```

pertencem ao aplicativo.

Rotas como:

```text
/
/sobre
/contato
```

não pertencem ao aplicativo instalado.

Não ampliar o scope para `/`.

Se houver links do admin para o site público, manter o comportamento web normal. Se necessário, considerar abrir links públicos em nova aba/janela para tornar a separação entre "app administrativo" e "site público" mais clara.

---

# 10. Express / deploy

Garantir que os seguintes arquivos sejam servidos publicamente:

```text
/admin/manifest.webmanifest
/admin/icons/*
```

O manifest deve responder com MIME adequado:

```text
application/manifest+json
```

O ambiente de produção deve usar HTTPS.

Confirmar que o fallback SPA atual atende rotas profundas de `/admin/*`.

Exemplo de comportamento esperado:

```text
GET /admin/dashboard
→ entrega a aplicação React
→ React Router resolve /admin/dashboard
```

Não criar fallback que intercepte:

```text
/admin/manifest.webmanifest
/admin/icons/*
```

antes de `express.static`.

Ordem conceitual:

```ts
app.use(express.static(distPath))

// APIs

// somente depois: fallback do frontend
app.get('*', ...)
```

Adaptar à estrutura real do servidor, sem alterar rotas existentes desnecessariamente.

---

# 11. Cache-Control

Para o manifest, evitar cache imutável muito longo.

Exemplo aceitável:

```text
Cache-Control: no-cache
```

ou política equivalente que permita revalidação.

Assets Vite com hash podem continuar usando cache longo/immutable conforme configuração atual.

Não alterar estratégia de cache do projeto inteiro sem necessidade.

---

# 12. Não implementar cache de API nesta fase

Explicitamente **não cachear**:

```text
/api/*
```

nem:

- autenticação;
- responses contendo dados administrativos;
- mutations POST/PUT/PATCH/DELETE;
- dados vindos do Prisma;
- tokens;
- endpoints de sessão.

A instalação deve continuar dependendo normalmente da rede para dados do backend.

---

# 13. Service Worker — somente como Fase 2 opcional

Não é necessário implementar Service Worker nesta entrega, salvo se a arquitetura atual já depender dele.

Caso futuramente seja desejado suporte offline ou precache:

- registrar SW somente a partir da área `/admin/`;
- usar script sob `/admin/`, preferencialmente:

```text
/admin/sw.js
```

- scope:

```text
/admin/
```

- nunca controlar `/`;
- `NetworkOnly` para `/api/*`;
- não cachear respostas autenticadas;
- navigation fallback somente para `/admin/*`;
- usar prompt de atualização em vez de reload forçado quando houver formulários/dados não salvos.

Exemplo conceitual:

```ts
navigator.serviceWorker.register(
  '/admin/sw.js',
  { scope: '/admin/' }
)
```

Não registrar:

```ts
navigator.serviceWorker.register('/sw.js', {
  scope: '/'
})
```

---

# 14. Evitar estes erros

## ERRO 1

Adicionar no `index.html` global:

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

Resultado indesejado:
- homepage pública passa a anunciar a PWA.

## ERRO 2

Manifest:

```json
{
  "scope": "/",
  "start_url": "/"
}
```

Resultado indesejado:
- o site inteiro vira contexto do aplicativo.

## ERRO 3

Service Worker:

```ts
navigator.serviceWorker.register('/sw.js')
```

com scope efetivo `/`.

Resultado indesejado:
- SW pode controlar homepage e outras rotas públicas.

## ERRO 4

Usar `vite-plugin-pwa` com configuração padrão sem avaliar a SPA.

A configuração padrão pode injetar manifest/registro no entry point global.

## ERRO 5

Cachear `/api/*`.

Não fazer.

---

# 15. Compatibilidade / UX esperada

## Chrome / Edge desktop

Na área `/admin/`:
- navegador pode disponibilizar instalação;
- CTA interno pode invocar o prompt quando `beforeinstallprompt` estiver disponível;
- app instalado abre em janela standalone.

## Android / Chromium

Na área `/admin/`:
- instalar como Web App;
- ícone no launcher;
- abrir em `standalone`.

## iOS / iPadOS

Na área `/admin/`:
- fornecer instrução manual "Adicionar à Tela de Início";
- não depender de `beforeinstallprompt`;
- não exigir Google Chrome;
- preferir instruções baseadas no fluxo do Safari por ser o caminho mais previsível para o usuário;
- se o navegador atual não disponibilizar a ação necessária, orientar a abrir a mesma URL `/admin/` no Safari e usar Compartilhar → Adicionar à Tela de Início;
- utilizar `apple-touch-icon.png` derivado do logo atual para identidade visual consistente.

O manifest também fornece informações de ícone a versões modernas do iOS/iPadOS. Entretanto, quando `apple-touch-icon` é declarado no `<head>`, ele pode ser usado especificamente para a experiência Apple. Por isso esta especificação mantém ambos: `manifest.icons` para a PWA e `apple-touch-icon` para iPhone/iPad.

---

# 16. Critérios de aceite

O trabalho só está concluído se todos os itens abaixo forem verificados.

### Homepage pública `/`

- [ ] nenhum CTA "Instalar aplicativo";
- [ ] nenhum `<link rel="manifest">` administrativo permanece no DOM;
- [ ] `scope` administrativo não afeta a homepage;
- [ ] homepage continua visual e funcionalmente idêntica.

### `/admin/`

- [ ] manifest é carregado;
- [ ] manifest contém `id: "/admin/"`;
- [ ] manifest contém `start_url: "/admin/"`;
- [ ] manifest contém `scope: "/admin/"`;
- [ ] `display: "standalone"`;
- [ ] ícones 192x192 e 512x512 válidos;
- [ ] ícone maskable 512x512 válido e com área de segurança;
- [ ] `apple-touch-icon.png` 180x180 válido;
- [ ] favicons administrativos 16x16 e 32x32 válidos;
- [ ] todos os ícones foram derivados do logo/imagem real já usada no projeto, sem placeholders;
- [ ] logo não foi deformado nem redesenhado;
- [ ] metadata administrativa é inserida somente em `/admin/`;
- [ ] metadata/favicons anteriores são restaurados ao sair de `/admin/`;
- [ ] CTA aparece quando o navegador fornece prompt instalável;
- [ ] CTA desaparece quando já estiver instalado;
- [ ] no iOS existe fallback de instrução manual;
- [ ] autenticação existente continua funcionando.

### Depois da instalação

- [ ] abrir pelo ícone inicia em `/admin/`;
- [ ] se autenticado, segue fluxo normal;
- [ ] se não autenticado, segue login/redirect já existente;
- [ ] navegação `/admin/*` continua funcional;
- [ ] APIs Express continuam sendo chamadas normalmente pela rede;
- [ ] nenhuma alteração Prisma é necessária;
- [ ] site público não vira parte do app instalado.

### Build/deploy

- [ ] `npm run build` ou comando equivalente passa;
- [ ] TypeScript passa;
- [ ] lint passa, se configurado;
- [ ] manifest é entregue em produção;
- [ ] Content-Type do manifest está correto;
- [ ] produção usa HTTPS;
- [ ] deep links `/admin/*` não retornam 404 do servidor.

---

# 17. Testes manuais mínimos

## Chrome/Edge desktop

1. abrir `/`;
2. confirmar ausência de CTA de instalação;
3. inspecionar `<head>` e confirmar ausência do manifest administrativo;
4. navegar para `/admin/`;
5. confirmar presença de:

```html
<link rel="manifest" href="/admin/manifest.webmanifest">
```

6. validar manifest em DevTools → Application → Manifest;
7. verificar `start_url`, `scope`, `name`, `short_name`, `theme_color` e `icons`;
8. confirmar visualmente que os ícones PWA correspondem ao logo atual;
9. verificar favicon administrativo na aba;
10. testar botão de instalação;
11. instalar;
12. fechar navegador/app;
13. iniciar pelo ícone instalado;
14. confirmar que o ícone do app corresponde à identidade visual atual;
15. confirmar abertura em `/admin/`;
16. testar login/logout;
17. testar atualização normal dos dados do backend;
18. voltar para `/` e confirmar restauração do favicon/metadata públicos originais.

## Android

1. acessar `/admin/`;
2. testar instalação;
3. validar que o ícone instalado corresponde à identidade/logo atual do projeto;
4. validar que a máscara do launcher não corta a parte principal do logo;
5. abrir pelo launcher;
6. validar modo standalone;
7. testar autenticação e rotas administrativas.

## iOS/iPadOS

1. acessar `/admin/`;
2. confirmar UI de instrução de instalação;
3. confirmar que o fluxo não exige Chrome e testar preferencialmente pelo Safari;
4. adicionar à Tela de Início;
5. confirmar que o ícone exibido corresponde ao `apple-touch-icon`/logo atual;
6. abrir pelo ícone;
7. validar abertura da área administrativa.

---

# 18. Orientação para implementação pelo Agent

Antes de modificar qualquer arquivo:

1. inspecione a estrutura do repositório;
2. identifique:
   - router utilizado;
   - componente/layout que engloba exclusivamente `/admin/*`;
   - sistema atual de autenticação;
   - servidor Express responsável por `dist`;
   - existência ou não de `vite-plugin-pwa`/Service Worker;
   - estratégia atual de deploy;
   - arquivo/imagem que atualmente fornece o logo visual usado pela aplicação;
   - favicon e metadata já existentes;
3. adapte esta especificação à arquitetura existente em vez de criar estruturas duplicadas.
4. antes de criar os ícones PWA, reutilize a imagem real do logo existente e gere os tamanhos necessários somente se ainda não houver assets adequados.

Durante a implementação:
- faça alterações mínimas e localizadas;
- preserve a homepage pública;
- preserve o backend Express/Prisma;
- não alterar schema Prisma;
- não adicionar offline/cache sem necessidade;
- reutilizar componentes e padrão visual existentes para botão/modal;
- reutilizar a imagem/logo atual como origem para favicon, manifest icons e `apple-touch-icon`;
- gerar os assets ausentes em tamanhos corretos, preservando proporção e identidade visual;
- não deixar ícones default do Vite ou placeholders;
- não criar dependência nova se a API nativa do navegador for suficiente.

Ao finalizar:
1. execute build;
2. execute lint/typecheck/testes existentes;
3. informe todos os arquivos criados/modificados;
4. descreva decisões tomadas;
5. relate qualquer limitação específica de navegador encontrada;
6. não considere a tarefa concluída sem verificar o isolamento entre `/` e `/admin/`.

---

# 19. Resultado arquitetural desejado

```text
DOMÍNIO
│
├── /
│   ├── homepage pública
│   ├── sem manifest administrativo
│   ├── sem install CTA
│   └── comportamento web convencional
│
└── /admin/
    ├── React Admin
    ├── autenticação existente
    ├── manifest /admin/manifest.webmanifest
    ├── scope /admin/
    ├── start_url /admin/
    ├── botão "Instalar aplicativo"
    └── modo standalone quando instalado
            │
            ▼
        Express API
            │
            ▼
          Prisma
            │
            ▼
         Database
```

O frontend administrativo instalado continua sendo o mesmo código React e continua consumindo o mesmo backend.

---

# Referências técnicas

- MDN — Making PWAs installable:
  https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

- MDN — Web App Manifest `scope`:
  https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope

- MDN — Web App Manifest `start_url`:
  https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/start_url

- Vite PWA — Getting Started:
  https://vite-pwa-org.netlify.app/guide/

- Vite PWA — Register Service Worker:
  https://vite-pwa-org.netlify.app/guide/register-service-worker

- Vite PWA — Minimal Requirements:
  https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html


- MDN — Define your app icons:
  https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons

- Apple Developer — Web App Manifest / Home Screen icon behavior:
  https://developer.apple.com/videos/play/wwdc2022/10048/
