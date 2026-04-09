import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "lancHunter — Telegram Mini App",
};

/**
 * /tg layout — минимальный shell для Telegram Mini App entrypoint.
 *
 * В TMA-режиме не нужны BottomTabBar и TopNav: TMA рендерится в modal view
 * внутри Telegram. Вся страница /tg — это авторизационный splash-экран.
 * После успешного автологина страница делает client-side redirect на `/`,
 * где стандартный (site) layout возьмёт на себя UI.
 */
export default function TgLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center px-6">
      {children}
    </div>
  );
}
