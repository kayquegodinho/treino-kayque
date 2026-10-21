import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const source = readFileSync(new URL('../sw-v301.js', import.meta.url), 'utf8');
const sync = readFileSync(new URL('../atlas-sync.mjs', import.meta.url), 'utf8');
const version = JSON.parse(readFileSync(new URL('../version.json', import.meta.url), 'utf8')).version;

function serviceWorkerFixture() {
  const handlers = {};
  const events = [];
  const cacheData = new Map([
    ['hermes-preserve-v1',new Map()],
    ['atlas-clean-4.0.2',new Map()],
  ]);
  cacheData.get('atlas-clean-4.0.2').set(
    'https://olimpo.example/atlas/atlas-sync.mjs?v=4.0.4',
    new Response('JS ANTIGO')
  );
  const network = [];
  const caches = {
    keys: async () => [...cacheData.keys()],
    delete: async key => cacheData.delete(key),
    open: async key => {
      if (!cacheData.has(key)) cacheData.set(key, new Map());
      const records = cacheData.get(key);
      return {
        addAll: async urls => { for(const url of urls) records.set(new URL(url,'https://olimpo.example/atlas/').href,new Response('saved')); },
        put: async (request,response) => records.set(
          typeof request === 'string' ? new URL(request,'https://olimpo.example/atlas/').href : request.url,
          response
        ),
      };
    },
    match: async request => {
      const url = typeof request === 'string' ?
        new URL(request,'https://olimpo.example/atlas/').href : request.url;
      for (const records of cacheData.values()) if(records.has(url)) return records.get(url);
      return undefined;
    },
  };
  const self = {
    location: {origin:'https://olimpo.example'},
    registration: {scope:'https://olimpo.example/atlas/'},
    clients: {claim: async()=>{}},
    skipWaiting() {},
    addEventListener(type,listener) { handlers[type]=listener; },
  };
  const fetch = async(request,init) => {
    network.push({url:request.url,cache:init?.cache});
    return new Response('JS NOVO',{status:200});
  };
  runInNewContext(source,{self,caches,URL,Response,fetch});
  async function fire(type,request=null){
    let done=null, responded=null;
    const event={
      request,
      waitUntil(promise){done=promise;},
      respondWith(promise){responded=promise;},
    };
    handlers[type](event);
    if (done) await done;
    return responded ? await responded : undefined;
  }
  return {fire,network,cacheData};
}

test('versão e importações têm cache bust sincronizado',()=>{
  assert.equal(version,'4.0.4');
  assert.match(index,/data-atlas-shell="4\.0\.4"/);
  assert.match(index,/const ATLAS_VERSION = "4\.0\.4"/);
  assert.match(index,/atlas-sync\.mjs\?v=4\.0\.4/);
  assert.match(sync,/cloud-sync\.mjs\?v=4\.0\.4/);
  assert.match(sync,/atlasVaultFingerprint/);
});

test('Atualizador Android faz GET simples ao GitHub, sem preflight CORS',async()=>{
  const start=index.indexOf('async function rawFetch(path){');
  const end=index.indexOf('async function fetchRemoteAtlasVersion(){',start);
  assert.ok(start>=0 && end>start, 'A função rawFetch deve estar presente');
  const source=index.slice(start,end);
  const requests=[];
  const context={
    Date,
    fetch:async(url,options)=>{
      requests.push({url,options});
      return {ok:true};
    },
  };
  runInNewContext(
    'const ATLAS_RAW_BASE="https://raw.githubusercontent.com/kayquegodinho/treino-kayque/main/";\n'+
    source+'\n'+
    'globalThis.testUpdate=rawFetch;',
    context
  );
  await context.testUpdate('version.json');
  await context.testUpdate('index.html');
  assert.equal(requests.length,2);
  for(const req of requests){
    assert.match(req.url,/^https:\/\/raw\.githubusercontent\.com\/.+\?t=\d+$/);
    assert.equal(req.options.mode,'cors');
    assert.equal(req.options.cache,'no-store');
    assert.equal(Object.hasOwn(req.options,'headers'),false,
      'Cabeçalhos não essenciais acionam OPTIONS e bloqueiam o raw.githubusercontent.com');
  }
});

test('Atlas atualiza em novo documento sem perder registros nem travar abas, Android e Olimpo',async()=>{
  const start=index.indexOf('const ATLAS_VERSION = "4.0.4";');
  const end=index.indexOf("forceUpdateBtn?.addEventListener('click',forceAtlasUpdate);",start);
  assert.ok(start>=0 && end>start,'Atualizador precisa estar presente');
  const updater=index.slice(start,end);
  const html='<!doctype html><html><body>const ATLAS_VERSION = "4.0.4";</body></html>';
  assert.doesNotMatch(index,/document\.(?:open|write|close)\s*\(/);
  assert.match(index,/\.tab"\)\.forEach\(b=>b\.onclick=/);
  assert.match(index,/\.bottomnav button"\)\.forEach\(b=>b\.onclick=/);
  assert.doesNotMatch(index,/\blocalStorage\.setItem\(["']atlasShellHtml/);
  for(const native of [false,true]){
    const origin=native
      ? 'https://kayquegodinho.github.io/treino-kayque/'
      : 'https://olimpo.example/atlas/';
    const memory=new Map([['atlasData','{"days":{"2026-10-21":{"done":true}}}']]);
    const nodes=new Map([
      ['manualCurrentVersion',{textContent:''}],
      ['manualUpdateStatus',{textContent:''}],
      ['forceUpdateBtn',{disabled:false,textContent:''}],
    ]);
    const navigations=[];
    const downloads=[];
    let workerCalls=0;
    const context={
      Date, URL,
      document:{
        baseURI:origin,
        getElementById:id=>nodes.get(id)||null,
        open:()=>{throw Error('document.open proibido durante update');},
        write:()=>{throw Error('document.write proibido durante update');},
      },
      navigator:{serviceWorker:{getRegistrations:()=>{
        workerCalls++;
        throw Error('InvalidStateError: document invalid state');
      }}},
      window:{location:{replace:url=>navigations.push(url)}},
      localStorage:{
        getItem:key=>memory.get(key)||null,
        setItem:(key,value)=>memory.set(key,value),
      },
      fetch:async url=>{
        downloads.push(url);
        return {
          ok:true,
          json:async()=>({version:'4.0.4'}),
          text:async()=>html,
        };
      },
    };
    runInNewContext(
      'const atlasNativeAndroid='+native+';\n'+updater+'\nthis.triggerUpdate=forceAtlasUpdate;',
      context
    );
    await context.triggerUpdate();
    assert.equal(memory.get('atlasData'),'{"days":{"2026-10-21":{"done":true}}}');
    assert.equal(memory.has('atlasShellHtml'),false,'Não guardar HTML para injetar em outras abas');
    assert.equal(navigations.length,1);
    assert.ok(navigations[0].startsWith(origin));
    assert.match(navigations[0],/atlasUpdate=\d+/);
    if(native)assert.match(navigations[0],/android=1/);
    assert.equal(workerCalls,0,'Service Worker opcional não deve bloquear atualização');
    assert.equal(downloads.length,3,'Verifica versão e HTML da origem e a versão publicada');
    assert.match(nodes.get('manualUpdateStatus').textContent,/Reabrindo o Atlas/);
  }
});

test('Atlas não troca documento enquanto o Olimpo ainda publica a nova versão',async()=>{
  const start=index.indexOf('const ATLAS_VERSION = "4.0.4";');
  const end=index.indexOf("forceUpdateBtn?.addEventListener('click',forceAtlasUpdate);",start);
  const updater=index.slice(start,end);
  const textForVersion=version=>
    '<!doctype html><html><body>const ATLAS_VERSION = "'+version+'";</body></html>';
  const nodes=new Map([
    ['manualCurrentVersion',{textContent:''}],
    ['manualUpdateStatus',{textContent:''}],
    ['forceUpdateBtn',{disabled:false,textContent:''}],
  ]);
  const navigations=[];
  const data='{"days":{"2026-10-21":{"done":true}}}';
  const memory=new Map([['atlasData',data]]);
  const context={
    Date,URL,
    document:{baseURI:'https://olimpo.example/atlas/',getElementById:id=>nodes.get(id)||null},
    window:{location:{replace:url=>navigations.push(url)}},
    fetch:async url=>({
      ok:true,
      json:async()=>({version:'4.0.4'}),
      text:async()=>textForVersion(url.startsWith('https://olimpo.example/')?'4.0.3':'4.0.4'),
    }),
    localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},
  };
  runInNewContext(
    'const atlasNativeAndroid=false;\n'+updater+'\nthis.triggerUpdate=forceAtlasUpdate;',
    context
  );
  await context.triggerUpdate();
  assert.equal(navigations.length,0);
  assert.equal(nodes.get('forceUpdateBtn').disabled,false);
  assert.match(nodes.get('manualUpdateStatus').textContent,/ainda não chegou/);
  assert.equal(memory.get('atlasData'),data);
});

test('Atualização antiga em cache não executa HTML guardado na inicialização',()=>{
  const bootstrap=index.slice(index.indexOf('<script data-atlas-shell='),
    index.indexOf('</script>',index.indexOf('<script data-atlas-shell=')));
  assert.doesNotMatch(bootstrap,/document\.(?:open|write|close)\s*\(/);
  assert.match(bootstrap,/removeItem\('atlasShellHtml'\)/);
  assert.doesNotMatch(bootstrap,/removeItem\('atlasData'\)/);
});

test('worker preserva caches do Hermes e de outros apps no OLIMPO',async()=>{
  const fixture=serviceWorkerFixture();
  await fixture.fire('activate');
  assert.ok(fixture.cacheData.has('hermes-preserve-v1'));
  assert.ok(!fixture.cacheData.has('atlas-clean-4.0.2'));
});

test('worker não usa JS obsoleto no cache em lugar de novas versões',async()=>{
  const fixture=serviceWorkerFixture();
  const request=new Request('https://olimpo.example/atlas/atlas-sync.mjs?v=4.0.4');
  const response=await fixture.fire('fetch',request);
  assert.equal(await response.text(),'JS NOVO');
  assert.equal(fixture.network.length,1);
  assert.equal(fixture.network[0].cache,'no-store');
});

test('worker não intercepta outros aplicativos do mesmo site',async()=>{
  const fixture=serviceWorkerFixture();
  const response=await fixture.fire('fetch',new Request('https://olimpo.example/hermes/app.mjs'));
  assert.equal(response,undefined);
  assert.equal(fixture.network.length,0);
});
