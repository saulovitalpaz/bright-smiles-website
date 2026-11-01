const { randomUUID } = require('node:crypto');
const { z } = require('zod');

const name = z.string().trim().min(1).max(160).refine(value => !/[<>]/.test(value));
const groupInput = z.object({ name, active: z.boolean() }).strict();
const conditionInput = groupInput.extend({ groupKey: z.string().min(1).max(80) }).strict();

function registerClinicalConditionRoutes(app, { prisma, authenticateToken, authorizeRole }) {
    app.get('/clinical-conditions', authenticateToken, authorizeRole(['admin', 'dentist']), async (_req, res) => {
        try {
            res.json(await prisma.clinicalConditionGroup.findMany({ include: { conditions: { orderBy: { name: 'asc' } } }, orderBy: { name: 'asc' } }));
        } catch { res.status(500).json({ error: 'Não foi possível carregar as condições da clínica.' }); }
    });
    for (const [path, model, schema] of [
        ['/clinical-condition-groups', 'clinicalConditionGroup', groupInput],
        ['/clinical-conditions', 'clinicalConditionDefinition', conditionInput],
    ]) {
        for (const method of ['post', 'put']) {
            app[method](path + (method === 'put' ? '/:key' : ''), authenticateToken, authorizeRole(['admin']), async (req, res) => {
                const parsed = schema.safeParse(req.body);
                if (!parsed.success) return res.status(400).json({ error: 'Revise o nome, grupo e disponibilidade.' });
                try {
                    const data = parsed.data;
                    if (data.groupKey) {
                        const group = await prisma.clinicalConditionGroup.findUnique({ where: { key: data.groupKey } });
                        if (!group || !group.active) return res.status(400).json({ error: 'Selecione um grupo disponível.' });
                    }
                    const result = method === 'post'
                        ? await prisma[model].create({ data: { ...data, key: `custom_${randomUUID()}` } })
                        : await prisma[model].update({ where: { key: req.params.key }, data });
                    res.status(method === 'post' ? 201 : 200).json(result);
                } catch (error) {
                    res.status(error.code === 'P2025' ? 404 : 500).json({ error: 'Não foi possível salvar o cadastro clínico.' });
                }
            });
        }
        // Archive instead of removing clinical identities used by historical odontograms.
        app.delete(path + '/:key', authenticateToken, authorizeRole(['admin']), async (req, res) => {
            try {
                await prisma[model].update({ where: { key: req.params.key }, data: { active: false } });
                res.sendStatus(204);
            } catch (error) {
                res.status(error.code === 'P2025' ? 404 : 500).json({ error: 'Não foi possível excluir o cadastro clínico.' });
            }
        });
    }
}

module.exports = { registerClinicalConditionRoutes };
