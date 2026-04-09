import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Нет соединения — lancHunter",
  description:
    "Вы офлайн. Как только интернет вернётся, lancHunter снова будет искать бизнес-ланчи рядом.",
};

/**
 * /offline — fallback shell served by the Serwist service worker when a
 * navigation request fails (no network / no cached copy of the target route).
 *
 * This page is precached at build time (`additionalPrecacheEntries` in
 * `next.config.ts`) and registered as the document fallback inside
 * `src/app/sw.ts`. It is intentionally static and self-contained — no data
 * fetching, no client-only code — so it can be served even when the server
 * is completely unreachable.
 */
export default function OfflinePage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF5C00]/10 text-[#FF5C00]">
        <WifiOff className="h-10 w-10" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Нет соединения
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-neutral-600">
          Кажется, интернет пропал. Как только он вернётся, lancHunter снова
          покажет свежие бизнес-ланчи рядом с вами.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full bg-[#FF5C00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-95"
      >
        Попробовать снова
      </Link>
    </main>
  );
}
