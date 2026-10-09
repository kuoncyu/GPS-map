# AI GPS Navigation — Batch 37

- 新增 `tests/batch37-user-flow-contract.mjs`，檢查搜尋/選取目的地、路線控制、導航開始停止、離線下載保護、網路事件與 Service Worker 離線資源契約。
- 新增 `tests/batch37-user-flow-report.json` 測試報告與 `tests/BATCH37-TEST-SCOPE.md` 測試範圍說明。
- 更新版本與 Service Worker 快取識別碼為 `1.1.0-b37`。
- `PROGRESS-ROADMAP.md` 加入 Batch 37 進度與真實瀏覽器測試限制。

執行：
```bash
node --experimental-default-type=module tests/batch37-user-flow-contract.mjs
node --experimental-default-type=module tests/batch36-navigation-flow.mjs
node --experimental-default-type=module tests/batch35-browser-contract.mjs
node --experimental-default-type=module tests/qa-static.mjs .
node --experimental-default-type=module tests/batch18-pipeline.mjs
```

限制：本批次自動化是原始碼契約檢查，未啟動真實瀏覽器或真機。歷史版本缺口請見 `PROGRESS-ROADMAP.md`。
