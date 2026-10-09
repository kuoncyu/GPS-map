# Batch 35 — Manual Browser UI Acceptance Checklist

These checks require a real browser; they are **not marked as passed** by the static contract test.

## Desktop and mobile browser
- [ ] Open the app from a local HTTPS/static server and confirm the map shell and navigation controls render without console errors.
- [ ] Search for a known bundled place; select a result and confirm the destination is reflected in route planning.
- [ ] Calculate a route and compare the displayed summary with the selected route.
- [ ] Switch to an alternative route and confirm route line and summary update together.
- [ ] Start navigation; verify the start button/state changes and next-action area becomes meaningful.
- [ ] Stop navigation; verify active guidance ends and the app remains usable.
- [ ] Clear route; verify stale route summary and guidance are cleared.
- [ ] Check GPS denied, unavailable, and granted states; never interpret demo coordinates as live GPS.
- [ ] Download/install a data package while online, then reload with network disabled and confirm bundled UI/data remain available.
- [ ] Reopen after a service-worker update; confirm old cache is replaced and there is no blank screen.
- [ ] On a narrow Android viewport, confirm search, route controls, modal/download controls, and text remain usable without horizontal overflow.
- [ ] Inspect browser console and network panel for missing files, rejected promises, and unhandled errors.

## Test evidence to record
- Browser/version and device/viewport
- Online/offline state
- Steps and expected/actual result
- Console/network errors
- Screenshot or screen recording for each failure
