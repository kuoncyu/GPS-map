# Batch 60 Hotfix 1 — Route Preview Overlay

Version: `1.1.0-b60-hotfix1`

## Fixed
- Corrected `.route-preview[hidden]` so the modal is actually hidden on initial page load. Previously `.route-preview { display:flex }` could override the browser's default hidden rendering and cover the app, leaving users stuck on “完整路線預覽”.
- Bumped the PWA manifest version and Service Worker cache ID so GitHub Pages users receive the corrected CSS rather than an older cached build.
- Added `tests/batch60-route-preview-hidden-regression.mjs` to protect initial-hidden, open-handler, and close-handler behavior.

## Deploy
Upload the contents of this project folder to the GitHub Pages publishing root. Keep `VERSION` at the same level as `index.html`; it is release metadata, not a folder or script. If the old site remains cached, unregister the site's Service Worker or clear site data once, then reload.

## Limitations
This hotfix fixes the verified initial overlay visibility defect. Real browser/device navigation, GPS, and nationwide map data still require separate acceptance testing.
