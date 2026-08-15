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

test('calendar UI exposes confirmed schedule moves and professional details', () => {
    const calendarPage = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminCalendar.tsx'), 'utf8');
    const calendar = fs.readFileSync(path.join(repoRoot, 'src/components/admin/appointments/CalendarView.tsx'), 'utf8');

    assert.match(calendarPage, /pendingDrop/);
    assert.match(calendarPage, /scheduledAt/);
    assert.match(calendarPage, /professional/);
    assert.match(calendarPage, /\/appointments\//);
    assert.match(calendarPage, /\/leads\//);
    assert.match(calendar, /draggable/);
    assert.match(calendar, /onDrop/);
});

test('calendar moves wait for confirmation and professional changes use separate updates', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminCalendar.tsx'), 'utf8');
    assert.match(source, /setPendingDrop\(/);
    assert.match(source, /scheduledAt/);
    assert.match(source, /professional/);
    assert.match(source, /Confirmar/);
    assert.match(source, /Cancelar/);
    assert.match(source, /buildCalendarEntries/);
});

test('appointments require a professional while leads can clear one', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'src/pages/AdminCalendar.tsx'), 'utf8');

    assert.match(source, /const professional = professionalDraft\.trim\(\)/);
    assert.match(source, /pendingDetails\.kind === "appointment" && !professional/);
    assert.match(source, /pendingDetails\.kind === "lead" && \(/);
    assert.match(source, /professional:\s*professional \|\| null/);
});

test('calendar expands its 30-minute slots for entries outside baseline hours', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'src/components/admin/appointments/CalendarView.tsx'), 'utf8');

    assert.match(source, /const getVisibleSlotMinutes/);
    assert.match(source, /Math\.min\(8 \* 60/);
    assert.match(source, /Math\.max\(20 \* 60/);
    assert.match(source, /getVisibleSlotMinutes\(entries, days\)/);
    assert.match(source, /getDropDateTime\(day, minutes\)/);
});

test('visible fractional-hour slots remain keyboard and pointer interactive', () => {
    const source = fs.readFileSync(path.join(repoRoot, 'src/components/admin/appointments/CalendarView.tsx'), 'utf8');
    const branchStart = source.indexOf("if (viewMode === 'week' && isFractional && !hasEntriesInRow)");
    const branchEnd = source.indexOf('\n                            return (', branchStart);
    const fractionalBranch = source.slice(branchStart, branchEnd);

    assert.match(fractionalBranch, /role=\{onEventCreate \? "button" : undefined\}/);
    assert.match(fractionalBranch, /tabIndex=\{onEventCreate \? 0 : undefined\}/);
    assert.match(fractionalBranch, /onClick=/);
    assert.match(fractionalBranch, /onKeyDown=/);
});
