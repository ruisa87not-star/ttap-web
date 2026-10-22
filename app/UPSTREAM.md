# Upstream provenance

Source: [wongjiahau/ttap-web](https://github.com/wongjiahau/ttap-web),
commit `becbba38d9986b3e624c3ed0bd6eac2171d30244`, MIT, Copyright (c) 2017 Wong Jia Hau.
The original LICENSE is retained at the repository root and included in desktop packaging.

- `src/ts/parser/parseStudentHtmlToRawSlot.ts` and `_v2.ts`: course headings,
  class rows, class-mode columns and continuation rows ported to `parseUtarHtml.ts`.
  The port uses textContent, explicit diagnostics, bounded input, stable composite
  class identities and validation instead of browser-global IDs and silent drops.
  `testData/student-2020-Sept.html` is read in place for an additional regression;
  its td/Mode headings and row-spanned Remark structure are reproduced with
  synthetic data in `tests/fixtures/student-td-mode.html`. Declared physical row
  counts are validated before deduplicating equal meetings.
- `src/ts/permutator/findTimetable.ts` and `partitionize.ts`: partition by
  course/type, sort by candidate count and backtrack with clash pruning, ported
  to `core/solveTimetables.ts`. UI visualization hooks and mutable global time
  matrices are removed. Explicit minute intervals and week sets preserve
  half-open adjacency and support all validated minute values without 32-bit overflow.
- Source fixtures: `src/ts/tests/testData/heng_2017_sept.ts` for MPU3113 (3),
  MPU3113 + MPU3123 (5), UKMM1043 (29), ACP + BKA (0);
  `heng_2017_apr.ts` for UEME3112 (420 with teaching weeks).
  Only course rows needed for those cases were copied to `tests/fixtures/upstream-cases.json`.
  No login HTML or account information is introduced.

Intentional behavior changes: invalid input is diagnosed, missing complete course
types exclude the course, internally conflicting classes cannot be selected,
combinations are deterministic, and only the first 500 are retained. A 501st
discovered solution sets `truncated`; exactly 500 does not. No claim of complete
compatibility with the current UTAR website is made without a current sample.

Framework references: [React createRoot](https://react.dev/reference/react-dom/client/createRoot),
[effect cleanup](https://react.dev/reference/react/useEffect),
[Vite workers](https://vite.dev/guide/features.html#web-workers),
[Electron security](https://www.electronjs.org/docs/latest/tutorial/security).

Desktop boundaries follow [Electron protocol registration](https://www.electronjs.org/docs/latest/api/protocol):
the standard, secure `ttap` scheme is registered before app readiness, serves only
packaged index/JS/CSS resources, and retains CSP. Sandboxed CommonJS preload exposes
eleven named capabilities; native dialog results alone supply filesystem paths.
Packaging uses the documented [electronDist option](https://www.electron.build/docs/api/electron-builder.interface.configuration/)
to reuse the official installed runtime on Windows.

The local tutorial and manual HTML import instructions follow the original
[tutorial flow](../src/ts/react/tutorial/tutorial.tsx) and
[How to add slot manually](../HowToAddSlotManually.md). Instructions are rewritten
for the new preview/confirm controls and multi-file import; original screenshots
and remote tutorial fetching are not included. Integrated registration uses
[Electron WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view)
in an isolated session, with no renderer bridge exposed to the official page.
The fixed HTTPS destination and restricted extraction replace the earlier
external-browser handoff. [View bounds](https://www.electronjs.org/docs/latest/api/view#viewsetboundsbounds)
track the available local slot; [screen work area](https://www.electronjs.org/docs/latest/api/screen)
limits initial native window dimensions.
