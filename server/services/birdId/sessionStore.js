const crypto = require('node:crypto');
const transitions = {
    AWAITING_AUTHORIZATION: ['EXCHANGING_CODE', 'CANCELLED', 'EXPIRED'],
    EXCHANGING_CODE: ['AUTHORIZED', 'FAILED', 'RECONCILIATION_REQUIRED'],
    AUTHORIZED: ['SUBMITTING', 'CANCELLED', 'EXPIRED'],
    SUBMITTING: ['SIGNING', 'RECONCILIATION_REQUIRED'],
    SIGNING: ['VALIDATING', 'FAILED', 'RECONCILIATION_REQUIRED'],
    VALIDATING: ['COMPLETE', 'FAILED', 'RECONCILIATION_REQUIRED'],
};
const terminal = new Set(['COMPLETE', 'CANCELLED', 'EXPIRED', 'FAILED']);
function transition(from, to) {
    if (!transitions[from]?.includes(to)) throw new Error('Invalid Bird ID transition.');
}
function createSessionStore(prisma) {
    return {
        async createSession({ sessionId = crypto.randomUUID(), userId, requestId, inputHash, sealedRequest, stateDigest, expiresAt }) {
            if (!Number.isSafeInteger(userId) || userId <= 0 || !sealedRequest || !/^[a-f0-9]{64}$/.test(stateDigest || '') || !(expiresAt > new Date()) || expiresAt > new Date(Date.now() + 600000)) throw new Error('Invalid Bird ID session.');
            return prisma.$transaction(async tx => {
                const existing = await tx.digitalIssueOperation.findUnique({ where: { userId_requestId: { userId, requestId } }, include: { birdIdSession: true } });
                if (existing) {
                    if (existing.provider !== 'BIRD_ID' || existing.inputHash !== inputHash) throw Object.assign(new Error('Identificador já usado para outra receita.'), { status: 409 });
                    return existing.birdIdSession;
                }
                const operation = await tx.digitalIssueOperation.create({ data: { userId, requestId, inputHash, provider: 'BIRD_ID' } });
                return tx.birdIdSession.create({ data: { id: sessionId, operationId: operation.id, userId, sealedRequest, stateDigest, expiresAt } });
            });
        },
        claimStage({ sessionId, userId, expectedStatus, nextStatus, stateDigest }) {
            transition(expectedStatus, nextStatus);
            if (expectedStatus === 'AWAITING_AUTHORIZATION' && nextStatus === 'EXCHANGING_CODE' && !/^[a-f0-9]{64}$/.test(stateDigest || '')) throw new Error('State required.');
            const leaseToken = crypto.randomUUID();
            const now = new Date();
            return prisma.$transaction(async tx => {
                const result = await tx.birdIdSession.updateMany({
                    where: { id: sessionId, userId, status: expectedStatus, expiresAt: nextStatus === 'EXPIRED' ? { lte: now } : { gt: now }, leaseToken: null, ...(stateDigest ? { stateDigest } : {}) },
                    data: { status: nextStatus, leaseToken, leaseUntil: new Date(now.getTime() + 60000), ...(stateDigest ? { stateDigest: null } : {}), ...(terminal.has(nextStatus) ? { stateDigest: null, sealedOAuth: null, sealedRequest: null, leaseToken: null, leaseUntil: null } : {}) },
                });
                return result.count === 1 ? tx.birdIdSession.findFirst({ where: { id: sessionId, userId, status: nextStatus } }) : null;
            });
        },
        finishSession({ sessionId, userId, expectedStatus, nextStatus, leaseToken, updates = {} }) {
            transition(expectedStatus, nextStatus);
            if (!leaseToken) throw new Error('Lease required.');
            const allowed = new Set(['sealedOAuth', 'sealedTransaction', 'unsignedStorageKey', 'unsignedHash', 'errorCode']);
            if (Object.keys(updates).some(key => !allowed.has(key))) throw new Error('Invalid session update.');
            return prisma.$transaction(async tx => {
                const result = await tx.birdIdSession.updateMany({
                    where: { id: sessionId, userId, status: expectedStatus, leaseToken, leaseUntil: { gt: new Date() } },
                    data: { ...updates, status: nextStatus, leaseToken: null, leaseUntil: null, ...(terminal.has(nextStatus) ? { stateDigest: null, sealedOAuth: null, sealedRequest: null } : {}) },
                });
                return result.count === 1 ? tx.birdIdSession.findFirst({ where: { id: sessionId, userId } }) : null;
            });
        },
    };
}
module.exports = { createSessionStore };
