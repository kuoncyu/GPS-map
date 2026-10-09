# AI GPS Navigation — Batch 35

## Scope
Adds a repeatable static browser-contract smoke suite and a manual real-browser acceptance checklist. Updates release/cache identifiers to `1.1.0-b35`.

## Run the checks
From this directory:

```bash
node --experimental-default-type=module tests/batch35-browser-contract.mjs
```

The test writes `tests/batch35-browser-contract-report.json` and exits nonzero if a contract fails.

## Test boundary
The automated suite validates source markup, expected control IDs, app references, Service Worker cache version, offline fallback declaration, and precache asset existence. It does **not** launch Chromium/Firefox, simulate actual clicks, verify rendered layout, or exercise real GPS/network transitions. Use `tests/BATCH35-MANUAL-UI-CHECKLIST.md` for the browser/device acceptance pass.

## Project lineage note
This package was reconstructed from the latest retrievable Library archive, Batch 18, because the Batch 33/34 archives were not available in the current working environment or Library. Therefore this ZIP is a **Batch 18-based recovery snapshot with Batch 35 checks**, not a claim that unretrievable Batch 19–34 changes are integrated. Keep the prior Batch 18 ZIP as the recoverable base until newer source archives can be supplied or recovered.
