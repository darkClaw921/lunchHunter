"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * TelegramAutoLogin — client-компонент, который выполняет автологин через
 * Telegram Mini App.
 *
 * Поведение:
 *  - На mount динамически импортирует @twa-dev/sdk (SSR-unsafe, обращается
 *    к window).
 *  - Вызывает WebApp.ready() и WebApp.expand().
 *  - Читает WebApp.initData. Если пусто — значит страница открыта не из TMA,
 *    показывает ошибку.
 *  - POST /api/auth/telegram с { initData }.
 *  - При 200 — router.replace("/").
 *  - При ошибке — показывает текст ошибки + кнопку "Продолжить как гость"
 *    (редирект на /).
 *
 * Три UI-состояния: loading / error.
 */
type State =
  | { kind: "loading" }
  | { kind: "error"; message: string };

export function TelegramAutoLogin(): React.JSX.Element {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        const mod = await import("@twa-dev/sdk");
        const WebApp = mod.default;

        WebApp.ready();
        try {
          WebApp.expand();
        } catch {
          // expand может бросить вне TMA — игнорируем.
        }

        const initData = WebApp.initData;
        if (!initData || initData.length === 0) {
          if (!cancelled) {
            setState({
              kind: "error",
              message: "Откройте приложение через Telegram-бота.",
            });
          }
          return;
        }

        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          if (!cancelled) {
            setState({
              kind: "error",
              message: data?.error ?? "Не удалось авторизоваться",
            });
          }
          return;
        }

        if (!cancelled) {
          router.replace("/");
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Не удалось авторизоваться";
          setState({ kind: "error", message });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state.kind === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="h-10 w-10 rounded-full border-4 border-accent/20 border-t-accent animate-spin"
          aria-hidden="true"
        />
        <div className="text-[15px] text-fg-primary font-medium">
          Авторизация через Telegram…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center max-w-xs">
      <div className="text-[17px] font-semibold text-fg-primary">
        Не удалось авторизоваться
      </div>
      <div className="text-[14px] text-fg-muted">{state.message}</div>
      <button
        type="button"
        onClick={() => router.replace("/")}
        className="mt-2 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
      >
        Продолжить как гость
      </button>
    </div>
  );
}
