# Atendimento: normalização do odontograma legado para V2

## Objetivo

Abrir o editor clínico V2 para atendimentos que ainda armazenam o odontograma no formato legado, preservando todas as marcações existentes.

## Decisão

`normalizeAppointmentResponse` converterá `dentalNotes` pelo normalizador já existente antes de colocá-lo no estado da tela. Assim, o `Odontogram` sempre recebe `OdontogramV2` na consulta. As marcações antigas são representadas como condições `legado_*` concluídas nos mesmos dentes e faces.

## Persistência e segurança

A conversão ocorre somente em memória ao carregar um atendimento. O JSON V2 somente é persistido se o profissional fizer o salvamento normal do atendimento. Não haverá leitura, escrita ou migração em lote no banco; os controles de autorização e a validação existente do payload V2 permanecem inalterados.

## Critérios de aceitação

1. Um `dentalNotes` legado normalizado para o estado do atendimento contém `version: 2` e `dentition: "permanent"`.
2. Uma marcação legada de face continua presente como condição V2 equivalente.
3. Ao abrir o dente desse atendimento, o modal usa o fluxo clínico V2, sem pedir a seleção legada de face.
4. Um odontograma V2 existente mantém suas condições sem alteração.
