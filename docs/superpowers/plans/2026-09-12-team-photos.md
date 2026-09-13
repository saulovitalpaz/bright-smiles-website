# Fotos da equipe e revisão da homepage

## Implementação

- Upload privado `PUT /team/photo/me` e leitura privada `GET /team/photo/me`, para admin/dentist e somente a profissional vinculada ao login único consultado no banco.
- Vínculos existentes: `Dra. Ana Karolina` → `ana-karolina`; `Dra. Clara Lima` → `clara-lima`. Os logins são únicos e não editáveis em `/users/me`; nome de exibição, CRO e IDs enviados pelo cliente não autorizam uploads.
- `GET /team/photos` é deliberadamente público: publica apenas a chave da profissional e a referência da foto. Não retorna registros de usuários.
- Persistência em Setting com prefixo `team_photo_`, fora da lista permitida em `/settings`. Sem migração de banco. O bucket existente recebe bytes originais, mantendo transparência. Falhas de persistência removem somente o novo objeto; fotos anteriores permanecem preservadas.
- Limite de 5 MB, somente PNG/JPEG/WebP, MIME e estrutura binária verificados. Uma imagem por requisição e nenhum campo de identidade aceito.
- Editor mostra prévia e exige Publicar minha foto. Invalida o cache da homepage; leitura pública sem cache HTTP, atualização ao voltar à aba e a cada minuto enquanto aberta.

## Revisão visual

Referência: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

- Team: substituir fotos recortadas e cards pesados por retratos 4:5, object-contain, fundo neutro e cantos arredondados; nomes completos e fotos com dimensões reservadas.
- Team: trocar clique em div e modal manual por botão e Dialog com teclado, Escape e gerenciamento de foco; contatos como links reais.
- Header: remover H1 duplicado da marca, declarar dimensões do logo e estado expandido do menu móvel.
- Hero: priorizar a imagem principal, ação no botão e link de tratamentos sem controles interativos aninhados.
- Index: link para pular ao conteúdo, compensação do cabeçalho fixo nas âncoras e respeito a movimento reduzido.
- Feedback: avaliações com rótulos e estado selecionado, campos nomeados sem indicação contraditória de opcionalidade. TestimonialsCarousel e Stories: rótulos nos controles; Footer e miniaturas de Stories: dimensões e carregamento tardio.

## Limitações de verificação

A conexão do navegador expirou em duas tentativas; a revisão visual foi feita no código, sem captura de tela. A checagem TypeScript completa encontrou problemas anteriores em PrescriptionGenerator.test.ts, AdminBlog.tsx e AdminComments.tsx, fora deste escopo.

Validação: testes de propriedade, negação anônima, perfis, tentativa de troca de identidade, MIME falso, excesso de tamanho, preservação de bytes e rollback; testes React de upload e fotos públicas; suítes completas, lint e build.
