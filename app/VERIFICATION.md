# Verification — 2026-10-22

Environment: Windows 11 x64, Node 24.20.0, npm 11.5.2, Electron 45.0.0,
Playwright 1.64.1 (Chromium 156 / Firefox 157). Synthetic schedules and
course-only archived upstream rows were used; no UTAR account was accessed.

| Check | Result |
| --- | --- |
| Strict TypeScript | Passed |
| Unit/component tests | 120 passed in 17 files |
| Production web build | Passed; separate worker emitted |
| Production Electron build | Passed; sandbox-compatible CommonJS preload |
| Windows directory packaging | Passed; official installed Electron runtime |
| Chromium production workflows | 12 passed |
| Firefox production workflows | 12 passed |
| Packaged Windows workflows | 6 passed |
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

Independent whole-branch review identified four correctness issues. All four
were reproduced by failing regressions and fixed in one pass; the 98-test suite
and strict types pass. See [REVIEW.md](REVIEW.md) for the findings and evidence.
The initial usage-limit interruption was resolved before the review resumed.
After the fixes, both production builds, Windows packaging and all **16 runtime
tests** passed. The archived td/Mode and spanned-Remark fixture was exercised in
Chromium, Firefox and the native HTML picker, preserving both lecture meetings.

GitHub authorization was verified through the configured Git credential helper.
Credentials were never printed or written to files. The actual
[ruisa87not-star/ttap-web fork](https://github.com/ruisa87not-star/ttap-web)
was created with parent `wongjiahau/ttap-web`; the reviewed implementation
(`4e21198`) was pushed to
[`codex/electron-redesign`](https://github.com/ruisa87not-star/ttap-web/tree/codex/electron-redesign).
The GitHub page confirms the fork/branch, and `git ls-remote` confirms equality
with the local commit. The original `upstream` remote remains intact. No PR or
hosted website was created. User-owned `suggestion/` files remain untracked and
unchanged.

## Timetable workspace polish

The approved blue-and-white workspace was refined with the frontend-design,
ui-ux-pro-max and frontend-ui-engineering skills. The header is 56px high and the
project actions no longer inherit dialog button spacing. Generate/Cancel moved
from the Conditions panel to the shared planner heading. Export is a secondary
action. Course names increased from 12px to 14px, calendar codes from 10px to 12px,
and meeting metadata from 9px to 11px. Time inputs use full rows to keep Windows
AM/PM controls visible.

Before the change, both Chromium and Firefox failed the new viewport and text
regressions: Generate extended below the 720px viewport and course names were
12px. Those checks now pass. The timetable starts at approximately 214px on a
1280×720 web viewport, compared with approximately 328px before the change.
The shared action remains visible in every panel at widths 720, 375 and 320px,
without whole-page horizontal overflow; the calendar itself can scroll.
A compact 1280×720 native window is also covered.

Fresh validation: strict TypeScript, all 98 unit/component tests, production web
build, Windows packaging and all **21 runtime tests** passed. The additional
runtime tests exercise action placement and text readability; the original import,
solver, file exchange, cancellation and security workflows remain in the full run.
Browser inspection also verified the visible keyboard focus ring, generated
classes and narrow-screen layout. Updated screenshots are in
[docs/planner.png](docs/planner.png) (packaged Windows) and
[docs/workbench.png](docs/workbench.png) (1280×720 browser).

## Original workflow guidance and navigation

The app now starts with a three-step local tutorial, with Previous/Next,
Skip tutorial and replay from the header. Import provides the official UTAR
registration link and an expandable manual-slot guide adapted from the original
workflow. Desktop opens the fixed official HTTPS URL through a verified IPC
capability; browser uses a new tab with noopener/noreferrer. No supplied URL is
accepted by the desktop capability. Credentials remain in the external website.

Back uses in-app view history. Import and planner sections remain mounted so
navigation, tutorial replay and sidebar collapse preserve input, selections and
generated candidates. The desktop sidebar can be hidden to expand the timetable.

Six new unit/component regressions failed before implementation, then passed.
An independent review found two additional issues: collapsed desktop state could
blank an active narrow Courses panel after resizing, and the import view lacked
a keyboard focus destination for an existing project. Both were reproduced with
failing tests and fixed. Sidebar collapse now applies only at the desktop
breakpoint; import always has a focusable heading. See [REVIEW.md](REVIEW.md).

Fresh strict types and **104 unit/component tests** passed, both production
builds and Windows packaging succeeded, and all **26 runtime tests** passed
(10 Chromium, 10 Firefox, 6 packaged Windows). Workflows verify tutorial navigation,
manual guidance, the exact registration destination, retained plans, expanded
calendar width, resize behavior and keyboard focus alongside the original tests.
The native browser-launch test captures the URL at the shell boundary; it does
not authenticate. Live UTAR login-page retrieval timed out, and no UTAR account
was used. Actual authentication and current authenticated page contents remain
unverified.

## Screen fitting and embedded UTAR registration

Read-only inspection of the installed TTAP v4.0.0 archive at
`C:\Users\DarylWong\AppData\Local\Programs\TTAP\resources\app.asar` confirmed that
its main window maximizes and hosts the legacy website. Its certificate and
web-security bypasses were identified during inspection; the new implementation
retains default certificate validation and webSecurity/contextIsolation/sandbox.
The installed application and its data were not modified or executed.

The new frame has no document-level scrolling. Import/tutorials and planner
panels scroll internally; calendar sizing uses the remaining panel space.
Initial native window bounds and minimum dimensions are constrained to the
display work area. Chromium and Firefox reproduced the original overflow before
the fix, then passed checks at 1280×720, 1024×600 and 375×667.

Desktop registration now uses a same-window WebContentsView with an in-memory
session, no preload, no Node integration and an exact HTTPS-origin navigation
policy. Verified local IPC handles opening, bounded placement, status, reload and
course extraction. Extraction requires the known timetable URL, rejects password
inputs inside the remote expression, returns only the expected course table,
checks page changes and limits the result to 10 MiB. Browser iframe permission is
limited to the official origin; normal browser restrictions remain in force.

The packaged runtime used synthetic official-origin responses to verify login
rejection, an expired login form at the timetable URL, omission of unrelated
account markup, course preview, isolation settings and native-view placement at
1280×720 and 800×600. View dimensions stayed within the client area below the app
header. Local dirty-close and project exchange checks still pass.

Independent review issues were reproduced and fixed: late capture completion
after navigation, password forms at a valid timetable URL, and unreachable
centered empty-state content in short panels. Full fresh validation passed
strict types, **120 unit/component tests**, both builds, Windows packaging and
all **30 runtime tests** (12 Chromium, 12 Firefox, 6 packaged Windows).

A separate unauthenticated native probe loaded the real official URL with title
`Welcome to Course Registration System`. The native child view was visible and
inside its parent bounds. [docs/registration.png](docs/registration.png) captures
that view's actual content; it is not a composite window screenshot. No account
or CAPTCHA was submitted. Authenticated timetable layouts, service expiry,
popups and pagination remain unverified against the live service.
