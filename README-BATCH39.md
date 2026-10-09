# Batch 39 — 真實瀏覽器互動與離線殼層煙霧測試

版本：`1.1.0-b39`

## 本批次內容
- 新增 `tests/batch39-browser-smoke.mjs`，以 Node.js 內建 HTTP server 啟動靜態應用程式，使用系統 Chromium 的 Chrome DevTools Protocol 執行實際瀏覽器測試，不依賴 Playwright/Puppeteer 套件。
- 測試頁面載入、地圖模式切換、主題切換、離線 POI 搜尋與目的地選取、資料包視窗、路線預覽提示、瀏覽器例外及 Service Worker 快取。
- 測試瀏覽器模擬離線後重新載入應用程式殼層。
- 更新 `VERSION`、Service Worker 快取名稱及版本契約測試。

## 執行方式
在專案根目錄執行：

```bash
node --experimental-default-type=module tests/batch39-browser-smoke.mjs
node --experimental-default-type=module tests/batch38-routing-integration.mjs
node --experimental-default-type=module tests/batch37-user-flow-contract.mjs
node --experimental-default-type=module tests/batch36-navigation-flow.mjs
node --experimental-default-type=module tests/batch35-browser-contract.mjs
node --experimental-default-type=module tests/qa-static.mjs .
node --experimental-default-type=module tests/batch18-pipeline.mjs
```

## 測試結果與界線
已建立 Chromium/CDP 測試器，但目前環境的組織瀏覽政策封鎖 `127.0.0.1`，Chromium 顯示 `Your organization doesn’t allow you to view this site`，所以應用程式互動與離線重載檢查被標記為 `BLOCKED`，不是通過。請參考 `tests/BROWSER-AUTOMATION-SETUP.md` 在允許 localhost 的環境重跑。此測試也不取代 Android/iOS 實機、真實 GPS 或道路資料驗收。

## 版本沿革注意
目前可恢復的基線為 Batch 18，Batch 19–34 的部分歷史修改仍缺失；本批次不宣稱那些未恢復的修改已完整合併。
