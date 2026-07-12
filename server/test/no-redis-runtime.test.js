const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');

test('API runtime has no Redis reminder dependency', () => {
    const indexSource = fs.readFileSync(path.join(serverRoot, 'index.js'), 'utf8');
    const packageJson = JSON.parse(
        fs.readFileSync(path.join(serverRoot, 'package.json'), 'utf8')
    );

    assert.doesNotMatch(indexSource, /whatsappWorker|scheduleReminders|notificationQueue/);
    assert.equal(packageJson.dependencies.bullmq, undefined);
    assert.equal(packageJson.dependencies.ioredis, undefined);
    assert.equal(fs.existsSync(path.join(serverRoot, 'workers', 'whatsappWorker.js')), false);
});
