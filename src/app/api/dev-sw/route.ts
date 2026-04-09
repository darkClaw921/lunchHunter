/**
 * Заглушка для dev-режима: serwist отключён, но старые PWA-клиенты
 * (от предыдущих installs) могут запрашивать `/dev-sw.js` и спамить 404.
 *
 * Возвращаем минимальный service worker который немедленно
 * unregister'ит сам себя при активации и форсирует reload клиентов.
 *
 * Маппинг `/dev-sw.js -> /api/dev-sw` выполняется через rewrite в
 * `next.config.ts` (Next.js не разрешает точку в имени route-сегмента).
 */
export function GET(): Response {
  const body = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try {
      await self.registration.unregister();
      const clients = await self.clients.matchAll();
      clients.forEach((c) => c.navigate(c.url));
    } catch (err) {
      console.warn('[dev-sw stub] unregister failed', err);
    }
  })());
});`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-store",
    },
  });
}
