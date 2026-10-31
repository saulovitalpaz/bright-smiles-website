# Plano de redesign responsivo do sidebar administrativo

Data: 2026-10-31. Status: aprovado pelo usuário e implementado; verificação registrada abaixo.

## Objetivo e limites

Dar leveza à navegação administrativa, melhorar a apresentação da marca e coordenar sidebar e barra inferior com movimento discreto. Stack verificada: React 18, TypeScript, Vite, Tailwind, React Router e Vitest. Não adicionar biblioteca de animação.

Seguir SECURITY.md. Preservar autenticação por cookies, permissões, rotas, configurações remotas, impressão e arquivos locais do usuário. Não acessar dados reais de pacientes para testes. Alterações limitadas à navegação, seus testes e documentação.

## Diagnóstico verificável

- `src/components/admin/AdminLayout.tsx:293`: fundo escuro fixo, borda escura e transição de 200 ms. `invisible` é aplicado imediatamente ao fechar; o backdrop também é desmontado imediatamente, impedindo saída visual completa.
- `src/components/admin/AdminLayout.tsx:212`: `transition-all` nos itens; substituir por propriedades explícitas.
- `src/components/admin/AdminLayout.tsx:300`: logo em 48 px no mobile e até 80 px no desktop, sombra forte, marca branca e slogan de 9 px em dourado. O PNG padrão tem 1046 × 1024, fundo branco e letras circulares pequenas: resolução do arquivo não é a causa principal. O asset configurado remotamente pode ser diferente e precisa de validação própria.
- `src/components/admin/AdminLayout.tsx:319`: controle desktop de apenas 24 × 24 px; ampliar a área acionável.
- `src/components/admin/AdminLayout.tsx:410`: barra inferior recebe `inert` e `aria-hidden`, mas não é escondida visualmente.
- `src/index.css:47`: já existem tokens claros de sidebar, hoje ignorados pelo componente.
- `src/styles/admin-typography.css`: Inter é a fonte administrativa; `.admin-brand` tem exceção intencional. Respeitar essa separação ao ajustar a marca.
- O layout já oferece Escape, contenção de Tab, retorno de foco, fechamento por rota e breakpoint, safe areas e rolagem interna. Melhorar esses mecanismos sem removê-los.

Auditoria orientada por web-design-guidelines e ui-ux-pro-max. A busca local de UX confirmou movimento reduzido, poucos elementos animados e durações ajustadas ao contexto. A busca React retornou recomendações marcadas para React 19.2; aplicar somente princípios compatíveis com React 18, sem incorporar APIs novas.

## Alternativas e escolha proposta

1. **Recomendada: superfície clara e transições CSS coordenadas.** Usa a paleta existente, mantém baixo custo e funciona sem dependência adicional.
2. Superfície translúcida com blur: pode aumentar profundidade, mas depende do conteúdo ao fundo e exige mais composição; desnecessária neste painel.
3. Morph completo da barra inferior para a lateral com View Transition API: possível como melhoria progressiva, mas muda a geometria e exige testes adicionais. Não integrar na primeira versão; a coreografia CSS já atende ao pedido de dinamismo.

## Design proposto

### Superfície e identidade

- Fundo `hsl(var(--sidebar-background))`, texto `hsl(var(--sidebar-foreground))`, contorno com `--sidebar-border` e hover com `--sidebar-accent`.
- Cantos expostos direitos de 20 px e sombra lateral difusa, leve, sem brilho preto na logo. Separadores discretos.
- Item ativo com fundo dourado suave, texto escuro e indicador adicional de seleção; contraste mínimo de 4,5:1 para texto normal. Acrescentar `aria-current="page"` aos links de rota exata.
- Inter de 14 px para itens, 12–13 px para auxiliares, pesos 400–600. Subitens com área de toque de pelo menos 44 px.
- Marca: conservar a fonte de identidade existente (Playfair Display), nome com 16–18 px, cor escura da paleta e quebra natural. Slogan de 12 px, sem tracking excessivo; não inventar novo slogan.
- Logo inteira, `object-fit: contain`, dimensões reservadas e base branca de cantos suaves. Proposta: 88 px expandida no desktop, 64 px no mobile e 44 px recolhida. Não cortar os dizeres circulares nem fabricar SVG a partir do PNG. A versão recolhida serve para reconhecimento, não leitura do texto incorporado.
- Preservar `site_logo` e `clinic_name` das configurações. Em erro de imagem, tentar o asset padrão apenas uma vez; se também falhar, manter nome e espaço de marca sem ciclo de onError.

### Responsividade

| Largura CSS | Comportamento |
| --- | --- |
| Abaixo de 1024 px | Sidebar modal sobreposto; largura `min(88vw, 336px)`; conteúdo não se desloca. Barra inferior permanece como navegação principal condensada. |
| A partir de 1024 px | Sidebar persistente com larguras existentes de 248 px e 76 px; conteúdo mantém compensação correspondente. |

Usar largura disponível, não identificação de aparelho. Manter o mesmo comportamento em navegador e PWA standalone. Proteger safe areas em todos os lados necessários, altura dinâmica e rolagem interna. Preservar botão do cabeçalho e acrescentar botão Menu na barra inferior: total de cinco itens para admin e quatro para gestor.

### Movimento mobile

- Abertura: sidebar 420 ms, `cubic-bezier(0.22, 1, 0.36, 1)`; fechamento 300 ms. Valores iniciais de design, sujeitos à validação em aparelho.
- Barra inferior: opacidade e deslocamento vertical de 12 px durante 180 ms, iniciando junto com o sidebar. No fechamento, reaparecer em 180 ms durante a saída lateral, sem esperar uma sequência longa.
- Backdrop: opacidade, 220 ms na entrada e 180 ms na saída; sem blur pesado.
- Não animar cada item do menu individualmente. Não animar width, height, margin ou box-shadow por quadro.
- Separar a intenção de abertura da presença visual durante a saída. Remover visibilidade/modalidade apenas ao concluir o fechamento; tratar `transitionend` de transform do próprio painel e possuir conclusão alternativa cancelável. Movimento reduzido conclui imediatamente, sem depender de evento de transição.
- Nova abertura durante fechamento cancela a conclusão anterior e reverte a transição. Troca de rota e mudança para desktop limpam backdrop, bloqueio de scroll e foco.
- Manter fundo e barra inferior inertes durante toda a presença modal. Restaurar foco ao acionador real (superior ou inferior) após ele voltar a estar disponível; se oculto pelo breakpoint, usar controle desktop visível. Não focar elemento invisível.
- Quando fechado, sidebar mobile não participa de Tab nem da árvore acessível. Preservar foco visível e Escape. O skip link também não deve permitir escapar do modal.
- A regra existente que oculta a barra ao editar campos continua tendo prioridade. Fechar menu não deve fazê-la aparecer sobre o teclado virtual.

### Movimento desktop

Não ampliar simplesmente a duração da mudança de largura: a largura atual não tem transição e animá-la causaria reflow contínuo. Atualizar a geometria uma vez e suavizar a superfície por transform e o texto por opacity, sem escalar letras ou logo. Se a solução gerar recorte, priorizar geometria estável e fade curto. Validar expandir um grupo pelo modo recolhido, preservando abertura sem navegação automática.

## Sequência de implementação por arquivo

- [x] **1. Aparência e marca.** Criar `src/styles/admin-navigation.css`, importado por `AdminLayout.tsx`. Concentrar seletores de navegação e tokens de movimento nesse arquivo; remover somente classes conflitantes do componente. Manter variáveis de dimensões e safe areas em `src/index.css`. Atualizar documentação `docs/admin-typography.md` se a escala da marca mudar.
- [x] **2. Coordenação mobile.** Em `AdminLayout.tsx`, centralizar abertura/fechamento e registrar o acionador real. Introduzir presença visual de saída, botão Menu inferior e estados CSS. Garantir cleanup de eventos e temporizadores, inclusive em unmount, troca de rota e resize. Não refatorar a lista de permissões nem mover dados clínicos para novos estados.
- [x] **3. Acessibilidade e desktop.** Ajustar foco, `aria-current`, área de toque de controles e labels do modo compacto. Tratar movimento reduzido; remover `transition-all` apenas na navegação em escopo. Preservar submenus e comportamento recolhido.
- [x] **4. Testes de comportamento.** Expandir `AdminLayout.test.tsx`: abrir pelo topo e pela barra; ocultar/inertizar barra; fechar por Escape e backdrop; retornar ao acionador correto; clique rápido abrir-fechar-abrir; mudança de rota e desktop; cleanup de scroll; gestor sem atalhos clínicos; logo configurada/fallback. Usar eventos de transição e movimento reduzido simulados conforme o caso. Preservar `navigation-contract.test.tsx`; não afrouxar contratos para fazer testes passarem.
- [x] **5. Validação visual e documentação.** Conferir 320, 390, 768, 1024 e 1440 px, landscape, zoom 200%, marca longa, menu com todos os grupos, PWA standalone e movimento reduzido. Registrar capturas com dados fictícios e resultados reais.

## Comandos e critérios de aceite

Após implementação:

```powershell
npm test -- src/components/admin/AdminLayout.test.tsx src/components/admin/navigation-contract.test.tsx
npx tsc --noEmit -p tsconfig.app.json
npm run build
git diff --check
```

Esperado: testes passam, TypeScript sem erros novos, build concluído e diff sem erros de whitespace. Testes DOM não comprovam fluidez, contraste ou qualidade de imagem: verificar em navegador e aparelho. Inspecionar performance durante abertura/fechamento para confirmar ausência de reflow por quadro no drawer; não declarar ganho de desempenho sem medição.

Antes de deploy, seguir SECURITY.md: testes frontend e backend, build e secret scan. O backend não possui script npm test no package.json inspecionado; identificar seu runner no momento de execução, sem inventar comando ou alegar aprovação. O scanner existente é `scripts/check-changed-secrets.mjs`; conferir sua interface antes de executá-lo. Não há deploy neste plano.

Aceitar somente se não houver overflow horizontal, navegação duplicada interativa, foco oculto, scroll bloqueado após fechar ou exposição de links proibidos por perfil. Barra inferior deve sumir visualmente enquanto o sidebar estiver aberto, voltar ao fechar e manter a reserva de espaço do conteúdo para não causar saltos. Navegação permanece fora da impressão.

## Referências

- Web Interface Guidelines: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
- Movimento e composição: https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion
- Diálogo modal e foco: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/
- View Transition API, alternativa avaliada: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using

## Limites da verificação desta proposta

Foram lidos componentes, CSS, testes, configurações de stack e documentação existente; a imagem padrão foi inspecionada visualmente. Não foi realizada sessão visual do painel autenticado nem verificado o asset remoto configurado. As observações de aparência atual decorrem do código e do asset local; os valores propostos precisam de validação visual na implementação.


## Registro da implementação

- Aparência em `src/styles/admin-navigation.css`; ciclo modal isolado em `src/components/admin/useAdminNavigation.ts` e integrado ao layout existente.
- Nome da clínica: 18 px no desktop e 16 px no mobile; até três linhas no mobile e duas em landscape baixo, com nome completo preservado no DOM e no atributo title. Essa adaptação evita que nomes extensos consumam a área de navegação.
- Desktop mantém geometria estável e fade de texto, conforme alternativa prevista; nenhuma escala de logo ou texto.
- Revisão independente não encontrou regressões; acrescentados testes de backdrop, fallback da logo e reabertura rápida.
- Chrome headless com API real bloqueada e dados fictícios: 320, 390, 768, 1024 e 1440 px sem overflow horizontal; drawer, foco, backdrop, grupo recolhido e movimento reduzido verificados. Capturas inspecionadas visualmente.
- Marca longa validada em 320 × 640 e landscape 844 × 390; viewport 720 × 450 usado como aproximação de área útil de zoom 200%. Standalone simulado, sem instalação real em dispositivo. Teste em aparelho físico e zoom nativo permanecem limites desta validação.
- CDP Performance registrou um incremento de LayoutCount durante uma abertura de 500 ms, compatível com mudança inicial de layout e sem evidência de reflow por quadro nesse ensaio; não representa benchmark comparativo em celulares.
- Backend: 229 testes passaram, um teste de integração ignorado pelo runner. Build, TypeScript e scanner de segredos aprovados. Avisos existentes de tamanho de bundles e Browserslist antigo continuam fora do escopo.
