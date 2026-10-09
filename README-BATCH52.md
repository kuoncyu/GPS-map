# AI GPS 導航系統 — Batch 52

- Release: `1.1.0-b52`
- Focus: Offline POI search and route package-version consistency.

## Changes
1. `OfflineSearch` reads `places.json` from the active verified package in IndexedDB.
2. Search cache is invalidated when the active package record/version changes.
3. Active package missing `places.json`, malformed JSON, invalid coordinates, package-switch races, or storage lookup errors fail closed; the static POI file is used only when no active package can be confirmed.
4. Search results carry package record ID, package ID, and version metadata.
5. Search UI and AI assistant preserve package metadata in the selected destination.
6. `routeToDestination()` rejects stale search destinations when the routing graph uses a different active package record.
7. `VERSION`, Service Worker cache, and current-release test contracts updated to `1.1.0-b52`.

## Verification
- Batch 52 dedicated tests: 12/12 passed.
- Listed regression suites: 158/158 passed, 0 failed.
- Static QA: 45 JavaScript files, 65 JSON files, 16 required assets, 0 failures.
- Offline data pipeline: passed (3 source files, 7 nodes, 14 edges, 2 POIs).
- Chromium smoke: BLOCKED because the execution environment denies localhost navigation; not counted as a pass.
- Real-browser IndexedDB/Service Worker behavior and physical GPS/device navigation: not tested.

## Limitations
- Included roads and POIs are demonstration data, not a licensed, complete nationwide production map dataset.
- Automated tests use injected/mocked storage and route adapters; they do not replace browser/device acceptance testing.
