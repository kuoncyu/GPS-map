# Offline Map Data Pipeline — Batch 18

用途：把標準 GeoJSON（道路 LineString + POI Point）轉成可驗證的離線 Routing Graph、Search Index、POI 資料與 SHA-256 manifest。

## 執行

```bash
node tools/map-pipeline/build-offline-package.mjs tools/map-pipeline/sample-taipei.geojson dist-offline/tpe
```

輸出：
- `routing/graph.json`
- `search/index.json`
- `poi/places.json`
- `manifest.json`

這是資料管線，不會聲稱自己產生 MBTiles。真正的 Vector Tile / MBTiles 需要由對應地圖資料工具鏈建立，再以相同 manifest 機制納入 Offline Package。
