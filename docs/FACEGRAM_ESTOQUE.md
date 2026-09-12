# Facegram e estoque

O atendimento usa uma face ilustrada com pontos para agulha e setas para cânula/fio. As marcações aceitam mouse, toque, caneta e teclado. Quantidade, produto e técnica pertencem à aplicação; o prontuário continua usando o documento facial versão 2. Registros antigos permanecem acessíveis.

Em Configurações → Estoque, cadastre nome, classe, saldo, concentração em UI/ml quando aplicável e preço por ml (ou por unidade para fios). A apresentação é fixa: uma concentração diferente exige um novo cadastro. Produtos podem ser inativados; ajustes de saldo exigem motivo e preservam histórico.

No painel junto à marcação, use “Selecionar produto do estoque” e pesquise o produto da classe atual. Marcações sem vínculo são registros manuais e não movimentam estoque. A confirmação da quantidade altera o rascunho do atendimento; a baixa só ocorre ao salvar o atendimento no servidor.

## Regras de consumo

- Líquidos: saldo em ml; dose em UI usa `ml = UI / concentração`. Dose em ml usa o próprio volume.
- Fios: saldo em unidades inteiras; dose em fios. Não se soma fios às unidades da toxina.
- Repetir um salvamento do mesmo atendimento não desconta novamente. Edição aplica a diferença; exclusão da aplicação ou troca de produto devolve o consumo anterior.
- Cancelar o agendamento não presume devolução de insumo já utilizado. Para corrigir consumo registrado indevidamente, corrija as aplicações. Atendimento com consumo vinculado não pode ser excluído diretamente.
- A transação salva atendimento, financeiro, saldo, consumo e movimentações juntos. Bloqueios de linha do atendimento e dos produtos, em ordem estável, protegem saldos concorrentes. Falha de estoque desfaz a transação inteira.
- A concentração e o preço usados ficam preservados no consumo. Quantidades usam Decimal com seis casas, não aritmética monetária binária.
- Rotas `/stock/*` exigem sessão autenticada e perfil admin ou dentist. Não há catálogo público. A interface não persiste dados de estoque em localStorage.

## Migração e ativação

A migração `server/prisma/migrations/20260912010000_facial_stock/migration.sql` cria somente StockProduct, StockUsage e StockMovement; não altera dados existentes nem chaves de criptografia.

Antes de aplicar em um banco compartilhado, siga SECURITY.md: backup verificado e restauração em ambiente isolado. Então execute, no serviço backend, `npx prisma migrate deploy` e `npx prisma generate`, reinicie a API e publique o frontend compatível. Não cadastre produtos antes de a API e a migração estarem ativas.

Neste ambiente não há DATABASE_URL configurada nem daemon Docker ativo. A migração e o backup/restore de um PostgreSQL real precisam ser validados no ambiente de implantação. Nenhuma migração foi aplicada ao banco em uso.

## Ilustração

Arquivo: `public/facial-chart-front.png`. Gerado com a ferramenta integrada imagegen; prompt final: face feminina frontal em ilustração médica de linhas pretas, pele pêssego clara, cabelos brancos penteados para trás, olhos azul-acinzentados e lábios rosados, fundo branco, sem textos, pontos, setas ou interface. As marcações são desenhadas pela aplicação, não fazem parte da imagem.

## Validação local

- Testes de backend: 153 aprovados, incluindo conversão, reconciliação, validação de entrada e acesso privado às rotas de estoque.
- Build de produção, validação do schema Prisma e geração do cliente: aprovados.
- Revisão visual do facegram em desktop e contêiner de 390 px, usando dados fictícios.
- A suíte geral do frontend tem uma falha anterior em `finance-pages-layout.test.ts`; TypeScript aponta erros anteriores em odontograma, prescrições e páginas administrativas. Nenhum erro de tipo foi apontado nos novos componentes.
- Testes de estoque usam doubles de persistência; não substituem verificação de migração, rollback e concorrência em PostgreSQL real antes da implantação.
