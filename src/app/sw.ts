import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// --- Push notifications ---
interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, unknown>;
}

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    payload = { title: "lancHunter", body: event.data.text() };
  }

  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon ?? "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url ?? "/", ...payload.data },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url = (event.notification.data as { url?: string })?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            (client as WindowClient).navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});

// Поддержка prompt-for-update (SKIP_WAITING)
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if ((event.data as { type?: string } | undefined)?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
