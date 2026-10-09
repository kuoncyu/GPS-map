# AI GPS 導航系統開發進度（暫定總步驟 60）

> 60 是目前規劃估算，不是商用上線認證；依實測、需求及缺口可調整。

- [x] 01–18：核心 UI、離線路網/搜尋資料、模組與資料管線（可恢復基線：Batch 18）
- [!] 19–34：部分歷史批次目前無法取回，不能宣稱已整合到本次恢復版本
- [x] 35：靜態瀏覽器契約檢查與人工驗收清單（以 Batch 18 為恢復基線）
- [x] 36：導航流程模組測試與 UI 事件契約檢查
- [x] 37：搜尋/目的地/路線/導航/離線下載的原始碼流程契約檢查（非真實瀏覽器）
- [x] 38：離線路由引擎與路線狀態整合測試（Node.js 模組實測，fetch 使用本機 JSON mock）
- [!] 39：已建立 Chromium/CDP 瀏覽器自動化測試器；目前環境的組織瀏覽政策封鎖 localhost，故應用程式 DOM 測試被阻擋，未列為通過
- [!] 40：完成可配置測試 URL、Chromium 路徑與測試器契約檢查；真實 UI/離線重載仍受環境限制，尚未驗收
- [x] 41：GPS Provider 生命週期、座標驗證、權限/定位錯誤狀態與模擬訊號恢復測試（非實機）
- [x] 42：GPS 定位精度分級、座標時間戳新鮮度與過期定位拒收（模擬測試）
- [x] 43：加入 GPS 過期定位定期檢查器、導航輔助安全降級與停止時清理排程；以模擬 API/注入式計時器驗證（非實機）
- [ ] 44–45：GPS 實機驗證、偏航整合與失訊邊界案例
- [ ] 46–50：離線地圖包完整性、更新/回滾、區域包容量與效能
- [ ] 51–55：語音、駕駛警示、交通事件與無障礙測試
- [ ] 56–58：安全、隱私、資源消耗、錯誤恢復與回歸測試
- [ ] 59–60：整合候選版、完整驗收報告與發佈檢查

Batch 36 由目前可恢復的 Batch 35 繼續；Batch 35 是以可取得的 Batch 18 為基線，Batch 19–34 缺失修改尚未恢復。因此 36/60 不是所有歷史功能已完整累積的宣稱。真實瀏覽器與手機測試仍未完成。

Batch 37 由目前可恢復的 Batch 36 繼續；自動化檢查只驗證原始碼契約，真實瀏覽器、手機及離線重新載入仍未完成。

Batch 38 已驗證離線路由與狀態整合；目前環境未安裝 Playwright/Puppeteer，因此真實瀏覽器自動化仍列為未完成。

- [x] 39：以系統 Chromium + Chrome DevTools Protocol 執行真實瀏覽器煙霧測試（桌面 headless 瀏覽器，不含手機/GPS 實機）

Batch 39 的 Chromium 啟動後遇到 `127.0.0.1 is blocked` 組織政策頁，沒有載入應用程式 DOM。測試器與阻擋原因已記錄在 `tests/BROWSER-AUTOMATION-SETUP.md` 和 `tests/batch39-browser-smoke-report.json`；不嘗試繞過該限制。


Batch 40 增加 `AI_GPS_TEST_URL`（僅限 HTTP(S) 且不得內嵌帳密）與 `CHROMIUM_PATH` 設定，讓測試可在已授權的測試部署環境執行；本環境仍不得繞過 localhost 封鎖。設定契約測試不等於瀏覽器 UI 測試通過。


## Batch 41 completion
- Hardened BrowserGeolocationProvider feature detection, lifecycle, coordinate validation, explicit error states and live-status reporting.
- Added simulated GPS lifecycle test suite (`tests/batch41-gps-provider.mjs`) and scope note.
- Updated version/cache to `1.1.0-b41`.
- Acceptance boundary: simulated provider tests only; real phone GPS and browser permission UI remain unverified.


Batch 41 已完成 BrowserGeolocationProvider 的瀏覽器定位 API 防護、經緯度範圍驗證、明確錯誤狀態與有效定位恢復測試。測試使用 Node.js 模擬 Geolocation API；並未驗證實體手機 GPS、作業系統權限視窗或真實道路偏航。


## Batch 42 completion
- Added accuracy classification (`good`/`fair`/`poor`/`unknown`), fix timestamp freshness checks, stale-fix rejection, and an explicit stale-state hook.
- Added deterministic timestamp tests; the application must schedule `markStale()` for automatic stale detection.
- Release/cache version is `1.1.0-b42`; the GPS quality helper is included in Service Worker precache.
- Physical GPS and real browser UI remain unverified.

Batch 42 已加入 GPS 精度分級與定位時間戳新鮮度檢查，並對過期座標回報明確錯誤狀態。測試以模擬 API/固定時間戳進行；`markStale()` 尚需由應用程式排程定期呼叫，真實裝置與真實瀏覽器驗收仍未完成。


## Batch 43 completion
- Added a configurable stale-fix monitor to BrowserGeolocationProvider; it starts with GPS watch, avoids duplicate timers, and is cleared on stop.
- Expired fixes downgrade GPS and driver-assistance live state; repeated stale ticks do not re-emit the transition; a fresh fix recovers live state.
- Added deterministic simulated scheduler tests. This does not prove physical-device GPS or browser permission UI behavior.
- Release/cache version is `1.1.0-b43`.

## Batch 44 completion
- Added navigation safety behavior for GPS stale, stopped, unavailable, and GPS error states.
- Added `GPS_SIGNAL_LOST` navigation state; route metrics remain frozen while location is unreliable.
- Suppressed off-route recalculation during unreliable GPS; fresh `LIVE_GPS` resumes navigation.
- Added Node-based mocked integration tests. Real GPS hardware and real-browser acceptance remain outstanding.
- Release/cache version is `1.1.0-b44`.

## Batch 45 completion
- Added an explicit navigation transition matrix helper for `NAVIGATING`, `GPS_SIGNAL_LOST`, `OFF_ROUTE`, `ARRIVED`, `ROUTE_READY`, and `READY`.
- Added navigation-generation invalidation and async reroute freshness guards; stale route results cannot overwrite stop, GPS-loss, arrival, or a newer planned route.
- Reroute failure only changes status when the originating navigation is still current.
- Added deferred-promise race tests; Batch 45 suite 8/8 passed, listed regression suites 85/85 passed in total.
- Real Chromium smoke remains blocked by the environment's localhost policy; physical GPS/device validation remains unrun.
- Release/cache version is `1.1.0-b45`.


## Batch 46 completion
- Added manifest and path validation, aggregate manifest SHA-256, per-file byte-length and SHA-256 checks, and payload storage only after all checks pass.
- Replaced placeholder package entries with seven existing local JSON assets and actual size/hash values.
- Improved download pause/resume handling and precached the integrity module.
- Batch 46 suite: 12/12 passed; listed regression suites: 97/97 passed; static QA: 0 failures; Batch 18 data pipeline passed.
- Chromium smoke remains blocked by localhost policy; real browser UI and physical GPS/device validation are still outstanding. SHA-256 is integrity checking, not publisher authentication.
- Release/cache version is `1.1.0-b46`.

## Batch 47 — 離線資料包版本啟用與回滾
- 新增 IndexedDB activePackageId，資料包寫入與啟用指標採同一 readwrite transaction。
- 回滾改為切換至前一個已驗證版本，不刪除新版；每個 packageId 最多保留兩個已驗證版本。
- 專項測試 11/11 通過；瀏覽器 IndexedDB 實測與實機測試尚未完成。

## Batch 48 — 離線資料包啟動復原與原子刪除
- 新增 `Storage.reconcileActivePackage()`，在單一 IndexedDB read-write transaction 中核對啟用指標與資料包清單；有效指標會保留，失效指標會復原至最新已驗證版本，沒有有效版本則清除指標。
- `PackageManager.inspect()` 啟動時優先執行一致性復原；不會單純因新版安裝時間較新而覆蓋仍有效的使用者啟用版本。
- `Storage.deletePackage()` 將啟用版本檢查與刪除放在同一交易，避免分離查詢/刪除造成競態。
- Batch 48 專項測試 10/10 通過；列出的自動化回歸測試 118/118 通過；靜態 QA 0 失敗。
- Chromium smoke 仍受 localhost 政策阻擋；真實瀏覽器 IndexedDB 故障注入、實體 GPS 與實機測試尚未完成。
- Release/cache version：`1.1.0-b48`。

## Batch 49 — 離線資料包生命週期安全（1.1.0-b49）
- 新增 `Storage.prunePackages()`，在單一 IndexedDB read-write transaction 內讀取資料包及啟用指標。
- 清理保留目前啟用版本及每個資料包家族的保留數量，避免刪除唯一可用版本。
- `PackageManager` 安裝、回滾與清理操作透過同一操作佇列序列化。
- 新增 `cleanupOldPackages()` 與 10 項專項測試。
- 限制：操作佇列只跨單一 PackageManager 實例；跨分頁併發與瀏覽器故障注入尚待實機驗收。

## Batch 50 — Offline Storage Quota & Install Failure Safety
- Added best-effort browser storage capacity estimation and pre-download quota check.
- Added actionable messages for quota exhaustion and transaction aborts.
- Preserved prior active package on failed update/commit paths.
- Added 8 dedicated automated checks; real browser quota fault injection remains pending.

## Batch 51 — Active Offline Package Routing Integration
- `OfflineRouter` now reads `routes.json` from the active verified package stored in IndexedDB, rather than silently routing from a separate static file when a package is active.
- Package ID/version changes invalidate the cached graph. Missing routes, invalid JSON, or invalid graph shape fail closed to prevent mixed-version routing.
- `OfflineVectorMapProvider` metadata now reports the actual active package ID/version and offline availability.
- Batch 51 dedicated suite 9/9 passed; listed regression suites 146/146 passed; static QA 0 failures; Batch 18 offline data pipeline passed.
- Chromium remains blocked by the environment localhost policy. Real-browser IndexedDB, Service Worker cache behavior, physical GPS and real-road navigation remain unverified. Existing map data is demonstrative, not a full commercial nationwide map dataset.
- Release/cache version: `1.1.0-b51`.

## Batch 52 — Offline Search and Package Version Consistency
- `OfflineSearch` now reads `places.json` from the active verified IndexedDB package and refreshes its cache when the active record/version changes.
- An active package missing `places.json`, invalid POI records, malformed JSON, or an IndexedDB lookup failure fails closed instead of silently falling back to a different static POI dataset.
- Search results carry package record/version metadata; UI and AI destination selection preserve it, and `routeToDestination()` rejects a route if the active routing graph belongs to a different package record.
- Batch 52 dedicated suite: 12/12 passed; listed automated regression checks: 158/158 passed; static QA: 0 failures; offline data pipeline passed.
- Chromium smoke remains blocked by the environment localhost policy. Real-browser IndexedDB/Service Worker and physical GPS/device validation remain unverified. The current POI/road datasets remain demonstration data, not a full nationwide commercial map.
- Release/cache version: `1.1.0-b52`.


## Batch 53 — Destination-to-route consistency
- Validate destination coordinates and reject stale async route results.
- Enforce selected destination and active package record consistency before committing route state.
- Add destination/routing integration regression coverage.

## Batch 56 — GPS／導航生命週期整合
- 對導航中的 GPS 座標加入有效性檢查；缺少座標或超出經緯度範圍時暫停導航，避免即時距離與 ETA 被無效資料污染。
- GPS 恢復時先驗證目的地與路線；若狀態不完整則退回 `ROUTE_READY`，保留已規劃路線並清除過期引導資訊。
- 導航停止後不會因 GPS 恢復而自動重啟；重新規劃結果須通過目的地、路線身分及位置移動幅度檢查，並保留離線資料包來源資訊。
- Batch 56 專項測試 12/12 通過；23 組 Node.js 自動化回歸套件通過；靜態 QA 0 失敗；離線資料管線通過。
- Chromium 本機頁面測試受組織政策阻擋，未計為通過；實體 GPS、真實道路及真實瀏覽器離線驗收仍待完成。
- Release/cache version：`1.1.0-b56`。

## Batch 57 — 導航重新規劃提交契約
- 新增 `validateRerouteResult()`，在提交替代路線前驗證目的地座標、路線點數、所有路線座標、距離及行駛時間。
- `maybeReroute()` 在請求前檢查 GPS 與目的地；非同步結果回來後再次檢查導航狀態、路線身分、目的地身分、定位有效性及車輛位移。
- 若導航在請求完成前已停止，丟棄過期結果；若路線結果格式錯誤，不覆蓋原路線。
- Batch 57 專項測試 13/13 通過；24 組 Node.js 回歸測試通過；靜態 QA 0 失敗；離線資料管線通過。
- 兩個 browser-smoke 腳本本批未執行，沒有計入通過數；真實瀏覽器、實體 GPS 與道路驗收仍待完成。
- Release/cache version：`1.1.0-b57`。

## Batch 58 — 路線規劃交易一致性
- 將目的地與路線提交視為單一交易，檢查請求序號、目的地身分、路線格式及離線資料包來源。
- 連續規劃時拒絕舊請求覆蓋新請求；目的地變更或路線資料無效時不提交結果。
- 專項測試 11/11 通過；Chromium 與實體裝置驗收仍待完成。
- Release/cache version：`1.1.0-b58`。

## Batch 59 — 離線路網資料與輸入驗證
- 新增 `validateRoutingGraph()`，檢查節點 ID、座標、道路邊端點、距離及通行時間，靜態路網與已啟用資料包路網都必須通過驗證。
- 路線計算前驗證起點、目的地、途經點座標；無效輸入或空路網會以明確錯誤停止規劃。
- Batch 59 專項測試 14/14 通過；26 個 Node.js 測試檔通過、0 失敗；靜態 QA 0 失敗；離線資料管線通過。
- Chromium smoke 實際嘗試但因組織政策封鎖 localhost 而 BLOCKED；實體 GPS、真實道路及完整瀏覽器離線驗收仍待完成。
- Release/cache version：`1.1.0-b59`。
