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
    'https://olimpo.example/atlas/atlas-sync.mjs?v=4.0.3',
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
  assert.equal(version,'4.0.3');
  assert.match(index,/data-atlas-shell="4\.0\.3"/);
  assert.match(index,/const ATLAS_VERSION = "4\.0\.3"/);
  assert.match(index,/atlas-sync\.mjs\?v=4\.0\.3/);
  assert.match(sync,/cloud-sync\.mjs\?v=4\.0\.3/);
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

test('Atlas atualiza mesmo com ServiceWorker com documento Android inválido',async()=>{
  const start=index.indexOf('const ATLAS_VERSION = "4.0.3";');
  const end=index.indexOf("forceUpdateBtn?.addEventListener('click',forceAtlasUpdate);",start);
  assert.ok(start>=0 && end>start,'Código do atualizador precisa estar presente');
  const updater=index.slice(start,end);
  const html='<!doctype html><html><body>const ATLAS_VERSION = "4.0.3";</body></html>';
  for(const native of [true,false]){
    const memory=new Map([['atlasData','{"days":{"2026-10-21":{"done":true}}}']]);
    const nodes=new Map([
      ['manualCurrentVersion',{textContent:''}],
      ['manualUpdateStatus',{textContent:''}],
      ['forceUpdateBtn',{disabled:false,textContent:''}],
    ]);
    const writes=[];
    let serviceCalls=0,cacheCalls=0,reload=null;
    const context={
      Date,
      document:{
        getElementById:id=>nodes.get(id)||null,
        open:()=>writes.push('open'),
        write:value=>writes.push(value),
        close:()=>writes.push('close'),
      },
      navigator:{
        serviceWorker:{
          getRegistrations:async()=>{
            serviceCalls++;
            throw Error('Failed to get ServiceWorkerRegistration objects: The document is in an invalid state');
          },
        },
      },
      caches:{
        keys:async()=>{
          cacheCalls++;
          throw Error('Cache unavailable');
        },
      },
      window:{caches:true},
      localStorage:{
        getItem:key=>memory.get(key)||null,
        setItem:(key,value)=>memory.set(key,value),
      },
      fetch:async url=>({
        ok:true,
        json:async()=>({version:'4.0.3'}),
        text:async()=>html,
      }),
      setTimeout:fn=>{reload=fn;return 1;},
    };
    runInNewContext(
      'const atlasNativeAndroid='+native+';\n'+updater+'\nthis.triggerUpdate=forceAtlasUpdate;',
      context
    );
    await context.triggerUpdate();
    assert.equal(memory.get('atlasData'),'{"days":{"2026-10-21":{"done":true}}}');
    assert.equal(memory.get('atlasShellVersion'),'4.0.3');
    assert.match(nodes.get('manualUpdateStatus').textContent,/Atualização pronta/);
    assert.equal(typeof reload,'function','Atualização deve aplicar o HTML baixado');
    assert.equal(serviceCalls,native?0:1);
    assert.equal(cacheCalls,native?0:1);
    reload();
    assert.deepEqual(writes,['open',html,'close']);
  }
});

test('worker preserva caches do Hermes e de outros apps no OLIMPO',async()=>{
  const fixture=serviceWorkerFixture();
  await fixture.fire('activate');
  assert.ok(fixture.cacheData.has('hermes-preserve-v1'));
  assert.ok(!fixture.cacheData.has('atlas-clean-4.0.2'));
});

test('worker não usa JS obsoleto no cache em lugar de novas versões',async()=>{
  const fixture=serviceWorkerFixture();
  const request=new Request('https://olimpo.example/atlas/atlas-sync.mjs?v=4.0.3');
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
