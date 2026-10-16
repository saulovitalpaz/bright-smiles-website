const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { createDigitalSigningWorker } = require('../services/digitalSigningWorker');
const express = require('express');
const { registerDigitalSigningRoutes } = require('../routes/digitalSigning');
const { createCertificateVault, validPkcs12 } = require('../utils/certificateVault');
const { hashPassword } = require('../utils/passwords');

const executable = process.env.SIGNING_TEST_PYTHON;
test('isolated worker signs a transient synthetic identity and rejects PDF tampering', { skip: !executable || !fs.existsSync(executable) }, async () => {
    const script = [
        'import json, os, sys',
        'from test_worker import SigningTests',
        'SigningTests.setUpClass()',
        'fixture = SigningTests()',
        'fixture.setUp()',
        'try:',
        ' credential, _ = fixture.credential()',
        ' environment = {key:value for key,value in os.environ.items() if key.startswith("SIGNING_")}',
        ' print(json.dumps({"credential":credential,"environment":environment}), flush=True)',
        ' sys.stdin.readline()',
        'finally:',
        ' fixture.doCleanups()'
    ].join('\n');
    const generator = spawn(executable, ['-c', script], { cwd: path.resolve(__dirname, '../signing'), windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let fixtureOutput = ''; let fixtureStderr = '';
    const fixture = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { generator.kill(); reject(new Error('Fixture timed out.')); }, 15000);
        generator.on('error', () => { clearTimeout(timer); reject(new Error('Fixture runtime unavailable.')); });
        generator.stderr.on('data', chunk => { fixtureStderr += chunk.toString(); });
        generator.stdout.on('data', chunk => {
            fixtureOutput += chunk.toString();
            if (!fixtureOutput.includes('\n')) return;
            clearTimeout(timer);
            try { resolve(JSON.parse(fixtureOutput.trim())); } catch { reject(new Error('Invalid transient fixture.')); }
        });
        generator.on('close', () => { clearTimeout(timer); if (!fixtureOutput) reject(new Error('Fixture failed.')); });
    });
    try {
        const worker = createDigitalSigningWorker({ ...process.env, ...fixture.environment, SIGNING_PYTHON_EXECUTABLE: executable });
        assert.equal((await worker({ operation: 'capabilities' })).available, true);
        const inspected = await worker({ operation: 'inspect', ...fixture.credential });
        assert.equal(inspected.status, 'VALID');
        assert.ok(!JSON.stringify(inspected).includes(fixture.credential.cpf));
        const result = await worker({ operation: 'sign', ...fixture.credential, document: { patientName: 'Transient fixture', patientCpf: fixture.credential.cpf, professionalName: 'Profissional de teste', professionalCro: 'CRO fixture', content: 'Synthetic signing smoke test.', date: new Date().toISOString(), verificationUrl: `https://example.invalid/validar-receita#token=${crypto.randomBytes(32).toString('base64url')}` } });
        assert.equal(result.validation.status, 'VALID');
        const pdf = Buffer.from(result.pdfBase64, 'base64');
        assert.equal(crypto.createHash('sha256').update(pdf).digest('hex'), result.hash);
        assert.equal((await worker({ operation: 'validate', pdfBase64: result.pdfBase64 })).status, 'VALID');
        // Exercise the public retrieval path with the actual signed bytes.
        const accessToken = crypto.randomBytes(32).toString('base64url');
        const accessDigest = crypto.createHash('sha256').update(accessToken).digest('hex');
        const publicApp = express(); publicApp.use(express.json());
        registerDigitalSigningRoutes(publicApp, {
            prisma: { digitalPrescription: { findUnique: async ({ where }) => where.tokenDigest === accessDigest ? { signatureStatus: 'VALID', hash: result.hash, storageKey: 'synthetic-private-object' } : null } },
            authenticateToken: (_req, res) => res.sendStatus(401),
            storage: { readDigitalPrescription: async key => { assert.equal(key, 'synthetic-private-object'); return pdf; } },
        });
        const publicServer = publicApp.listen(0, '127.0.0.1');
        await new Promise(resolve => publicServer.once('listening', resolve));
        try {
            const endpoint = 'http://127.0.0.1:' + publicServer.address().port + '/prescription-validation';
            const options = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: accessToken }) };
            const lookup = await fetch(endpoint + '/token', options);
            assert.equal((await lookup.json()).fileAvailable, true);
            const download = await fetch(endpoint + '/file', options);
            assert.equal(download.status, 200);
            const retrieved = Buffer.from(await download.arrayBuffer());
            assert.deepEqual(retrieved, pdf);
            assert.equal((await worker({ operation: 'validate', pdfBase64: retrieved.toString('base64') })).status, 'VALID');
        } finally { await new Promise(resolve => publicServer.close(resolve)); }
        pdf[7] = pdf[7] === 55 ? 54 : 55;
        assert.equal((await worker({ operation: 'validate', pdfBase64: pdf.toString('base64') })).status, 'INVALID');
        await assert.rejects(worker({ operation: 'inspect', ...fixture.credential, password: crypto.randomBytes(16).toString('hex') }), error => error.status === 422 && !error.message.includes(fixture.credential.password));
        assert.ok(!fixtureStderr.includes(fixture.credential.password));
        assert.ok(!fixtureStderr.includes(fixture.credential.cpf));

        // Reproduce the real upload format through multipart, reauthentication,
        // the isolated worker and the encrypted vault, without a manual CPF.
        const der = Buffer.from(fixture.credential.pfxBase64, 'base64');
        const headerSize = der[1] & 0x80 ? 2 + (der[1] & 0x7f) : 2;
        const ber = Buffer.concat([Buffer.from([0x30, 0x80]), der.subarray(headerSize), Buffer.from([0, 0])]);
        assert.equal(validPkcs12(ber), true);
        const accountPassword = crypto.randomBytes(20).toString('hex');
        const user = { id: 1, role: 'dentist', name: 'Profissional de teste', cro: 'CRO fixture', password: await hashPassword(accountPassword) };
        const vault = createCertificateVault({ DIGITAL_CERTIFICATE_KEY: crypto.randomBytes(32).toString('base64') });
        let saved;
        const prisma = {
            user: { findUnique: async () => user },
            digitalCertificate: { upsert: async ({ create }) => { saved = create; return saved; } },
            $queryRaw: async () => [user],
            $transaction: async run => run(prisma),
        };
        const app = express(); app.use(express.json());
        registerDigitalSigningRoutes(app, { prisma, vault, worker, storage: { isPrivateDocumentStorageConfigured: () => true }, authenticateToken: (req, _res, next) => { req.user = { id: user.id }; next(); } });
        const server = app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.once('listening', resolve));
        try {
            const body = new FormData();
            body.set('certificate', new Blob([ber]), 'synthetic-ber.pfx');
            body.set('password', fixture.credential.password);
            body.set('accountPassword', accountPassword);
            const response = await fetch(`http://127.0.0.1:${server.address().port}/digital-signatures/certificate`, { method: 'POST', body });
            assert.equal(response.status, 200);
            const value = await response.json();
            assert.equal(value.certificate.status, 'ACTIVE');
            assert.ok(!JSON.stringify(value).includes(fixture.credential.cpf));
            assert.ok(!JSON.stringify(value).includes(fixture.credential.password));
            const restored = vault.open(user.id, saved.sealedCredentials);
            assert.equal(Object.hasOwn(restored, 'cpf'), false);
            assert.equal((await worker({ operation: 'inspect', ...restored })).status, 'VALID');
            const signed = await worker({ operation: 'sign', ...restored, document: { patientName: 'Transient fixture', patientCpf: fixture.credential.cpf, professionalName: user.name, professionalCro: user.cro, content: 'Synthetic BER signing smoke test.', date: new Date().toISOString(), verificationUrl: 'https://example.invalid/validar-receita#token=synthetic' } });
            assert.equal(signed.validation.status, 'VALID');
        } finally { ber.fill(0); der.fill(0); await new Promise(resolve => server.close(resolve)); }
    } finally {
        generator.stdin.end('\n');
        await new Promise(resolve => generator.once('close', resolve));
    }
});
