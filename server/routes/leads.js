const { normalizeScheduledAt } = require('../utils/schedule');

function createUpdateLeadHandler(prisma) {
    return async (req, res) => {
        try {
            const data = { ...req.body };
            if (data.scheduledAt !== undefined) {
                data.scheduledAt = normalizeScheduledAt(data.scheduledAt);
            }

            const lead = await prisma.lead.update({
                where: { id: parseInt(req.params.id, 10) },
                data
            });
            res.json(lead);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
}

module.exports = {
    createUpdateLeadHandler
};
