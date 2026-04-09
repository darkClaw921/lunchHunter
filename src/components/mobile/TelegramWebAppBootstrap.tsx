"use client";

import * as React from "react";

/**
 * TelegramWebAppBootstrap — невидимый client-компонент, который при mount
 * проверяет наличие Telegram WebApp в окружении и вызывает обязательные
 * методы инициализации:
 *
 * - `WebApp.ready()` — сообщает Telegram-клиенту, что mini-app загрузилась
 *   и готова к показу. БЕЗ этого вызова `HapticFeedback.impactOccurred`
 *   и другие методы могут быть no-op в большинстве клиентов Telegram.
 * - `WebApp.expand()` — растягивает Mini App на полную высоту экрана.
 *
 * Должен монтироваться один раз в `(site)/layout.tsx` (вне `/tg`,
 * который и так делает это в TelegramAutoLogin). Если страница открыта
 * НЕ из Telegram — `window.Telegram?.WebApp` отсутствует, компонент
 * молча ничего не делает (это безопасный no-op).
 *
 * Не использует `@twa-dev/sdk` чтобы не тянуть зависимость в основной
 * client bundle — обращается напрямую к глобальному `window.Telegram.WebApp`,
 * который Telegram автоматически инжектит в WebView ДО загрузки страницы.
 */

interface TelegramWebApp {
  ready?: () => void;
  expand?: () => void;
  isExpanded?: boolean;
  HapticFeedback?: unknown;
}

interface TelegramNamespace {
  WebApp?: TelegramWebApp;
}

interface WindowWithTelegram {
  Telegram?: TelegramNamespace;
}

export function TelegramWebAppBootstrap(): null {
  React.useEffect(() => {
    const w = window as Window & WindowWithTelegram;
    const webApp = w.Telegram?.WebApp;
    if (!webApp) return; // не Telegram WebView — silent no-op

    try {
      webApp.ready?.();
    } catch {
      // в редких случаях ready() может бросить — игнорируем.
    }

    try {
      // expand только если ещё не expanded — на iOS повторный expand
      // иногда триггерит warning в console.
      if (webApp.isExpanded === false) {
        webApp.expand?.();
      }
    } catch {
      // expand тоже может бросить вне TMA — игнорируем.
    }
  }, []);

  return null;
}

export default TelegramWebAppBootstrap;
