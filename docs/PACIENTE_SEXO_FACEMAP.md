# Sexo do paciente e imagem do mapa facial

O campo Sexo pertence ao cadastro do paciente: Feminino (`female`), Masculino (`male`) ou Não informado (`null`). Pacientes antigos permanecem sem informação até edição explícita; o sistema não deduz sexo pelo nome.

No mapa interativo de aplicações, masculino seleciona `/facial-chart-front-male.png`. Feminino e não informado mantêm `/facial-chart-front.png`. A troca afeta somente a imagem de fundo, mantendo o mesmo sistema de coordenadas, aplicações, controles e integração com estoque.

## Imagem masculina

Arquivo: `public/facial-chart-front-male.png`.

Criada com a ferramenta integrada de geração de imagens, usando a imagem feminina existente como referência de edição. O arquivo feminino original foi preservado.

Prompt: “Edit this illustration into the male counterpart for the same clinical facial mapping app. Preserve EXACT frontal pose, portrait 3:4 aspect ratio, scale, head placement, white background and clinical hand-drawn colored illustration style. Keep eyes, nose tip, mouth and chin at the same normalized coordinates as the reference because an existing interactive annotation layer must align. Adult masculine face, moderately squarer jaw, slightly thicker eyebrows, short swept back hair, clean shaven, neutral expression, no makeup or pronounced lashes. Preserve soft skin shading and black linework; neck visible to identical lower boundary. Only change the underlying face artwork; no text, no markers, no diagrams, no labels. Save the generated image as a project-ready PNG asset.”

## Publicação

A alteração exige a migração aditiva do campo no backend e regeneração do Prisma Client. O fluxo de inicialização do servidor já executa `prisma generate` e `prisma migrate deploy`. Validar backup e possibilidade de restauração antes de aplicar a migração no ambiente com dados reais. A implementação local não executa seed nem altera o banco de produção.
