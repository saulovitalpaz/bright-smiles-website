const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { createDigitalSigningWorker } = require('../services/digitalSigningWorker');

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
        pdf[7] = pdf[7] === 55 ? 54 : 55;
        assert.equal((await worker({ operation: 'validate', pdfBase64: pdf.toString('base64') })).status, 'INVALID');
        await assert.rejects(worker({ operation: 'inspect', ...fixture.credential, password: crypto.randomBytes(16).toString('hex') }), error => error.status === 422 && !error.message.includes(fixture.credential.password));
        assert.ok(!fixtureStderr.includes(fixture.credential.password));
        assert.ok(!fixtureStderr.includes(fixture.credential.cpf));
    } finally {
        generator.stdin.end('\n');
        await new Promise(resolve => generator.once('close', resolve));
    }
});
