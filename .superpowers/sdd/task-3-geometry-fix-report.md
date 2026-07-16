# Task 3 geometry fix report

- Changed only `src/components/admin/attendance/odontogram/odontogramGeometry.ts`.
- Premolar uses `14_occl.svg`: `background-cusp`, `subcaries-buccal`, `subcaries-mesial`, `subcaries-lingual`, `subcaries-distal`, `subcaries-occlusal`, and every child path of `fissure`.
- Molar uses the equivalent IDs from `16_occl.svg`.
- Incisor and canine keep their existing organic outlines; every occlusal face now has asymmetric C-curve geometry.
- Verification passed: source-path mapping, all FaceKeys, unchanged frontal geometry.
- Focused lint passed: `npm exec -- eslint src/components/admin/attendance/odontogram/odontogramGeometry.ts`.

Concern: the shared worktree has concurrent changes in `AnatomicalTooth.tsx` and its test, plus unrelated untracked SDD/docs files; none were modified or staged by this task.
