# Batch 47 — 離線資料包版本啟用、回滾與恢復

版本：`1.1.0-b47`

## 本批內容
- 新增 IndexedDB `activePackageId` 中繼資料，讓啟用版本不再只靠安裝時間推斷。
- 新增 `Storage.putPackageAndActivate()`，在同一個 IndexedDB readwrite transaction 中寫入已驗證資料包並更新啟用指標。
- 安裝資料包使用不可變的唯一記錄 ID；同一資料包最多保留兩個已驗證版本，支援回復。
- `PackageManager.inspect()` 優先依啟用指標讀取版本，並對舊資料採取相容回退。
- `rollback()` 只切換啟用指標，不刪除新版本；若無有效前版則回報明確錯誤。
- Service Worker cache 與 `VERSION` 更新至 `1.1.0-b47`。

## 驗證
- Batch 47 版本／回滾測試：11/11 通過。
- 測試使用 Node.js、記憶體 Storage mock 與確定性 mock payload；IndexedDB 原子交易以程式碼契約檢查，未在真實瀏覽器執行。
- 實體裝置、真實 GPS、實際瀏覽器 IndexedDB 故障注入仍未驗收。
- Chromium smoke 受執行環境 localhost 政策限制，不能計為通過。
- Batch 19–34 部分歷史修改未完整恢復，仍屬已知整合缺口。

## 回歸測試總覽
- 本批專項：11/11 通過。
- 本次所列回歸測試合計：108 項通過、0 項失敗。
- 靜態 QA：45 JS、55 JSON、16 項必要資產，0 項失敗。
- 離線路網管線通過：3 個檔案、7 個節點、14 條邊、2 個 POI。
