# AI GPS Navigation — Batch 56

Version: `1.1.0-b56`

## Scope
- Added coordinate validity checks to the navigation lifecycle so missing or out-of-range GPS fixes pause navigation rather than producing invalid live metrics.
- GPS recovery now validates the selected destination and current route before resuming. Invalid route state falls back to `ROUTE_READY` and clears stale live guidance while preserving the planned route summary.
- A stopped navigation session remains stopped when GPS recovers; recovery does not implicitly restart a route that the user has stopped.
- Navigation reroute guards validate the full route identity and destination identity, reject results if the vehicle has moved more than 80 metres during calculation, and preserve offline package provenance when a replacement route is committed.
- Updated current-release test contracts to `1.1.0-b56` and added a dedicated GPS/navigation lifecycle regression suite.

## Validation
- Batch 56 focused suite: 12/12 passed.
- Automated Node.js regression suites: 23 suites passed, 0 failed (browser smoke is reported separately).
- Static QA: 45 JavaScript files, 72 JSON files, 16 required assets, 0 failures.
- Offline data pipeline: passed (3 files, 7 nodes, 14 edges, 2 POIs).
- ZIP integrity check is recorded at package creation.

## Not verified
- Headless Chromium navigation to the local app was blocked by organization policy (`127.0.0.1 is blocked`); this is not counted as a browser pass. See `tests/batch56-browser-smoke-report.json`.
- Physical GPS hardware, mobile device behavior, real-road routing, real-browser IndexedDB fault injection, and Service Worker offline behavior still require acceptance testing.
- Included road and POI content is demonstration data, not a licensed nationwide commercial map dataset.
