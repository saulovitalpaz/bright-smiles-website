const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(serverRoot, '..');

test('leads persist an optional professional assignment', () => {
    const schema = fs.readFileSync(path.join(serverRoot, 'prisma/schema.prisma'), 'utf8');
    const leads = fs.readFileSync(path.join(serverRoot, 'routes/leads.js'), 'utf8');

    assert.match(schema, /model Lead[\s\S]*professional\s+String\?/);
    assert.match(leads, /scheduledAt/);
    assert.match(leads, /professional/);
});

test('calendar helper exposes shared entries and local week calculations', () => {
    const helper = fs.readFileSync(path.join(repoRoot, 'src/lib/calendar.ts'), 'utf8');
    const calendar = fs.readFileSync(path.join(repoRoot, 'src/components/admin/appointments/CalendarView.tsx'), 'utf8');

    assert.match(helper, /export interface CalendarEntry/);
    assert.match(helper, /export const buildCalendarEntries/);
    assert.match(helper, /export const getWeekDays/);
    assert.match(helper, /export const getDropDateTime/);
    assert.match(helper, /export const professionalColor/);
    assert.match(calendar, /onEventDrop/);
    assert.match(calendar, /onEventOpen/);
    assert.match(calendar, /data-drop-minutes/);
});
