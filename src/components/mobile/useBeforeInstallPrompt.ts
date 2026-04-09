"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Minimal typing for the (non-standard, Chrome/Edge-only) `beforeinstallprompt`
 * event. Not part of @types/web yet, so we model just what we actually use.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
 */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface UseBeforeInstallPromptResult {
  /** True if the browser has fired a `beforeinstallprompt` event we captured. */
  canInstall: boolean;
  /** True if the PWA is already running in standalone (installed) mode. */
  isStandalone: boolean;
  /**
   * Trigger the native install prompt. Resolves to `"accepted"` or
   * `"dismissed"` based on the user's choice, or `null` if no prompt is
   * available (e.g. Safari, or the event has not fired yet).
   */
  promptInstall: () => Promise<"accepted" | "dismissed" | null>;
}

/**
 * React hook that captures the browser's `beforeinstallprompt` event and
 * exposes a `promptInstall()` callback for custom install UI.
 *
 * - On Chromium browsers the event fires once the PWA install criteria
 *   are met; we call `preventDefault()` to suppress the mini-infobar and
 *   keep the event so we can trigger it later from a user gesture.
 * - On Safari / iOS the event never fires; `canInstall` stays `false` and
 *   consumers should fall back to showing instructions instead.
 * - Also listens for `appinstalled` to clear the captured event and for
 *   the `display-mode: standalone` media query to detect installed state.
 */
export function useBeforeInstallPrompt(): UseBeforeInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const standaloneMql = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(
      standaloneMql.matches ||
        // iOS Safari exposes navigator.standalone on installed PWAs.
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true,
    );

    const onBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = (): void => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    const onStandaloneChange = (e: MediaQueryListEvent): void => {
      setIsStandalone(e.matches);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    standaloneMql.addEventListener("change", onStandaloneChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      standaloneMql.removeEventListener("change", onStandaloneChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | null
  > => {
    if (!deferredPrompt) {
      return null;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome;
  }, [deferredPrompt]);

  return {
    canInstall: deferredPrompt !== null && !isStandalone,
    isStandalone,
    promptInstall,
  };
}
