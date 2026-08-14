const CACHE_NAME = "prismaapp-static-v2";
const PRECACHE_URLS = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isRevalidatingAsset =
    url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json";
  const isImmutableAsset = url.pathname.startsWith("/_next/static/");

  if (isRevalidatingAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  if (isImmutableAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ||
            fetch(request).then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
        )
      )
    );
    return;
  }

  // Peticiones de navegación (carga de documento HTML, incluida la que
  // dispara `window.location.reload()` en `service-worker-register.tsx`
  // al activarse una versión nueva del SW): se dejan pasar sin interceptar.
  // Interceptarlas con `fetch(request)` reproducido aquí puede chocar con
  // las redirecciones de autenticación del middleware/proxy (login,
  // guards por rol) y con los fetches RSC de Next.js, causando que la
  // recarga automática post-actualización falle con un error de conexión
  // en vez de simplemente recargar. Los assets (íconos/manifest/estáticos)
  // ya se sirven cacheados arriba; el resto de rutas/API GET del mismo
  // origen no se cachean por ahora — prioridad es no romper la navegación.
  if (request.mode === "navigate") return;

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request).catch(() => caches.match("/"))
    );
  }
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "PrismaApp",
    body: "Tienes una notificación nueva",
    url: "/dashboard",
  };

  try {
    const data = event.data?.json();
    payload = {
      title: data?.title || payload.title,
      body: data?.body || payload.body,
      url: data?.url || payload.url,
    };
  } catch {
    // Mantener el contenido predeterminado si el payload no es JSON válido.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const path = event.notification.data?.url || "/dashboard";
  const targetUrl = new URL(path, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windowClients) => {
        const exactClient = windowClients.find(
          (client) => client.url === targetUrl
        );
        if (exactClient) {
          return exactClient.focus();
        }

        const sameOriginClient = windowClients.find(
          (client) => new URL(client.url).origin === self.location.origin
        );
        if (sameOriginClient) {
          await sameOriginClient.navigate(targetUrl);
          return sameOriginClient.focus();
        }

        return self.clients.openWindow(targetUrl);
      })
  );
});
