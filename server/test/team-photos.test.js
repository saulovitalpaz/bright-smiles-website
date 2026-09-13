const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { registerTeamPhotoRoutes } = require('../routes/teamPhotos');

test('team photos enforce ownership, validate bytes and publish only photo references', async () => {
    const settings = new Map();
    const uploads = [];
    const removed = [];
    let failSave = false;
    const prisma = {
        user: { findUnique: async ({ where }) => ({ id: where.id, username: where.id === 1 ? 'Dra. Ana Karolina' : where.id === 2 ? 'Dra. Clara Lima' : 'Outra conta', role: 'dentist' }) },
        setting: {
            findUnique: async ({ where }) => settings.has(where.key) ? { key: where.key, value: settings.get(where.key) } : null,
            findMany: async () => [...settings].map(([key, value]) => ({ key, value })),
            upsert: async ({ where, create }) => { if (failSave) throw new Error('test failure'); settings.set(where.key, create.value); }
        }
    };
    const app = express();
    const auth = (req, res, next) => { if (!req.headers['x-user']) return res.sendStatus(401); req.user = { id: Number(req.headers['x-user']), role: req.headers['x-role'] || 'dentist' }; next(); };
    const roles = allowed => (req, res, next) => allowed.includes(req.user.role) ? next() : res.sendStatus(403);
    registerTeamPhotoRoutes(app, { prisma, authenticateToken: auth, authorizeRole: roles,
        uploadAsset: async args => { uploads.push(args); return { reference: `bucket://public/test/${uploads.length}.png` }; },
        deleteAsset: async ref => removed.push(ref)
    });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
    const put = (user, bytes = png, extra = false, role = 'dentist') => {
        const body = new FormData(); body.append('file', new Blob([bytes], { type: 'image/png' }), 'portrait.png');
        if (extra) body.append('userId', '2');
        return fetch(`${base}/team/photo/me`, { method: 'PUT', headers: user ? { 'x-user': String(user), 'x-role': role } : {}, body });
    };
    try {
        assert.equal((await fetch(`${base}/team/photo/me`)).status, 401);
        assert.equal((await put(null)).status, 401);
        assert.equal((await put(1, png, false, 'manager')).status, 403);
        assert.equal((await put(3)).status, 403);
        assert.equal((await put(3, png, false, 'admin')).status, 403);
        assert.equal((await put(1, png, true)).status, 400);
        assert.equal((await put(1, Buffer.from('not an image'))).status, 400);
        assert.equal((await put(1, Buffer.alloc(5 * 1024 * 1024 + 1))).status, 400);
        assert.equal(uploads.length, 0);
        assert.equal((await put(1)).status, 200);
        assert.equal((await put(2)).status, 200);
        assert.deepEqual(uploads[0].body, png);
        assert.equal(uploads[0].scope, 'public');
        assert.equal(uploads[0].ownerId, 1);
        const publicPhotos = await (await fetch(`${base}/team/photos`)).json();
        assert.deepEqual(Object.keys(publicPhotos).sort(), ['ana-karolina', 'clara-lima']);
        assert.equal(publicPhotos['ana-karolina'], 'bucket://public/test/1.png');
        failSave = true;
        assert.equal((await put(1)).status, 500);
        assert.equal(settings.get('team_photo_ana-karolina'), 'bucket://public/test/1.png');
        assert.deepEqual(removed, ['bucket://public/test/3.png']);
    } finally { await new Promise(resolve => server.close(resolve)); }
});
