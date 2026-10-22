# TTAP Planner — web and Windows

A redesigned UTAR timetable planner. The web app and Windows Electron app share
the same interface, HTML importer, solver and versioned `.ttap.json` project files.
The original application remains in the repository root; install the new app
independently, without running the root package installation.

Development branch: [`codex/electron-redesign`](https://github.com/ruisa87not-star/ttap-web/tree/codex/electron-redesign)
in the [GitHub fork](https://github.com/ruisa87not-star/ttap-web).

![Packaged Windows timetable planner](docs/planner.png)

The compact workspace keeps **Generate** beside the selected course count, above
the timetable. On smaller screens, switch between **Courses**, **Timetable** and
**Conditions**; the same Generate/Cancel action is available from every panel.
Course names use 14px text, with 12px course codes and 11px metadata in the calendar.
The calendar scrolls independently to retain readable day columns.

## Start

Use Node.js **24.15 or later** and npm 11 (verified with Node 24.20.0 / npm 11.5.2).
Run these commands from the repository root:

```sh
npm --prefix app ci
npm --prefix app run dev:web
npm --prefix app run dev:desktop
```

Choose one development command at a time. The desktop command opens Electron;
the web command prints a local URL. To build production outputs:

```sh
npm --prefix app run build:web
npm --prefix app run preview:web
npm --prefix app run build:desktop
npm --prefix app run package:win
```

| Output | Location |
| --- | --- |
| Static web application | `app/dist-web/` |
| Electron main, preload and renderer | `app/out/` |
| Windows application folder | `app/release/win-unpacked/` |
| Windows executable | `app/release/win-unpacked/TTAP-Planner.exe` |

Serve `dist-web` over HTTP(S); opening `index.html` with `file://` is unsupported.
Copy the **entire** Windows folder when sharing it. This development build has no
installer, automatic updater, or configured signing certificate. Build it on
Windows for the installed host architecture; packaging reuses the official
Electron distribution installed in `app/node_modules/electron/dist`.

## Arrange a timetable

1. Save your UTAR master schedule pages as UTF-8 `.html` / `.htm` files. Choose
   **Choose HTML files**, drop multiple pages together, or use **Paste HTML**.
   **Try demo** provides synthetic courses without accessing UTAR.
2. Review the course/class counts and import notes, then choose **Use these
   courses**. Invalid or incomplete classes are excluded; a course with no valid
   choice for a required class type is excluded too.
3. Select courses, optionally fix a lecture/tutorial/practical group, and add
   unavailable times. These times apply every teaching week.
4. Choose **Generate**. Browse candidates and teaching weeks; select a class in
   the timetable for all its meetings, rooms and weeks. A new condition invalidates
   the previous results. **Cancel calculation** stops the Worker immediately.
5. Choose **Export project**. Desktop uses a native save dialog and writes the
   file atomically. Web starts a browser download: confirm **I kept the file**
   only after retaining it. A download gesture alone does not prove a disk save.
6. Open the same `.ttap.json` file in either version. Courses, fixed classes and
   unavailable times are restored. Generate again to obtain equivalent candidates.

Dirty projects prompt before replacement or desktop close. A failed/cancelled
export preserves the current work. Changes made while saving remain dirty. The
browser warns before leaving dirty work; browser/OS shutdown can still interrupt
the application, so export important work regularly.

## Limits and compatibility

- HTML imports and project files are limited to **10 MiB**, measured as UTF-8 bytes;
  multiple HTML files share that total limit.
- The solver retains at most **500** candidates. It reports truncation only after
  finding a 501st; the displayed count is then a retained count, not a full total.
- Meetings clash only when day, time and teaching weeks overlap. Adjacent times
  do not clash. Every class's meetings are selected together.
- Projects contain input data and conditions, not generated candidates or the
  currently viewed candidate/week. Schema version 1 is supported.
- Historical UTAR student table formats (with/without Class Mode) and archived
  solver examples are covered. **A current real UTAR export has not been supplied
  or verified.** Unrecognized layouts produce import notes. Do not mix terms:
  term metadata is not validated, and duplicate/subset class rows can merge.
- Imported HTML is parsed as data, never rendered. Scripts, images and frames
  are blocked by CSP. The app does not log in, auto-register courses, upload
  schedules, synchronize to a cloud, or publish a website.

## Verification

```sh
npm --prefix app run check
npm --prefix app run install:browsers
npm --prefix app run build:web
npm --prefix app run package:win
npm --prefix app run test:e2e:web
npm --prefix app run test:e2e:desktop
```

The unit suite covers parsing, validation, archived solver counts, Worker
cancellation/stale replies, file failure paths, IPC source checks and dirty state.
Playwright serves the production web build in Chromium and Firefox; desktop tests
launch the packaged executable, use real file I/O and replace only the native
dialog responses at the test boundary. No test bridge is shipped in the app.
Native overwrite tests may require a normal host shell when run under a restricted
filesystem sandbox.
The test scripts keep official browser runtimes in the project's `node_modules`
to avoid Firefox assembly loading failures observed in the shared Windows cache.
Set `PLAYWRIGHT_BROWSERS_PATH` explicitly to use another location.

The recorded verification result and remaining runtime limitations are in
[VERIFICATION.md](VERIFICATION.md), with independent findings and fixes in
[REVIEW.md](REVIEW.md). Source attribution and deliberate rule changes
are in [UPSTREAM.md](UPSTREAM.md). Original MIT notice: [LICENSE](LICENSE).
Bundled third-party notices: [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt).
Execution decisions and their tradeoffs: [DECISIONS.md](DECISIONS.md).
