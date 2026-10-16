const test = require('node:test');
const assert = require('node:assert/strict');
const { createSessionStore } = require('../services/birdId/sessionStore');

test('only one claimant wins and stale leases cannot finish a stage', async () => {
    let row = { id: 'session', userId: 1, status: 'AUTHORIZED', expiresAt: new Date(Date.now() + 60000), leaseToken: null };
    const prisma = { birdIdSession: {
        updateMany: async ({ where, data }) => {
            if (where.id !== row.id || where.userId !== row.userId || where.status !== row.status || (where.leaseToken !== undefined && where.leaseToken !== row.leaseToken)) return { count: 0 };
            row = { ...row, ...data }; return { count: 1 };
        },
        findFirst: async () => ({ ...row }),
    }, $transaction: async run => run(prisma) };
    const store = createSessionStore(prisma);
    const input = { sessionId: 'session', userId: 1, expectedStatus: 'AUTHORIZED', nextStatus: 'SUBMITTING' };
    const results = await Promise.all([store.claimStage(input), store.claimStage(input)]);
    assert.equal(results.filter(Boolean).length, 1);
    const winner = results.find(Boolean);
    assert.equal(await store.finishSession({ ...input, expectedStatus: 'SUBMITTING', nextStatus: 'SIGNING', leaseToken: 'stale' }), null);
    assert.ok(await store.finishSession({ ...input, expectedStatus: 'SUBMITTING', nextStatus: 'SIGNING', leaseToken: winner.leaseToken }));
    assert.throws(() => store.claimStage({ ...input, expectedStatus: 'COMPLETE' }));
});
