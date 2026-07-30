const test = require('node:test');
const assert = require('node:assert/strict');
const { odontogramSchema } = require('../utils/validationSchemas');

const valid = {
  version: 2,
  dentition: 'permanent',
  teeth: {
    '16': {
      notes: 'Controle clínico',
      conditions: [{
        id: 'condition-1', category: 'restauracao', type: 'resina_composta', stage: 'concluido',
        targets: [{ kind: 'surface', face: 'center', region: 'incisalOcclusal' }],
      }],
    },
  },
};

test('accepts a bounded permanent layered odontogram', () => {
  assert.equal(odontogramSchema.safeParse(valid).success, true);
});

test('rejects invalid teeth, HTML notes and unknown condition fields', () => {
  for (const input of [
    { ...valid, teeth: { '51': valid.teeth['16'] } },
    { ...valid, teeth: { '16': { ...valid.teeth['16'], notes: '<script>x</script>' } } },
    { ...valid, teeth: { '16': { ...valid.teeth['16'], conditions: [{ ...valid.teeth['16'].conditions[0], unsafe: true }] } } },
  ]) assert.equal(odontogramSchema.safeParse(input).success, false);
});
