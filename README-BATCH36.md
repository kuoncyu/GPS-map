# AI GPS Navigation — Batch 36

- 新增 `tests/batch36-navigation-flow.mjs`：測試無路線時拒絕啟動、開始/停止狀態轉換，以及 UI 控制器與導航引擎的事件契約。
- 新增 JSON 測試報告與 `PROGRESS-ROADMAP.md`（暫定總計 60 批次）。
- 版本與 Service Worker 快取識別碼更新為 `1.1.0-b36`。

執行：
```bash
node --experimental-default-type=module tests/batch36-navigation-flow.mjs
node --experimental-default-type=module tests/batch35-browser-contract.mjs
node --experimental-default-type=module tests/qa-static.mjs .
node --experimental-default-type=module tests/batch18-pipeline.mjs
```

限制：Node 模組測試不會啟動真實瀏覽器或手機，也不代表 Android GPS、語音、離線重新載入或道路導航已通過驗收。歷史版本缺口見 `PROGRESS-ROADMAP.md`。
