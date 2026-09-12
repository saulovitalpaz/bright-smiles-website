## Task 4: Registrar rotas e reorganizar o sidebar

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/admin/AdminLayout.tsx`
- Modify: `src/pages/AdminDashboard.tsx`
- Modify: `src/hooks/useAuth.tsx`
- Create: `src/components/admin/navigation-contract.test.tsx`

**Interfaces:**
- Registers `/admin/calendario` with the same role protection as `/admin/consultas`.
- Dashboard calendar shortcut navigates to `/admin/calendario`.
- Sidebar hierarchy is `Atendimentos > Consultas, Pacientes, Prescrição, Termos & Documentos` and `Configurações > Geral, Equipe`.

- [ ] **Step 1: Write failing navigation contract tests**

Assert source-level contracts in a small test that reads the four files with `fs.readFileSync`:

```ts
expect(appSource).toMatch(/path="\/admin\/calendario"/);
expect(dashboardSource).toContain("navigate('/admin/calendario')");
expect(layoutSource).toMatch(/label:\s*["']Atendimentos["']/);
expect(layoutSource).toMatch(/label:\s*["']Pacientes["'][\s\S]*href:\s*["']\/admin\/pacientes["']/);
expect(layoutSource).toMatch(/label:\s*["']Configurações["']/);
expect(layoutSource).toMatch(/label:\s*["']Equipe["'][\s\S]*href:\s*["']\/admin\/users["']/);
```

Also assert no `navigate('/admin/consultas?view=calendar')` remains in the dashboard source and that `MANAGER_ALLOWED_ROUTES` is not expanded with clinical calendar access.

- [ ] **Step 2: Run focused test and confirm RED**

Run:

```powershell
npx vitest run src/components/admin/navigation-contract.test.tsx
```

Expected: FAIL because the route, labels and dashboard target still use the old structure.

- [ ] **Step 3: Register the calendar route and update navigation**

Import `AdminCalendar` in `App.tsx` and add:

```tsx
<Route path="/admin/calendario" element={<RoleProtectedRoute><AdminCalendar /></RoleProtectedRoute>} />
```

In `AdminLayout`, make `Atendimentos` the parent with the existing consultation/prescription/document links plus patients, make `Calendário` a top-level item, and make `Configurações` the parent of `Geral` and `Equipe`. Preserve `adminOnly` flags and active route matching for detail paths.

- [ ] **Step 4: Update dashboard shortcut and keep role boundaries**

Change the card shortcut to `navigate('/admin/calendario')`. Do not add the calendar route to `MANAGER_ALLOWED_ROUTES`; the existing `RoleProtectedRoute` must continue redirecting managers away from clinical routes.

- [ ] **Step 5: Run focused test and confirm GREEN**

Run:

```powershell
npx vitest run src/components/admin/navigation-contract.test.tsx
```

Expected: PASS with the exact route and hierarchy assertions.

- [ ] **Step 6: Commit**

```powershell
git add src/App.tsx src/components/admin/AdminLayout.tsx src/pages/AdminDashboard.tsx src/hooks/useAuth.tsx src/components/admin/navigation-contract.test.tsx
git commit -m "feat: add standalone calendar and nested admin navigation"
```

---

