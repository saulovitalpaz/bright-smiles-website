# Workspace de harmonização facial — especificação

## Objetivo

Trocar a edição em lista de regiões por um workspace clínico responsivo com mapa SVG, seleção anatômica, marcadores de aplicações e inspector contextual, preservando o campo JSON `Appointment.facialNotes` e os dados legados.

## Decisões

- O mapa continua em SVG 2D e usa o viewBox existente (`0 0 320 420`). Cada região bilateral recebe um ID estável (`nasolabial-left`, `nasolabial-right`, `malar-left`, `malar-right`, `periorbital-left`, `periorbital-right`).
- O documento persistido passa a aceitar `{ version: 2, applications: [...] }`. O normalizador também lê o formato legado `{ [region]: { product, dose, notes } }`, sem descartar campos existentes.
- Aplicações armazenam coordenadas normalizadas (0–1) relativas ao viewBox, procedimento, dose/volume e os campos clínicos do inspector.
- O clique comum seleciona uma região. O modo “Marcar aplicação” cria uma aplicação somente no próximo clique, associada à região selecionada.
- O salvamento continua no fluxo existente de `AdminAttendanceDetail` (`POST/PUT /appointments`); não há nova tabela, endpoint ou migração.
- O `FaceMap` legado permanece disponível para a timeline histórica, recebendo uma projeção compatível dos dados normalizados.

## Componentes

`FacialHarmonizationWorkspace` orquestra `WorkspaceHeader`, `ProcedureSelector`, `FacialMapToolbar`, `RegionSearch`, `FacialSvgMap`, `ApplicationMarker`, `RegionInspector`, `ApplicationEditor`, `ApplicationList` e `SessionSummaryBar`. O mapa e o inspector usam grid em desktop e coluna única com inspector inferior em telas menores.

## Acessibilidade e responsividade

Regiões e marcadores são focáveis, possuem `aria-label` em português e indicadores que não dependem somente de cor. Controles têm alvo mínimo de 44px e foco visível. Apenas o inspector pode rolar internamente; o workspace evita rolagem da página.

## Riscos e mitigação

- **Legado sem lateralidade/aplicações:** normalização e projeção preservam o formato antigo.
- **Persistência de posição:** conversão usa `getScreenCTM().inverse()` e coordenadas normalizadas, mantendo pontos ao redimensionar.
- **Regressão visual/histórica:** `FaceMap` existente não é removido; testes atuais permanecem.

