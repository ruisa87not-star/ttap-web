# TTAP Web + Electron Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付共用介面及排課核心的 UTAR 網頁版與 Windows Electron 桌面版，支援 HTML 匯入、排課及互通的專案檔。

**Architecture:** 在 fork 的 `app/` 建立獨立套件；Vite 建置網頁，electron-vite 建置相同 renderer 加上 main / preload。匯入和排課是共用功能，檔案存取由薄的平台層處理，求解在 Web Worker 執行。保留上游程式作為移植與回歸參考，逐步拆除核心的 UI 相依。

**Tech Stack:** React、TypeScript、Vite、Electron、electron-vite、electron-builder；Vitest、jsdom、Testing Library、Playwright。UI 使用 CSS 與原生表單控制項，不新增 UI 或狀態管理框架。

**Spec:** [2026-10-21-electron-redesign-design.md](../specs/2026-10-21-electron-redesign-design.md)。使用者已確認設計與本計畫，並選擇 Native 循序實作，最後獨立審閱。

## Global Constraints

- 「兩個版本共用介面、HTML 匯入流程、資料格式及排課核心。」
- 「匯入檔案總量上限為 10 MiB」；以 UTF-8 bytes 計算，邊界為 `10 * 1024 * 1024`。
- 「HTML 僅作資料解析，不能插入應用畫面或執行其中的指令碼。」
- 「每次最多保留 500 個候選方案。」達上限只表示搜尋被截斷，不能顯示完整總數。
- 「只有星期、時間及上課週次都相交，才判定衝堂。」時段使用半開區間，端點相接不衝堂。
- 「儲存為帶有 `schemaVersion: 1` 的 `.ttap.json` 檔案」；不儲存候選結果。
- 「第一版 UI 文案沿用原專案的英文」；課程名稱與代碼保留原文。
- 「renderer 啟用 context isolation 與 sandbox，停用 Node integration。」保持 webSecurity 開啟。
- 網頁產物為 `app/dist-web/`，Electron 建置為 `app/out/`，Windows 封裝為 `app/release/win-unpacked/`。
- 不增加登入、自動選課、雲端同步、自動更新、Service Worker、正式網站發佈或其他平台封裝。
- 保留上游 1,021 筆提交、根目錄舊應用與 MIT 聲明；目前分支為 `codex/electron-redesign`，遠端只有 `upstream`。
- 每個產品邏輯步驟先有失敗測試，再實作，再驗證。非程式的文件和 Git 設定用直接檢查驗證，不建立鏡像測試。

## Review Focus

1. 孤立的 `subRow` 或少了其中一堂的班別：必須回報並排除不完整班別，不能匯入少上一堂的可選班別。歸屬 Task 2。
2. 不同科目重複使用班別編號、科目代碼或班別欄位含分隔符號：不能錯誤合併。穩定識別使用序列化 tuple。歸屬 Task 2、3。
3. 切換資料集後舊 Worker 才回覆，或取消後立即再計算：舊結果不能覆蓋目前條件。歸屬 Task 4。
4. 外部專案宣稱合法版本但包含未知科目、固定班別或無效時段：保持目前工作，顯示錯誤。歸屬 Task 1、5。
5. 桌面儲存取消、磁碟寫入失敗、儲存中再次編輯，或瀏覽器下載被取消：不能誤清目前的變更或自動關閉／替換專案。歸屬 Task 5、6。

## File Structure and Shared Contracts

所有新產品檔案放在 `app/`，測試依責任放在 `app/tests/`。各 Task 下方列出確切檔案；舊的 `src/`、`public/`、根 package 與 lockfile 僅作參考，不改動。

`app/src/shared/model.ts` 由 Task 1 定義後維持下列型別；不要在 renderer 或 Electron 另建一份資料模型：

```ts
type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };
type Meeting = { day: number; startMinute: number; endMinute: number; weeks: number[]; room: string };
type ClassOption = { id: string; courseCode: string; type: string; number: string; group: string; meetings: Meeting[]; remark?: string; classMode?: string; classSize?: string };
type Course = { code: string; name: string; creditHours?: number; classes: ClassOption[] };
type BlockedPeriod = { day: number; startMinute: number; endMinute: number };
type Selection = { courseCodes: string[]; lockedClassIds: string[]; blocked: BlockedPeriod[] };
type Project = { schemaVersion: 1; sources: string[]; courses: Course[]; selection: Selection };
type HtmlSource = { name: string; text: string };
type ImportIssue = { source: string; row?: number; message: string };
type ImportResult = { sources: string[]; courses: Course[]; issues: ImportIssue[] };
type SolveInput = { courses: Course[]; selection: Selection };
type Timetable = { classIds: string[] };
type SolveResult = { solutions: Timetable[]; truncated: boolean };
type FileOutcome<T> = { status: 'ok'; value: T } | { status: 'cancelled' } | { status: 'error'; message: string };
type ExportReceipt = { kind: 'saved' | 'downloaded'; name: string };
```

day 為整數 1–7，分鐘為整數 0–1440 且 `startMinute < endMinute`。週次支援整數 1–53、去重排序；HTML 的週次範圍先驗證端點再展開，超出範圍回報錯誤，避免巨大範圍卡住匯入。拒絕空白代碼、重複 ID、非有限數字和不完整參照；不使用 32-bit 週次位移或全域可變時間基準。`ClassOption.id = JSON.stringify([courseCode, type, number, group])`，會議時段完整保存於同一選項。科目／類型分組亦使用 tuple，不用雜湊相加。

Task 順序為 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8；此順序讓每一步都有可單獨驗證的結果。

## Task 1: 共用專案格式與驗證

**Files:** Create `app/package.json`, `app/package-lock.json`, `app/tsconfig.json`, `app/vitest.config.ts`, `app/src/shared/model.ts`, `app/src/shared/project.ts`, `app/tests/shared/project.test.ts`, `app/tests/fixtures/projects.ts`; Modify `.gitignore`。

**Interfaces:** Produces 上述型別與 `MAX_IMPORT_BYTES = 10 * 1024 * 1024`、`MAX_SOLUTIONS = 500`、`validateCourses(value: unknown): Result<Course[]>`、`validateProject(value: unknown): Result<Project>`、`decodeProject(text: string): Result<Project>`、`encodeProject(project: Project): Result<string>`，全部從 `shared/project.ts` 匯出。

- [x] **Step 1:** 在獨立套件設定 strict TypeScript、Vitest 與 jsdom，`test` script 使用 `vitest run`；核對當時套件的 engines / peerDependencies，採相容版本並提交 lockfile。新增 fixtures 的 `makeProject(): Project`，有一科 L/T、非空 sources 及有效 selection；加入下列測試，尚不實作 codec：
  ```ts
  const p = makeProject();
  const encoded = encodeProject(p);
  expect(encoded.ok).toBe(true);
  if (!encoded.ok) throw new Error('fixture should encode');
  expect(decodeProject(encoded.value)).toEqual({ ok: true, value: p });
  expect(validateProject({ ...p, schemaVersion: 2 }).ok).toBe(false);
  expect(validateProject({ ...p, selection: { ...p.selection, lockedClassIds: ['missing'] } }).ok).toBe(false);
  expect(decodeProject('{').ok).toBe(false);
  ```
  增加具名案例 `invalidCourseReference`, `reversedTime`, `nonFiniteNumber`, `duplicateClassId`, `weekOutOfRange`, `tooLargeProject`，各斷言 `ok === false`；大小測試含多位元中文，使用 UTF-8 bytes。
- [x] **Step 2:** 執行 `npm --prefix app test -- tests/shared/project.test.ts`；確認因缺少 codec／驗證而失敗。
- [x] **Step 3:** 實作上述簽章，將格式與驗證留在純 TypeScript；固定班別必須存在且屬於已選科目，同科同類型最多固定一個班別。新增獨立 `typecheck` script；忽略 `app/node_modules/`、`app/coverage/`、`app/out/`、`app/dist-web/`、`app/release/` 及測試產物。
- [x] **Step 4:** 執行同一測試與 `npm --prefix app run typecheck`；預期全部通過，無舊應用依賴安裝。
- [x] **Step 5:** 只提交本 Task 的列出檔案，訊息 `feat: define portable timetable project format`。

## Task 2: UTAR HTML 匯入與網頁預覽

**Files:** Create `app/index.html`, `app/vite.config.ts`, `app/src/renderer/main.tsx`, `app/src/renderer/App.tsx`, `app/src/renderer/styles.css`, `app/src/renderer/import/parseUtarHtml.ts`, `app/src/renderer/import/ImportPanel.tsx`, `app/src/platform/browserFiles.ts`, `app/tests/import/parseUtarHtml.test.ts`, `app/tests/import/ImportPanel.test.tsx`, `app/tests/fixtures/student-v1.html`, `app/tests/fixtures/student-v2.html`, `app/tests/fixtures/paginated.html`; Modify `app/package.json`、lockfile。

**Interfaces:** Consumes `HtmlSource`, `ImportResult`, `validateCourses`, `MAX_IMPORT_BYTES`；Produces `parseUtarHtml(sources: HtmlSource[]): ImportResult`、`readHtmlFiles(files: File[]): Promise<FileOutcome<HtmlSource[]>>`、`ImportPanel({ onConfirm }: { onConfirm: (result: ImportResult) => void })`。`App` 接受已確認的匯入資料，建立有效 Project；範例只使用合成 HTML。

- [x] **Step 1:** 依上游兩版學生解析器的 table / subRow 結構製作小型無個資 fixtures。測試兩版預期的 course code、type、group、room、classMode 和所有 meetings；`mergeDuplicatePages` 斷言重複頁不增加班別或 meetings，`sameNumberDifferentCourse` 斷言兩科保有兩個不同 ID，`tupleDelimiterCollision` 斷言不同班別欄位的分隔符組合不碰撞。另測 `orphanSubRow`、`missingMeetingCell`、`subjectToChangeHeader`、HTML entities、空白／登入頁、script / img 內容、`1-999999999` 週次回報錯誤不展開，以及時間為空和 Industrial Training 的排除提示。UI 測試空白匯入不能確認、有效匯入有統計、取消不呼叫 onConfirm。
  v2 fixture 固定有科目 TEST1013、一個含兩個 meetings 的 L 班別與一個 T 班別；在 `tests/import/parseUtarHtml.test.ts` 使用 Node readFileSync 讀取 fixture：
  ```ts
  it('v2PreservesBothMeetings', () => {
    const text = readFileSync(new URL('../fixtures/student-v2.html', import.meta.url), 'utf8');
    const result = parseUtarHtml([{ name: 'v2.html', text }]);
    expect(result.courses[0].code).toBe('TEST1013');
    expect(result.courses[0].classes.find(c => c.type === 'L')?.meetings).toHaveLength(2);
  });
  ```
- [x] **Step 2:** 執行 `npm --prefix app test -- tests/import`，確認因尚無解析及預覽功能而失敗。
- [x] **Step 3:** 移植 `src/ts/parser/parseStudentHtmlToRawSlot.ts` 與 `_v2.ts` 的表格遍歷及繼承規則，替換 innerHTML 資料讀取為 textContent，使用 Task 1 型別與標準陣列操作。以欄位／表頭辨識版型，不依年份；不確定的結構回報診斷。不完整班別整組排除，不能留下缺會議的可選班別。大小檢查先於讀檔／DOMParser。完成選檔、貼上、多檔拖入、內建範例與確認預覽；範例含 TEST1013 及 TEST2023 兩科，各有 L/T 和可行方案，不預選科目。建立 Vite 共用入口和 `dev:web`、`build:web`、`preview:web` scripts。CSP 禁止匯入 HTML 的腳本、圖片及網路資源執行；不渲染原始 HTML。
- [x] **Step 4:** 執行匯入測試、typecheck、`npm --prefix app run build:web`。用 `npm --prefix app run dev:web -- --host 127.0.0.1` 檢查預覽：瀏覽器不被導向桌面版下載頁，錯誤不替換目前資料。
- [x] **Step 5:** 提交 `feat: import UTAR course pages in the shared web app`。

## Task 3: 移植純排課核心

**Files:** Create `app/src/core/solveTimetables.ts`, `app/src/core/clashes.ts`, `app/tests/core/solveTimetables.test.ts`, `app/tests/core/upstreamParity.test.ts`, `app/tests/fixtures/solver.ts`, `app/tests/fixtures/upstream-cases.json`, `app/UPSTREAM.md`。

**Interfaces:** Consumes `SolveInput`, `MAX_SOLUTIONS`；Produces `meetingsClash(a: Meeting, b: Meeting): boolean`、`solveTimetables(input: SolveInput): SolveResult`。空 selection 回傳空 solutions 且 truncated 為 false；輸入先通過共用驗證。順序由科目、類型、穩定班別 ID 決定，重跑同一資料可重現。

- [x] **Step 1:** 在 `fixtures/solver.ts` 定義 `makeSolveInput(): SolveInput`，包含一科兩個 L 及一個 T，兩個 L 均不與 T 衝堂，斷言 solutions 有 2 筆且每筆 L/T 齊全。另測端點相接、不同週同時段、同週衝堂、多會議不可拆分、固定班別、封鎖時段、無解、同編號跨科、同班別自身會議衝堂。用 10 個獨立二選一分組證明回傳 500 筆且 truncated 為 true，不配置百萬筆結果。
  ```ts
  it('requiresLectureAndTutorial', () => {
    const result = solveTimetables(makeSolveInput());
    expect(result.solutions).toHaveLength(2);
    expect(result.solutions.every(t => t.classIds.length === 2)).toBe(true);
    expect(result.truncated).toBe(false);
  });
  ```
- [x] **Step 2:** 執行 `npm --prefix app test -- tests/core`，確認因缺少核心而失敗。
- [x] **Step 3:** 移植 `src/ts/permutator/findTimetable.ts` 的分組、少選項優先及回溯搜尋流程；以科目／類型分組且同班別 meetings 整組選取。使用半開區間與週次交集保留規則，移除視覺化、UI、全域 TimePeriod 狀態與字串雜湊相依，達 500 筆即停止並回報上限。從上游 `HENG_2017_APR` 提取僅含課程的少量回歸資料，對照既有測試的 MPU3113=3、MPU3113+MPU3123=5、UKMM1043=29、FM2 考慮週次=420、ACP+BKA=0；不引入整份登入 HTML 或舊依賴。於 `UPSTREAM.md` 記錄來源 commit、移植路徑、規則及表現差異。
- [x] **Step 4:** 執行 core 測試、完整單元測試與 typecheck。確認核心無 window、document、React、Electron 匯入，全部對照案例通過後才聲稱規則相容。
- [x] **Step 5:** 提交 `feat: port timetable search into a shared pure core`。

## Task 4: 共用排課畫面與可取消運算

**Files:** Create `app/src/workers/solver.worker.ts`, `app/src/workers/SolverClient.ts`, `app/src/renderer/planner/Planner.tsx`, `app/src/renderer/planner/CourseList.tsx`, `app/src/renderer/planner/ConstraintsPanel.tsx`, `app/src/renderer/planner/TimetableView.tsx`, `app/tests/workers/SolverClient.test.ts`, `app/tests/planner/Planner.test.tsx`; Modify `App.tsx`、`styles.css`。

**Interfaces:** `SolverClient.solve(input: SolveInput): Promise<SolveResult>`、`cancel(): void`、`dispose(): void`；取消使用 AbortError，銷毀 Worker，新的 solve 建立新 Worker。訊息為 `{ requestId, input }` 與 `{ requestId, result }` 或 `{ requestId, error }`。`Planner({ project, onChange }: { project: Project; onChange: (p: Project) => void })` 由 App 持有專案；候選結果不寫回 Project。

- [x] **Step 1:** 使用可控制回覆的 Worker 測試替身，測試 `cancelThenSolve`、`ignoreOldResponseAfterNewImport`、錯誤與 dispose。畫面測試：選科及固定班別可更新 Project；更改不可上課時段後舊結果失效；取消不顯示錯誤；無解顯示目前條件；500 筆上限提示；切換候選／週次會更新課表。課表測試相同時段、不同週的兩堂能在各週正確顯示。
  以測試替身延後 Worker 回覆，在已選科目的 `makeProject()` 測試計算期間的操作：
  ```ts
  it('keepsCancellationAvailableDuringSearch', async () => {
    render(<Planner project={makeProject()} onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(screen.getByRole('button', { name: 'Cancel calculation' })).toBeEnabled();
  });
  ```
- [x] **Step 2:** 執行 `npm --prefix app test -- tests/workers tests/planner`，確認尚無對應行為而失敗。
- [x] **Step 3:** 實作上述介面，套用少量元件狀態與 Web Worker，不把求解搬回主執行緒。條件或專案更換即取消舊工作，requestId 過期回覆不能更動畫面。完成搜尋科目、L/T/P 班別、固定班別、日期／開始／結束時間的限制表單、候選切換與週次選擇；課表顯示時間、科目、類型、班別、教室及週次。科目 checkbox 的 accessible name 為 `{code} {name}`，課表 region 為 Weekly timetable，計算按鈕為 Generate 及 Cancel calculation。桌面三欄、窄視窗面板切換，具標籤、鍵盤焦點及非 hover 操作。
- [x] **Step 4:** 執行本 Task 測試、完整單元測試、typecheck 及 build:web。瀏覽器實際驗證範例可產生課表，計算期間仍可按取消；清空科目不顯示舊成功結果。
- [x] **Step 5:** 提交 `feat: arrange and browse timetables in the shared interface`。

## Task 5: 網頁專案檔存取與未輸出變更

**Files:** Create `app/src/platform/files.ts`, `app/src/platform/browser.ts`, `app/src/renderer/ProjectActions.tsx`, `app/tests/platform/browser.test.ts`, `app/tests/planner/ProjectActions.test.tsx`; Modify `browserFiles.ts`、`App.tsx`。

**Interfaces:** `FilePort` 定義 `pickHtml(): Promise<FileOutcome<HtmlSource[]>>`、`openProject(): Promise<FileOutcome<{ name: string; text: string }>>`、`exportProject(project: Project): Promise<FileOutcome<ExportReceipt>>`；`browserFilePort: FilePort`。`getFilePort(): FilePort` 在沒有 preload 橋接時回傳 browser 實作；Task 6 才接桌面實作。App 的 dirty 比較最後一次已儲存或使用者已確認保留下載的 Project 快照，不包含候選切換；儲存開始後的新變更不能被完成回覆清除。

- [x] **Step 1:** 測試 File API 開啟與 Blob 下載的 JSON round-trip，`status: cancelled` 不替換專案、不清 dirty，錯誤／未知版本／未知參照保留現有 Project。測試產生下載回傳 `{ kind: 'downloaded', name }`，URL.revokeObjectURL 在瀏覽器取得下載後執行。UI 測試 dirty 時開啟／匯入提供 Export / Discard / Cancel，輸出失敗或取消會中止替換；瀏覽器發出下載後仍需使用者明確確認已保留檔案才能清 dirty／繼續替換。測試輸出中的新修改仍 dirty，beforeunload 只在 dirty 時註冊。
  在測試中控制 Blob URL 與 anchor 點擊，驗證回報的能力：
  ```ts
  it('reportsADownloadRatherThanADiskSave', async () => {
    const result = await browserFilePort.exportProject(makeProject());
    expect(result.status).toBe('ok');
    expect(result.status === 'ok' && result.value.kind).toBe('downloaded');
  });
  ```
- [x] **Step 2:** 執行 `npm --prefix app test -- tests/platform tests/planner/ProjectActions.test.tsx`，確認缺少檔案操作與保護流程而失敗。
- [x] **Step 3:** 實作 FilePort、共享 toolbar 與 ProjectActions；檔案選擇取消恢復 UI 可再次操作。開啟先 decodeProject，再確認替換。網頁只顯示 Exported，不宣稱磁碟寫入完成；下載手勢發出後的磁碟取消無法偵測，提供使用者確認已保留下載的操作，不能僅憑手勢自動替換專案。註冊及清理 beforeunload；瀏覽器無 preload 時完整運作。
- [x] **Step 4:** 執行本 Task、完整單元測試、typecheck、build:web。手動匯出再選取檔案，確認課程及條件一致且重新計算得等效課表。
- [x] **Step 5:** 提交 `feat: open and export portable timetable projects on the web`。

## Task 6: Electron 原生檔案與 Windows 應用

**Files:** Create `app/electron.vite.config.ts`, `app/electron-builder.yml`, `app/src/main/index.ts`, `app/src/main/files.ts`, `app/src/main/ipc.ts`, `app/src/preload/index.ts`, `app/src/platform/electron.ts`, `app/src/shared/bridge.ts`, `app/tests/main/files.test.ts`, `app/tests/main/ipc.test.ts`, `app/tests/platform/electron.test.ts`; Modify `files.ts`、`App.tsx`、`app/package.json`、lockfile。

**Interfaces:** `window.ttap?: DesktopBridge`，bridge 包含 FilePort 三個操作，以及 `setDirty(dirty: boolean): void`、`onCloseRequested(handler: () => void): () => void`、`confirmClose(): Promise<void>`。主程序不接收 renderer 提供的任意路徑；所有實際路徑來自原生對話框。renderer 端 Electron adapter 實作 FilePort；main 端共用 validateProject。`main/files.ts` 匯出僅供主程序內部的 `readHtmlPaths(paths: string[]): Promise<HtmlSource[]>`、`readProjectFile(path: string): Promise<Project>`、`writeProjectAtomically(path: string, project: Project): Promise<void>`，讀寫失敗拋出錯誤，由 IPC 轉為 FileOutcome。

- [x] **Step 1:** 以暫存目錄測試讀寫 round-trip、對話框取消、10 MiB 邊界、覆寫既有檔案、寫入與 rename 失敗保留原檔並清理暫存檔。IPC 測試拒絕非主視窗／子 frame、未知來源、非 Project payload；native save 取消不清 dirty。關閉流程測試：有 dirty 時不可直接關閉，只有成功儲存或明確捨棄後才 confirmClose；乾淨視窗直接關閉。
  在 beforeEach 使用 mkdtemp 建立 `tempDir`，afterEach 清理該已驗證的暫存目錄：
  ```ts
  it('roundTripsTheNativeProjectFile', async () => {
    const path = join(tempDir, 'example.ttap.json');
    const project = makeProject();
    await writeProjectAtomically(path, project);
    expect(await readProjectFile(path)).toEqual(project);
  });
  ```
- [x] **Step 2:** 執行 `npm --prefix app test -- tests/main tests/platform/electron.test.ts`，確認尚無 native 行為而失敗。
- [x] **Step 3:** 實作 main / preload、FilePort adapter 與關閉橋接；使用 contextBridge、來源限定 IPC、sandbox / contextIsolation、停用 nodeIntegration，webSecurity 保持開啟。正式版以受控本機 app protocol 載入封裝資源，拒絕越界路徑、任意導覽及新視窗。preload 以 sandbox 可用的 CommonJS bundle 產出，不載入未封裝的本機模組。新增 `dev:desktop`、`build:desktop`、`package:win`（Windows directory target）scripts；只封裝 app/out、必要執行依賴和授權聲明。
- [x] **Step 4:** 執行本 Task、完整單元測試、typecheck、build:web、`npm --prefix app run build:desktop`、`npm --prefix app run package:win`。確認獨立 Windows 可執行目錄產生；實際啟動檢查相同介面與原生存取。
- [x] **Step 5:** 提交 `feat: run the shared planner as a Windows Electron app`。

## Task 7: 兩個正式版本的操作驗證與使用說明

**Files:** Create `app/playwright.config.ts`, `app/tests/e2e/web.spec.ts`, `app/tests/e2e/electron.spec.ts`, `app/tests/e2e/helpers.ts`, `app/README.md`; Modify `app/package.json`、lockfile、根 `README.md` 的新版入口說明、`app/UPSTREAM.md`。

**Interfaces:** 使用正式 `dist-web`、封裝的 Windows executable、同一組 fixtures 及專案檔；不依賴 dev server 才有的能力。新增 `test:e2e:web`（Chromium、Firefox）、`test:e2e:desktop`（Windows Electron）、`check`（型別及單元測試）scripts。

- [ ] **Step 1:** 撰寫 e2e：載入範例 → 選兩科 → 固定班別 → 加入封鎖 → Generate → 切候選／週次 → 匯出 → 重新開啟。加入多檔拖入、無效 HTML、零結果、取消後立即重算、窄視窗鍵盤操作，以及匯入 HTML 的 script / image 不執行／不連網。網頁下載檔帶入 Electron，Electron 檔案再由網頁開啟，斷言課程、條件及 canonical classIds 相等。桌面用實際檔案 I/O，僅在原生對話框選擇位置的邊界提供測試控制。
  共用範例入口的 accessible name 固定為 Try demo，開啟後選科不預設全部勾選；兩個版本都使用相同的 smoke 斷言：
  ```ts
  test('demoCanGenerateATimetable', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try demo' }).click();
    await page.getByRole('checkbox', { name: /^TEST1013 / }).check();
    await page.getByRole('button', { name: 'Generate' }).click();
    await expect(page.getByRole('region', { name: 'Weekly timetable' })).toContainText('TEST1013');
  });
  ```
  Electron 測試使用 firstWindow() 得到 page 後，沿用此段從 Try demo 起的操作，不導覽到 `/`。
- [ ] **Step 2:** 執行兩組 e2e 記錄失敗；已有功能通過的案例保持通過，新增失敗僅定位並修正本計畫範圍內的問題。若無 Firefox runtime 或桌面執行能力，保留測試並標記尚未驗證，不把它當成已通過。
- [ ] **Step 3:** 完成必要修正與說明文件：Node / npm 前提、`npm --prefix app ci`、所有 dev / build / test 命令、輸出位置、匯入步驟、10 MiB 與 500 方案限制、網頁下載語意、未驗證的現行 UTAR 版型。說明保留舊版的入口，新增應用不要求根目錄 npm install；正式站點發佈仍不在本次範圍。
- [ ] **Step 4:** 一次執行 check、兩個正式建置、Windows 封裝及兩組 e2e；全部檢視結果。檢查網頁 bundle 沒有 Electron／Node builtins／require，static preview 與 Windows app 的主要流程通過，`git diff --check` 無錯誤。只有新變更或失敗才重跑相關檢查。
- [ ] **Step 5:** 審閱完整 diff、檢查來源與 MIT 聲明，提交 `test: verify web and Windows planner workflows`。紀錄實際驗證結果及未驗證項目，不能用單元測試替代 runtime 驗證。

## Task 8: 建立真正的 GitHub fork 並保存成果

**Files:** 僅 repository remotes 與 GitHub fork；無產品檔案。

**Interfaces:** `upstream` 保留 `https://github.com/wongjiahau/ttap-web.git`；`origin` 指向實際建立或已存在的使用者 fork；成果分支為 `codex/electron-redesign`。

- [ ] **Step 1:** 檢查當時可用的 GitHub 工具或已登入的 GitHub 瀏覽器帳號；在可操作帳號下建立原專案 fork，或重用其既有 fork。沒有登入時，先完成所有不受影響的本機成果，再請使用者完成登入；不能把本機 checkout 說成遠端 fork。
- [ ] **Step 2:** 確認 GitHub 顯示 fork parent 是 wongjiahau/ttap-web，才將該 URL 設為 origin。已存在 origin 時先核對，不能盲目覆蓋。
- [ ] **Step 3:** 在 Task 7 的必要檢查通過且審閱完成後，push `codex/electron-redesign` 至 origin，不推送 upstream、不 force push、不發佈網站、不建立額外 PR。
- [ ] **Step 4:** 以 GitHub 頁面與 `git ls-remote origin refs/heads/codex/electron-redesign` 核對遠端 SHA，並檢查工作目錄乾淨。交付 fork 連結、啟動命令、網頁與 Windows 產物位置和驗證結果。若遠端登入仍未完成，清楚列為剩餘工作。

## Execution Handoff

建議採 **Native**：由目前代理依 Task 1–8 逐項實作，每個相關測試通過後提交，再做整個分支的獨立審閱。任務依賴同一套資料型別及先前畫面流程，循序實作可減少介面整合與重複上下文成本。

另一方式是 **Subagent-driven**：每個 Task 交給新的實作代理及審閱代理，再進到下一個 Task；需要更多上下文與代理呼叫。兩種方式都必須先由使用者審閱本計畫並選定，之後分別使用 executing-plans 或 subagent-driven-development 技能。
