# Task 3 — Odontograma anatômico

## RED

Comando:

```powershell
npx vitest run src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx
```

O primeiro teste executável falhou como esperado porque
`./AnatomicalTooth` ainda não existia. A primeira execução dentro do sandbox
falhou antes da coleta porque o Vitest não podia ler o diretório pai exigido
por `vitest.config.ts`; a repetição aprovada fora do sandbox confirmou o RED
esperado de módulo ausente.

## GREEN

```powershell
npx vitest run src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx
```

Resultado: 1 arquivo, 5 testes aprovados. As quatro famílias FDI renderizam
atributo de família e ao menos três camadas anatômicas; `Ausente` apresenta o
marcador visual.

## Lint

```powershell
npx eslint src/components/admin/attendance/odontogram/AnatomicalTooth.tsx src/components/admin/attendance/odontogram/odontogramGeometry.ts src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx
```

Resultado: saída limpa, código de saída 0.

## Origem dos caminhos

Os contornos foram adaptados localmente, em literais de
`odontogramGeometry.ts`, apenas a partir dos seis SVGs MIT aprovados e
somente-leitura:

- `C:\tmp\react-odontogram-modul-20260715\src\assets\teeth-svgs\11.svg`
- `C:\tmp\react-odontogram-modul-20260715\src\assets\teeth-svgs\13.svg`
- `C:\tmp\react-odontogram-modul-20260715\src\assets\teeth-svgs\14.svg`
- `C:\tmp\react-odontogram-modul-20260715\src\assets\teeth-svgs\14_occl.svg`
- `C:\tmp\react-odontogram-modul-20260715\src\assets\teeth-svgs\16.svg`
- `C:\tmp\react-odontogram-modul-20260715\src\assets\teeth-svgs\16_occl.svg`

A licença integral está em `src/assets/odontogram/THIRD_PARTY_NOTICES.md`.
Não há cópia de metadados, CSS embutido, scripts, fetch ou dependência de
runtime. As referências `url(#...)` encontradas são somente IDs internos de
gradientes e clipPath do próprio SVG.

## Arquivos

- `src/assets/odontogram/THIRD_PARTY_NOTICES.md`
- `src/components/admin/attendance/odontogram/odontogramGeometry.ts`
- `src/components/admin/attendance/odontogram/AnatomicalTooth.tsx`
- `src/components/admin/attendance/odontogram/AnatomicalTooth.test.tsx`
- `src/index.css`

## Auto-revisão

- Incisivo, canino, pré-molar e molar possuem silhuetas distintas, com uma,
  duas ou três raízes conforme a família, colos curvos e coroas com cúspides
  próprias.
- A ordem de pintura é sombra de raiz, dentina, transição cervical, esmalte,
  highlight recortado, overlay clínico e cruz de ausência.
- Gradientes e clipPath têm IDs prefixados pelo número do dente.
- O navegador integrado não estava disponível nesta sessão; a revisão visual
  foi estática sobre os paths e as camadas SVG, além dos testes de renderização.
- O staging e o commit foram limitados aos cinco arquivos acima; nenhuma
  alteração preexistente em `.superpowers` ou `docs` foi incluída.

## Commit

`b24096b7d92f2b67c083af156ad1af64e1c427c2` — `feat: add licensed anatomical tooth vectors`
