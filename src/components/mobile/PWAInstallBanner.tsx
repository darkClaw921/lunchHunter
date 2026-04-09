"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useBeforeInstallPrompt } from "./useBeforeInstallPrompt";

const DISMISSED_STORAGE_KEY = "lh:pwa-install-dismissed";

interface PWAInstallBannerProps {
  /** Optional extra classes applied to the outer wrapper. */
  className?: string;
}

/**
 * PWAInstallBanner — mobile-only install prompt surface shown above the
 * BottomTabBar on the home route. Uses `useBeforeInstallPrompt` to capture
 * Chrome's native `beforeinstallprompt` event and trigger the system UI
 * from a user gesture (button tap).
 *
 * Hidden when:
 *   - Browser has not fired `beforeinstallprompt` (`canInstall === false`)
 *   - The app is already running in standalone mode
 *   - The user has previously dismissed the banner in the current browser
 *     (persisted to `localStorage` under `lh:pwa-install-dismissed`)
 *
 * The component renders nothing on desktop (callers are expected to apply
 * `md:hidden` via the `className` prop or a parent wrapper).
 */
export function PWAInstallBanner({
  className,
}: PWAInstallBannerProps): React.JSX.Element | null {
  const { canInstall, promptInstall } = useBeforeInstallPrompt();
  const [dismissed, setDismissed] = React.useState<boolean>(false);
  const [hydrated, setHydrated] = React.useState<boolean>(false);

  React.useEffect(() => {
    setHydrated(true);
    try {
      if (window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // localStorage may be unavailable (e.g. Safari private mode) — ignore.
    }
  }, []);

  const handleInstall = React.useCallback(async (): Promise<void> => {
    const outcome = await promptInstall();
    if (outcome === "dismissed") {
      // User said "no" to the system dialog — remember that for this session.
      try {
        window.localStorage.setItem(DISMISSED_STORAGE_KEY, "1");
      } catch {
        // ignore
      }
      setDismissed(true);
    }
  }, [promptInstall]);

  const handleDismiss = React.useCallback((): void => {
    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }, []);

  if (!hydrated || !canInstall || dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[72px] z-40 mx-auto w-full max-w-[430px] px-3",
        className,
      )}
      role="region"
      aria-label="Установить приложение lancHunter"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-[#FF5C00] px-4 py-3 text-white shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Download className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight">
            Установить lancHunter
          </div>
          <div className="text-xs leading-tight text-white/90">
            Быстрый доступ к бизнес-ланчам с рабочего стола
          </div>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#FF5C00] transition active:scale-95"
        >
          Установить
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1 text-white/80 hover:text-white"
          aria-label="Скрыть баннер установки"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
