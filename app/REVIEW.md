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
