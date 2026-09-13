# Remoção do blog — 13/09/2026

O blog foi retirado da navegação pública e administrativa, das rotas React, da homepage, das chamadas e rotas HTTP, dos eventos específicos de analytics e do seed. Comentários/depoimentos, tratamentos e stories continuam disponíveis. A sanitização HTML usada por documentos clínicos foi preservada, com nome genérico `sanitizeRichContent`.

O modelo Prisma `Post` e as migrações históricas permanecem somente para preservar a tabela e dados legados. Não foi executado seed, migração, exclusão de registros ou acesso ao banco. Uma eventual eliminação física futura requer autorização e backup/restauração validados.

Foram removidas credenciais padrão do seed. Antes de qualquer mutação, ele agora exige `SEED_SUPPORT_PASSWORD`, `SEED_ANA_PASSWORD`, `SEED_CLARA_PASSWORD` e `SEED_MANAGER_PASSWORD`, sem valores padrão e com 12 a 256 caracteres. Novas senhas são armazenadas usando o hash já adotado pelo servidor; contas existentes não têm suas credenciais redefinidas pelo seed. Falhas não imprimem objetos de erro que possam conter dados sensíveis. Nenhuma senha de conta existente foi alterada; credenciais historicamente expostas exigem rotação pelo responsável em procedimento próprio.
