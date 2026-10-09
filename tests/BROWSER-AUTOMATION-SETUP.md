# Browser automation setup and known environment blocker

## Batch 40 updates
`tests/batch40-browser-smoke.mjs` now supports two explicit execution modes:

- Default: serves the checked-out project from a temporary local HTTP server.
- Optional: set `AI_GPS_TEST_URL` to an already running, authorized HTTP(S) test deployment. The runner rejects other URL schemes and embedded credentials.
- Optional: set `CHROMIUM_PATH` to the path of an installed Chromium-compatible executable.

Example in a permitted development environment:

```bash
CHROMIUM_PATH=/usr/bin/chromium node --experimental-default-type=module tests/batch40-browser-smoke.mjs
# Or, only when you have an authorized test deployment:
AI_GPS_TEST_URL=https://your-authorized-test-host.example/ CHROMIUM_PATH=/usr/bin/chromium node --experimental-default-type=module tests/batch40-browser-smoke.mjs
```

## Current environment result
Batch 39 attempted local navigation and Chromium showed `127.0.0.1 is blocked — Your organization doesn’t allow you to view this site`. App DOM checks and offline reload were not run. The result is `BLOCKED`, not pass or product failure. Do not try to bypass organization browser restrictions. Batch 40 makes the test target configurable so the suite can be run against an authorized environment; this does not remove the blocker in this environment.

The report is written to `tests/batch40-browser-smoke-report.json`. Harness configuration contracts are checked separately by `tests/batch40-browser-harness-contract.mjs`.

This is desktop headless-browser coverage only. It does not replace Android/iOS device tests, real GPS tests, or real road-network validation.
