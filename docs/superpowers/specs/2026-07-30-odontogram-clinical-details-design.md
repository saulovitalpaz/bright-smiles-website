# Odontograma: detalhes clínicos e visão oclusal

## Objetivo

Tornar cada ocorrência clínica registrada no odontograma consultável ao reabrir o dente, simplificar o cadastro para que a região seja escolhida apenas uma vez e apresentar a visão oclusal/incisal de cada elemento na arcada.

## Escopo aprovado

### Fluxo de registro

O modal de um dente usará exclusivamente o registro clínico em camadas. O profissional escolhe categoria e procedimento, seleciona diretamente uma ou mais regiões anatômicas, informa a situação e, se necessário, uma observação. A antiga sequência de selecionar uma face e depois definir a mesma região não será mostrada para dados V2.

Registros legados continuam normalizados para V2 e visíveis. Os controles legados de status por face ou dente inteiro permanecem disponíveis apenas quando o consumidor ainda envia o formato legado, preservando compatibilidade de gravação fora do novo fluxo.

### Consulta e manutenção de ocorrências

Ao abrir um dente que possua ocorrências em camadas, o modal exibirá uma seção de registros salvos antes do formulário de novo registro. Cada item deverá mostrar:

- procedimento, em texto legível;
- situação clínica, em texto legível;
- região ou regiões selecionadas, com os nomes anatômicos do dente;
- observação da ocorrência, quando existente.

Cada item terá uma ação explícita para removê-lo. A exclusão chamará o atual contrato de dados imutável, sem alterar as demais ocorrências, notas do dente ou registros de outros dentes. O estado vazio deixa claro que ainda não há ocorrências para aquele dente.

### Arcada e visão oclusal

Cada posição da arcada exibirá o dente anatômico frontal e, logo abaixo, uma miniatura da sua vista oclusal/incisal. A miniatura usa a geometria oclusal já adotada pelo seletor de regiões, mantém o rótulo do dente e recebe as marcações das ocorrências da face central e suas regiões. A apresentação deve continuar responsiva e não criar controles de edição na arcada: abrir o dente continua sendo a única ação de edição.

Para evitar leitura ambígua, a vista oclusal será apenas informativa e terá rótulo acessível. Marcas de uma ocorrência não escondem outras: quando há mais de um registro na mesma área, a miniatura indica a sobreposição sem apagar os dados que ficam listados no modal.

### Dados e segurança

Não haverá alteração de rota, autorização, armazenamento ou esquema de banco. O formato `OdontogramV2` e a normalização de legados continuam sendo a fonte de verdade. Observações clínicas permanecem no mesmo payload protegido pelos controles existentes; testes não usarão dados de pacientes reais.

## Componentes e responsabilidades

- `Odontogram`: elimina instruções redundantes no fluxo V2, mostra o painel de ocorrências salvas no modal e envia remoções imutáveis ao consumidor.
- `ClinicalConditionEditor`: mantém a seleção precisa de regiões como a única seleção do alvo e reinicializa o formulário após salvar uma ocorrência.
- `ClinicalConditionList` (novo): converte tipos, etapas e alvos em informação clínica legível e expõe remoção por identificador.
- `OcclusalTooth` (novo ou extensão focal de componente existente): desenha a miniatura oclusal da arcada com as áreas afetadas, sem expor botões de seleção.
- `odontogramModel`: centraliza os rótulos de procedimentos, etapas e alvos para uso consistente na lista, PDF e testes.

## Comportamentos de erro e acessibilidade

O botão de salvar continua indisponível até que procedimento, situação e ao menos uma região válida estejam selecionados. O botão de remoção identifica a ocorrência que será removida. A lista usa títulos e textos, não somente cor, para que a condição seja compreensível por leitores de tela e em impressão. A arcada mantém áreas de toque amplas e não altera a semântica dos botões que abrem dentes.

## Testes de aceitação

1. Abrir um dente V2 mostra ocorrências previamente registradas com procedimento, situação, regiões e observação.
2. Remover uma ocorrência remove somente seu identificador e mantém as demais ocorrências e as notas do dente.
3. O cadastro V2 não exibe os controles antigos de seleção prévia da face; salvar depende da seleção de região no editor clínico.
4. Cada dente da arcada possui uma vista oclusal/incisal informativa abaixo do dente frontal.
5. Uma condição no alvo central é refletida na miniatura oclusal e continua acessível por texto no modal.
6. Dados legados e `readOnly` permanecem compatíveis, sem controles de edição indevidos.

## Fora de escopo

- Edição de uma ocorrência já salva.
- Alterações no catálogo clínico, no banco, em permissões ou nos documentos PDF.
- Novos dados clínicos além dos campos já suportados pela versão 2.
