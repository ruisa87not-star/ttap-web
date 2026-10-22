# Verification — 2026-10-22

Environment: Windows 11 x64, Node 24.20.0, npm 11.5.2, Electron 45.0.0,
Playwright 1.64.1 (Chromium 156 / Firefox 157). Synthetic schedules and
course-only archived upstream rows were used; no UTAR account was accessed.

| Check | Result |
| --- | --- |
| Strict TypeScript | Passed |
| Unit/component tests | 91 passed in 14 files |
| Production web build | Passed; separate worker emitted |
| Production Electron build | Passed; sandbox-compatible CommonJS preload |
| Windows directory packaging | Passed; official installed Electron runtime |
| Chromium production workflows | 5 passed |
| Firefox production workflows | 5 passed |
| Packaged Windows workflows | 3 passed |
| Browser bundle boundary | No Electron IPC, Node imports or global require |
| Source whitespace check | Passed |

Runtime checks covered demo import, no preselection, fixed classes, unavailable
times, candidate/week switching, JSON downloads and native saves, web ↔ desktop
project exchange with canonical candidate equality, invalid inputs, zero results,
cancel then immediately recalculate, narrow-screen keyboard use, and untrusted
HTML script/image/frame blocking with no resource requests. Packaged protocol
requests outside the renderer asset allowlist return 404. Actual window
preferences were checked: sandbox/contextIsolation/webSecurity enabled,
nodeIntegration disabled; renderer has no require or process globals.

Atomic native write tests simulate write/rename failures and check that the
original file remains unchanged and temporary files are removed. IPC tests
reject other renderers, subframes and unexpected URLs. Cancelled saves retain
dirty state and prevent close. Edits during save remain dirty.

The installed Firefox runtime failed to load its mozglue assembly from this
host's shared cache, even after reinstalling. The identical official runtime
loads from the project directory; `install:browsers` and e2e scripts therefore
use project-local browsers. No binary patches or security settings were changed.
The packaging tool's archive-directory rename also failed repeatedly; the
documented `electronDist` option successfully reuses the official installed copy.

Not verified: current real UTAR HTML layouts, mixed-term metadata, legacy root
application runtime, installer/signing/distribution on another Windows machine,
or hosted deployment. The npm production advisory audit endpoint returned
`socket hang up`; no claim of a clean dependency security audit is made.

Independent review and any fixes are recorded below when complete.
