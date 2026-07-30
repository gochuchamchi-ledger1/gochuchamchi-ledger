const CACHE='gochuchamchi-v2-20260730';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./mascot.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))]))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
   if(r && r.status===200 && new URL(e.request.url).origin===location.origin){
     const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));
   }
   return r;
 }).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):undefined)));
});