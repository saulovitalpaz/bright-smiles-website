const { z } = require('zod');
const { Prisma } = require('@prisma/client');
const { stockProductSchema, quantitySchema, StockError } = require('../utils/facialStock');
const serialize = product => ({ ...product, quantity: Number(product.quantity), concentration: product.concentration === null ? null : Number(product.concentration), price: Number(product.price) });
const adjustmentSchema = z.object({ quantity: z.number().finite().min(-1000000).max(1000000).multipleOf(0.000001).refine(n => n !== 0), reason: z.string().trim().min(3).max(200).refine(s => !/[<>]/.test(s)), version: z.number().int().nonnegative() }).strict();
const fail = (res, error) => res.status(error instanceof StockError ? error.statusCode : 500).json({ error: error instanceof StockError ? error.message : 'Não foi possível atualizar o estoque.' });

function registerStockRoutes(app, prisma, authenticateToken, authorizeRole) {
    const access = [authenticateToken, authorizeRole(['admin', 'dentist'])];
    app.get('/stock/products', ...access, async (req, res) => {
        const query = z.object({ search: z.string().max(100).optional(), procedureType: z.string().max(40).optional() }).safeParse(req.query);
        if (!query.success) return res.status(400).json({ error: 'Busca inválida.' });
        try {
            const products = await prisma.stockProduct.findMany({ where: { ...(query.data.search ? { name: { contains: query.data.search, mode: 'insensitive' } } : {}), ...(query.data.procedureType ? { procedureType: query.data.procedureType } : {}) }, orderBy: { name: 'asc' }, take: 500 });
            res.json(products.map(serialize));
        } catch (error) { fail(res, error); }
    });
    app.post('/stock/products', ...access, async (req, res) => {
        const parsed = stockProductSchema.safeParse(req.body?.product);
        const quantity = quantitySchema.safeParse(req.body?.quantity);
        if (!parsed.success || !quantity.success) return res.status(400).json({ error: 'Confira nome, classe, quantidade, concentração e preço.' });
        if (parsed.data.stockUnit === 'unit' && !Number.isInteger(quantity.data)) return res.status(400).json({ error: 'A quantidade de fios deve ser inteira.' });
        try {
            const product = await prisma.$transaction(async tx => {
                const product = await tx.stockProduct.create({ data: { ...parsed.data, quantity: quantity.data } });
                await tx.stockMovement.create({ data: { productId: product.id, quantity: quantity.data, reason: 'Saldo inicial', actorId: req.user.id } });
                return product;
            });
            res.status(201).json(serialize(product));
        } catch (error) { fail(res, error); }
    });
    app.put('/stock/products/:id', ...access, async (req, res) => {
        const parsed = stockProductSchema.safeParse(req.body?.product);
        const version = z.number().int().nonnegative().safeParse(req.body?.version);
        if (!parsed.success || !version.success) return res.status(400).json({ error: 'Dados do produto inválidos.' });
        try {
            const product = await prisma.$transaction(async tx => {
                const rows = await tx.$queryRaw`SELECT * FROM "StockProduct" WHERE "id" = ${req.params.id} FOR UPDATE`;
                const current = rows[0];
                if (!current) throw new StockError('Produto não encontrado.', 404);
                if (current.version !== version.data) throw new StockError('O estoque mudou. Atualize a página antes de salvar.', 409);
                if (current.procedureType !== parsed.data.procedureType || current.stockUnit !== parsed.data.stockUnit || String(current.concentration ?? '') !== String(parsed.data.concentration ?? '')) {
                    throw new StockError('Classe, unidade e concentração são fixas. Cadastre outro produto para uma nova apresentação.');
                }
                return tx.stockProduct.update({ where: { id: current.id }, data: { ...parsed.data, version: { increment: 1 } } });
            });
            res.json(serialize(product));
        } catch (error) { fail(res, error); }
    });
    app.post('/stock/products/:id/adjustments', ...access, async (req, res) => {
        const parsed = adjustmentSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: 'Informe quantidade, motivo e versão válidos.' });
        try {
            const product = await prisma.$transaction(async tx => {
                const rows = await tx.$queryRaw`SELECT * FROM "StockProduct" WHERE "id" = ${req.params.id} FOR UPDATE`;
                const current = rows[0];
                if (!current) throw new StockError('Produto não encontrado.', 404);
                if (current.version !== parsed.data.version) throw new StockError('O estoque mudou. Atualize a página antes de ajustar.', 409);
                if (current.stockUnit === 'unit' && !Number.isInteger(parsed.data.quantity)) throw new StockError('A quantidade de fios deve ser inteira.');
                if (new Prisma.Decimal(current.quantity).add(parsed.data.quantity).lt(0)) throw new StockError('O ajuste deixaria o estoque negativo.', 409);
                const product = await tx.stockProduct.update({ where: { id: current.id }, data: { quantity: { increment: parsed.data.quantity }, version: { increment: 1 } } });
                await tx.stockMovement.create({ data: { productId: current.id, quantity: parsed.data.quantity, reason: parsed.data.reason, actorId: req.user.id } });
                return product;
            });
            res.json(serialize(product));
        } catch (error) { fail(res, error); }
    });
    app.get('/stock/products/:id/movements', ...access, async (req, res) => {
        try {
            const rows = await prisma.stockMovement.findMany({ where: { productId: req.params.id }, orderBy: { id: 'desc' }, take: 100 });
            res.json(rows.map(row => ({ id: row.id, quantity: Number(row.quantity), reason: row.reason, createdAt: row.createdAt })));
        } catch (error) { fail(res, error); }
    });
}
module.exports = { registerStockRoutes };
