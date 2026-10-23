# Verification — latest revision 2026-10-23

## Compact browser registration login — 2026-10-23

The reported difference was confirmed: Electron inserts presentation CSS into
its isolated native view; the browser used a normal scrolling cross-origin
iframe showing UTAR's banner and announcements. A new regression failed on the
missing compact/full-view behavior before implementation. The web iframe now
uses an outer visual crop measured from the actual public login layout, leaving
the official document, form, scripts, CAPTCHA and HTTPS submission intact.

Fresh checks passed strict TypeScript, **145 unit/component tests in 25 files**,
production web/Electron builds and **38 browser workflows** (19 Chromium,
19 Firefox). An initial simultaneous unit/build run timed out in two existing
App tests; the subsequent complete check passed without timeout or assertion
changes. Browser geometry checks caught a 2px announcement edge in the initial
crop; reducing its height resolved that issue in both engines.

Runtime checks verify banner/footer exclusion, form/clock containment at
1280×720 and 1024×600, no vertical page movement from wheel input in compact
mode, input preservation when toggling the same iframe, automatic full view for
the next document/error response, and compact reset on Reload. At 375px and
320px, the app stays within the viewport and the real password field remains
reachable through horizontal panning. Full view is always available for content
outside the crop, including keyboard-accessible off-crop links.

The live unauthenticated UTAR page was loaded in a separate browser tab and then
through the production web app. Visual inspection confirmed title, login form,
CAPTCHA and server clock without banner/announcements. Actual capture:
[docs/web-registration.png](docs/web-registration.png). No credentials or CAPTCHA
response were submitted to UTAR; automated form navigation uses synthetic data
and a local intercepted fixture response. The crop depends on UTAR's current
public layout and cannot inspect cross-origin login messages; the complete-page
and official-page fallbacks remain available.

No dependencies or native registration logic changed. The Electron build passed;
this web-only fix did not repackage or replace the running Windows application.
User-owned root reference PNGs and suggestion/ remain untouched and excluded.

## Clear, fixed sidebar control and fork logo — Planner 0.5.0

Fresh checks passed strict TypeScript, **144 unit/component tests in 25 files**,
production web and Electron builds, Windows packaging, and **44 runtime tests**
(18 Chromium, 18 Firefox, 8 packaged Windows). The executable's product/file
version is 0.5.0; the native runtime confirms version 0.5.0 and maximized startup.
The launcher freshness check reports Current. Running the root Start-TTAP.cmd
opened a live process titled TTAP Planner 0.5.0 from this repository's release
folder.

The new regressions failed before production changes: blocked periods expanded
the calendar/PNG range, Clear was absent, card text was verbose, and collapsing
the sidebar moved its control by 17px horizontally and vertically. They pass
after the fixes. Unavailable time is intersected with the visible calendar range,
including partial overlap and periods entirely outside it. Actual early/evening
classes still determine any extension beyond the default 08:00–18:00 range.
Clash filtering continues to use the full, unchanged blocked periods.

Clear removes selected courses and locked class IDs while preserving imported
courses, unavailable periods and the current search. Runtime checks clear two
courses with one hidden by search, confirm an empty timetable/disabled export,
then reselect a course and verify the previous fixed group is gone. A full-day
00:00–23:59 Sunday constraint leaves the axis at 08:00–18:00. Both browsers verify
identical sidebar-button bounding boxes before and after collapse, responsive
state retention, and exact Course Clash text.

The user-provided fork_logo.png is copied unchanged to src/assets/fork-logo.png;
both SHA-256 hashes are
2FB75D8083FA8B29208DC910B403F06B6297EDE6CC01A6062B8B044A49E5036F.
The header and favicon load in production web and packaged Windows. Windows
packaging uses the PNG for its application icon and includes it for BrowserWindow.
The asset lives under src, so existing launcher freshness checks cover changes.
No dependencies were added. User-owned root reference images, including the
original fork_logo.png, and suggestion/ remain untouched and uncommitted.

Updated synthetic captures: [docs/planner.png](docs/planner.png),
[docs/unavailable-time.png](docs/unavailable-time.png),
[docs/course-groups.png](docs/course-groups.png),
[docs/school-day-mobile.png](docs/school-day-mobile.png), and
[docs/registration-guide.png](docs/registration-guide.png).
No authenticated UTAR workflow was submitted in this revision; existing login
error/isolation and image-save/dirty-close regression checks remain passing.

## Earlier verification records

Environment: Windows 11 x64, Node 24.20.0, npm 11.5.2, Electron 45.0.0,
Playwright 1.64.1 (Chromium 156 / Firefox 157). Synthetic schedules and
course-only archived upstream rows were used; no UTAR account was accessed.

| Check | Result |
| --- | --- |
| Strict TypeScript | Passed |
| Unit/component tests | 127 passed in 21 files |
| Production web build | Passed; separate worker emitted |
| Production Electron build | Passed; sandbox-compatible CommonJS preload |
| Windows directory packaging | Passed; official installed Electron runtime |
| Chromium production workflows | 14 passed |
| Firefox production workflows | 14 passed |
| Packaged Windows workflows | 7 passed |
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

## Launcher and full-day calendar — Planner 0.1.1

The reported root `Start-TTAP.cmd` was executed before editing. Its processes
resolved to this checkout's `app/release/win-unpacked/TTAP-Planner.exe`, and its
archive already contained the local renderer, tutorial and integrated login.
Opening the installed legacy application was not reproduced. The launcher did
have no check for a stale package. It now compares source/build-input and source
directory modification times with the archive, rejects missing build inputs,
and rebuilds when needed. Tests cover current, changed, deleted and missing
inputs and a failing rebuild that never launches the previous package. This is
a local freshness check, not a remote update check or content-hash verification.

The real launcher was exercised through `cmd.exe`: it reported `Stale`, built
the application and opened the repository executable with window title
`TTAP Planner 0.1.1`. A subsequent check reported `Current`. Rebuilding later
encountered an open executable lock; after the user closed that window, the
final Windows package built successfully.

The calendar defaults to five Mon–Fri columns, with time rows spanning
08:00–18:00. Its positions and durations scale with the available panel height;
18:00 has a reserved endpoint label. Browser checks at 1280×720, 1024×600,
375×667 and 320×667 verify both endpoint classes, all five day columns,
non-overlapping hour labels, no vertical calendar overflow and an in-bounds week
selector. Opening class details reproduced a compressed-axis regression; an
overlay now leaves the calendar scale intact. Weekend/evening checks preserve
Saturday classes, Sunday unavailable time and the 07:00–20:00 range.

The packaged application verifies version 0.1.1 in app metadata, its header and
window title, and the same full-day geometry at 1280×720 and 1024×600 client
sizes. Final fresh validation passed strict types, **123 unit/component tests**,
production web/Electron builds, Windows packaging and **33 runtime tests**
(13 Chromium, 13 Firefox, 7 Windows). Existing native login, import, project
exchange and dirty-close checks remain passing. [docs/planner.png](docs/planner.png)
is the actual final packaged calendar; [docs/school-day-mobile.png](docs/school-day-mobile.png)
shows the browser's compact layout. These use synthetic class data.

## Reference-based revision — Planner 0.2.0

The user's explicit diagram supersedes the earlier orientation: **weekdays are
rows down the left (Mon–Sun), and time runs left-to-right along the top
(08:00–18:00)**. The calendar is visible before generating, always includes
Saturday/Sunday and extends its time range for earlier/later meetings. Geometry
checks now verify horizontally ordered non-overlapping time labels, vertically
ordered weekday labels, both endpoint classes and no calendar/document overflow
at 1280×720, 1024×600, 375×667 and 320×667. The native checks cover both desktop
client sizes as well.

The previous 0.1.1 binary reproduced `maximized: false`; the rebuilt 0.2.0 starts
hidden, maximizes at ready-to-show, then appears. Every packaged test checks
actual `BrowserWindow.isMaximized()`. Resizing tests explicitly restore the
window before changing its size.

Skipping/finishing the initial tutorial now reveals the embedded login directly.
The native view is bounded to the compact home card, and login-only cosmetic CSS
hides the known banner and announcements without replacing the official form,
changing its action, copying its values or relaxing web security. An actual
unauthenticated official-page probe verified the maximized parent and a visible
**870×311** view; the form ended at y=205 inside its 311px viewport, with no
vertical overflow. [docs/registration.png](docs/registration.png) is a direct
capture of that real view, not a composite. No account or CAPTCHA was submitted.
Authenticated behavior remains unverified. Web uses a bounded cross-origin
iframe and retains the documented browser embedding restrictions.

Native synthetic-origin checks verify the same automatic entry, compact bounds,
banner/announcement presentation, visible password input, original isolation,
capture validation and suspension while the manual modal is open. Manual import
supports HTML files/paste within a floating dialog, backdrop or Escape dismissal,
focus restoration and the existing dirty-replacement/export guards. Replaying
the tutorial retains the current plan without an obsolete registration handoff.

Try demo enters the planner directly with **18 selectable courses** and several
lecture/tutorial groups. Four reference-style subjects generate multiple options;
the course summary shows their groups, matching colors and 11 total credits.
Unknown optional credits produce an Unknown total. A half-hour constraint dialog
shows occupancy across current options and previews the remaining count before
applying. Cancel leaves the project unchanged; applying invalidates results for
regeneration. Counts explicitly describe shown options rather than all possible
solutions. [docs/demo-summary.png](docs/demo-summary.png) and
[docs/demo-time-constraints.png](docs/demo-time-constraints.png) are actual browser
captures with synthetic schedules.

The independent review's two findings and three visual/focus regressions were
reproduced and fixed; see [REVIEW.md](REVIEW.md). Final fresh validation passed
strict types, **127 tests in 21 files**, production web/Electron builds, Windows
packaging and all **35 runtime tests** (14 Chromium, 14 Firefox, 7 packaged Windows).
Native project exchange, saved-HTML security and cancelled-save/dirty-close
protection remain passing. User-owned reference PNGs and `suggestion/` were not
modified or included in the change.


## Immediate clash checks and registration images — Planner 0.3.0

Selecting courses, locking a group or applying unavailable time now starts the
existing cancellable Worker immediately. Component regressions verify no-solution
alerts, recovery after deselection, alternative compatible groups and rejection
of stale results. Results and the exportable candidate are tied to the exact
current project. The Teaching Week selector is removed; week-aware conflict
logic remains. All meetings display together. Many alternating-week lanes use
readable minimum heights and internal scrolling, without enlarging the app frame.
The independent review found and confirmed this lane-height regression; the
eight-course runtime check failed before the fix and passes afterward.

Export image produces an actual 1600px-wide PNG containing the horizontal weekly
timetable, full course names, chosen groups and class numbers, rooms, meeting
times/weeks, credits and registration steps. Unit checks verify the rendered
content and rejection of incomplete selections. Browser tests save PNG
downloads to disk and check format/dimensions; packaged Windows tests decode the
saved image with nativeImage. The UI has no Export project action. Legacy project
opening remains supported. Export is disabled for empty, checking or conflicting
selections; changing timetable option invalidates exported status. Cancelled
saves, downloaded-file confirmation and edits during saves retain dirty protection.

Manual import now has expandable, bundled screenshots created from synthetic
course data. They are explicitly labelled as examples. The archived upstream
image containing account information is not shipped. Browser runtime checks
verify the images actually load under the production CSP. The source screenshots
can be regenerated with PLAYWRIGHT_BROWSERS_PATH=0 and
`node scripts/capture-import-guide.mjs` from app/.

Fresh final validation passed strict types, **134 unit/component tests in 22
files**, production web/Electron builds, Windows packaging, and **37 runtime
tests**: 15 Chromium, 15 Firefox, 7 packaged Windows. Geometry checks include
1280×720, 1024×600, 375×667 and 320×667, weekday rows, horizontal hour labels and
weekend/evening times. Native tests confirm version 0.3.0 and maximized startup.
The root launcher freshness check reports Current for the new package.

[docs/planner.png](docs/planner.png), [docs/registration-guide.png](docs/registration-guide.png),
[docs/illustrated-import.png](docs/illustrated-import.png), and
[docs/school-day-mobile.png](docs/school-day-mobile.png) are captured final outputs
using synthetic data. No authenticated UTAR account flow was submitted or verified
in this revision. No new dependencies were added. Existing user-owned root
reference images and suggestion/ were untouched and excluded from the commit.


## Guarded course selection and visible login errors — Planner 0.4.0

Prospective course checks now search every permitted class-type combination
before disabling a course. They use the same week-aware solver, with a first-
solution existence path inside a separate cancellable Worker. The original
500-option enumeration and truncation checks still pass. Card messages explain
why unavailable courses cannot be selected; selected courses remain removable.
Current-project guards prevent stale availability or timetable replies from
becoming selectable or exportable.

Selected cards expose a right arrow for group selection. The modal flyout appears
beside the course, stays visible through responsive panel changes via a portal,
and limits its height to the space beneath its actual top. Both resize hiding
and long-label clipping were reproduced with failing browser tests and fixed.
Courses-panel sidebar icons replace Hide/Show controls. Export image occupies
the former Generate position; the Generate control and entire project toolbar
are removed. Image download confirmation, save cancellation, dirty replacement,
dirty close and edits during save remain verified. Runtime fixtures now enter
through actual HTML import rather than removed project-opening controls.

Native login presentation preserves known visible error markers. A bounded
plain-text probe reads those messages only on official login paths; it never
reads input values, account content or full login HTML. Unit tests verify the
extraction boundary and native network/HTTP details. Packaged runtime checks
show a synthetic invalid-verification-code message while keeping the original
password input usable, then an HTTP 503 failure with Reload. Native sandbox,
context isolation, exact HTTPS origin and no remote preload remain intact.
Browser embedding cannot read cross-origin authentication messages; those stay
in UTAR's form, with browser load-error/timeout guidance and direct-page fallback.
No real account credentials or CAPTCHA were submitted.

Fresh final checks passed strict types, **141 unit/component tests in 25 files**,
web/Electron production builds, Windows packaging and **42 runtime tests**
(17 Chromium, 17 Firefox, 8 packaged Windows). Ordinary calendar geometry still
passes at 1280×720, 1024×600, 375×667 and 320×667, with weekday rows and horizontal
08:00–18:00 labels. The root launcher reports Current for Planner 0.4.0.

Current synthetic-data captures: [docs/planner.png](docs/planner.png),
[docs/course-groups.png](docs/course-groups.png), [docs/login-error.png](docs/login-error.png),
and [docs/school-day-mobile.png](docs/school-day-mobile.png). One independent review
was completed; its P2 height finding was fixed, with no second review requested.
No new dependencies were introduced. User-owned root PNGs and suggestion/ were
untouched and excluded from the change.
