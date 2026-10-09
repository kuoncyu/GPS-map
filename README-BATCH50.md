# Batch 50 — Offline Storage Quota & Install Failure Safety

Release: `1.1.0-b50`

## Scope
- Added `Storage.estimateCapacity()` around the browser Storage Manager estimate API. Unsupported or denied estimates degrade safely and do not prevent installation by themselves.
- Added a best-effort quota preflight before downloading package payloads. If the browser reports less available space than the declared package size, installation is rejected before network transfer.
- Normalized quota and transaction-abort errors into actionable Traditional Chinese messages.
- Kept package persistence/activation behind `Storage.putPackageAndActivate()` after payload verification; a failed commit is not reported as success and the prior active record is not overwritten by the mocked failure path.
- Updated release version and service-worker cache to `1.1.0-b50`.

## Validation
- Dedicated suite: `tests/batch50-storage-quota-safety.mjs` — 8/8 passed.
- Browser quota behavior and actual IndexedDB quota exhaustion were not exercised in a real browser. `navigator.storage.estimate()` is an estimate, not a reservation; another tab or process can consume space after preflight.
- Chromium smoke testing remains subject to the environment's localhost restriction; no physical-device GPS validation was performed.

## Regression totals
- 15 listed regression suites: 137 automated checks passed, 0 failed.
- Static QA: 45 JavaScript files, 61 JSON files, 16 required assets, 0 failures.
- Offline pipeline: passed (3 source files, 7 nodes, 14 edges, 2 POIs).
- Chromium smoke test was attempted and blocked by environment policy (`127.0.0.1 is blocked`); it is explicitly not counted as a pass.
