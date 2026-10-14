const { spawn } = require('node:child_process');
const path = require('node:path');
const WORKER_ERRORS = {
    CERTIFICATE_FILE_INVALID: 'O arquivo do certificado é inválido.',
    INVALID_CPF: 'Informe um CPF válido.',
    INVALID_CERTIFICATE: 'Certificado ou senha do certificado inválidos.',
    CPF_MISMATCH: 'O CPF informado não corresponde ao certificado.',
    CERTIFICATE_EXPIRED: 'O certificado está fora do período de validade.',
    CERTIFICATE_REVOKED: 'O certificado foi revogado. Envie um certificado válido.',
    CERTIFICATE_IDENTITY_MISSING: 'O certificado não contém uma identidade eCPF válida.',
    CERTIFICATE_UNTRUSTED: 'Não foi possível confirmar a cadeia e a revogação do certificado.',
    SIGNING_NOT_CONFIGURED: 'O serviço de assinatura precisa ser configurado.',
    INVALID_PDF: 'O PDF enviado é inválido.',
    INVALID_UPLOAD: 'O arquivo enviado é inválido ou excede o limite.',
    VALIDATION_FAILED: 'Não foi possível validar a assinatura do documento.'
};

function workerEnvironment(env) {
    const names = ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'LANG', 'SIGNING_TRUST_ROOTS_PATH', 'SIGNING_CA_BUNDLE_PATH', 'SIGNING_ALLOWED_HOSTS', 'SIGNING_CRL_PATH'];
    return Object.fromEntries(names.filter(name => typeof env[name] === 'string').map(name => [name, env[name]]));
}

function createDigitalSigningWorker(env = process.env) {
    let active = 0;
    return async function run(request) {
        if (active >= 2) throw Object.assign(new Error('Signing busy.'), { status: 503 });
        active++;
        try {
            return await new Promise((resolve, reject) => {
                const child = spawn(env.SIGNING_PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'py' : 'python3'), [path.join(__dirname, '../signing/worker.py')], {
                    env: workerEnvironment(env), stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, shell: false
                });
                let output = ''; let size = 0; let stderrSize = 0; let settled = false;
                const finish = (error, result) => { if (settled) return; settled = true; clearTimeout(timer); if (error) { child.kill(); reject(error); } else resolve(result); };
                const failure = () => finish(Object.assign(new Error('Signing service unavailable.'), { status: 503 }));
                const timer = setTimeout(failure, 90000);
                child.on('error', failure); child.stdin.on('error', failure);
                child.stdout.on('data', chunk => { size += chunk.length; if (size > 20 * 1024 * 1024) return failure(); output += chunk.toString('utf8'); });
                child.stderr.on('data', chunk => { stderrSize += chunk.length; if (stderrSize > 8192) failure(); });
                child.on('close', code => {
                    if (code !== 0) return failure();
                    try {
                        const result = JSON.parse(output);
                        if (result.error) {
                            const code = Object.hasOwn(WORKER_ERRORS, result.error.code) ? result.error.code : 'SIGNING_REJECTED';
                            return finish(Object.assign(new Error(WORKER_ERRORS[code] || 'Não foi possível validar o certificado ou documento.'), { status: code === 'SIGNING_NOT_CONFIGURED' ? 503 : 422, code }));
                        }
                        finish(null, result);
                    } catch { failure(); }
                });
                const payload = JSON.stringify(request);
                if (Buffer.byteLength(payload) > 18 * 1024 * 1024) return failure();
                child.stdin.end(payload);
            });
        } finally { active--; }
    };
}

module.exports = { workerEnvironment, createDigitalSigningWorker };
