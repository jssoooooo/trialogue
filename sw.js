/* 삼자대화 — 오프라인 지원 서비스 워커
   같은 출처의 앱 파일만 캐시합니다. OpenAI / Anthropic API 호출은 손대지 않습니다. */
var CACHE = "trialogue-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
      .catch(function(){})
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                            .map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var url;
  try { url = new URL(e.request.url); } catch(err){ return; }
  // API 호출과 다른 출처 요청은 그대로 통과 (가로채면 CORS가 깨집니다)
  if(e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
        return res;
      }).catch(function(){
        return caches.match("./index.html");
      });
    })
  );
});
