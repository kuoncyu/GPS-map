const CACHE='ai-gps-release-v1.1.0-b60-hotfix1';
const ASSETS=[
'./','./index.html','./css/reset.css','./css/variables.css','./css/main.css','./css/map.css','./css/offline.css',
'./js/app.js','./js/state.js','./js/providers.js','./js/provider-contracts.js','./js/gps-provider.js','./js/gps-quality.js','./js/map-provider.js','./js/routing-provider.js','./js/provider-manager.js','./js/provider-ui.js',
'./js/offline-manager.js','./js/storage.js','./js/offline-package-integrity.js','./js/package-manager.js','./js/map.js','./js/gps.js','./js/routing.js','./js/route-ui.js','./js/navigation.js','./js/search.js','./js/search-ui.js','./js/traffic.js','./js/traffic-ui.js','./js/driver-assistance.js','./js/driver-ui.js','./js/up-ahead.js','./js/up-ahead-ui.js','./js/voice.js','./js/voice-ui.js','./js/weather.js','./js/weather-ui.js','./js/parking.js','./js/parking-ui.js','./js/ai-parser.js','./js/ai-assistant.js','./js/ai-assistant-ui.js','./js/guidance.js','./js/commercial-ui.js','./js/media.js','./js/media-ui.js','./js/phone.js','./js/phone-ui.js','./js/notifications.js','./js/notifications-ui.js',
'./data/routes.json','./data/places.json','./data/traffic.json','./data/driver-alerts.json','./data/package-manifest.json','./data/weather.json','./data/parking.json','./data/cities.json','./data/manifest.json'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  event.respondWith(caches.match(request).then(cached=>{
    if(cached)return cached;
    return fetch(request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});}
      return response;
    }).catch(()=>{
      if(request.mode==='navigate'||(request.headers.get('accept')||'').includes('text/html'))return caches.match('./index.html');
      return new Response('Offline resource unavailable',{status:503,statusText:'Service Unavailable',headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    });
  }));
});
