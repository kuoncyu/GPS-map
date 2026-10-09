# AI-GPS v1.1 Batch 17 — Provider Architecture

本批將 v1.0.0 Demo Release 升級為可接商用資料來源的 Provider 架構。

## 新增
- Provider contracts：Map / Routing / GPS
- Offline Vector Map Provider
- Browser Geolocation Provider（需使用者授權）
- Offline Graph Routing Provider adapter
- External Routing Provider adapter（未設定 endpoint 時拒絕假造資料）
- Tile Map Provider adapter
- Provider Manager / status UI

## 原則
Demo Provider 與真實 Provider 分離；未設定合法外部服務時，不會假裝存在即時地圖、即時路況或真實道路資料。
