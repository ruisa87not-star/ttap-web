# TTAP 網頁版與 Electron 新版設計

日期：2026-10-21
狀態：使用者已於 2026-10-21 確認修訂後的書面設計，進入實作計畫。

## 目標與成功條件

以 `wongjiahau/ttap-web` 為基礎，重新設計 UTAR 排課的介面及操作流程，同時交付新版網頁應用與 Windows Electron 桌面程式。兩個版本共用介面、HTML 匯入流程、資料格式及排課核心。保留原專案的 Git 歷史、MIT 授權及原有排課規則，並在移植後重新驗證。

第一版的完整操作路徑是：匯入 UTAR 課程 HTML、確認資料、選科、設定不可上課時段、產生及切換課表，最後輸出專案檔並能重新開啟。匯入後的排課及資料處理均在本機執行。桌面版可完全離線啟動；網頁版由靜態 HTTP(S) 伺服器提供，頁面載入後的主要操作不依賴後端 API。

使用者已確認：

- 目的是重新設計介面與操作流程，做成新的排課工具。
- 課程來源沿用 UTAR 網頁，優先改善貼上與匯入流程。
- 第一版先支援 Windows，保留排課核心並提供本機存取。
- 同時保留網頁版；新版網頁與桌面端提供同一套主要排課功能。

## 原專案檢查結果

檢查基準為上游 `master` 的 `becbba38d9986b3e624c3ed0bd6eac2171d30244`。

- `src/ts/parser/` 已有學生及 FGO HTML 解析器。
- `src/ts/model/rawSlot.ts` 定義課程、班別、星期、時間、週次、教室等資料。
- `src/ts/permutator/` 提供課表組合演算法，並有考慮週次的版本。
- `src/ts/clashFinder/` 及相關測試提供衝堂規則的參考。
- `src/ts/react/login.tsx` 同時有貼上 HTML 及舊桌面版的內嵌登入相容邏輯。
- 排課程式匯入的視覺化模組依賴 `window` 和 React 配色，不能直接當成獨立運算核心使用。
- 原專案依賴 Create React App、舊 Material UI 與 Redux；React 及 React DOM 的主要版本亦不一致。
- 本次尚未執行舊專案測試，也未驗證目前 UTAR 網頁的結構。舊 HTML 樣本不能視為現行網站相容性的證明。

## 方案選擇

| 方案 | 優點 | 代價 | 決定 |
| --- | --- | --- | --- |
| 在舊應用直接換介面、加入 Electron | 一開始移動的程式較少 | 新介面持續受舊工具鏈及狀態管理限制 | 不採用 |
| 在 fork 內新增共用應用，分別建置網頁及 Electron，移植並驗證排課核心 | 保留歷史及規則，兩個新版共用介面且可獨立建置 | 需要拆除核心對 UI 的依賴，並隔離平台檔案操作 | 採用 |
| 全部重新實作 | 架構自由 | 必須重新證明班別、週次、衝堂等規則 | 不採用 |

## 第一版操作流程

### 1. 匯入及檢查

- 首頁提供貼上 HTML、選取 `.html` / `.htm` 檔案、拖入檔案及載入內建範例。
- 可一次匯入多個 HTML 檔案，以支援課程清單分頁。貼上與檔案使用同一套解析、驗證及重複資料處理規則。
- 匯入檔案總量上限為 10 MiB；瀏覽器讀檔、Electron 主程序讀檔及貼上入口均檢查限制。
- HTML 僅作資料解析，不能插入應用畫面或執行其中的指令碼。
- 預覽顯示來源、科目數、班別數，以及無法辨識的資料和原因。沒有有效課程時不能進入排課。
- 使用者確認匯入後才替換目前資料；取消或解析失敗均保留原本專案。
- 不同來源的重複班別依課程代碼、類型、班別及完整上課時段辨識，不能只依舊版的臨時 UID 合併。

### 2. 選科及限制

- 主畫面左側顯示可搜尋的科目清單，中間顯示週課表，右側顯示限制和候選方案。
- 窄視窗下，科目和限制改為可切換面板，課表可水平捲動；主要操作不能依賴 hover。
- 科目列出代碼、名稱，以及 Lecture / Tutorial / Practical 等實際存在的班別。
- 可以選取科目、固定特定班別，或讓系統選擇該科目的可用班別。
- 可以設定每週不可上課的日期及時間範圍；限制適用於整個學期。
- 條件變更後，先前的候選結果標示為已失效，不能誤當成符合新條件的課表。
- 課程名稱及代碼保留來源原文；第一版 UI 文案沿用原專案的英文，避免同時引入多語系工作。

### 3. 產生及瀏覽課表

- 同一班別的多個上課時段視為不可拆開的選項。班別識別由課程代碼、課程類型及來源班別編號共同組成，避免不同科目的相同編號被合併。
- 每個所選科目，依匯入資料實際存在的課程類型，各選一個班別。例如同時存在 L、T、P 時，三種類型都必須選入；同類型的多個班別則擇一。備註保留供閱讀，不推測未明示的跨類型配對規則。
- 只有星期、時間及上課週次都相交，才判定衝堂。相鄰且端點相接的時段不衝堂。
- 求解在 Web Worker 執行；主畫面保持可操作，並可取消本次運算。
- 每次最多保留 500 個候選方案。達到上限時顯示「已達顯示上限」，不得宣稱這是所有可能方案的總數。
- 可切換候選方案及檢視各週課表；有週次差異的課程清楚標示週次。
- 無解時明確顯示「目前條件下找不到課表」，列出本次選科、固定班別及不可上課時段供使用者修改，不宣稱已找出唯一成因；不能把空白畫面當成成功。

### 4. 專案檔輸出及開啟

- 儲存為帶有 `schemaVersion: 1` 的 `.ttap.json` 檔案，包含課程資料、所選科目、固定班別及不可上課時段。
- 候選課表屬於衍生資料，開啟後重新計算，不依賴舊求解器的內部狀態。
- 網頁版透過標準檔案選擇器及 File API 開啟 HTML 和專案檔，透過 Blob 下載 `.ttap.json`，不要求瀏覽器提供 File System Access API。
- 桌面版的檔案對話框、讀寫及寫入失敗處理由 Electron 主程序負責；renderer 不能指定任意檔案路徑。
- 開啟時驗證檔案類型、大小、版本、欄位、時間及資料參照。檔案損壞或版本不支援時，保留目前工作並顯示可理解的錯誤。
- 桌面版寫入採同目錄暫存檔與替換流程，避免半份 JSON 覆蓋原檔；失敗時回報而不宣稱已儲存。
- 網頁版只能確認已產生下載，不能確認使用者是否把檔案寫入磁碟；提示使用「已匯出」等符合實際能力的文字。
- 替換有未輸出變更的專案時，兩個版本均提供輸出、捨棄或取消。桌面版關閉視窗亦提供此選擇；網頁版重新整理或關閉頁籤則使用瀏覽器提供的 beforeunload 提醒。
- 兩個版本可互相開啟相同版本的 `.ttap.json`，以相同課程資料及條件重新產生等效課表。

## 程式結構

新增獨立的 `app/` 套件，使用 React、TypeScript、Vite、Electron、electron-vite 及 electron-builder。保留上游原有應用及工具鏈，新版不要求先安裝舊應用依賴。

Vite 將共用 renderer 建置成 `app/dist-web/` 靜態網站；electron-vite 將同一個 renderer 與 main / preload 建置成 `app/out/`，再封裝 Windows 應用。兩條建置流程分開執行。網頁產物不包含 Electron、Node.js 或 preload 依賴。

| 位置 | 責任 |
| --- | --- |
| `app/src/main/` | Electron 視窗、原生對話框、檔案讀寫、IPC 來源驗證及生命週期 |
| `app/src/preload/` | 透過 contextBridge 暴露有限的匯入、開啟、儲存操作 |
| `app/src/renderer/` | 兩個版本共用的匯入預覽、選科、限制、課表與錯誤顯示 |
| `app/src/platform/` | 網頁的 File / Blob 操作，以及桌面版 preload 橋接；對 UI 提供相同的選取 HTML、開啟專案及輸出專案介面 |
| `app/src/core/` | 資料模型、正規化、驗證、班別組合、衝堂及求解規則 |
| `app/src/workers/` | 可取消的課表計算，使用具識別碼的請求與回應避免舊結果覆蓋新條件 |
| `app/src/shared/` | 主程序與 renderer 共用的檔案格式、IPC 型別及純資料驗證 |
| `app/tests/fixtures/` | 合成或去識別化的 HTML、課程及專案範例 |

HTML 解析保留在 renderer 的獨立匯入模組，使用 DOMParser 解析隔離文件；不將 DOM API 帶入純排課核心或 Worker。解析出的資料先通過驗證，再進入核心。

平台層根據受控 preload 橋接是否存在選擇檔案操作實作，不依賴 user-agent。網頁版沒有橋接時正常提供完整排課功能，不出現要求下載桌面版的攔截。Electron 專用模組只由 main / preload 匯入。

先移植與第一版相關的核心和測試，移除 UI 視覺化相依，重新驗證原有行為。沒有上課時間的資料及 Industrial Training 依舊版規則不參與自動排課，但在匯入預覽顯示排除原因，不能默默丟棄。React 的畫面狀態先用內建 hooks 管理，不預先引入全域狀態框架。具體套件版本在實作時核對相容性並鎖定於 lockfile。

## Electron 邊界

- renderer 啟用 context isolation 與 sandbox，停用 Node integration。
- 保持 webSecurity 開啟；應用不載入 UTAR 登入頁，也不保管學生帳密。
- preload 僅暴露必要操作，不直接暴露 ipcRenderer 或通用檔案存取。
- IPC 檢查訊息來源和內容；主程序與 renderer 均驗證跨邊界的專案資料。
- 正式版本只載入封裝的本機應用；CSP 限制腳本與網路來源，禁止導覽至任意網站及任意開新視窗。
- 網頁版同樣限制 HTML 來源內容的執行及網路請求，不上傳匯入的課程或專案資料。

## 第一版範圍之外

- UTAR 帳號登入、自動擷取、選課提交及即時名額。
- 雲端帳號、同步、多人協作及自動更新。
- 網頁版 Service Worker、離線冷啟動，以及正式網站託管與發佈。
- macOS / Linux 的打包與相容性承諾。
- 通用 CSV 編輯器、手動建立任意課程、課表最佳化評分。
- PNG / PDF / 行事曆匯出及安裝程式簽章；第一版交付 Windows 可執行目錄及專案檔存取。

## 驗證與交付標準

1. 有文件化的網頁及桌面版開發、測試、靜態網站建置及 Windows 建置命令，且不依賴舊版的 npm install。
2. 測試涵蓋 UTAR HTML 解析、無效及空白輸入、重複資料、分頁合併、班別完整性、相鄰時段、週次衝堂、固定班別及不可上課時段。
3. 以合成資料證明可以找到已知解，也可以正確回報已知無解；移植相關的舊核心案例以檢查規則一致性。
4. 驗證 Worker 取消、條件變更後忽略過期結果，以及候選結果上限的顯示。
5. 專案檔儲存或匯出再開啟後，資料及條件一致；兩個版本可以互開專案檔。無效檔案不破壞目前專案。
6. 型別檢查、相關自動測試、網頁建置及桌面建置通過。以正式網頁產物驗證 Chromium 和 Firefox 的主要流程，並驗證 Windows Electron 視窗的相同流程。
7. 只有實際跑過的測試、畫面操作及打包平台才標示通過；現行 UTAR HTML 相容性仍須用使用者可提供的去識別化樣本另行核對。
8. 保留 MIT 授權與原作者聲明，紀錄移植來源。GitHub 上的 fork 必須以已登入帳號實際建立；設定 upstream 或本機分支不能算已完成遠端 fork。

## 參考資料

- [原專案](https://github.com/wongjiahau/ttap-web/tree/becbba38d9986b3e624c3ed0bd6eac2171d30244)
- [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)
- [electron-vite guide](https://electron-vite.org/guide/)
- [Vite static deployment](https://vite.dev/guide/static-deploy.html)
- [Browser file selection](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/files)
- [Browser downloads](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#download)
