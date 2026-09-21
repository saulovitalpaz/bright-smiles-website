# Autosave clínico e raio de proximidade de 15 km

## Objetivo

Limitar as estatísticas de regiões próximas a 15 km da clínica e proteger as alterações feitas no odontograma e no facemap contra perda acidental ao sair da consulta. O autosave começa somente depois do primeiro salvamento manual, quando a API retorna e a interface confirma o ID da consulta.

## Estatísticas de proximidade

O backend usará 15 km como limite máximo para incluir uma localização estimada nas regiões próximas. O texto do painel administrativo informará o mesmo limite. Localizações além de 15 km não serão retornadas nessa lista nem participarão dos percentuais regionais derivados dela.

## Ativação do autosave

O autosave será habilitado somente quando todas estas condições forem verdadeiras:

- a consulta foi carregada com um ID persistido ou acabou de ser criada e teve o ID retornado pela API;
- a carga inicial da consulta terminou;
- o usuário possui permissão de edição;
- houve alteração em `dentalNotes` ou `facialNotes` depois do último estado confirmado pelo servidor.

Uma consulta na rota `new` não dispara autosave. Ela continua exigindo o primeiro salvamento manual e todas as validações atuais. Depois que esse salvamento retorna com sucesso, a navegação substitui a rota por `/admin/consultas/:id`; a tela carregada com esse ID passa a permitir autosave.

## Fluxo de gravação

Alterações no odontograma ou facemap iniciam um debounce de 1 segundo. Novas alterações reiniciam o prazo. Ao vencer o prazo, a interface envia a versão mais recente da consulta pelo endpoint autenticado existente de atualização.

Os salvamentos serão serializados: apenas uma requisição de autosave poderá permanecer em andamento. Se o usuário editar novamente durante a requisição, o estado será marcado como pendente e uma nova gravação, com o snapshot mais recente, começará depois que a anterior terminar. Uma resposta antiga nunca substituirá o estado clínico mais recente mantido na interface.

O salvamento manual continuará disponível e continuará sendo responsável pelos demais campos, validações, retorno agendado, peso e efeitos atuais do atendimento. O botão manual e o autosave compartilharão a mesma preparação segura do payload para evitar diferenças de formato. O autosave não exibirá o toast de sucesso usado pelo botão manual e não mudará de página.

## Estado visível e saída da tela

A área clínica exibirá um indicador discreto com os estados:

- `Salvando…` enquanto houver uma requisição em andamento;
- `Salvo automaticamente` depois que o servidor confirmar a versão atual;
- `Falha ao salvar automaticamente` quando a API rejeitar ou não concluir a gravação.

Enquanto existir uma alteração clínica ainda não confirmada pelo servidor, a tela registrará proteção de `beforeunload`. Recarregar, fechar a aba ou navegar para fora do documento fará o navegador apresentar seu aviso nativo. Depois da confirmação do autosave, a proteção será removida.

Na navegação interna do React Router, um bloqueador de navegação será ativado enquanto houver alteração clínica pendente. A interface tentará salvar imediatamente, sem esperar o debounce. Se a gravação for confirmada, a navegação prossegue; se falhar, a pessoa escolhe entre permanecer na consulta ou descartar as alterações e sair. Não será usado `localStorage`, `sessionStorage` ou outro armazenamento persistente do navegador para dados clínicos.

## Segurança e consistência

O fluxo reutilizará a API privada de consultas, os cookies HttpOnly e as verificações de função existentes. Nenhum dado clínico será incluído em logs, URLs ou armazenamento local. O backend continuará validando `facialNotes` e `dentalNotes` e aplicando a sincronização de estoque já associada à atualização do atendimento.

Falhas de rede preservam os dados atuais na memória da tela, mantêm o estado pendente e ativam a proteção de saída. Uma edição posterior ou uma ação manual de salvar poderá tentar novamente. O modo somente leitura nunca agenda gravações.

## Testes

Os testes automatizados verificarão:

- inclusão de localizações até 15 km e exclusão das mais distantes;
- texto de 15 km no painel administrativo;
- ausência de autosave na rota `new` e no modo somente leitura;
- debounce de 1 segundo após alteração do odontograma ou facemap;
- envio pela API autenticada somente depois de um ID confirmado;
- serialização de alterações feitas durante uma requisição em andamento;
- indicador de sucesso e de falha;
- ativação de `beforeunload` apenas enquanto houver alteração clínica não confirmada;
- bloqueio da navegação interna até salvar ou confirmar o descarte de alterações pendentes.

## Critérios de aceitação

1. A lista de regiões próximas considera no máximo 15 km e a interface informa esse limite.
2. O primeiro salvamento de uma consulta nova permanece manual.
3. Depois de confirmar o ID, alterações no odontograma e facemap são gravadas automaticamente após 1 segundo de inatividade.
4. Alterações rápidas ou durante uma requisição não são perdidas nem sobrescritas por respostas antigas.
5. A interface informa o estado do autosave e alerta antes de abandonar dados ainda não confirmados.
6. Dados clínicos não são persistidos no armazenamento do navegador.
7. Usuários somente leitura não provocam requisições de autosave.
