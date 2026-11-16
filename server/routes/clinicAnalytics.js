const { parseFinanceTransactionDate } = require('../utils/financePeriod');

function period(query) {
    if (!query.start && !query.end) return {};
    if (typeof query.start !== 'string' || typeof query.end !== 'string') throw new Error('Invalid period');
    const start = parseFinanceTransactionDate(query.start);
    const end = parseFinanceTransactionDate(query.end);
    if (start > end) throw new Error('Invalid period');
    end.setUTCDate(end.getUTCDate() + 1);
    return { gte: start, lt: end };
}

const dateWhere = (field, range) => Object.keys(range).length ? { [field]: range } : {};
const breakdown = (rows, key) => rows.map(row => ({ name: row[key] || 'Não informado', count: row._count._all }));

function createClinicAnalyticsHandler(prisma) {
    return async (req, res) => {
        let range;
        try { range = period(req.query); } catch { return res.status(400).json({ error: 'Período inválido.' }); }
        try {
            const [transactions, visits, leads, clinical] = await Promise.all([
                prisma.financeTransaction.groupBy({ by: ['type', 'category', 'paymentStatus'], where: dateWhere('date', range), _count: { _all: true }, _sum: { amount: true } }),
                prisma.analyticsEvent.count({ where: { ...dateWhere('date', range), type: 'pageview', NOT: { path: { startsWith: '/admin' } } } }),
                prisma.lead.count({ where: dateWhere('createdAt', range) }),
                req.user.role === 'admin' ? Promise.all([
                    prisma.appointment.groupBy({ by: ['status', 'appointmentType'], where: dateWhere('date', range), _count: { _all: true } }),
                    prisma.appointment.groupBy({ by: ['procedure'], where: { ...dateWhere('date', range), status: 'attended' }, _count: { _all: true } }),
                    prisma.treatmentPlanItem.groupBy({ by: ['name'], where: { ...dateWhere('updatedAt', range), clinicalStatus: 'completed' }, _count: { _all: true } }),
                    prisma.patient.count({ where: dateWhere('createdAt', range) }),
                    prisma.treatmentPlan.count({ where: { ...dateWhere('createdAt', range), status: { not: 'cancelled' } } }),
                    prisma.treatmentPlan.count({ where: { ...dateWhere('createdAt', range), status: 'authorized', items: { some: {}, every: { clinicalStatus: 'completed' } } } })
                ]) : null
            ]);
            const finance = { income: { count: 0, total: 0, categories: {} }, expense: { count: 0, total: 0, categories: {} }, pending: { count: 0, total: 0 } };
            for (const row of transactions) {
                if (row.paymentStatus === 'voided') continue;
                const amount = row._sum.amount || 0;
                if (row.type === 'income' && row.paymentStatus === 'pending') { finance.pending.count += row._count._all; finance.pending.total += amount; continue; }
                const target = finance[row.type];
                if (!target || !target.categories) continue;
                target.count += row._count._all;
                target.total += amount;
                const category = row.category || 'Não informado';
                const item = target.categories[category] || { count: 0, total: 0 };
                item.count += row._count._all; item.total += amount; target.categories[category] = item;
            }
            let clinic = null;
            if (clinical) {
                const [appointments, procedures, treatments, patients, plansTotal, plansCompleted] = clinical;
                clinic = { appointments: appointments.map(row => ({ status: row.status, type: row.appointmentType, count: row._count._all })), procedures: breakdown(procedures, 'procedure'), treatments: breakdown(treatments, 'name'), patients, plans: { pending: plansTotal - plansCompleted, completed: plansCompleted } };
            }
            return res.json({ clinic, finance, website: { visits, leads } });
        } catch { return res.status(500).json({ error: 'Não foi possível carregar os indicadores.' }); }
    };
}
module.exports = { createClinicAnalyticsHandler };
