const { normalizeScheduledAt } = require('../utils/schedule');

function createUpdateLeadHandler(prisma) {
    return async (req, res) => {
        try {
            const data = {};
            for (const field of ['status', 'scheduledAt', 'professional']) {
                if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                    data[field] = req.body[field];
                }
            }

            if (data.scheduledAt !== undefined) {
                data.scheduledAt = normalizeScheduledAt(data.scheduledAt);
            }

            if (data.professional === '') {
                data.professional = null;
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
