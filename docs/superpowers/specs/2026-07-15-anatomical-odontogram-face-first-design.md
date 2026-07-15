# Odontograma anatômico com seleção de face primeiro

Data: 2026-07-15
Status: aprovado para implementação

## Contexto

O odontograma atual usa formas SVG simplificadas desenhadas manualmente. Incisivos, caninos, pré-molares e molares não possuem anatomia suficientemente reconhecível e a visualização clínica parece geométrica. Na arcada, o toque apenas escolhe o número do dente. A seleção real de superfície aparece depois, dentro do modal, e a condição é comunicada principalmente por controles textuais.

A nova versão deve melhorar simultaneamente a representação anatômica e o fluxo clínico. O profissional precisa reconhecer o tipo de dente, selecionar visualmente a superfície e somente depois registrar a condição.

## Objetivos

- Substituir os desenhos atuais por vetores suaves e anatomicamente reconhecíveis.
- Diferenciar visualmente incisivos, caninos, pré-molares e molares.
- Representar coroas, raízes e vista oclusal com profundidade visual discreta.
- Permitir a seleção direta de mesial, distal, vestibular, lingual ou palatina e oclusal ou incisal.
- Usar o fluxo face primeiro e condição depois.
- Manter alvos de toque confiáveis no celular e impedir rolagem horizontal da página.
- Preservar todos os dados existentes e o formato JSON persistido pelo backend.
- Preservar os modos editável, somente leitura, histórico e impressão.

## Não objetivos

- Não criar uma reconstrução odontológica 3D real.
- Não usar WebGL ou modelos pesados.
- Não substituir neste ciclo o modelo clínico completo por FHIR ou outro padrão.
- Não importar todo o aplicativo externo de odontograma.
- Não adicionar dentição decídua, periodontograma, pontes complexas ou planejamento ortodôntico neste ciclo.

## Fonte vetorial e licença

A anatomia terá como referência e fonte permitida os templates SVG do projeto público `ZoliQua/React-Odontogram-Modul`, licenciado sob MIT:

- Repositório: https://github.com/ZoliQua/React-Odontogram-Modul
- Licença: https://github.com/ZoliQua/React-Odontogram-Modul/blob/main/LICENSE

Os vetores necessários serão adaptados ao componente existente. O módulo externo completo não será instalado. Somente a geometria necessária será incorporada, otimizada e documentada. A atribuição de copyright e a licença MIT serão mantidas em um aviso de terceiros junto aos assets.

## Direção visual

A direção é clínica, anatômica e sóbria. O objetivo não é criar um efeito decorativo, mas fazer cada forma realmente parecer um dente.

### Vista frontal

- Contorno orgânico diferente para cada família dentária.
- Coroa com volume obtido por gradiente de esmalte, highlight interno e sombra curta.
- Colo dental e transição para a raiz sem cortes geométricos abruptos.
- Incisivos com borda incisal, caninos com cúspide, pré-molares com volume intermediário e molares com coroa larga.
- Quantidade e abertura de raízes coerentes visualmente com o tipo do dente.
- Implante, ausência e ponte continuam reconhecíveis sem destruir o formato geral da arcada.

### Vista oclusal

- Silhueta anatômica arredondada para cada família dentária.
- Cinco regiões clínicas clicáveis com áreas visuais contínuas.
- Sulcos e cúspides leves para dar profundidade, sem competir com a cor da condição.
- A região selecionada recebe contorno de alto contraste, leve elevação visual e indicação textual.
- Condições persistidas continuam visíveis por cor, mas também por contorno ou padrão para não depender apenas da cor.

### Sistema visual

- Base em slate escuro compatível com o painel atual.
- Esmalte em branco marfim e cinzas frios.
- Uma única cor de foco clínico para seleção.
- Vermelho para área a tratar e azul para área tratada, acompanhados de texto e contorno.
- Animações curtas de 150 a 220 ms apenas para feedback de toque e mudança de estado.
- Respeito a `prefers-reduced-motion`.

## Fluxo de interação

### 1. Escolha do dente

Na arcada, tocar em um dente abre o editor ampliado. O botão deve anunciar número, tipo e condição atual. A arcada continua compacta e responsiva.

### 2. Escolha da face

O editor mostra uma vista frontal anatômica e uma vista oclusal ampliada. O profissional toca diretamente em uma das cinco regiões da vista oclusal. A face escolhida recebe foco visual e seu nome aparece no cabeçalho do editor.

Nenhuma condição é aplicada no primeiro toque. Esse toque apenas define a face ativa.

### 3. Escolha da condição

Depois da seleção da face, o editor revela as condições aplicáveis:

- Saudável
- A tratar, persistida como `Tratar`
- Tratada, persistida como `Tratado`

Ao selecionar a condição, somente a face ativa é atualizada. As demais faces do dente permanecem inalteradas. O resultado deve aparecer imediatamente no próprio vetor.

### 4. Condição do dente inteiro

Uma ação separada, claramente identificada como `Dente inteiro`, permite registrar:

- Saudável
- Ausente
- Implante
- Ponte

Essas opções não devem ser misturadas com o seletor de superfície. O usuário precisa confirmar visualmente que está alterando o dente inteiro.

### 5. Observações

As observações clínicas permanecem vinculadas ao dente. O campo aparece depois das ações visuais, sem competir com a tarefa principal.

## Comportamento mobile-first

- A página nunca ganha rolagem horizontal.
- A arcada usa container queries e reorganiza os dentes sem reduzir os alvos abaixo de 44 px.
- No celular, o editor ampliado ocupa um painel vertical rolável dentro da viewport.
- A visualização anatômica e a oclusal aparecem em sequência vertical.
- No desktop, as duas vistas podem aparecer lado a lado.
- O scroll vertical do documento permanece natural.
- Toques em faces usam `touch-action: manipulation` e não criam regiões de swipe horizontais.
- Labels e controles nunca ultrapassam a largura do painel.

## Compatibilidade de dados

O backend continua recebendo `Record<string, ToothData>` com esta estrutura:

```ts
interface ToothFaceData {
  status: string;
}

interface ToothData {
  status: string;
  notes: string;
  faces?: Record<string, ToothFaceData>;
}
```

As chaves existentes `top`, `bottom`, `left`, `right` e `center` serão preservadas. Uma função central continuará traduzindo essas posições para os nomes clínicos corretos conforme arcada e quadrante. Não haverá migração de banco.

Dados antigos sem `faces` serão renderizados normalmente. Dados antigos com uma condição geral permanecem visíveis. A edição de uma face não apaga a condição geral nem outras faces.

## Arquitetura de componentes

### `Odontogram.tsx`

Coordena arcadas, seleção do dente, abertura do editor e atualização do modelo externo.

### `AnatomicalTooth.tsx`

Renderiza a vista frontal com anatomia por família, estados de dente inteiro e modo somente leitura.

### `ToothSurfaceSelector.tsx`

Renderiza a vista oclusal ampliada, as cinco regiões semânticas, feedback de foco, teclado e eventos de seleção.

### `odontogramGeometry.ts`

Contém apenas geometrias, transformações por quadrante e definições de gradientes. Não contém estado React.

### `odontogramModel.ts`

Contém tipos, mapeamento de faces, atualização imutável e regras que distinguem condição de face e condição do dente inteiro.

Essa separação reduz o tamanho do componente atual e permite testar a seleção clínica sem depender do modal completo.

## Acessibilidade

- Cada dente e cada superfície será um controle semântico alcançável pelo teclado.
- `Enter` e `Espaço` selecionam a superfície focada.
- `aria-pressed` comunica a face ativa.
- O nome clínico da face e a condição atual fazem parte do rótulo acessível.
- O foco permanece visível.
- A cor nunca é o único indicador de estado.
- O editor move o foco para o título ao abrir e devolve o foco ao dente ao fechar.

## Testes

Será adicionada infraestrutura de teste de frontend com Vitest e Testing Library, limitada ao necessário para este componente.

Casos obrigatórios:

- Tocar em um dente abre o editor sem alterar dados.
- Tocar em uma face apenas seleciona essa face.
- Escolher `A tratar` altera somente a face ativa.
- Escolher `Tratada` preserva as demais faces.
- Alterar o dente inteiro não é confundido com alteração de face.
- Dados antigos continuam sendo renderizados.
- Controles de face funcionam por teclado.
- Modo somente leitura não altera dados.
- O componente não contém largura mínima fixa nem scroll horizontal.
- Build de produção, lint dos arquivos modificados e contratos responsivos continuam passando.

## Critérios de aceitação

- Os quatro tipos de dente são visualmente reconhecíveis sem depender do número.
- O desenho não utiliza os polígonos simplificados atuais.
- O usuário consegue selecionar uma face tocando diretamente na imagem ampliada do dente.
- A condição só aparece depois que a face foi escolhida.
- A condição aplicada aparece imediatamente na região correta do vetor.
- A seleção não exige precisão inferior a 44 px no celular.
- Nenhuma largura de viewport suportada produz overflow horizontal.
- O formato persistido permanece compatível com consultas anteriores.
- A licença MIT dos vetores adaptados está preservada no repositório.

## Riscos e mitigação

### Geometria muito detalhada

Vetores excessivamente complexos podem aumentar o DOM e dificultar o toque. Serão mantidos apenas os paths necessários, com áreas de interação independentes da decoração visual.

### Seleção acidental

As superfícies terão hit areas ampliadas e feedback imediato. O primeiro toque apenas seleciona, sem gravar uma condição.

### Conflito com dados legados

O modelo persistido não será alterado. Toda tradução clínica ficará em funções puras e testadas.

### Dependência externa

O módulo externo não será uma dependência de runtime. Os assets incorporados terão origem e licença registradas, evitando quebra por atualização de pacote.
