const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');

const loadAuthenticateToken = (jwt) => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const start = source.indexOf('const authenticateToken =');
    const end = source.indexOf('\n};', start) + 3;
    const declaration = source.slice(start, end);

    return new Function('jwt', 'JWT_SECRET', `${declaration}; return authenticateToken;`)(jwt, 'test-secret');
};

test('invalid authentication tokens return 401 so the client can renew the session', () => {
    const authenticateToken = loadAuthenticateToken({
        verify: (_token, _secret, callback) => callback(new Error('jwt expired'))
    });
    let statusCode;
    let nextCalled = false;
    const response = {
        sendStatus: (code) => {
            statusCode = code;
        }
    };

    authenticateToken(
        { cookies: { token: 'expired-token' }, headers: {} },
        response,
        () => { nextCalled = true; }
    );

    assert.equal(statusCode, 401);
    assert.equal(nextCalled, false);
});

test('the current bearer token takes precedence over a stale authentication cookie', () => {
    let verifiedToken;
    const authenticateToken = loadAuthenticateToken({
        verify: (token, _secret, callback) => {
            verifiedToken = token;
            callback(token === 'current-token' ? null : new Error('invalid token'), { id: 1 });
        }
    });
    let statusCode;
    let nextCalled = false;
    const response = {
        sendStatus: (code) => {
            statusCode = code;
        }
    };

    authenticateToken(
        {
            cookies: { token: 'stale-cookie' },
            headers: { authorization: 'Bearer current-token' }
        },
        response,
        () => { nextCalled = true; }
    );

    assert.equal(verifiedToken, 'current-token');
    assert.equal(statusCode, undefined);
    assert.equal(nextCalled, true);
});

test('password utilities hash new passwords and recognize legacy credentials for upgrade', async () => {
    const { hashPassword, verifyPassword } = require('../utils/passwords');
    const password = 'temporary-secret';
    const hashed = await hashPassword(password);

    assert.match(hashed, /^scrypt\$/);
    assert.notEqual(hashed, password);
    assert.deepEqual(await verifyPassword(password, hashed), { valid: true, needsUpgrade: false });
    assert.deepEqual(await verifyPassword('wrong-secret', hashed), { valid: false, needsUpgrade: false });
    assert.deepEqual(await verifyPassword(password, password), { valid: true, needsUpgrade: true });
});

test('user management is admin-only, validated, hashed, and never selects password', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const appointments = fs.readFileSync(
        path.resolve(serverRoot, '..', 'src/pages/AdminAppointments.tsx'),
        'utf8'
    );
    const adminUsers = fs.readFileSync(
        path.resolve(serverRoot, '..', 'src/pages/AdminUsers.tsx'),
        'utf8'
    );
    const usersStart = source.indexOf("app.get('/users'");
    const usersEnd = source.indexOf("app.patch('/users/me'", usersStart);
    const routes = source.slice(usersStart, usersEnd);

    assert.match(routes, /app\.get\('\/users', authenticateToken, authorizeRole\(\['admin'\]\)/);
    assert.match(routes, /app\.post\('\/users', authenticateToken, authorizeRole\(\['admin'\]\)/);
    assert.match(routes, /createUserSchema\.safeParse\(req\.body\)/);
    assert.match(routes, /hashPassword\(result\.data\.password\)/);
    assert.match(routes, /select:\s*SAFE_USER_SELECT/);
    assert.doesNotMatch(routes, /data:\s*req\.body|findMany\(\s*\)/);
    assert.match(source, /app\.get\('\/staff', authenticateToken, authorizeRole\(\['admin', 'dentist'\]\)/);
    assert.match(source, /select:\s*STAFF_USER_SELECT/);
    assert.match(appointments, /fetchClient\("\/staff"\)/);
    assert.match(adminUsers, /type="password"/);
    assert.match(adminUsers, /minLength=\{8\}/);

    const selectStart = source.indexOf('const SAFE_USER_SELECT');
    const selectEnd = source.indexOf('};', selectStart) + 2;
    const safeSelect = source.slice(selectStart, selectEnd);
    assert.doesNotMatch(safeSelect, /password/);
});

test('signature image validation checks both MIME type and file bytes', () => {
    const { isSupportedSignatureImage } = require('../utils/signatureImage');
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    assert.equal(isSupportedSignatureImage(pngHeader, 'image/png'), true);
    assert.equal(isSupportedSignatureImage(Buffer.from('%PDF-1.7'), 'image/png'), false);
    assert.equal(isSupportedSignatureImage(pngHeader, 'application/pdf'), false);
});

test('login verifies hashes and upgrades a successful legacy password', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const loginStart = source.indexOf("app.post('/login'");
    const loginEnd = source.indexOf("app.post('/logout'", loginStart);
    const route = source.slice(loginStart, loginEnd);

    assert.match(route, /verifyPassword\(password, user\.password\)/);
    assert.match(route, /needsUpgrade/);
    assert.match(route, /hashPassword\(password\)/);
    assert.doesNotMatch(route, /user\.password\s*===\s*password/);
});

test('signature upload accepts only public images and settings uses the dedicated endpoint', () => {
    const source = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const settings = fs.readFileSync(
        path.resolve(serverRoot, '..', 'src/pages/AdminSettings.tsx'),
        'utf8'
    );
    const signatureHandler = settings.slice(
        settings.indexOf('const handleSignatureUpload'),
        settings.indexOf('if (isLoading)', settings.indexOf('const handleSignatureUpload'))
    );

    assert.match(source, /const signatureUpload = multer\(/);
    assert.match(source, /SIGNATURE_IMAGE_TYPES\.has\(file\.mimetype\)/);
    assert.match(source, /app\.post\('\/upload\/signature', authenticateToken, signatureUpload\.single\('file'\)/);
    assert.match(source, /scope:\s*'public'/);
    assert.match(signatureHandler, /\/upload\/signature/);
    assert.doesNotMatch(signatureHandler, /formData\.append\("scope", "public"\)/);
});

test('new users accept only the supported role and identity fields', () => {
    const { createUserSchema } = require('../utils/validationSchemas');

    assert.equal(createUserSchema.safeParse({
        name: 'Dra. Karol',
        username: 'karol',
        password: 'temporary-secret',
        cro: 'CRO/MG 12345',
        role: 'dentist'
    }).success, true);
    assert.equal(createUserSchema.safeParse({
        name: 'Dra. Karol',
        username: 'karol',
        password: 'short',
        role: 'admin'
    }).success, false);
    assert.equal(createUserSchema.safeParse({
        name: 'Dra. Karol',
        username: 'karol',
        password: 'temporary-secret',
        role: 'root'
    }).success, false);
});
