# Execution decisions and tradeoffs

Recorded in execution order while following the approved design and plan.

- Ruling: Reuse the clean dedicated checkout on codex/electron-redesign — this workspace was created for this task and the approved plan names this branch; developer instructions prefer reusing a suitable checkout — no extra worktree, no unrelated work exposed.
- Ruling: Do not install or execute the legacy root app — the approved spec requires an independently installable app and legacy dependency versions conflict — legacy runtime remains unverified; new core parity tests will cover relevant rules.
- Task 2: Ruling: Explicitly list Vite's exact Windows native binding as an optional dependency — npm omitted it from the install and --include=optional did not restore it; direct installation fixed module loading — this optional entry must track the locked Rolldown version.
- Task 2: Ruling: Use package-root fixture paths in Vitest — Vite 8 rewrites import.meta.url under jsdom — tests remain portable through npm --prefix app.
- Task 2: Ruling: Apply correctness findings from suggestion/ without replacing the approved spec — drop courses missing every valid option of an observed type; reject conflicting class meetings; keep source files untouched — overly conservative exclusion is visible in import notes.
- Task 2: Ruling: Permit identical/subset duplicate meeting sets, reject conflicting sets — the approved paginated fixture repeats only part of a complete class — unrecognized mixed-term metadata remains a validation limitation to report.
- Task 2: Ruling: Do not adopt preferredClassIds from the unapproved revised proposal — the approved spec re-computes candidate results — reopening does not remember candidate position.
- Task 3: Ruling: Correct the plan's upstream dataset attribution — GetBigSlotsOf uses September for four cases, April only for FM2 — extracted the original course rows from each correct source, with no account HTML.
- Task 3: Ruling: Detect a 501st solution before reporting truncation, keep only 500, and use code-unit canonical ordering — resolves the plan's 500-boundary ambiguity and reviewed correctness finding — one extra solution search may be needed.
- Task 6: Ruling: readProjectText returns bounded raw UTF-8 text, decoded uniformly in the renderer — matches FilePort and avoids duplicate codec handling in the native adapter — invalid native files reach the same validation UI.
- Task 6: Ruling: package the already installed official Electron distribution via documented electronDist — builder 26.15.3 repeatedly fails its extraction-directory rename on this Windows host, while official install.js succeeds — package:win is intended for the installed host architecture, not cross-compilation.
- Task 7: Ruling: use project-local official Playwright browsers via a four-line launcher — Firefox cannot load its mozglue assembly from the shared cache on this host but the identical distribution works inside the workspace — extra local disk space; explicit PLAYWRIGHT_BROWSERS_PATH remains supported.
- Final: Ruling: perform the whole-branch independent review before Task 8 push — Task 8 explicitly requires reviewed code before publishing the branch — remotes-only actions occur after review.
- Final: Ruling: mixed-term metadata and subset merging remain documented limitations — complete declarations are now enforced; no current reliable term contract exists in the approved spec — mixed terms can still be merged when metadata is unrecognized.
- Final: Ruling: retain student-parser scope rather than add FGO staff import — approved Task 2 selects the two student parsers — staff-specific pages may be rejected.
- Final: Ruling: keep candidate/week position transient — approved project data stores input and conditions only — reopening resets the viewed candidate/week.
- Final: Ruling: leave current live UTAR layout unverified — no current export was supplied — newer formats may require a later parser update.
- Final: Ruling: leave legacy runtime unexecuted — original app is retained unchanged with separate conflicting dependencies — old runtime remains unverified.
- Final: Ruling: leave hosting, installers/signing, other OS and automatic updates out of scope — approved first version is static web output and Windows directory — distribution requires separate work.
- Final: Ruling: finish GitHub fork/push only after reviewed fixes and runtime gates — user authorized this in Task 8 — remote publication waits for those gates.
- Final: Ruling: use the already approved integration choice (fork and push this branch, no PR) instead of a new finishing menu — user approval persists and Task 8 specifies the exact action — no local merge or PR is created.

Deferred minor findings: none.


## Planner 0.3.0 — immediate checks and final image

- Each immutable project edit starts the existing cancellable Worker; only results
  belonging to the current project can render or become exportable. Compatible
  alternative groups are searched before reporting no solution.
- Teaching-week filtering is removed. Meeting week sets remain part of conflict
  correctness. A shared lane layout separates equal clock times across disjoint weeks.
- PNG is the user-facing output. Canvas draws the chosen candidate and complete
  registration details from structured data, with wrapping and explicit image
  bounds. Changing the chosen candidate invalidates the exported-image status.
- Native PNG saves keep main-frame sender validation, a bounded image payload,
  native-path selection and atomic writes. Legacy project opening and underlying
  format adapters stay available for compatibility, without an Export project UI.
- Manual-import screenshots use marked synthetic examples. The upstream archive
  contains a student name/ID, so it is not bundled into the redesigned guide.


## Planner 0.4.0 — guarded course selection and compact controls

- Prospective course availability uses the same week-aware DFS, stopping at its
  first solution. A separate cancellable Worker checks the catalog while the
  timetable Worker retains the normal 500-option cap. Results are accepted only
  for the current immutable project. Selected courses remain removable.
- Group selectors move into a modal flyout reached by the selected-card arrow.
  A portal keeps it visible across responsive sidebar changes; viewport-relative
  maximum height makes long labels scroll within the remaining space.
- The project toolbar and Generate control are removed. Export image occupies
  the planner action position, and sidebar icons live beside the Courses panel.
  File adapters remain for internal compatibility, without project-opening UI.
- Native login probes read only known visible error-marker text (maximum 500
  characters), never input values or page HTML. Cosmetic login styles preserve
  error elements. HTTP and network failures remain distinct from correctable
  form errors; sandbox, origin restrictions and isolated session stay intact.
- Browser embedding cannot expose cross-origin authentication details to TTAP.
  The official form retains those messages; load-error/timeout guidance and
  a direct-page fallback remain available.
