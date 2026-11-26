// Margo's Study Hub offline support: caches the unified shell, Statistics Hub, Micro Hub and Op Man Hub.
// Bump V when you change root shell files or switcher.js. Content files (json, md, js, html)
// are fetched fresh when online and served from cache when offline.
const V = "margo-hub-v2";
const SHELL = [
  "./", "./index.html", "./switcher.js", "./manifest.webmanifest",
  "./lib/firebase-config.js", "./lib/firebase-sync.js", "./lib/cat.js", "./lib/stats.js",
  "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
  "./stats/", "./stats/index.html", "./stats/app.js", "./stats/lib/lecture-lib.js", "./stats/lib/cat.js", "./stats/lib/stats.js",
  "./stats/lib/firebase-config.js", "./stats/lib/firebase-sync.js", "./stats/courses/stats/course.json",
  "./micro/", "./micro/index.html", "./micro/app.js", "./micro/lib/lecture-lib.js", "./micro/lib/cat.js", "./micro/lib/stats.js",
  "./micro/lib/formulas.js", "./micro/lib/graphs.js", "./micro/lib/firebase-config.js", "./micro/lib/firebase-sync.js",
  "./micro/courses/micro/course.json",
  "./opman/", "./opman/index.html", "./opman/app.js", "./opman/lib/lecture-lib.js", "./opman/lib/cat.js", "./opman/lib/stats.js",
  "./opman/lib/formulas.js", "./opman/lib/apply.js", "./opman/lib/path.js", "./opman/lib/opman.js", "./opman/lib/firebase-config.js", "./opman/lib/firebase-sync.js",
  "./opman/courses/opman/course.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith("margo-hub-") && k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function navFallback(pathname) {
  if (/\/stats(\/|$)/.test(pathname)) return caches.match("./stats/index.html");
  if (/\/micro(\/|$)/.test(pathname)) return caches.match("./micro/index.html");
  if (/\/opman(\/|$)/.test(pathname)) return caches.match("./opman/index.html");
  return caches.match("./index.html");
}

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const same = u.origin === location.origin;
  const fonts = u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
  const fbSdk = u.hostname === "www.gstatic.com" && u.pathname.startsWith("/firebasejs/10.14.1/");
  const cdn = u.hostname === "cdnjs.cloudflare.com" && (
    u.pathname.startsWith("/ajax/libs/pdf.js/3.11.174/") ||
    u.pathname.startsWith("/ajax/libs/KaTeX/0.16.9/")
  );
  if (!same && !fonts && !fbSdk && !cdn) return;
  const put = (res) => {
    if (res.ok || res.type === "opaque") {
      const cp = res.clone();
      caches.open(V).then((c) => c.put(r, cp));
    }
    return res;
  };
  if (fonts || fbSdk || cdn || /\.(png|jpg|woff2?)$/.test(u.pathname)) {
    e.respondWith(caches.match(r).then((m) => m || fetch(r).then(put)));
    return;
  }
  e.respondWith(
    fetch(r, { cache: "no-cache" })
      .then(put)
      .catch(() => caches.match(r, { ignoreSearch: r.mode === "navigate" }).then((m) => m || (r.mode === "navigate" ? navFallback(u.pathname) : Response.error())))
  );
});
