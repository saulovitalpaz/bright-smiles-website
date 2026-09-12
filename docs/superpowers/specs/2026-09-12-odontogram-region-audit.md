# Conferência das regiões do odontograma

Solicitação de 12/09/2026: conferir a seleção mostrada na captura “Condições das faces”. Após a revisão, o usuário autorizou corrigir as faces ausentes.

## Resultado

- As cinco faces estão disponíveis: vestibular, palatina (arcada superior) ou lingual (inferior), mesial, distal e oclusal/incisal. Os lados mesial/distal mudam conforme o quadrante em `getFaceLabels`.
- Nas quatro faces laterais, a lista `FACE_REGION_OPTIONS` de `ToothSurfaceSelector.tsx` oferece apenas `cervical` e `middle`. O terço `incisalOcclusal` está ausente da seleção lateral, apesar de aceito pelo tipo `ConditionTarget` e pela validação do servidor.
- A seleção central grava `face: center, region: incisalOcclusal`. Ela representa a superfície central e não substitui os terços incisais/oclusais das quatro outras faces.
- “Dente inteiro” existe em seção separada e depende da condição escolhida. Condições como implante não permitem selecionar faces.
- O limite atual é de cinco regiões por ocorrência, igual no frontend e no backend. Não é o total de regiões disponíveis.
- Raízes individuais, terços radiculares, cúspides, fossas, sulcos e ângulos não são alvos estruturados separados nesse modelo; os procedimentos relacionados à raiz usam o dente inteiro. Portanto, não se deve apresentar essa seleção como cobertura de toda a anatomia dentária.

## Referência anatômica

[Dental Anatomy and Morphology of Permanent Teeth, seção 2.2](https://www.intechopen.com/chapters/86255) descreve a divisão da coroa em terços cervical, médio e incisal/oclusal. A constatação da ausência deriva da comparação dessa divisão com o código da seleção.

## Correção autorizada

Disponibilizado `incisalOcclusal` nas quatro faces laterais, com rótulo incisal para incisivos/caninos e oclusal para pré-molares/molares. Os três terços são agrupados por face. O resumo agora mantém o nome do terço lateral, em vez de exibir apenas a face. Identificadores, superfície central, histórico existente e limite de cinco alvos por ocorrência são preservados.

Testes cobrem seleção por família/quadrante, dentição permanente e decídua, gravação e reabertura do alvo exato e aceitação pelo servidor. Expandir para regiões radiculares ou cúspides exigiria novos alvos e representação gráfica; isso não faz parte desta correção dos terços da coroa.
