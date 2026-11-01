const { Prisma } = require('@prisma/client');
const {
    clinicalProcedureSchema,
    createTreatmentPlanSchema,
    updateTreatmentPlanSchema,
    treatmentPlanAuthorizationSchema,
    treatmentPlanPaymentSchema,
    treatmentPlanItemStatusSchema,
} = require('../utils/validationSchemas');

const PLAN_ROLES = ['admin', 'dentist'];
const CATALOG_ROLES = ['admin', 'dentist'];
const FINANCE_CATEGORY = 'Tratamento odontológico';

class RouteError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

const parseId = (value) => {
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id <= 2147483647 ? id : null;
};

const decimal = (value) => new Prisma.Decimal(Number(value).toFixed(2));
const amountNumber = (value) => Number(new Prisma.Decimal(value || 0).toFixed(2));
const sumAmounts = (values) => values.reduce((total, value) => total.plus(value || 0), new Prisma.Decimal(0));

function routeError(res, error, fallback) {
    if (error instanceof RouteError) return res.status(error.statusCode).json({ error: error.message });
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado.' });
    if (error?.code === 'P2002') return res.status(409).json({ error: 'Este pagamento ou registro já existe.' });
    if (error?.code === 'P2003') return res.status(409).json({ error: 'O registro possui vínculos que impedem esta alteração.' });
    if (error?.code === 'P2034') return res.status(409).json({ error: 'O saldo foi atualizado por outro recebimento. Atualize o plano e tente novamente.' });
    return res.status(500).json({ error: fallback });
}

function formatPlan(plan) {
    const quotedTotal = sumAmounts(plan.items.map(item => item.quotedTotal));
    const authorizedTotal = sumAmounts(plan.items.map(item => item.authorizedTotal));
    const receivedTotal = sumAmounts(plan.payments.map(payment => payment.amount));
    const phaseTotals = {};
    for (const item of plan.items) {
        phaseTotals[item.phase] = (phaseTotals[item.phase] || 0) + amountNumber(item.quotedTotal);
    }
    const isExpired = plan.status === 'awaiting_authorization' && plan.validUntil < new Date();
    return {
        ...plan,
        status: isExpired ? 'expired' : plan.status,
        items: plan.items.map(item => ({
            ...item,
            unitPrice: amountNumber(item.unitPrice),
            quotedTotal: amountNumber(item.quotedTotal),
            authorizedTotal: item.authorizedTotal === null ? null : amountNumber(item.authorizedTotal),
        })),
        payments: plan.payments.map(payment => ({ ...payment, amount: amountNumber(payment.amount) })),
        totals: {
            quoted: amountNumber(quotedTotal),
            authorized: amountNumber(authorizedTotal),
            received: amountNumber(receivedTotal),
            balance: amountNumber(authorizedTotal.minus(receivedTotal)),
            discount: amountNumber(sumAmounts(plan.items.filter(item => item.authorizedTotal !== null)
                .map(item => new Prisma.Decimal(item.quotedTotal).minus(item.authorizedTotal)))),
            byPhase: phaseTotals,
        },
    };
}

async function lockPlan(tx, planId) {
    await tx.$queryRaw`SELECT "id" FROM "TreatmentPlan" WHERE "id" = ${planId} FOR UPDATE`;
}

async function buildPlanItem(tx, item, inactiveProcedureIds = new Set()) {
    const name = item.name;
    const category = item.category;
    const pricingUnit = item.pricingUnit;
    const unitPrice = decimal(item.unitPrice);

    if (item.procedureId) {
        const procedure = await tx.clinicalProcedure.findUnique({ where: { id: item.procedureId } });
        if (!procedure || (!procedure.active && !inactiveProcedureIds.has(item.procedureId))) {
            throw new RouteError(400, 'Selecione um procedimento ativo da tabela.');
        }
        if (item.conditionType && !procedure.conditionTypes.includes(item.conditionType)) {
            throw new RouteError(400, 'O procedimento não está associado a esta condição clínica.');
        }
    }

    const quantity = item.quantity;
    if (unitPrice.mul(quantity).greaterThan('9999999999.99')) throw new RouteError(400, 'O total do procedimento excede o limite permitido.');
    return {
        procedureId: item.procedureId || null,
        name,
        category,
        pricingUnit,
        conditionType: item.conditionType || null,
        phase: item.phase,
        quantity,
        unitPrice,
        quotedTotal: unitPrice.mul(quantity).toDecimalPlaces(2),
        toothNumber: item.toothNumber || null,
        targets: item.targets || undefined,
        notes: item.notes || null,
    };
}

const includePlan = {
    patient: { select: { id: true, name: true, birthDate: true } },
    sourceAppointment: { select: { id: true, date: true, procedure: true } },
    items: { orderBy: [{ phase: 'asc' }, { id: 'asc' }] },
    payments: {
        select: { id: true, amount: true, method: true, receivedAt: true },
        orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
    },
};
const includePlanForQuote = {
    ...includePlan,
    sourceAppointment: { select: { id: true, date: true, procedure: true, dentalNotes: true } },
};

function registerTreatmentPlanRoutes(app, { prisma, authenticateToken, authorizeRole }) {
    const validateConditions = async (types) => {
        const found = await prisma.clinicalConditionDefinition.count({ where: { key: { in: [...new Set(types)] } } });
        if (found !== new Set(types).size) throw new RouteError(400, 'Selecione condições cadastradas pela clínica.');
    };
    app.get('/clinical-procedures', authenticateToken, authorizeRole(CATALOG_ROLES), async (_req, res) => {
        try {
            const procedures = await prisma.clinicalProcedure.findMany({ orderBy: [{ active: 'desc' }, { category: 'asc' }, { name: 'asc' }] });
            res.json(procedures.map(procedure => ({ ...procedure, price: amountNumber(procedure.price) })));
        } catch {
            res.status(500).json({ error: 'Não foi possível carregar a tabela de procedimentos.' });
        }
    });

    app.post('/clinical-procedures', authenticateToken, authorizeRole(['admin']), async (req, res) => {
        const parsed = clinicalProcedureSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: 'Revise os dados do procedimento e do preço.' });
        try {
            await validateConditions(parsed.data.conditionTypes);
            const procedure = await prisma.clinicalProcedure.create({
                data: { ...parsed.data, price: decimal(parsed.data.price), active: parsed.data.active ?? true },
            });
            res.status(201).json({ ...procedure, price: amountNumber(procedure.price) });
        } catch (error) {
            routeError(res, error, 'Não foi possível cadastrar o procedimento.');
        }
    });

    app.put('/clinical-procedures/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
        const id = parseId(req.params.id);
        const parsed = clinicalProcedureSchema.safeParse(req.body);
        if (!id || !parsed.success) return res.status(400).json({ error: 'Revise os dados do procedimento e do preço.' });
        try {
            await validateConditions(parsed.data.conditionTypes);
            const procedure = await prisma.clinicalProcedure.update({
                where: { id },
                data: { ...parsed.data, price: decimal(parsed.data.price), active: parsed.data.active ?? true },
            });
            res.json({ ...procedure, price: amountNumber(procedure.price) });
        } catch (error) {
            routeError(res, error, 'Não foi possível atualizar o procedimento.');
        }
    });

    app.get('/treatment-plans', authenticateToken, authorizeRole(PLAN_ROLES), async (req, res) => {
        const patientId = req.query.patientId === undefined ? null : parseId(String(req.query.patientId));
        const sourceAppointmentId = req.query.sourceAppointmentId === undefined ? null : parseId(String(req.query.sourceAppointmentId));
        if (req.query.patientId !== undefined && !patientId) return res.status(400).json({ error: 'Paciente inválido.' });
        if (req.query.sourceAppointmentId !== undefined && !sourceAppointmentId) return res.status(400).json({ error: 'Atendimento inválido.' });
        try {
            const plans = await prisma.treatmentPlan.findMany({
                where: { ...(patientId ? { patientId } : {}), ...(sourceAppointmentId ? { sourceAppointmentId } : {}) },
                include: includePlan,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                take: 200,
            });
            res.json(plans.map(formatPlan));
        } catch {
            res.status(500).json({ error: 'Não foi possível carregar os planos de tratamento.' });
        }
    });

    app.post('/treatment-plans', authenticateToken, authorizeRole(PLAN_ROLES), async (req, res) => {
        const parsed = createTreatmentPlanSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: 'Revise o paciente e os itens do plano.' });
        try {
            const plan = await prisma.$transaction(async tx => {
                const patient = await tx.patient.findUnique({ where: { id: parsed.data.patientId }, select: { id: true } });
                if (!patient) throw new RouteError(404, 'Paciente não encontrado.');
                if (parsed.data.sourceAppointmentId) {
                    const appointment = await tx.appointment.findUnique({ where: { id: parsed.data.sourceAppointmentId }, select: { patientId: true } });
                    if (!appointment || appointment.patientId !== patient.id) throw new RouteError(400, 'O atendimento não pertence a este paciente.');
                }
                const items = [];
                for (const item of parsed.data.items) items.push(await buildPlanItem(tx, item));
                const validUntil = new Date();
                validUntil.setDate(validUntil.getDate() + 30);
                return tx.treatmentPlan.create({
                    data: {
                        patientId: patient.id,
                        sourceAppointmentId: parsed.data.sourceAppointmentId || null,
                        createdById: req.user.id,
                        validUntil,
                        status: 'awaiting_authorization',
                        notes: parsed.data.notes || null,
                        paymentTerms: parsed.data.paymentTerms || null,
                        items: { create: items },
                    },
                    include: includePlan,
                });
            });
            res.status(201).json(formatPlan(plan));
        } catch (error) {
            routeError(res, error, 'Não foi possível salvar o orçamento.');
        }
    });

    app.get('/treatment-plans/:id', authenticateToken, authorizeRole(PLAN_ROLES), async (req, res) => {
        const id = parseId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Plano inválido.' });
        try {
            const plan = await prisma.treatmentPlan.findUnique({ where: { id }, include: includePlanForQuote });
            if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });
            res.json(formatPlan(plan));
        } catch {
            res.status(500).json({ error: 'Não foi possível carregar o orçamento.' });
        }
    });

    app.put('/treatment-plans/:id', authenticateToken, authorizeRole(PLAN_ROLES), async (req, res) => {
        const id = parseId(req.params.id);
        const parsed = updateTreatmentPlanSchema.safeParse(req.body);
        if (!id || !parsed.success) return res.status(400).json({ error: 'Revise os dados e os itens do orçamento.' });
        try {
            const plan = await prisma.$transaction(async tx => {
                await lockPlan(tx, id);
                const existing = await tx.treatmentPlan.findUnique({ where: { id }, include: { items: true, payments: true } });
                if (!existing) throw new RouteError(404, 'Plano não encontrado.');
                if (existing.status !== 'awaiting_authorization' || existing.validUntil < new Date()
                    || existing.payments.length || existing.items.some(item => item.authorizedTotal !== null)) {
                    throw new RouteError(409, 'Este orçamento não pode mais ser editado.');
                }
                const items = [];
                const inactiveProcedureIds = new Set(existing.items.map(item => item.procedureId).filter(Boolean));
                for (const item of parsed.data.items) items.push(await buildPlanItem(tx, item, inactiveProcedureIds));
                await tx.treatmentPlanItem.deleteMany({ where: { planId: id } });
                await tx.treatmentPlanItem.createMany({ data: items.map(item => ({ ...item, planId: id })) });
                return tx.treatmentPlan.update({
                    where: { id },
                    data: { notes: parsed.data.notes || null, paymentTerms: parsed.data.paymentTerms || null },
                    include: includePlan,
                });
            });
            res.json(formatPlan(plan));
        } catch (error) {
            routeError(res, error, 'Não foi possível atualizar o orçamento.');
        }
    });

    app.post('/treatment-plans/:id/authorization', authenticateToken, authorizeRole(PLAN_ROLES), async (req, res) => {
        const id = parseId(req.params.id);
        const parsed = treatmentPlanAuthorizationSchema.safeParse(req.body);
        if (!id || !parsed.success) return res.status(400).json({ error: 'Revise os procedimentos selecionados.' });
        try {
            const plan = await prisma.$transaction(async tx => {
                await lockPlan(tx, id);
                const existing = await tx.treatmentPlan.findUnique({ where: { id }, include: { items: true, payments: true } });
                if (!existing) throw new RouteError(404, 'Plano não encontrado.');
                if (existing.validUntil < new Date() && ['awaiting_authorization', 'partially_authorized'].includes(existing.status)) {
                    throw new RouteError(409, 'A validade deste orçamento terminou. Gere um novo orçamento para autorizar os procedimentos.');
                }
                if (!['awaiting_authorization', 'partially_authorized'].includes(existing.status)) {
                    throw new RouteError(409, 'Este orçamento não aceita novas autorizações.');
                }
                const itemMap = new Map(existing.items.map(item => [item.id, item]));
                for (const choice of parsed.data.items) {
                    const item = itemMap.get(choice.itemId);
                    if (!item) throw new RouteError(400, 'Há um procedimento que não pertence a este orçamento.');
                    if (item.authorizedTotal !== null) {
                        if (!choice.authorized || (choice.authorizedTotal !== undefined
                            && !decimal(choice.authorizedTotal).equals(item.authorizedTotal))) {
                            throw new RouteError(409, 'Um procedimento já autorizado não pode ser alterado.');
                        }
                        continue;
                    }
                    if (!choice.authorized) continue;
                    const authorizedTotal = choice.authorizedTotal === undefined ? item.quotedTotal : decimal(choice.authorizedTotal);
                    if (authorizedTotal.greaterThan(item.quotedTotal)) throw new RouteError(400, 'O valor autorizado não pode superar o valor orçado.');
                    await tx.treatmentPlanItem.update({
                        where: { id: item.id },
                        data: { authorizedTotal, clinicalStatus: 'authorized' },
                    });
                    item.authorizedTotal = authorizedTotal;
                }
                const selectedCount = existing.items.filter(item => item.authorizedTotal !== null).length;
                const status = selectedCount === existing.items.length
                    ? 'authorized'
                    : selectedCount > 0 ? 'partially_authorized' : 'awaiting_authorization';
                return tx.treatmentPlan.update({ where: { id }, data: { status }, include: includePlanForQuote });
            });
            res.json(formatPlan(plan));
        } catch (error) {
            routeError(res, error, 'Não foi possível autorizar o orçamento.');
        }
    });

    app.patch('/treatment-plan-items/:id/status', authenticateToken, authorizeRole(PLAN_ROLES), async (req, res) => {
        const id = parseId(req.params.id);
        const parsed = treatmentPlanItemStatusSchema.safeParse(req.body?.status);
        if (!id || !parsed.success) return res.status(400).json({ error: 'Situação clínica inválida.' });
        try {
            const item = await prisma.treatmentPlanItem.findUnique({ where: { id }, include: { plan: true } });
            if (!item) return res.status(404).json({ error: 'Procedimento não encontrado.' });
            if (item.authorizedTotal === null) return res.status(409).json({ error: 'Autorize o procedimento antes de atualizar sua execução.' });
            const transitions = { authorized: ['authorized', 'in_progress', 'completed'], in_progress: ['in_progress', 'completed'], completed: ['completed'] };
            if (!transitions[item.clinicalStatus]?.includes(parsed.data)) return res.status(409).json({ error: 'A execução clínica não pode voltar para uma etapa anterior.' });
            const changed = await prisma.treatmentPlanItem.updateMany({ where: { id, clinicalStatus: item.clinicalStatus }, data: { clinicalStatus: parsed.data } });
            if (!changed.count) return res.status(409).json({ error: 'A execução foi atualizada por outro usuário. Atualize o plano.' });
            const updated = await prisma.treatmentPlanItem.findUnique({ where: { id } });
            res.json(updated);
        } catch (error) {
            routeError(res, error, 'Não foi possível atualizar o procedimento.');
        }
    });

    app.post('/treatment-plans/:id/payments', authenticateToken, authorizeRole(PLAN_ROLES), async (req, res) => {
        const id = parseId(req.params.id);
        const parsed = treatmentPlanPaymentSchema.safeParse(req.body);
        if (!id || !parsed.success) return res.status(400).json({ error: 'Revise o valor, método e data do recebimento.' });
        try {
            const result = await prisma.$transaction(async tx => {
                const priorPayment = await tx.treatmentPlanPayment.findUnique({ where: { idempotencyKey: parsed.data.idempotencyKey }, include: { plan: true } });
                if (priorPayment) {
                    if (priorPayment.planId !== id || !decimal(parsed.data.amount).equals(priorPayment.amount)
                        || priorPayment.method !== parsed.data.method) throw new RouteError(409, 'A chave do recebimento já foi usada com outros dados.');
                    return { payment: priorPayment, repeated: true };
                }
                await lockPlan(tx, id);
                const plan = await tx.treatmentPlan.findUnique({ where: { id }, include: { items: true, payments: true } });
                if (!plan) throw new RouteError(404, 'Plano não encontrado.');
                if (!['authorized', 'partially_authorized'].includes(plan.status)) throw new RouteError(409, 'Autorize os procedimentos antes de receber pagamentos.');
                const authorized = sumAmounts(plan.items.map(item => item.authorizedTotal));
                const received = sumAmounts(plan.payments.map(payment => payment.amount));
                const balance = authorized.minus(received);
                const amount = decimal(parsed.data.amount);
                if (balance.lessThanOrEqualTo(0)) throw new RouteError(409, 'Este orçamento não possui saldo a receber.');
                if (amount.greaterThan(balance)) throw new RouteError(400, 'O valor excede o saldo autorizado ainda não recebido.');
                const payment = await tx.treatmentPlanPayment.create({
                    data: {
                        planId: id,
                        createdById: req.user.id,
                        amount,
                        method: parsed.data.method,
                        receivedAt: parsed.data.receivedAt ? new Date(parsed.data.receivedAt) : new Date(),
                        idempotencyKey: parsed.data.idempotencyKey,
                    },
                });
                const transaction = await tx.financeTransaction.create({
                    data: {
                        type: 'income',
                        amount: amountNumber(amount),
                        category: FINANCE_CATEGORY,
                        description: `Recebimento de plano de tratamento #${id}`,
                        date: payment.receivedAt,
                        patientId: plan.patientId,
                        paymentStatus: 'received',
                        treatmentPlanPaymentId: payment.id,
                    },
                });
                return { payment: { ...payment, financeTransactionId: transaction.id }, repeated: false };
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
            res.status(result.repeated ? 200 : 201).json({
                id: result.payment.id,
                planId: result.payment.planId,
                method: result.payment.method,
                receivedAt: result.payment.receivedAt,
                amount: amountNumber(result.payment.amount),
                repeated: result.repeated,
                ...(result.payment.financeTransactionId ? { financeTransactionId: result.payment.financeTransactionId } : {}),
            });
        } catch (error) {
            routeError(res, error, 'Não foi possível registrar o recebimento.');
        }
    });

    app.get('/patients/:id/history', authenticateToken, authorizeRole(PLAN_ROLES), async (req, res) => {
        const id = parseId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Paciente inválido.' });
        try {
            const [patient, appointments, plans, transactions] = await Promise.all([
                prisma.patient.findUnique({ where: { id }, select: { id: true, name: true, birthDate: true, sex: true } }),
                prisma.appointment.findMany({
                    where: { patientId: id },
                    select: { id: true, date: true, scheduledAt: true, procedure: true, professional: true, status: true, price: true, paymentStatus: true, appointmentType: true },
                    orderBy: [{ scheduledAt: 'desc' }, { date: 'desc' }],
                    take: 100,
                }),
                prisma.treatmentPlan.findMany({ where: { patientId: id }, include: includePlan, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] }),
                prisma.financeTransaction.findMany({
                    where: { patientId: id, type: 'income', paymentStatus: { not: 'voided' } },
                    select: { id: true, amount: true, paymentStatus: true, category: true, description: true, date: true },
                }),
            ]);
            if (!patient) return res.status(404).json({ error: 'Paciente não encontrado.' });
            const received = transactions.filter(item => item.paymentStatus !== 'pending').reduce((sum, item) => sum + item.amount, 0);
            const legacyPending = transactions.filter(item => item.paymentStatus === 'pending').reduce((sum, item) => sum + item.amount, 0);
            const plansFormatted = plans.map(formatPlan);
            const planBalance = plansFormatted.reduce((sum, plan) => sum + (plan.totals.balance || 0), 0);
            const now = Date.now();
            const nextAppointment = await prisma.appointment.findFirst({
                where: { patientId: id, status: 'scheduled', scheduledAt: { gte: new Date(now) } },
                select: { id: true, scheduledAt: true, procedure: true, status: true },
                orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
            });
            res.json({
                patient,
                nextAppointment,
                appointments,
                plans: plansFormatted,
                financialSummary: {
                    received: amountNumber(received),
                    legacyPending: amountNumber(legacyPending),
                    planBalance: amountNumber(planBalance),
                    totalReceivable: amountNumber(legacyPending + planBalance),
                    pendingTransactions: transactions.filter(item => item.paymentStatus === 'pending').map(item => ({
                        id: item.id,
                        amount: amountNumber(item.amount),
                        category: item.category,
                        description: item.description,
                        date: item.date,
                    })),
                },
            });
        } catch {
            res.status(500).json({ error: 'Não foi possível carregar o histórico do paciente.' });
        }
    });
}

module.exports = { registerTreatmentPlanRoutes };
