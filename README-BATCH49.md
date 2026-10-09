# Batch 49 — 離線資料包生命週期安全

版本：`1.1.0-b49`

## 本批內容

- `Storage.prunePackages()`：在單一 IndexedDB `packages` + `meta` read-write transaction 內讀取資料包與啟用指標，再執行保留策略。
- 清理僅依已驗證且具有 payload 的資料包建立保留集合；每個 package family 至少保留一份，且不刪除目前啟用版本。
- `PackageManager` 新增序列化操作佇列，讓安裝、回滾與清理不會由同一個管理器實例同時交錯執行。
- 新增 `cleanupOldPackages()`，清理後重新讀取啟用資料包並更新管理器狀態。
- 版本與 Service Worker cache 更新至 `1.1.0-b49`。

## 驗證

- Batch 49 專項測試：11/11 通過。
- 回歸測試：Batch 49、48、47、46、45、44、43、42、41、40、38、37、36、35 與 Batch 18 離線資料管線均執行。
- 靜態 QA：45 個 JavaScript、58 個 JSON、16 項必要資產，0 項靜態檢查失敗。
- 真實瀏覽器 IndexedDB 併發／故障注入尚未執行；Chromium smoke test 可能受環境 localhost 政策限制。未將其視為通過。

## 範圍與限制

這批的操作序列化只保證同一個 `PackageManager` 實例內的操作順序；多個分頁或多個管理器實例之間仍需依 IndexedDB 交易保護，並應於真實瀏覽器測試跨分頁競爭。儲存配額不足、瀏覽器崩潰與實機離線啟動仍需進一步驗收。
