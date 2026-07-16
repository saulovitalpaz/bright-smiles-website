const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');

test('User stores an optional professional signature URL', () => {
    const prismaSchema = fs.readFileSync(path.join(serverRoot, 'prisma/schema.prisma'), 'utf8');
    const userModel = prismaSchema.slice(
        prismaSchema.indexOf('model User {'),
        prismaSchema.indexOf('model Post {')
    );

    assert.match(userModel, /signatureUrl\s+String\?/);
});

test('current-user profile validation accepts optional nullable fields and rejects empty names', () => {
    const validation = require('../utils/validationSchemas');
    const schema = validation.updateCurrentUserSchema;

    assert.equal(typeof schema?.safeParse, 'function');
    assert.equal(schema.safeParse({}).success, true);
    assert.equal(schema.safeParse({ name: 'Dra. Karol', cro: null, signatureUrl: null }).success, true);
    assert.equal(schema.safeParse({ cro: 'CRO-SP 12345', signatureUrl: '/assets/signature.png' }).success, true);
    assert.equal(schema.safeParse({ name: '' }).success, false);
    assert.equal(schema.safeParse({ name: '   ' }).success, false);
});

test('current-user profile validation rejects credential and authorization fields', () => {
    const { updateCurrentUserSchema } = require('../utils/validationSchemas');

    for (const forbiddenField of ['role', 'username', 'password']) {
        assert.equal(
            updateCurrentUserSchema.safeParse({ [forbiddenField]: 'not-allowed' }).success,
            false,
            `expected ${forbiddenField} to be rejected`
        );
    }
});

test('PATCH /users/me is authenticated, updates only the token user, and omits password', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const routeStart = source.indexOf("app.patch('/users/me'");

    assert.notEqual(routeStart, -1, 'expected PATCH /users/me to be registered');

    const routeEnd = source.indexOf("app.post('/login'", routeStart);
    const route = source.slice(routeStart, routeEnd);

    assert.match(source, /updateCurrentUserSchema/);
    assert.match(route, /app\.patch\(['"]\/users\/me['"],\s*authenticateToken/);
    assert.match(route, /updateCurrentUserSchema\.safeParse\(req\.body\)/);
    assert.match(route, /where:\s*\{\s*id:\s*req\.user\.id\s*\}/);
    assert.match(route, /data:\s*result\.data/);
    assert.match(route, /select:\s*\{[\s\S]*signatureUrl:\s*true/);
    assert.doesNotMatch(route, /req\.(?:params|query)|req\.body\.(?:id|role|username|password)/);
    assert.doesNotMatch(route, /password/);
});
