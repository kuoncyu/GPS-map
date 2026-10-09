# QA Report — Batch 56

- Release: `1.1.0-b56`
- Focused navigation/GPS lifecycle tests: 12 passed, 0 failed.
- Automated Node.js regression suites: 23 suites passed, 0 failed, excluding the separately reported browser-smoke result.
- Static QA: 45 JavaScript files, 72 JSON files, 16 required assets, 0 failures.
- Offline pipeline: passed; 3 files, 7 graph nodes, 14 graph edges, 2 POIs.
- Chromium smoke: blocked before UI assertions because the environment policy blocks localhost navigation. This is not a pass; see `tests/batch56-browser-smoke-report.json`.
- Physical GPS/device testing: not performed.
- Data limitation: current road and POI content is demonstrative, not a complete commercial map of Taiwan.
