# Batch 43 — GPS stale-fix monitor

## Changes
- Automatically schedule `markStale()` while the browser GPS watch is active.
- Prevent duplicate monitors and clear the monitor when the provider stops.
- Make stale-state transition idempotent and disable live driver assistance when the last fix expires.
- A new valid position restores live GPS state.
- Bumped release and Service Worker cache to `1.1.0-b43`.

## Validation
Run `node --experimental-default-type=module tests/batch43-gps-stale-monitor.mjs`. Tests use a simulated Geolocation API and injected scheduler; no physical GPS hardware, real browser permission prompt, or real-road rerouting was tested.
