# Analytics, Calendário e Navegação Administrativa — Especificação

## Objetivo

Restabelecer a coleta e a leitura de analytics, obter localização aproximada por IP sem solicitar permissão de localização do navegador e reorganizar consultas, calendário, pacientes e equipe na navegação administrativa. A solução deve preservar as permissões atuais, não expor IP bruto e não adicionar um segundo serviço de analytics.

## Diagnóstico confirmado

- `AdminAnalytics` usa Axios sem `withCredentials` para acessar `/dashboard/stats` e `/analytics/stats`, embora ambas as rotas exijam o cookie HttpOnly. Em produção, as duas respondem `401` sem a sessão.
- As três leituras da página estão em um único `Promise.all`; uma resposta protegida com erro descarta também as respostas válidas e deixa todos os indicadores com os valores iniciais.
- A coleta usa `x-forwarded-for` diretamente, o que ignora a fronteira de confiança já configurada no Express por `trust proxy`.
- O provedor atual é chamado por HTTP, sem timeout ou cache. Uma consulta externa é feita a cada evento.
- O endpoint aceita `type`, `path` e `source` sem contrato de entrada e devolve o registro persistido, inclusive campos que não precisam chegar ao navegador.
- O backend armazena IP bruto e `/analytics/stats` inclui eventos recentes completos na resposta administrativa.
- Fontes e localizações agregam todos os tipos de evento, mas usam `pageview` como denominador. Isso pode produzir percentuais inconsistentes.
- A seção de bairros sugere precisão que geolocalização por IP não oferece de forma confiável.
- `AdminAppointments` mistura lista, calendário, carregamento de leads/equipe e todos os modais da agenda em uma única página.
- A lista de consultas não tem filtro de data. O calendário é uma aba interna e o atalho do dashboard depende de `?view=calendar`.
- “Pacientes” e “Equipe” são itens isolados no sidebar, em vez de pertencerem a “Atendimentos” e “Configurações”.

## Abordagem escolhida

O analytics existente será modularizado e reforçado. A geolocalização continuará no backend e usará o endpoint HTTPS do IPWhoIs por meio de uma pequena interface interna, com timeout, cache e fallback. Essa abordagem evita um novo serviço, não exige migração de banco e permite substituir o provedor futuramente sem mudar o contrato da aplicação.

Alternativas rejeitadas neste ciclo:

- banco GeoIP local: remove a dependência por requisição, mas exige conta/licença, automação de download e atualizações periódicas;
- Umami ou plataforma semelhante: acrescenta infraestrutura, autenticação, implantação e manutenção para funcionalidades que o sistema já possui.

## Arquitetura de analytics

### Coleta no navegador

Um helper único será responsável por enviar eventos. `PageTracker`, `BlogPost` e `Stories` usarão esse helper em vez de repetir chamadas `fetch`.

O contrato aceito será restrito a:

- `type`: `pageview`, `blog_view` ou `story_view`;
- `path`: caminho iniciado por `/`, normalizado e limitado em tamanho;
- `source`: origem normalizada e limitada em tamanho.

O envio será assíncrono, com `keepalive`, e não bloqueará navegação nem renderização. Não haverá chamada a `navigator.geolocation` ou a qualquer API de GPS do navegador.

### Rota pública de coleta

`POST /analytics` continuará sendo público por necessidade funcional, como exceção explícita ao padrão de rotas privadas. A rota ficará sujeita às restrições de origem já aplicadas aos `POST` em produção e ganhará testes que comprovem seu contrato público limitado.

O servidor deverá:

1. validar e normalizar o payload;
2. rejeitar bots conhecidos e payloads inválidos antes da persistência;
3. obter o endereço pela interface confiável do Express (`req.ip`);
4. recusar endereços inválidos, privados ou reservados para a consulta geográfica;
5. calcular um HMAC SHA-256 com separação de domínio usando o segredo já obrigatório do servidor;
6. usar o HMAC como identificador de visitante e chave do cache, nunca persistindo IP bruto em eventos novos;
7. aplicar um limite em memória por identificador para reduzir abuso da rota pública;
8. consultar geolocalização somente quando o cache não tiver uma entrada válida;
9. persistir o evento mesmo quando a geolocalização falhar;
10. responder `202` com um corpo mínimo, sem devolver registro, IP, identificador ou localização individual.

O cache geográfico terá duração de 24 horas e guardará apenas o identificador irreversível e os dados aproximados. A chamada externa usará HTTPS, seleção explícita de campos, timeout curto e validação da resposta.

### Localização aproximada

Serão persistidos, quando disponíveis:

- cidade;
- estado/região;
- país dentro do campo de localização formatado;
- latitude e longitude arredondadas para duas casas decimais.

“Bairro” não será inferido nem exibido para eventos novos. O painel usará “Cidades” e “Estados/Regiões”, com texto que esclarece a natureza aproximada dos dados.

Falha, timeout, limite ou resposta inválida do provedor resultará em localização desconhecida, sem perda do evento. O endpoint gratuito do IPWhoIs é adequado ao volume atual quando combinado com cache; a interface interna permitirá trocar para um serviço com SLA se o volume ultrapassar o limite contratado.

### Dados legados e privacidade

Registros existentes com IP bruto serão preservados neste ciclo para evitar uma exclusão de dados não solicitada. Ao agregar visitantes, valores legados serão convertidos em HMAC somente em memória, permitindo compará-los com identificadores novos sem devolver o valor original.

`GET /analytics/stats` não retornará mais `recentEvents` ou qualquer identificador de visitante. A alteração não exige mudança no schema Prisma: o campo `ip` existente passará a conter o HMAC nos registros novos.

### Estatísticas administrativas

`GET /analytics/stats` permanecerá protegido por sessão e limitado às funções `admin` e `manager`.

Somente eventos `pageview` formarão os denominadores de tráfego. A resposta agregada conterá:

- total de visitas;
- visitantes únicos;
- total de leads e taxa de conversão;
- origens do tráfego;
- cidades;
- estados/regiões;
- páginas mais acessadas;
- categorias de dispositivo derivadas do `User-Agent`.

Eventos `blog_view` e `story_view` continuarão disponíveis para métricas de conteúdo, sem distorcer percentuais de pageviews.

`AdminAnalytics` passará a usar `fetchClient` para leituras protegidas. Métricas principais e lista pública de posts serão carregadas em paralelo, mas tratadas independentemente: uma falha em posts não apagará analytics, e uma falha nas métricas exibirá erro com ação de nova tentativa em vez de zeros enganosos. A chamada redundante a `/dashboard/stats` será removida porque seus valores não são exibidos na página.

## Consultas e calendário

### Lista de consultas

`/admin/consultas` ficará exclusivamente responsável pela lista de atendimentos. A página manterá:

- total de atendimentos;
- ação “Novo atendimento” para funções autorizadas;
- pesquisa por nome do paciente ou CPF;
- filtro por dia, usando `scheduledAt` e recorrendo a `date` para registros legados;
- abertura do atendimento e exclusão conforme as permissões atuais.

Os filtros de texto e data serão combináveis. A página não carregará leads, equipe ou componentes do calendário.

### Página de calendário

Uma nova página em `/admin/calendario` receberá o calendário e os fluxos operacionais atualmente misturados em `AdminAppointments`:

- visualizações mensal, semanal e diária;
- carregamento de atendimentos, leads e profissionais;
- criação manual em horário vazio;
- movimentação de eventos com confirmação;
- alteração do profissional;
- atualização coordenada do calendário, leads e dashboard.

O acesso manterá a proteção atual de agenda clínica, sem ampliar permissões para `manager`. A separação será feita por responsabilidade, preservando o componente `CalendarView` e o comportamento já coberto por testes.

O botão de calendário no card “Próxima Agenda” do dashboard apontará diretamente para `/admin/calendario`. O parâmetro `?view=calendar` deixará de ser necessário.

## Sidebar administrativo

A hierarquia será:

```text
Dashboard
Solicitações
Conteúdo
Atendimentos
  Consultas
  Pacientes
  Prescrição
  Termos & Documentos
Calendário
Financeiro
Minhas Finanças (quando aplicável)
Analytics
Configurações
  Geral
  Equipe
```

“Pacientes” deixará de ser item principal e ficará dentro de “Atendimentos”. “Equipe” ficará dentro de “Configurações”. Os itens e subitens continuarão filtrados pelas regras de função existentes. Estados ativos considerarão rotas de detalhe sem marcar um grupo incorreto.

## Tratamento de erros

- coleta inválida: `400`, sem persistência;
- excesso de eventos: `429`, sem persistência;
- bot ou endereço reservado: `202` com estado ignorado e sem dados sensíveis;
- falha geográfica: evento salvo com localização desconhecida;
- falha de persistência: resposta genérica, sem detalhes internos ou payload em logs;
- falha ao carregar analytics: mensagem visível e botão de nova tentativa;
- falha opcional de posts: métricas permanecem disponíveis e a seção de posts mostra estado próprio;
- falha no calendário: estado anterior permanece e a mensagem segura aparece próxima à ação.

Logs não conterão IP, HMAC, localização individual, payload de paciente, cookie, token ou resposta integral do provedor.

## Estratégia de testes

### Backend

- teste unitário da normalização e validação dos eventos;
- teste de extração segura de IP e rejeição de endereços privados/reservados;
- teste que observa falha antes da implementação e depois comprova que IP bruto não é persistido;
- teste de timeout/falha geográfica com persistência em fallback;
- teste de cache para evitar consultas repetidas do mesmo identificador;
- teste de limite por visitante;
- teste das agregações usando somente `pageview` nos percentuais;
- teste que comprova ausência de IP, HMAC e eventos individuais na resposta de estatísticas;
- contrato de autorização de `/analytics/stats` e contrato público restrito de `POST /analytics`.

### Frontend

- `PageTracker`, blog e stories usam o helper central;
- `AdminAnalytics` envia o cookie por `fetchClient`, renderiza dados e separa falhas de posts;
- lista de consultas não renderiza calendário e combina filtros de paciente/CPF e data;
- nova página de calendário preserva criação, movimentação e edição;
- `/admin/calendario` está protegida e registrada;
- sidebar apresenta a nova hierarquia;
- atalho do dashboard abre `/admin/calendario`.

### Verificação final

- testes frontend;
- testes backend;
- lint;
- build de produção;
- testes do subsistema de backup;
- varredura de segredos;
- `git diff --check`.

Não haverá migração Prisma nem alteração de criptografia de dados existentes. Arquivos não rastreados, backups e documentação de construção serão preservados.

## Critérios de aceite

1. Uma visita pública válida cria um evento sem solicitar permissão de localização.
2. Eventos novos nunca persistem ou retornam IP bruto.
3. A localização aproximada aparece por cidade e estado/região quando o provedor responde.
4. Indisponibilidade do provedor não impede a contagem da visita.
5. A página de analytics autenticada deixa de receber `401` por ausência de cookie e não exibe zeros quando há erro de carregamento.
6. Percentuais de origem e localização usam apenas pageviews e não ultrapassam o denominador por misturar eventos de conteúdo.
7. `/admin/consultas` mostra somente a lista e permite combinar pesquisa de paciente/CPF com filtro de data.
8. `/admin/calendario` preserva todas as operações atuais da agenda.
9. O card “Próxima Agenda” abre a nova rota do calendário.
10. “Pacientes” aparece sob “Atendimentos” e “Equipe” sob “Configurações”.
11. Usuários anônimos continuam sem acesso às estatísticas, calendário, pacientes ou equipe.
12. Testes, lint, build, backup, secret scan e `git diff --check` terminam sem regressões relacionadas.
