const test = require('node:test');
const assert = require('node:assert/strict');
const { syncPatientWeight } = require('../utils/appointmentPatientWeight');

test('new measurement updates encrypted cadastral weight only for latest consultation', async () => {
    let written;
    const tx = { $queryRaw: async () => [], appointment: { findFirst: async () => ({ id: 8 }) }, patient: { update: async args => { written = args; } } };
    await syncPatientWeight(tx, { id: 8, patientId: 3 }, '72,5', value => `encrypted:${value}`);
    assert.deepEqual(written, { where: { id: 3 }, data: { weight: 'encrypted:72.5' } });
    written = undefined;
    await assert.rejects(syncPatientWeight(tx, { id: 7, patientId: 3 }, '70', v => v), /última consulta/);
    assert.equal(written, undefined);
});

test('waits for the patient lock before checking whether a newer consultation saved', async () => {
    let release, checked = false, written = false;
    let latestId = 8;
    const lock = new Promise(resolve => { release = resolve; });
    const tx = {
        $queryRaw: async (sql, patientId) => { assert.match(sql.join('?'), /FOR NO KEY UPDATE/); assert.equal(patientId, 3); await lock; },
        appointment: { findFirst: async () => { checked = true; return { id: latestId }; } },
        patient: { update: async () => { written = true; } },
    };
    const saving = syncPatientWeight(tx, { id: 8, patientId: 3 }, '70', value => value);
    const rejected = assert.rejects(saving, /última consulta/);
    await Promise.resolve();
    assert.equal(checked, false);
    latestId = 9;
    release();
    await rejected;
    assert.equal(written, false);
});

test('omission preserves weight and invalid measurements never reach storage', async () => {
    const tx = {};
    await syncPatientWeight(tx, { id: 8, patientId: 3 }, undefined, v => v);
    for (const value of ['0', '-1', 'abc', '1001', null, '']) {
        await assert.rejects(syncPatientWeight(tx, { id: 8, patientId: 3 }, value, v => v), /peso/i);
    }
});
