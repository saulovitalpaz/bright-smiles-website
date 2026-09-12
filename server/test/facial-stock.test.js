const test = require('node:test');
const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { syncFacialStock, doseQuantity, validateFacialNotes, stockProductSchema } = require('../utils/facialStock');
const D = Prisma.Decimal;
const product = (id = 'p1', overrides = {}) => ({ id, name: 'Produto de teste', procedureType: 'botulinum-toxin', stockUnit: 'ml', quantity: new D(10), concentration: new D(50), price: new D(100), active: true, version: 0, ...overrides });
const application = (overrides = {}) => ({ id: 'a1', regionId: 'frontal', procedureType: 'botulinum-toxin', amount: 10, unit: 'U', productId: 'p1', ...overrides });
function store(initial = [product()]) {
    const products = new Map(initial.map(p => [p.id, p]));
    let usages = []; const movements = [];
    const tx = {
        $queryRaw: async (_, id) => products.has(id) ? [products.get(id)] : [],
        stockUsage: {
            findMany: async ({ where }) => usages.filter(u => u.appointmentId === where.appointmentId),
            deleteMany: async ({ where }) => { usages = usages.filter(u => u.appointmentId !== where.appointmentId); },
            createMany: async ({ data }) => { usages.push(...data); },
        },
        stockProduct: { update: async ({ where, data }) => { const p = products.get(where.id); p.quantity = p.quantity.add(data.quantity.increment); p.version++; return p; } },
        stockMovement: { create: async ({ data }) => movements.push(data) },
    };
    const save = (applications, id = 1) => syncFacialStock(tx, { id, facialNotes: { version: 2, applications } }, 1);
    return { products, movements, save, get usages() { return usages; } };
}
test('UI doses convert to ml, repeated save does not consume again, edit applies difference', async () => {
    const s = store(); await s.save([application()]); assert.equal(s.products.get('p1').quantity.toString(), '9.8');
    await s.save([application()]); assert.equal(s.products.get('p1').quantity.toString(), '9.8'); assert.equal(s.movements.length, 1);
    await s.save([application({ amount: 25 })]); assert.equal(s.products.get('p1').quantity.toString(), '9.5');
    await s.save([]); assert.equal(s.products.get('p1').quantity.toString(), '10'); assert.equal(s.usages.length, 0);
});
test('product replacement restores original stock and consumes the replacement', async () => {
    const s = store([product(), product('p2', { concentration: new D(100) })]);
    await s.save([application()]); await s.save([application({ productId: 'p2' })]);
    assert.equal(s.products.get('p1').quantity.toString(), '10'); assert.equal(s.products.get('p2').quantity.toString(), '9.9');
});
test('different appointments consume independently and insufficient stock is rejected', async () => {
    const s = store([product('p1', { quantity: new D(.3) })]);
    await s.save([application()], 1);
    await assert.rejects(s.save([application()], 2), /Estoque insuficiente/);
    assert.equal(s.products.get('p1').quantity.toString(), '0.1');
});
test('snapshot concentration and price remain unchanged for existing applications', async () => {
    const s = store(); await s.save([application()]); s.products.get('p1').concentration = new D(100); s.products.get('p1').price = new D(200);
    await s.save([application({ amount: 20 })]);
    assert.equal(s.products.get('p1').quantity.toString(), '9.6'); assert.equal(s.usages[0].unitPrice.toString(), '100');
});
test('rejects class mismatch, unknown products and inactive new usage', async () => {
    const s = store();
    await assert.rejects(s.save([application({ procedureType: 'filler' })]), /incompatível/);
    await assert.rejects(s.save([application({ productId: 'missing' })]), /não encontrado/);
    s.products.get('p1').active = false;
    await assert.rejects(s.save([application()]), /inativo/);
});
test('ml doses and thread units use correct base quantity', () => {
    assert.equal(doseQuantity(application({ amount: .5, unit: 'ml' }), product(), null).toString(), '0.5');
    assert.equal(doseQuantity(application({ amount: 2, unit: 'fio' }), product('p1', { stockUnit: 'unit' }), null).toString(), '2');
    assert.throws(() => doseQuantity(application({ amount: 1.5, unit: 'fio' }), product('p1', { stockUnit: 'unit' }), null), /inteira/);
    assert.throws(() => doseQuantity(application(), product(), null), /concentração/);
});
test('validates clinical data server-side, preserves legacy and rejects malicious or duplicate marks', () => {
    const old = { frontal: { dose: '2 U', product: 'Anterior', notes: 'Observação' } };
    assert.deepEqual(validateFacialNotes(old), old);
    assert.throws(() => validateFacialNotes({ version: 2, applications: [application(), application()] }), /repetidos/);
    for (const patch of [{ amount: -1 }, { notes: '<script>x</script>' }, { coordinates: { x: 2, y: .5 } }, { amount: Infinity }, { price: 0 }]) {
        assert.throws(() => validateFacialNotes({ version: 2, applications: [application(patch)] }), /inválido/);
    }
    const path = { version: 2, applications: [application({ coordinates: { x: .2, y: .3 }, endCoordinates: { x: .4, y: .5 }, device: 'Cânula' })] };
    assert.deepEqual(validateFacialNotes(path), path);
});
test('requires valid concentration for toxin and matching stock units', () => {
    const value = { name: 'Produto', procedureType: 'botulinum-toxin', stockUnit: 'ml', concentration: 50, price: 100, active: true };
    assert.equal(stockProductSchema.safeParse(value).success, true);
    assert.equal(stockProductSchema.safeParse({ ...value, concentration: null }).success, false);
    assert.equal(stockProductSchema.safeParse({ ...value, stockUnit: 'unit' }).success, false);
});
