const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const shouldAudit = (req) => (
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
    || req.originalUrl.startsWith('/patients')
    || req.originalUrl.startsWith('/appointments')
    || req.originalUrl.startsWith('/prescriptions')
    || req.originalUrl.startsWith('/finance')
);

const trustedIp = (req) => String(req.ip || req.socket.remoteAddress || 'unknown').slice(0, 45);

const auditLogger = (req, res, next) => {
    if (!shouldAudit(req)) return next();

    res.once('finish', () => {
        const action = `${req.method} ${req.baseUrl || ''}${req.route?.path || req.path}`;
        const resource = req.path.split('/')[1] || 'root';
        const details = JSON.stringify({ statusCode: res.statusCode });

        prisma.auditLog.create({
            data: {
                userId: req.user?.id ?? null,
                action,
                resource,
                details,
                ip: trustedIp(req)
            }
        }).catch(() => {
            console.error('Audit log write failed.');
        });
    });

    next();
};

module.exports = auditLogger;
