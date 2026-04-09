import type { Metadata } from "next";
import { BottomTabBar } from "@/components/mobile/BottomTabBar";
import { TelegramWebAppBootstrap } from "@/components/mobile/TelegramWebAppBootstrap";
import { TopNav } from "@/components/desktop/TopNav";
import { RouteProgress } from "@/components/ui/RouteProgress";

export const metadata: Metadata = {
  title: "lancHunter — поиск бизнес-ланчей рядом",
};

/**
 * (site) layout — адаптивный shell для публичного клиентского приложения.
 *
 * - На mobile (<md): скрывает TopNav, показывает fixed `BottomTabBar` внизу,
 *   центрирует контент в колонке max-w 430px.
 * - На desktop (≥md): показывает `TopNav` 64px сверху, скрывает BottomTabBar,
 *   содержимое — полноширинное (1440px).
 *
 * Страницы внутри (site) рендерят одновременно mobile и desktop варианты
 * как siblings: `<MobileX className="md:hidden" />` и
 * `<DesktopX className="hidden md:block" />`. Данные БД запрашиваются один раз.
 *
 * Центрирование mobile-колонки и обрамление BottomTabBar делаются поверх
 * `children` через nested wrapper-div'ы с `md:hidden` — на desktop они
 * схлопываются (display:none), не мешая полноширинному layout.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-screen">
      {/* Глобальный прогресс-бар переходов: рендерится в DOM всегда,
          но видим только во время pending-навигации (см. RouteProgress). */}
      <RouteProgress />

      {/* Невидимый client-bootstrap для Telegram WebApp: вызывает
          WebApp.ready() + WebApp.expand() если приложение открыто внутри
          Telegram (в т.ч. после redirect с /tg). БЕЗ этого вызова
          HapticFeedback.* методы no-op в большинстве клиентов. Для
          обычного веба — silent no-op. */}
      <TelegramWebAppBootstrap />

      {/* Desktop TopNav (hidden <md via TopNav's own md:flex) */}
      <TopNav />

      {/* Wrapper: mobile центрирует 430px колонку на тёплом фоне,
          desktop — прозрачный (body bg-[page-bg] виден насквозь) */}
      <div className="flex md:block justify-center md:bg-transparent">
        <div className="relative w-full max-w-[430px] md:max-w-none min-h-[calc(100vh-64px)] bg-surface-primary md:bg-transparent shadow-sm md:shadow-none flex flex-col">
          <main className="flex-1 pb-24 md:pb-0">{children}</main>
          <BottomTabBar className="md:hidden" />
        </div>
      </div>
    </div>
  );
}
