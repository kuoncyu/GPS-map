# AI GPS Navigation System · Batch 9

## Batch 10 — Weather / Parking

This batch extends the offline POI search into route-aware forward information.

### Added
- Offline Up Ahead engine for POIs along the current route/corridor.
- Heading-aware filtering so POIs behind the vehicle are reduced.
- Distance ordering and route-progress ordering.
- Categories including restaurant, coffee, fuel, charging, parking, hospital, convenience and rest stop.
- Offline Cities Ahead dataset for nearby cities/districts.
- Navigation State fields: `nearbyPOIs`, `citiesAhead`.
- Clicking an Up Ahead POI promotes it to the navigation destination.
- Explicit `OFFLINE` / Demo-data presentation.

### Offline principle
All Batch 9 POI and city calculations use local JSON data and browser-side geospatial calculations. No network request is required after the data package has been installed.

### Demo limitation
The included places/cities are demonstration data and are not licensed production map/POI data.


## Batch 10
- Offline weather snapshot with timestamp and explicit `isLive:false`.
- Weather risk can feed Driver Assistance warnings.
- Offline parking dataset with distance, capacity and demo availability.
- Parking results are calculated locally from current destination/location.
- No network is required for weather/parking UI after package installation.


## Batch 11 — Voice Navigation
- Offline Web Speech API voice engine
- Chinese (Taiwan) navigation prompts
- Start / approach-turn / reroute / off-route / arrival announcements
- Duplicate announcement cooldown and speech queue
- Repeat instruction button uses the current navigation state
- Explicitly offline/local; no live voice service required


## Batch 14
Commercial driver UI: focus mode, compact full-map mode, large-text mode, priority safety banner, larger touch targets, responsive side panel, and preserved day/night architecture.

## Current batch
See `README-BATCH39.md` and `tests/batch39-browser-smoke-report.json` for Batch 39 browser smoke tests and limitations.


## Latest increment
See `README-BATCH40.md` for the Batch 40 browser harness configuration and test limitations.


## Latest increment — Batch 56
See `README-BATCH56.md`, `QA-REPORT.md`, and `tests/batch56-summary.json` for GPS/navigation lifecycle safeguards, regression results, and outstanding device/browser acceptance limits.
