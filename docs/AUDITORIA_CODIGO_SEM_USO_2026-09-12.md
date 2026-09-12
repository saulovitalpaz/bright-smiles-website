# Auditoria de código sem uso — 12/09/2026

## Escopo e método

Inspeção dos pontos de entrada do frontend, importações estáticas e dinâmicas, referências nos testes e scripts, dependências diretas e módulos locais do servidor. Busca de indicadores de dados simulados no código de produção. Nenhum banco de dados, seed ou migração foi executado.

## Correções

- Removidos 44 arquivos versionados sem consumidores na aplicação atual: 27 componentes de UI, o hook exclusivo da sidebar aposentada, o wrapper NavLink, o odontograma simplificado antigo, dois catálogos estáticos e 12 arquivos da interface facial anterior (incluindo dois arquivos de testes exclusivos).
- Blog e tratamentos continuam consumindo a API; o conteúdo inicial em `server/seed.js` foi preservado. O teste de referências de mídia passou a inspecionar essa fonte mantida.
- O mapa facial atual continua sendo `InjectableChart`, exposto por `FacialHarmonizationWorkspace`. Seus testes de interação, estoque e compatibilidade foram preservados.
- Removidas 24 dependências diretas sem importadores após a limpeza. `package.json` e `package-lock.json` foram sincronizados pelo npm. A dependência Zod do backend foi preservada.
- Eliminados comentários de rascunho e variáveis abandonadas no envio de feedback, sem alterar o payload.
- Conectado `App.css` ao ponto de entrada: as regras de dimensão da raiz já eram verificadas pelo script responsivo, mas a aplicação não carregava o arquivo.

## Preservado deliberadamente

- Mocks e fixtures de testes ativos: necessários para verificar comportamento sem acessar dados reais.
- Catálogos clínicos, normalizadores de registros antigos, migrações e scripts operacionais.
- Arquivos pessoais, backups, documentação de construção e alterações anteriores da sessão.
- Recursos públicos e imagens: podem estar referenciados pelo conteúdo persistido no banco, mesmo sem importação no código.
- O lockfile histórico do Bun não foi regenerado. O Dockerfile usa npm ci e o lockfile atualizado é o do npm.

## Validação

- Frontend: 232 testes passando em 41 arquivos. Nove testes exclusivos da interface facial aposentada foram removidos junto aos componentes; os testes da interface substituta passaram antes da remoção.
- Backend: 153 testes passando.
- Build de produção, lint do formulário alterado e conferência de whitespace dos arquivos de código alterados passaram.
- Após a limpeza, o grafo de importações não apontou outros módulos isolados do frontend além do setup de testes, carregado pelo Vitest. As rotas, utilitários e middlewares locais do backend são alcançáveis pelos pontos de entrada inspecionados.

Esta análise confirma o uso em nível de módulos e referências estáticas; não constitui uma prova de que todo export, seletor CSS ou ramo de execução restante seja necessário. Dados reais persistidos e scripts históricos não foram classificados como descartáveis apenas por não terem importações.

As remoções são recuperáveis pelo histórico do Git.
