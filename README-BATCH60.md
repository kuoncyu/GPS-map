# Batch 60 — Release Readiness

Version: `1.1.0-b60`

## Changes
- Aligned `VERSION`, PWA manifest version, Service Worker cache ID, and executable smoke-test release expectations.
- Added the missing `js/guidance.js` module to the Service Worker precache list.
- Restricted offline HTML fallback to document navigations. Failed offline JS/JSON/CSS requests now return HTTP 503 instead of incorrectly returning `index.html` as a successful resource.
- Added release-readiness checks for version parity, precache coverage, local JS imports, JSON parsing, offline fallback behavior, and cache cleanup.

## Validation limits
Node.js and static checks do not prove physical GPS behavior or actual offline behavior in a production browser. Chromium local navigation has previously been blocked by the execution environment; that remains a release acceptance item. Bundled route/POI data is demonstration data, not a complete nationwide commercial map.
