// O Atlas pode ser usado tanto em GitHub Pages quanto dentro do OLIMPO.
// Nunca apagar caches de outros apps quando as páginas compartilham a origem.
const APP_VERSION="4.0.4";
const CACHE="atlas-clean-"+APP_VERSION;
const CORE=["./","./index.html","./manifest-v301.webmanifest","./version.json",
  "./atlas-sync.mjs?v=4.0.4","./cloud-sync.mjs?v=4.0.4",
  "./assets/icons/icon-atlas-v301-192.png","./assets/icons/icon-atlas-v301-512.png",
  "./assets/icons/icon-atlas-v301-maskable-512.png"];
const OWN_CACHE_PREFIX="atlas-";
self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      if(key.startsWith(OWN_CACHE_PREFIX)&&key!==CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const scope=new URL(self.registration.scope);
  if(!url.pathname.startsWith(scope.pathname))return;

  const script=/\.(?:mjs|js)$/i.test(url.pathname);
  const metadata=/(?:version\.json|manifest-v301\.webmanifest)$/.test(url.pathname);
  if(event.request.mode==="navigate" || script || metadata){
    // Scripts DEVEM ser buscados no servidor a cada nova execução.
    // O método cache-first anterior mantinha atlas-sync.mjs obsoleto por tempo indefinido.
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:"no-store"});
        if(response.ok){
          const cache=await caches.open(CACHE);
          await cache.put(event.request.mode==="navigate"?"./index.html":event.request,response.clone());
        }
        return response;
      }catch(error){
        return (await caches.match(event.request.mode==="navigate"?"./index.html":event.request))
          || Response.error();
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(async response=>{
    if(response.ok) (await caches.open(CACHE)).put(event.request,response.clone());
    return response;
  })));
});
self.addEventListener("message",event=>{
  if(event.data==="SKIP_WAITING")self.skipWaiting();
});
