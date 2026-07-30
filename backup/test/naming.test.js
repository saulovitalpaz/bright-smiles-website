import test from 'node:test';
import assert from 'node:assert/strict';
import { backupKeys } from '../src/naming.js';

test('places every backup under a UTC daily prefix', () => {
  const keys = backupKeys(new Date('2026-07-30T06:00:00.123Z'), 'fixture');

  assert.equal(keys.dailyKey, 'daily/2026/07/postgres-20260730T060000123Z-fixture.dump.enc');
  assert.equal(keys.monthlyKey, null);
});

test('adds a monthly copy on the first UTC day', () => {
  const keys = backupKeys(new Date('2026-08-01T06:00:00.000Z'), 'fixture');

  assert.equal(keys.monthlyKey, 'monthly/2026/postgres-20260801T060000000Z-fixture.dump.enc');
});
