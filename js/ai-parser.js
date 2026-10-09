const norm=s=>String(s||'').trim().toLowerCase();
export function parseIntent(input){const t=norm(input);if(!t)return {type:'UNKNOWN',confidence:0,raw:input};
 const patterns=[
  ['ROUTE_TO',/(導航|帶我去|前往|去|到).{0,2}(.+)/],
  ['SEARCH_POI',/(找|搜尋|查找|附近有).{0,4}(.+)/],
  ['NEARBY',/(附近|周邊).{0,4}(餐廳|咖啡|加油|充電|停車|醫院|超商|銀行|景點|飯店)/],
  ['ROUTE_STATUS',/(還有多久|剩多久|剩下多遠|多久到|幾公里|目前路線|路線狀態)/],
  ['NAV_STATUS',/(現在在哪|目前在哪|目前位置|現在位置|導航到哪|導航狀態)/],
  ['REPEAT',/(再說一次|重說|重複|剛才說什麼)/],
  ['STOP_NAV',/(停止導航|結束導航|取消導航)/],
  ['HELP',/(你能做什麼|可以做什麼|幫助|功能)/]
 ];
 for(const [type,re] of patterns){const m=t.match(re);if(m)return {type,query:(m[2]||m[1]||'').trim(),confidence:0.9,raw:input};}
 return {type:'UNKNOWN',query:input.trim(),confidence:0.2,raw:input};}
