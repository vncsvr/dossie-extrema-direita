// Service worker: na instalação já guarda o app inteiro e os dados (data/*.json), para funcionar offline
// desde a 1ª visita. Dados: rede primeiro com tempo-limite de 3 s, depois a cópia offline.
// A lista de arquivos e a versão do cache são escritas pelo scripts/copiar-dados.mjs a cada build.
const VERSAO = '8e3b56d36d'
const ARQUIVOS = ["./assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2","./assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2","./assets/index-B26Bechs.js","./assets/index-BqvKvP8D.css","./assets/inter-latin-400-normal-C38fXH4l.woff2","./assets/inter-latin-500-normal-Cerq10X2.woff2","./assets/inter-latin-600-normal-LgqL8muc.woff2","./assets/newsreader-latin-400-normal-BFBkh4jY.woff2","./assets/newsreader-latin-500-normal-B66TYsaK.woff2","./data/casos.json","./data/complementos.json","./data/em-jogo.json","./data/eventos.json","./data/fases.json","./data/fotos.json","./data/ligacoes.json","./data/narracao.json","./data/perguntas.json","./data/personagens.json","./icone.svg","./icone-192.png"]
const CACHE = `dossie-${VERSAO}`
self.addEventListener('install', e => {
  self.skipWaiting()
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.json', ...ARQUIVOS])))
})
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())))
const comPrazo = (p, ms) => Promise.race([p, new Promise((_, nao) => setTimeout(() => nao(new Error('tempo')), ms))])
self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  // áudio vem em pedaços (206); o navegador cuida sozinho, sem cache offline
  if (req.url.includes('/narracao/')) return
  const chave = new URL(req.url); chave.search = ''
  if (req.url.includes('/data/')) {
    const rede = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(chave.href, c)) } return r })
    e.respondWith(comPrazo(rede, 3000).catch(() => caches.match(chave.href).then(c => c || rede)))
    return
  }
  e.respondWith(caches.match(req).then(cached => {
    const rede = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)) } return r }).catch(() => cached)
    return cached || rede
  }))
})
