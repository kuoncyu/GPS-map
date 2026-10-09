# AI GPS v1.1 — Batch 18

## Offline Map Data Pipeline

Batch 18 introduces a reproducible GeoJSON → Offline Data Package pipeline.

### Input
- GeoJSON FeatureCollection
- Road `LineString` features
- POI `Point` features

### Output
- `routing/graph.json` — routing graph
- `search/index.json` — searchable offline index
- `poi/places.json` — offline POI dataset
- `manifest.json` — per-file size + SHA-256 verification manifest

### Command
`node tools/map-pipeline/build-offline-package.mjs <roads.geojson> <outputDir>`

### Safety / licensing
The sample data is synthetic demo data. Real OSM or commercial data must be imported only under its applicable license/terms. This pipeline does not claim to create MBTiles or provide live traffic.
