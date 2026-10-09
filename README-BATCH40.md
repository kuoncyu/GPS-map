# Batch 40 — 瀏覽器測試環境診斷與可配置目標

版本：`1.1.0-b40`

## 本批次內容
- 瀏覽器煙霧測試器可使用 `AI_GPS_TEST_URL` 指向已授權的 HTTP(S) 測試部署；未設定時使用專案本機靜態伺服器。
- 可用 `CHROMIUM_PATH` 指定 Chromium 相容瀏覽器執行檔。
- 限制目標 URL scheme，拒絕 URL 內嵌帳密。
- 測試報告記錄 target、targetMode 與 Chromium 路徑。
- 新增 `batch40-browser-harness-contract.mjs`，確認測試器配置、阻擋狀態及版本契約。
- 更新 Service Worker 快取名稱至 `ai-gps-release-v1.1.0-b40`。

## 測試方式
```bash
node --experimental-default-type=module tests/batch40-browser-harness-contract.mjs
node --experimental-default-type=module tests/batch40-browser-smoke.mjs
node --experimental-default-type=module tests/batch38-routing-integration.mjs
node --experimental-default-type=module tests/batch37-user-flow-contract.mjs
node --experimental-default-type=module tests/batch36-navigation-flow.mjs
node --experimental-default-type=module tests/batch35-browser-contract.mjs
node --experimental-default-type=module tests/qa-static.mjs .
node --experimental-default-type=module tests/batch18-pipeline.mjs
```

## 驗收界線
本批次完成測試器設定與契約測試，但目前執行環境對 localhost 的組織政策限制仍存在。除非報告明確顯示瀏覽器 DOM 測試 PASS，否則不可宣稱真實瀏覽器 UI 或離線重新載入已通過。手機/GPS 實機與道路資料驗收亦未完成。

## 版本沿革
目前可恢復的基線為 Batch 18；Batch 19–34 的部分歷史修改尚未取回，本批次不宣稱已完整整合缺失批次。
