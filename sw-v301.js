const APP_VERSION="3.0.2";
const CACHE="atlas-clean-"+APP_VERSION;
const CORE=["./","./index.html","./manifest-v301.webmanifest","./version.json","./assets/icons/icon-atlas-v301-192.png","./assets/icons/icon-atlas-v301-512.png","./assets/icons/icon-atlas-v301-maskable-512.png"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener("activate",e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const u=new URL(e.request.url); if(u.origin!==self.location.origin)return;
 if(u.pathname.endsWith("/version.json")||u.pathname.endsWith("/manifest-v301.webmanifest")){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match(e.request)));return}
 if(e.request.mode==="navigate"){e.respondWith((async()=>{try{const r=await fetch(e.request,{cache:"no-store"});const c=await caches.open(CACHE);c.put("./index.html",r.clone());return r}catch(_){return (await caches.match("./index.html"))||(await caches.match("./"))}})());return}
 e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(async r=>{if(r.ok)(await caches.open(CACHE)).put(e.request,r.clone());return r})))
});
self.addEventListener("message",e=>{if(e.data==="SKIP_WAITING")self.skipWaiting()});
