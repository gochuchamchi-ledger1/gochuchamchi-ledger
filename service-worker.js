const CACHE='gochuchamchi-v52-features';
const CORE=[
 './','./index.html','./manifest.webmanifest',
 './icon-192.png','./icon-512.png','./mascot.png',
 './home-cat.png','./transaction-cat.png','./member-cat.png',
 './report-cat.png','./arrears-cat.png','./report-qr.png'
];
self.addEventListener('install',e=>{
 self.skipWaiting();
 e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
});
self.addEventListener('activate',e=>{
 e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
 ]));
});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 e.respondWith(
  fetch(e.request).then(resp=>{
   if(resp && resp.status===200 && new URL(e.request.url).origin===location.origin){
    const copy=resp.clone();
    caches.open(CACHE).then(c=>c.put(e.request,copy));
   }
   return resp;
  }).catch(()=>caches.match(e.request).then(hit=>hit||(e.request.mode==='navigate'?caches.match('./index.html'):undefined)))
 );
});
