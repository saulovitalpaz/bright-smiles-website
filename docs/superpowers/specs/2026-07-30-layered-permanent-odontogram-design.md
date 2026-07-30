# Odontograma permanente com condições clínicas em camadas

Data: 2026-07-30  
Status: aprovado para especificação

## Contexto

O odontograma atual representa dentes permanentes com anatomia SVG e cinco faces selecionáveis, mas permite somente condições simplificadas, em geral tratada ou a tratar. Ele não registra de maneira independente achados, tratamentos, materiais e evolução clínica, portanto uma nova marcação pode substituir a informação de outra intervenção no mesmo local.

O objetivo desta evolução é disponibilizar um odontograma clínico de alta precisão para a dentição permanente. Ele deve registrar múltiplas condições sobrepostas no mesmo dente ou região, mostrar cada ocorrência de forma compreensível no SVG e preservar a compatibilidade dos prontuários existentes.

## Objetivos

- Manter exclusivamente a dentição permanente FDI nesta entrega.
- Substituir o estado único por ocorrências clínicas independentes em camadas.
- Permitir que uma ocorrência cubra uma ou mais faces, uma sub-região ou o dente inteiro.
- Ampliar o catálogo de achados, materiais, tratamentos e correções odontológicas.
- Priorizar regiões SVG clínicas exatas e anatomia distinta por família dentária.
- Preservar leituras de dados legados e o campo `odontogram` já persistido pela API.
- Validar o payload de odontograma no servidor; ele não permanecerá como JSON irrestrito.
- Preservar os modos editável, somente leitura, histórico, receita e impressão.

## Não objetivos

- Incluir dentição decídua nesta entrega.
- Criar periodontograma completo, planejamento ortodôntico com medidas, odontologia 3D real, WebGL ou uma migração para FHIR.
- Alterar registros clínicos existentes sem uma ação explícita do profissional.
- Alterar a estrutura da tabela de pacientes ou criar uma migração de banco para o odontograma.

## Modelo de dados

O valor persistido continuará no campo JSON `odontogram` do paciente, porém a versão 2 organizará as informações por dente e ocorrências independentes:

```ts
interface OdontogramV2 {
  version: 2;
  dentition: "permanent";
  teeth: Record<string, ToothRecord>;
}

interface ToothRecord {
  notes: string;
  conditions: ClinicalCondition[];
}

interface ClinicalCondition {
  id: string;
  category: ClinicalCategory;
  type: ClinicalConditionType;
  targets: ConditionTarget[];
  stage: ClinicalStage;
  notes?: string;
}

interface ConditionTarget {
  face: FaceKey;
  region?: "entire" | "cervical" | "middle" | "incisalOcclusal";
}
```

`FaceKey` preserva as cinco faces clínicas já existentes: `top`, `right`, `bottom`, `left` e `center`. A interface traduz cada chave para vestibular, lingual ou palatina, mesial, distal e oclusal ou incisal conforme a arcada e o quadrante. Um alvo de dente inteiro será representado por um tipo explícito de alvo, não por cinco faces artificiais.

Uma condição aceita múltiplos alvos. Assim, por exemplo, uma restauração de resina pode abranger oclusal e mesial, enquanto uma cárie e uma restauração anterior podem coexistir em uma mesma região sem se apagarem.

Os dados legados em `Record<string, ToothData>` continuarão sendo lidos. Um adaptador os converterá em memória para ocorrências da versão 2; nenhuma informação de `status`, `faces` ou `notes` será descartada. A primeira edição salvará a versão 2 normalizada. Consumidores de impressão e leitura usarão o mesmo adaptador.

## Catálogo clínico

O catálogo terá códigos estáveis e labels em português. A UI só oferecerá as combinações clinicamente válidas de tipo e alvo.

| Categoria | Opções iniciais |
| --- | --- |
| Achados | Cárie, lesão inicial de cárie, infiltração, fratura, trinca, desgaste, abrasão, erosão, abfração, mancha, hipoplasia, sensibilidade, mobilidade, envolvimento de furca, retração gengival, dente ausente |
| Restaurações e prevenção | Resina composta, amálgama, ionômero de vidro, restauração provisória, selante, inlay, onlay, overlay, faceta |
| Endodontia | Tratamento endodôntico, retratamento, obturação radicular, lesão periapical, pino intrarradicular, núcleo |
| Prótese e implantes | Coroa total, coroa parcial, coroa provisória, coroa sobre implante, implante, ponte fixa, prótese removível, elemento pôntico |
| Periodontia e cirurgia | Gengivectomia, enxerto, cirurgia periodontal, exodontia indicada, exodontia executada |
| Ortodontia | Bracket, banda, contenção, aparelho |

Cada ocorrência possui uma situação independente: `aAvaliar`, `planejado`, `emAndamento`, `concluido`, `monitorado`, `suspenso` ou `removido`. Ela comunica planejamento e execução sem confundir o tipo clínico com o progresso assistencial.

## Interação e precisão anatômica

O fluxo de registro é:

1. O profissional seleciona um dente na arcada permanente.
2. No editor, seleciona diretamente uma ou mais faces no SVG anatômico.
3. Para condições que precisam de maior precisão, escolhe a sub-região cervical, média ou incisal/oclusal da face.
4. Escolhe a categoria, o tipo clínico e a situação assistencial.
5. O sistema cria uma nova ocorrência, sem substituir as demais condições.

As famílias incisivo, canino, pré-molar e molar continuarão visualmente distintas. As cinco superfícies terão hit areas próprias e acessíveis. Coberturas parciais e totais representarão inlay, onlay, faceta e coroa; marcações anatômicas de raiz representarão tratamento endodôntico, pino e implante; ponte, bracket, selante, contenção, ausência e fratura terão sinais vetoriais próprios.

Em uma região com sobreposição, o SVG mostrará a camada mais recente ou a de maior prioridade clínica, além de indicador de múltiplas ocorrências. Ao selecionar a região, a UI exibirá todas as camadas, permitindo inspecionar, editar ou remover somente a ocorrência escolhida.

O significado não dependerá apenas da cor: preenchimentos, hachuras, contornos e marcadores diferenciarão tipos e situação. Todos os alvos manterão tamanho útil de toque de pelo menos 44 px e acesso por teclado.

## Segurança e validação

O backend validará o odontograma com schema explícito antes da persistência. A validação aceitará apenas dentes permanentes FDI válidos, a versão suportada, categorias e tipos conhecidos, estágios permitidos, alvos válidos para cada tipo e limites conservadores de tamanho, notas e ocorrências por dente. Chaves desconhecidas serão rejeitadas.

Notas serão tratadas como texto simples e terão limite de comprimento; a aplicação não armazenará ou renderizará HTML clínico. Os dados do odontograma continuarão protegidos pelos mesmos controles de autorização do prontuário. Não haverá dados de pacientes, tokens ou imagens clínicas em testes, fixtures ou logs.

## Arquitetura

- `odontogramModel.ts`: tipos v2, catálogo, adaptador legado, regras de alvo e atualizadores imutáveis.
- `odontogramGeometry.ts`: geometria dos dentes e regiões SVG, sem estado React.
- `AnatomicalTooth.tsx`: renderização anatômica e composição visual das camadas.
- `ToothSurfaceSelector.tsx`: seleção semântica de faces e sub-regiões.
- `ClinicalConditionEditor.tsx`: criação e edição de uma ocorrência clínica, com filtro de opções compatíveis.
- `Odontogram.tsx`: arcadas, seleção, lista de camadas e integração com os modos existentes.
- `server/utils/validationSchemas.js`: schema de odontograma estruturado e reutilizável nas rotas de paciente.

## Tratamento de erros

- O editor impedirá salvar uma ocorrência sem alvo, tipo ou situação.
- A API retornará erro de validação sem persistir payload parcial.
- Dados legados inválidos ou incompletos serão mostrados somente leitura com aviso e não serão descartados automaticamente.
- Falhas ao atualizar o prontuário manterão o estado local anterior e apresentarão mensagem de erro sem expor detalhes internos.

## Testes e critérios de aceitação

- Duas ou mais ocorrências podem coexistir na mesma face ou sub-região.
- Editar ou remover uma ocorrência não altera as demais.
- Cada opção respeita suas regras de alvo; uma coroa não pode ser aplicada somente a uma sub-região.
- Dados antigos com `status`, `faces` e `notes` continuam visíveis e editáveis após adaptação.
- O SVG comunica cada categoria relevante com geometria, padrão ou contorno adequado.
- Todos os controles funcionam por teclado, têm rótulos acessíveis e não dependem somente de cor.
- A API rejeita versionamento, dentes, tipos, estágios, alvos, tamanhos e chaves inválidos.
- Modos somente leitura, histórico, impressão e receita preservam o resumo clínico.
- Testes de frontend e backend, lint, build, varredura de segredos e `git diff --check` passam antes da entrega.
