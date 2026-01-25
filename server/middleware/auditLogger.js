const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const auditLogger = async (req, res, next) => {
    // Capture the original send to log status code later if needed, 
    // but for now we log the request arrival.

    const userId = req.user ? req.user.id : null; // Assuming auth middleware sets req.user
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Only log state-changing operations or sensitive reads
    // You can customize this filter
    if (method === 'POST' || method === 'PUT' || method === 'DELETE' || url.includes('/patients')) {
        try {
            const action = `${method} ${url}`;
            const resource = url.split('/')[1] || 'root';

            // Avoid logging sensitive body data directly without sanitization
            const details = method !== 'GET' ? JSON.stringify(req.body).substring(0, 200) : null;

            await prisma.auditLog.create({
                data: {
                    userId: userId,
                    action: action,
                    resource: resource,
                    details: details,
                    ip: typeof ip === 'string' ? ip : ip[0] // handle array
                }
            });
        } catch (error) {
            console.error('Audit Log failed:', error);
            // Don't block the request if audit fails, but consider alerting
        }
    }

    next();
};

module.exports = auditLogger;
