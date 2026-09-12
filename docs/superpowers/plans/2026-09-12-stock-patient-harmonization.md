# Estoque, peso do paciente e harmonização

**Objetivo:** executar o desenho aprovado em 12/09/2026, mantendo dados antigos e as regras de SECURITY.md.

**Arquitetura:** ampliar os modelos existentes de estoque e paciente com campos opcionais; manter movimentações transacionais e autorizações atuais. Produto e dose pertencem às aplicações do facemap. Peso cadastral é dado clínico protegido, consultável no atendimento e prescrição, sem sobrescrever pesos históricos.

- [x] Estoque: adicionar `batch` e `reconstitutedAt` opcionais em `server/prisma/schema.prisma`, migração aditiva, validação em `server/utils/facialStock.js`, formulário `src/pages/AdminStock.tsx` e contrato `src/lib/stock.ts`. Datas são datas civis, sem conversão de fuso na exibição. Testar criação, edição e rejeição de datas inválidas.
- [x] Facemap: reproduzir abertura da marcação com produto da classe correta em `FacialHarmonizationWorkspace.test.tsx`; mostrar o seletor de imediato, permitir atualizar resultados e pesquisar nome/lote, manter filtro por classe e bloqueio de produtos inativos. Verificar cadastro → GET filtrado → marcação e persistência do vínculo.
- [x] Paciente: adicionar `weight` opcional validado e cifrado com a chave atual. Aceitar vírgula decimal; omissão preserva valor, null limpa. Exibir no cadastro, consulta e prescrição. Manter `Appointment.weight` como histórico, sem preencher ou alterar pelo peso atual. Testar rotas reais com dados fictícios e compatibilidade de cifragem.
- [x] Layout: remover títulos internos repetidos e o card Protocolo geral. Diário clínico em largura inteira, materiais complementares e faturamento em colunas equilibradas, facemap em largura inteira. Preservar materiais e peso antigos, com indicação histórica.
- [x] Odontograma (adicionado após autorização): completar os três terços das quatro faces laterais, com rótulos por família do dente e preservação do alvo exato no resumo, na gravação e reabertura. Manter a superfície central e as regras existentes para dente inteiro.
- [x] Verificar testes frontend/backend, TypeScript, build, diff e segredos. Verificar migração/backup em ambiente isolado se disponível; documentar limitações sem acessar dados de produção. Navegador integrado falhou antes da inicialização com erro de ambiente.

Comandos: `npm test`, `node --test server/test/*.test.js`, `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`, `git diff --check`. Nenhuma publicação ou migração de produção faz parte desta execução.


## Verificação final

- Frontend: 258 testes aprovados em 41 arquivos.
- Backend: 162 testes aprovados; backup: 18 testes aprovados.
- Build de produção concluído. Prisma validado e cliente gerado.
- Migração aplicada sobre o schema anterior em PostgreSQL 16 temporário. Valores antigos preservados; escrita dos novos campos com Prisma confirmada. Dump restaurado em outra base temporária e verificado. Nenhum acesso ao banco da clínica.
- Varredura por padrões comuns de segredos nas alterações sem achados; `git diff --check` aprovado.
- TypeScript: permanecem seis erros em arquivos não alterados (PrescriptionGenerator.test.ts, AdminBlog.tsx, AdminComments.tsx, AdminUsers.tsx). Nenhum erro nos arquivos desta alteração após a revisão.
- Navegador integrado indisponível por falha de inicialização do ambiente; inspeção visual interativa não concluída. Layout verificado por código e interações por testes de componentes. A consulta à ferramenta de busca da skill UI/UX também não executou devido ao Python do ambiente; foram usadas suas orientações gerais de agrupamento, rótulos e foco.
- Facemap: a captura enviada confirmou que o texto roxo era um botão pouco reconhecível, com a lista inicialmente fechada. A lista agora abre com a marcação e a troca tem borda/ícone. Cadastro e busca pela classe passaram no teste de integração.
- Publicação não executada. Aplicar a migração aditiva no backend antes de disponibilizar o frontend; manter a rotina de backup de produção prevista em SECURITY.md.
