Task 4 Navigation Report
========================

Summary
-------
- Added the protected standalone route `/admin/calendario` in `src/App.tsx`.
- Updated the dashboard shortcut card to navigate directly to `/admin/calendario`.
- Reorganized the admin sidebar so `Atendimentos` contains `Consultas`, `Pacientes`, `Prescrição` and `Termos e Documentos`, while `Configurações` contains `Geral` and `Equipe`.
- Kept manager route boundaries unchanged by leaving `MANAGER_ALLOWED_ROUTES` without calendar access.

Files Changed
-------------
- `src/App.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/components/admin/navigation-contract.test.tsx`

Verification
------------
- RED: `npx vitest run src/components/admin/navigation-contract.test.tsx`
  - failed before implementation because `/admin/calendario` and the new dashboard target did not exist.
- GREEN: `npx vitest run src/components/admin/navigation-contract.test.tsx`
- `npm run lint`

Notes
-----
- `src/hooks/useAuth.tsx` did not require code changes because the existing `MANAGER_ALLOWED_ROUTES` already preserved the intended restriction for the new clinical calendar route.
