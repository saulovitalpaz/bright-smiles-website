const { z } = require('zod');
const { Prisma } = require('@prisma/client');
const Decimal = Prisma.Decimal;
const procedureTypes = ['botulinum-toxin', 'filler', 'biostimulator', 'bioremodeler', 'skinbooster', 'thread', 'other'];
const quantitySchema = z.number().finite().min(0).max(1000000).multipleOf(0.000001);
const stockProductSchema = z.object({
    name: z.string().trim().min(1).max(160).refine(value => !/[<>]/.test(value)),
    procedureType: z.enum(procedureTypes),
    stockUnit: z.enum(['ml', 'unit']),
    concentration: z.number().finite().positive().max(1000000).nullable(),
    price: z.number().finite().min(0).max(10000000).multipleOf(0.01),
    active: z.boolean().default(true),
}).strict().superRefine((value, context) => {
    if ((value.procedureType === 'thread') !== (value.stockUnit === 'unit')) context.addIssue({ code: 'custom', message: 'Fios usam unidades; líquidos usam ml.' });
    if (value.procedureType === 'botulinum-toxin' && !value.concentration) context.addIssue({ code: 'custom', message: 'Informe a concentração em UI/ml.' });
});
const pointSchema = z.object({ x: z.number().finite().min(0).max(1), y: z.number().finite().min(0).max(1) }).strict();
const text = z.string().max(2000).refine(value => !/[<>]/.test(value));
const applicationSchema = z.object({
    id: z.string().min(1).max(100), regionId: z.string().min(1).max(100), procedureType: z.enum(procedureTypes),
    coordinates: pointSchema.optional(), endCoordinates: pointSchema.optional(),
    productId: z.string().min(1).max(100).optional(), productName: text.optional(),
    amount: z.number().finite().min(0).max(1000000).optional(), unit: z.enum(['U', 'ml', 'fio']).optional(),
    technique: text.optional(), plane: text.optional(), device: text.optional(), notes: text.optional(),
}).strict();
const legacySchema = z.record(z.string().max(100), z.object({ dose: text, product: text, notes: text }).strict());
const facialSchema = z.union([
    z.object({ version: z.literal(2), applications: z.array(applicationSchema).max(1000), legacyRegions: legacySchema.optional() }).strict(),
    legacySchema,
]).nullable();
class StockError extends Error { constructor(message, statusCode = 400) { super(message); this.statusCode = statusCode; } }
function validateFacialNotes(value) {
    const parsed = facialSchema.safeParse(value);
    if (!parsed.success) throw new StockError('Registro facial inválido. Verifique pontos, doses e produtos.');
    const ids = (parsed.data?.applications ?? []).map(a => a.id);
    if (new Set(ids).size !== ids.length) throw new StockError('Existem aplicações com identificadores repetidos.');
    return parsed.data;
}
function doseQuantity(application, product, concentration) {
    if (!(application.amount > 0)) throw new StockError('Informe uma dose maior que zero para o produto selecionado.');
    let quantity = new Decimal(application.amount);
    if (product.stockUnit === 'unit') {
        if (application.unit !== 'fio' || !Number.isInteger(application.amount)) throw new StockError('Informe a quantidade inteira de fios.');
    } else if (application.unit === 'U') {
        if (!concentration || new Decimal(concentration).lte(0)) throw new StockError('O produto precisa de concentração em UI/ml para doses em UI.');
        quantity = quantity.div(concentration);
    } else if (application.unit !== 'ml') throw new StockError('Unidade da dose incompatível com o produto.');
    quantity = quantity.toDecimalPlaces(6, Decimal.ROUND_HALF_UP);
    if (quantity.lte(0)) throw new StockError('Dose menor que a precisão do estoque.');
    return quantity;
}

// The caller holds the appointment row lock by creating/updating it first.
// Product locks are acquired in a stable order; every stock writer uses these locks.
async function syncFacialStock(tx, appointment, actorId) {
    const notes = validateFacialNotes(appointment.facialNotes ?? null);
    const previous = await tx.stockUsage.findMany({ where: { appointmentId: appointment.id } });
    const applications = (notes?.applications ?? []).filter(a => a.productId);
    const productIds = [...new Set([...previous.map(a => a.productId), ...applications.map(a => a.productId)])].sort();
    if (!productIds.length) return;
    const products = new Map();
    for (const id of productIds) {
        const rows = await tx.$queryRaw`SELECT * FROM "StockProduct" WHERE "id" = ${id} FOR UPDATE`;
        if (!rows.length) throw new StockError('Produto não encontrado no estoque. Selecione um produto cadastrado.');
        products.set(id, rows[0]);
    }
    const next = applications.map(application => {
        const product = products.get(application.productId);
        const old = previous.find(row => row.applicationId === application.id && row.productId === application.productId);
        if (!product.active && !old) throw new StockError('Produto inativo. Selecione outro produto.');
        if (product.procedureType !== application.procedureType) throw new StockError('Produto incompatível com a classe da aplicação.');
        const concentration = old ? old.concentration : product.concentration;
        const quantity = doseQuantity(application, product, concentration);
        if (!product.active && quantity.gt(old.quantity)) throw new StockError('Não é possível aumentar o consumo de um produto inativo.');
        return { appointmentId: appointment.id, applicationId: application.id, productId: product.id, quantity, concentration, unitPrice: old ? old.unitPrice : product.price };
    });
    for (const id of productIds) {
        const total = rows => rows.filter(row => row.productId === id).reduce((sum, row) => sum.add(row.quantity), new Decimal(0));
        const delta = total(previous).sub(total(next));
        if (delta.isZero()) continue;
        const product = products.get(id);
        if (new Decimal(product.quantity).add(delta).lt(0)) throw new StockError(`Estoque insuficiente para ${product.name}.`, 409);
        await tx.stockProduct.update({ where: { id }, data: { quantity: { increment: delta }, version: { increment: 1 } } });
        await tx.stockMovement.create({ data: { productId: id, quantity: delta, reason: delta.lt(0) ? 'Aplicação no facegram' : 'Correção de aplicação', appointmentId: appointment.id, actorId } });
    }
    await tx.stockUsage.deleteMany({ where: { appointmentId: appointment.id } });
    if (next.length) await tx.stockUsage.createMany({ data: next });
}
module.exports = { stockProductSchema, quantitySchema, validateFacialNotes, doseQuantity, syncFacialStock, StockError };
