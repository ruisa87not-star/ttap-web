# Independent review and verified fixes — 2026-10-22

A fresh reviewer inspected the whole implementation from upstream `becbba3`
through `79e6d99`, including the approved design, plan, execution rulings, source
and tests. The review was read-only. It found four issues and no actionable minors.
The initial verdict required fixes before publishing the branch.

| Finding | Resolution | Regression evidence |
| --- | --- | --- |
| Critical: opening a file from clean state could overwrite edits made during the asynchronous read | Replacement checks the latest dirty state after reading | Deferred open, edit during read, then require Export/Discard/Cancel |
| Important: a declared multi-row class could omit a missing continuation | Validate physical row counts at class/course boundaries and table end, before meeting deduplication | Missing middle/end continuation rejected; equal physical meetings remain valid |
| Important: upstream student 2020 td/Mode headers and five-cell continuation layout were not recognized | Recognize structured headers and derive continuation width from the parent's spanned Remark | De-identified fixture and retained upstream page; real browser/native imports preserve both meetings |
| Important: `__proto__` class type could pass validation and crash rendering | Type labels use a Map with a string fallback | Validated external project opens and renders the unusual type |

The reproducing tests were run against the original implementation and failed:
5 failed, 25 passed, including the expected React error. After the fixes all
30 focused tests passed. The complete strict-type/unit gate passed with **98
tests in 14 files**. Production builds, packaging and runtime verification are
recorded in [VERIFICATION.md](VERIFICATION.md).

The author completed one fix pass with regression verification. No second
independent review was requested, following the approved execution workflow.

The review explicitly set aside these already approved boundaries:

- Mixed-term detection and subset merging remain a documented limitation;
  explicitly incomplete declared row groups are now rejected.
- FGO-specific staff import is outside the selected student-parser port.
- Candidate/week position is not stored; projects regenerate candidates.
- Current live UTAR compatibility requires a current supplied export.
- The unchanged legacy application was not installed or executed.
- Hosting, installers/signing, other operating systems and updates remain out of scope.
- GitHub fork/push is handled after the review fixes and verification gates.

Deferred minor findings: **none**.

## Guidance and navigation follow-up — 2026-10-22

One fresh reviewer inspected the tutorial, official-login handoff, course sidebar
and in-app Back changes against the five requested behaviors. The review was
read-only and found no critical issues. Its two P2 findings were reproduced and
fixed in one pass:

| Finding | Fix | Verification |
| --- | --- | --- |
| Desktop collapse could hide the active mobile Courses panel after resizing | Limit collapse visibility to the desktop CSS breakpoint | Chromium and Firefox regression failed before the fix and passes after it |
| Existing-project import view had no focus target after leaving the tutorial | Always render a focusable import heading | Component focus regression failed before the fix; unit and browser checks pass after it |

The reviewer verified the fixed-URL IPC boundary and preservation of the existing
dirty/export guards. It set aside live UTAR authentication and external service
availability because no account was supplied. This boundary is accepted and
recorded in [VERIFICATION.md](VERIFICATION.md): the browser handoff is covered,
while authenticated UTAR behavior remains unverified. No second review was
requested. The final full run passed strict types, 104 unit/component tests and
26 runtime tests.

## Embedded registration and viewport sizing — 2026-10-22

One fresh read-only reviewer checked the native trust boundary, lifecycle and
responsive reachability. Three P2 issues were reproduced and resolved:

| Finding | Fix | Evidence |
| --- | --- | --- |
| A delayed capture could navigate after leaving the registration view | Invalidate capture generations on unmount, dialog suspension and reload | Both deferred-result component regressions failed, then passed |
| URL validation alone did not reject a login form served at the timetable URL | Reject password fields inside the remote expression and return only the expected course table | Expired-login native fixture failed before the fix and passes after it |
| Centered empty-state content clipped above the scrollable area in short panels | Use safe centering | Chromium/Firefox geometry checks failed before the fix and pass after it |

The reviewer found no remaining source blocker after those changes. The final
120-unit and 30-runtime checks passed. No second review was requested.

Set-aside rulings: authenticated UTAR behavior and live popup/expiry flows remain
unverified without an account; a subsequent unauthenticated probe did verify the
real login page loads in the attached view. Documentation was completed after
the review. Installed TTAP was inspected read-only by the implementing agent;
its runtime was not independently compared. These limits are recorded in
[VERIFICATION.md](VERIFICATION.md).

## Launcher freshness and full-day calendar — 2026-10-22

A fresh read-only reviewer inspected the focused changes against `317938f`.
It confirmed one P2: deleting a source file did not update any remaining file's
timestamp, so the launcher could report the package as current. The regression
failed before the fix. Freshness now includes source-directory timestamps and
the presence of required build inputs. Tests also cover modified sources,
missing packages and a failed rebuild that must not launch the previous package.

The reviewer requested runtime evidence for class details and extended schedules.
Opening details on a narrow screen reproduced overlapping hourly labels. Details
now overlay the calendar rather than shrinking its time axis. The browser
regression failed before this adjustment and passes after it, including closing
details, Saturday/Sunday periods and an extended 07:00–20:00 range. No further
source findings were reported. No second independent review was requested.

## Reference-based flow revision — Planner 0.2.0

A fresh read-only reviewer checked the user's seven requested changes against
`6c7d816`, including startup maximization, automatic compact registration,
manual-dialog dismissal, a substantial demo catalog and the explicitly corrected
weekday/time direction. Two P2 findings were reproduced with failing regressions:

| Finding | Fix |
| --- | --- |
| Replaying the tutorial from a plan left an obsolete registration link that returned to the plan | Remove the obsolete handoff and describe automatic registration after finishing/skipping the initial tutorial |
| Missing optional credit data produced a false zero/incomplete numeric total | Show Unknown whenever any selected course omits credits |

The reviewer found no further actionable source issues in native lifecycle,
dirty-project protection, meeting placement or constraint filtering. Visual
inspection separately reproduced undersized weekday rows when showing summary
and a constraint-dialog width overridden by the base dialog rule. Compact chrome,
summary sizing and a specific dialog selector resolve these; browser regressions
verify row height and dialog width. A backdrop-close focus regression was also
reproduced and fixed by restoring the connected opener on dialog cleanup.
No second independent review was requested.


## Immediate clash checks and image export — Planner 0.3.0

A fresh read-only reviewer inspected the changes against `65d1951`, including
automatic Worker invalidation, current-project/candidate ownership, image save
snapshots, bounded native PNG requests and account-free local guide assets.
It found one P2: dividing a fixed-height weekday by many alternating-week lanes
made compatible meetings unreadable. The eight-course browser regression failed
with 4px meeting buttons before the fix. Minimum readable lane heights and
internal calendar scrolling resolve it; ordinary schedules still fit all seven
weekday rows. The focused Chromium regression passed after the fix.

No additional actionable correctness, security or data-loss findings were
reported. No second independent review was requested. The reviewer did not rerun
the broad suite; the implementing agent runs the final gates separately.
