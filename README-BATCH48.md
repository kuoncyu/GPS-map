# Batch 48 — 離線資料包啟動復原與原子刪除

版本：`1.1.0-b48`

## 本批內容
- `Storage.reconcileActivePackage()` 在單一 IndexedDB read-write transaction 內讀取資料包清單與 `activePackageId`，保留有效啟用版本；若指標缺失或指向無效資料，則選擇最新的已驗證且具有 payload 的版本，若沒有有效版本則清除啟用指標。
- `PackageManager.inspect()` 啟動檢查時優先執行一致性復原，並保留有效但較舊的明確啟用版本，不會只因安裝時間較新就切換版本。
- `Storage.deletePackage()` 在同一個 IndexedDB read-write transaction 內檢查啟用指標並刪除資料，避免先查詢、後刪除的競態窗口。
- Service Worker cache 與 `VERSION` 更新至 `1.1.0-b48`。

## 驗證
- Batch 48 專項測試：10/10 通過。
- 列出的自動化回歸測試：118/118 通過。
- 靜態 QA：45 個 JavaScript、56 個 JSON、16 項必要資產，0 項失敗。
- Batch 18 離線路網管線：通過（3 個檔案、7 個節點、14 條邊、2 個 POI）。

## 驗收限制
本批測試包含 PackageManager 模擬儲存測試與 IndexedDB 原子交易的靜態契約檢查；沒有執行真實瀏覽器 IndexedDB 故障注入。Chromium smoke test 仍受環境 localhost 政策阻擋，實體手機 GPS 與真實道路測試尚未完成。
