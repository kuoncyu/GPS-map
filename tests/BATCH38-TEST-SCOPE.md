# Batch 38 — Offline routing runtime integration

## Included checks
1. Bundled graph and demo traffic snapshot load.
2. Route calculation between known graph nodes returns valid geometry and positive distance/time.
3. Highway avoidance is honored when a feasible alternative exists.
4. Toll avoidance is honored.
5. Waypoints appear in the calculated node sequence.
6. `routeToDestination` updates the application to `ROUTE_READY` and populates route/destination/remaining metrics.
7. Missing destination is rejected.
8. A graph whose edges are all blocked returns a no-route error.

## Scope limits
- `fetch` is mocked to load local JSON files; no internet is used.
- Tests run against actual routing/traffic modules in Node.js.
- No real browser, DOM interaction, GPS hardware, voice output, or device offline reload is tested.
- Playwright and Puppeteer are not installed in this environment.
