# Batch 44 — Navigation Safety During GPS Loss

## Changes
- NavigationEngine detects stale, stopped, unavailable, and GPS error states.
- Active navigation transitions to `GPS_SIGNAL_LOST` and freezes navigation metrics while the fix is unreliable.
- Rerouting is suppressed while GPS is unreliable or navigation is not active.
- A fresh `LIVE_GPS` fix restores `NAVIGATING` and recalculates from the fresh location.
- Stopping navigation while GPS is lost returns to `ROUTE_READY` and does not auto-resume.
- Release and Service Worker cache version updated to `1.1.0-b44`.

## Verification
Run `node --experimental-default-type=module tests/batch44-navigation-gps-safety.mjs` and the regression commands listed in `tests/batch44-pipeline-summary.txt`.

## Limitations
Tests use synthetic coordinates and a mocked routing provider. They do not verify real GPS hardware, physical road navigation, browser UI, or offline reload in a real browser. The existing Batch 19–34 historical integration gap remains documented in the roadmap.
