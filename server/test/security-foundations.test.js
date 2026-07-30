const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');

const expectsGuard = (method, route, roles) => {
    const expression = new RegExp(
        `app\\.${method}\\('${route.replace(/[/?]/g, '\\$&')}', authenticateToken, authorizeRole\\(\\[${roles.map((role) => `'${role}'`).join(', ')}\\]\\)`
    );
    assert.match(source, expression);
};

test('clinical, operational and administrative endpoints require least-privilege roles', () => {
    expectsGuard('get', '/appointments', ['admin', 'dentist']);
    expectsGuard('get', '/appointments/:id', ['admin', 'dentist']);
    expectsGuard('post', '/appointments', ['admin', 'dentist']);
    expectsGuard('put', '/appointments/:id', ['admin', 'dentist']);
    expectsGuard('delete', '/appointments/:id', ['admin', 'dentist']);
    expectsGuard('get', '/patients/:cpf', ['admin', 'dentist']);
    expectsGuard('get', '/patients', ['admin', 'dentist']);
    expectsGuard('post', '/prescriptions', ['admin', 'dentist']);
    expectsGuard('get', '/prescriptions/patient/:patientId', ['admin', 'dentist']);
    expectsGuard('delete', '/prescriptions/:id', ['admin', 'dentist']);
    expectsGuard('get', '/dashboard/stats', ['admin', 'manager']);
    expectsGuard('get', '/document-templates', ['admin', 'dentist']);
    expectsGuard('post', '/document-templates', ['admin', 'dentist']);
    expectsGuard('delete', '/document-templates/:id', ['admin', 'dentist']);
    expectsGuard('get', '/patient-documents/:patientId', ['admin', 'dentist']);
    expectsGuard('post', '/patient-documents', ['admin', 'dentist']);
    expectsGuard('put', '/patient-documents/:id', ['admin', 'dentist']);
    expectsGuard('delete', '/patient-documents/:id', ['admin', 'dentist']);
    expectsGuard('get', '/analytics/stats', ['admin', 'manager']);
    expectsGuard('get', '/leads', ['admin', 'manager']);
    expectsGuard('put', '/leads/:id', ['admin', 'manager']);
    expectsGuard('delete', '/leads/:id', ['admin', 'manager']);
});

test('content mutation endpoints are admin-only and public testimonials are approved-only', () => {
    for (const [method, route] of [
        ['post', '/posts'], ['put', '/posts/:id'], ['delete', '/posts/:id'],
        ['post', '/treatments'], ['put', '/treatments/:id'], ['delete', '/treatments/:id'],
        ['post', '/treatments/:id/results'], ['delete', '/treatment-results/:id'],
        ['post', '/stories'], ['delete', '/stories/:id'],
        ['put', '/testimonials/:id'], ['delete', '/testimonials/:id'],
    ]) expectsGuard(method, route, ['admin']);

    const testimonialsStart = source.indexOf("app.get('/testimonials'");
    const testimonialsEnd = source.indexOf("app.get('/testimonials/:id'", testimonialsStart);
    const route = source.slice(testimonialsStart, testimonialsEnd);
    assert.match(route, /\{ approved: true \}/);
});

test('production CORS does not grant browser credentials to arbitrary Railway domains', () => {
    assert.doesNotMatch(source, /https:\\\/\\\/\.\*\\\.up\\\.railway\\\.app/);
});

test('audit logging records outcome metadata without request bodies or credentials', () => {
    const auditSource = fs.readFileSync(path.join(__dirname, '..', 'middleware', 'auditLogger.js'), 'utf8');
    assert.doesNotMatch(auditSource, /JSON\.stringify\(req\.body\)/);
    assert.match(auditSource, /res\.once\('finish'/);
    assert.match(auditSource, /statusCode/);
});

test('server foundations fail closed in production and set API security headers', () => {
    assert.match(source, /app\.disable\('x-powered-by'\)/);
    assert.match(source, /Content-Security-Policy/);
    assert.match(source, /Strict-Transport-Security/);
    assert.match(source, /Invalid server security configuration\./);
    assert.doesNotMatch(source, /JWT_SECRET \|\| 'super_secret/);
    assert.match(source, /express\.json\(\{ limit: '1mb' \}\)/);
    assert.match(source, /process\.env\.MAINTENANCE_MODE === 'true'/);
    assert.match(source, /req\.path !== '\/health'/);
    assert.match(source, /status\(503\)\.json\(\{ error: 'Service temporarily unavailable\.' \}\)/);
});

test('browser authentication uses an HttpOnly cookie instead of returning a reusable token', () => {
    const loginStart = source.indexOf("app.post('/login'");
    const loginEnd = source.indexOf("app.post('/logout'", loginStart);
    const loginRoute = source.slice(loginStart, loginEnd);
    assert.match(loginRoute, /httpOnly:\s*true/);
    assert.match(loginRoute, /sameSite:\s*'lax'/);
    assert.doesNotMatch(loginRoute, /res\.json\(\{ \.\.\.toSafeUser\(user\), token \}\)/);
    assert.match(source, /app\.get\('\/auth\/session', authenticateToken/);

    const apiSource = fs.readFileSync(path.resolve(__dirname, '..', '..', 'src', 'lib', 'api.ts'), 'utf8');
    assert.doesNotMatch(apiSource, /admin_token/);
    assert.match(apiSource, /credentials:\s*'include'/);
});

test('public testimonial submission cannot self-approve or mass-assign moderation fields', () => {
    const start = source.indexOf("app.post('/testimonials'");
    const end = source.indexOf("app.get('/testimonials'", start);
    const route = source.slice(start, end);
    assert.match(route, /approved:\s*false/);
    assert.doesNotMatch(route, /data:\s*req\.body/);
});
