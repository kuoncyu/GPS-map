# Batch 41 — GPS Provider lifecycle tests

## Scope
- Validate GPS provider capabilities and configurable watch options.
- Verify duplicate starts do not create duplicate geolocation watches.
- Verify valid coordinate updates and conversions (m/s to km/h).
- Reject invalid latitude/longitude and keep live assistance disabled.
- Map permission denial, position unavailable and timeout to explicit status values.
- Verify stopping clears the browser watch and marks the provider non-live.
- Verify missing Geolocation API reports `UNAVAILABLE` rather than simulated live GPS.

## Run
```bash
node --experimental-default-type=module tests/batch41-gps-provider.mjs
```

## Limits
The test supplies a simulated `navigator.geolocation` API in Node.js. It validates provider behavior but does not prove device GPS accuracy, browser permission UI, background execution, or satellite reception on a physical phone.
