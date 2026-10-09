# AI GPS 導航系統 — Batch 51

- Release: `1.1.0-b51`
- Focus: 將已啟用且通過驗證的離線資料包實際接入路線規劃與地圖 Provider metadata。

## 本批變更

1. `OfflineRouter` 優先讀取 `Storage.reconcileActivePackage()` / `Storage.getActivePackage()` 所回傳之已驗證資料包中的 `routes.json` payload，不再在已有啟用資料包時默默改讀靜態檔案。
2. 啟用資料包缺少 `routes.json`、JSON 格式錯誤或 graph 缺少 `nodes` / `edges` 時，明確停止規劃，避免混用不同版本資料。
3. 當 active package ID 或版本變更時，路網快取重新載入；沒有啟用資料包時，保留既有靜態資料 fallback，供尚未安裝資料包的開發／示範流程使用。
4. `OfflineVectorMapProvider.getMapMetadata()` 回報實際啟用資料包 ID、版本與可用狀態。
5. `VERSION`、Service Worker cache 及目前版本契約測試更新至 `1.1.0-b51`。

## 驗證

- Batch 51 專項：9/9 passed。
- 列出的 16 個自動化回歸套件：146/146 passed，0 failed。
- 靜態 QA：45 JavaScript、63 JSON、16 required assets，0 failures。
- Batch 18 離線資料管線：通過（3 source files、7 nodes、14 edges、2 POIs）。
- Chromium smoke：BLOCKED，執行環境政策阻擋 localhost；0 passed、0 failed、1 blocked，不計入通過數。

## 驗收界線

專項測試使用注入的 storage/fetch adapter，並非真實瀏覽器 IndexedDB 測試。真實瀏覽器、Service Worker 實際快取、實體手機 GPS 與道路導航仍未驗收。現有圖資仍為示範資料，並非完整全台商用圖資。
