# AI GPS Navigation — Release Acceptance Checklist

Release candidate: `1.1.0-b60`

## Automated checks completed
- [x] Release version matches between `VERSION`, PWA manifest, Service Worker cache identifier, and smoke-test expectation.
- [x] All first-party JavaScript, CSS, and JSON assets are listed in the Service Worker precache.
- [x] Local JavaScript module imports resolve to existing project files.
- [x] Bundled JSON files parse successfully.
- [x] Offline fallback is limited to document navigations; missing non-document resources do not receive HTML as a fake successful response.
- [x] Node.js regression suite: 27 test files passed, 0 failed (two browser-smoke scripts excluded from the Node-only loop).
- [x] Release-readiness suite: 8/8 passed.
- [x] Static QA: 45 JavaScript files, 80 JSON files, 16 required assets, 0 failures.
- [x] Offline routing data pipeline: 3 files, 7 nodes, 14 edges, 2 POIs.
- [x] ZIP integrity test passed.

## Required before commercial production
- [ ] Run the application in a supported browser on an actual HTTP(S) origin and complete interactive UI smoke tests. The current environment blocks localhost navigation in Chromium, so this item is not passed.
- [ ] Validate Service Worker installation, cache population, offline reload, update activation, and rollback in a real browser.
- [ ] Test browser GPS permissions, GPS loss/recovery, heading/speed accuracy, and route arrival on physical devices.
- [ ] Test navigation on representative real-world roads and edge cases, including rerouting, closed roads, tolls, ferries, and no-route situations.
- [ ] Supply and validate licensed, up-to-date nationwide road, address, and POI data. Current bundled route graph and POIs are demo data only.
- [ ] Complete privacy, security, accessibility, performance, battery-use, and app-store/release compliance reviews.

## Release decision
**Not yet certified for commercial production.** The automated project checks pass, but browser/device acceptance and production-grade map-data validation remain open.
