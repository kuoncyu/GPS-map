# Batch 42 — GPS Fix Quality and Freshness

## Changes
- Added `js/gps-quality.js` for accuracy bands, timestamp freshness, and fix-age calculation.
- Browser GPS provider now publishes `gpsQuality` and `gpsLastFixAt`, and rejects stale coordinate fixes.
- Added `markStale()` so the app can explicitly mark a last fix stale and disable live driver-assistance status.
- Added the helper module to the Service Worker precache and bumped release/cache to `1.1.0-b42`.
- Added `tests/batch42-gps-quality.mjs`.

## Acceptance boundary
Automated tests use controlled timestamps and a simulated Geolocation API. They do not establish real device GPS accuracy, physical signal-loss behavior, real road off-route behavior, or successful browser UI execution. `markStale()` is an explicit lifecycle hook; a scheduler or application event must call it periodically for automatic stale detection.

## Tests executed
- GPS quality helper: 6/6 passed.
- Batch 41 GPS provider regression: 9/9 passed.
- Batch 40 browser harness contract: 8/8 passed.
- Batch 38 routing integration: 8/8 passed.
- Batch 37 user-flow contract: 11/11 passed.
- Batch 36 navigation flow: 6/6 passed.
- Batch 35 browser source contract: 13/13 passed.
- Combined assertions: 61/61 passed; static QA: 0 failures; Batch 18 pipeline passed.

Detailed machine-readable results are in `tests/batch42-summary.json` and the `tests/batch42-*` reports.
