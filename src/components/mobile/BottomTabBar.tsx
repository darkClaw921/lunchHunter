"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  UtensilsCrossed,
  Map as MapIcon,
  Heart,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useHaptics } from "@/lib/hooks/useHaptics";

/**
 * BottomTabBar — fixed-bottom mobile навигация по pencil lanchHunter.pen.
 *
 * 5 табов: Поиск, Бизнес-ланч, Карта, Избранное, Профиль.
 * Активный таб получает pill-фон с accent-tint и accent-иконкой + label.
 * Неактивные — muted icon + label.
 * Поддерживает safe-area-inset-bottom (env() fallback до 0).
 *
 * Используется внутри (site)/layout.tsx mobile-варианта.
 *
 * **Press feedback:**
 * - Навигация через чистый {@link Link} из `next/link`. На браузерах с
 *   View Transitions API переход между табами автоматически сопровождается
 *   кросс-фейдом через `@view-transition { navigation: auto }` в
 *   globals.css, плюс morph pill-индикатора по `viewTransitionName:
 *   'bottom-tab-indicator'`.
 * - `onClick={handleTabClick}` дёргает `haptics.selection()` для Telegram —
 *   это ощущается как «переключение выбора» в табах, что корректнее чем
 *   medium impact.
 * - Scale-эффект на :active обеспечивается глобальным правилом в
 *   `globals.css` (`button, a, [role="button"] :active { transform:
 *   scale(0.97) }`) — `<Link>` рендерится как `<a>`, локальные
 *   `active:scale-*` не нужны.
 * - `transition-colors` сохраняется для плавного переключения цвета
 *   active/inactive таба.
 * - `style={{ viewTransitionName: 'bottom-tab-indicator' }}` — вешается
 *   ТОЛЬКО на активный таб. При смене таба браузер делает morph
 *   «скользящего» pill-индикатора через View Transitions API. Имя
 *   `bottom-tab-indicator` уникально на всё дерево — критично, иначе VT
 *   API выбросит ошибку дублирования.
 */
export interface BottomTabItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Сопоставление активного состояния: если pathname начинается с одного из
   * этих значений, таб считается активным. Если не задано — сравнение по href.
   */
  matchPrefixes?: readonly string[];
}

export const DEFAULT_TABS: readonly BottomTabItem[] = [
  { href: "/", label: "Поиск", icon: Search, matchPrefixes: ["/", "/search"] },
  {
    href: "/business-lunch",
    label: "Бизнес-ланч",
    icon: UtensilsCrossed,
    matchPrefixes: ["/business-lunch"],
  },
  { href: "/map", label: "Карта", icon: MapIcon, matchPrefixes: ["/map"] },
  {
    href: "/favorites",
    label: "Избранное",
    icon: Heart,
    matchPrefixes: ["/favorites"],
  },
  { href: "/profile", label: "Профиль", icon: User, matchPrefixes: ["/profile"] },
];

function isTabActive(pathname: string, item: BottomTabItem): boolean {
  if (item.matchPrefixes && item.matchPrefixes.length > 0) {
    return item.matchPrefixes.some((prefix) =>
      prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
    );
  }
  return pathname === item.href;
}

export interface BottomTabBarProps {
  items?: readonly BottomTabItem[];
  className?: string;
}

export function BottomTabBar({
  items = DEFAULT_TABS,
  className,
}: BottomTabBarProps): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const haptics = useHaptics();
  const prevIndexRef = React.useRef<number>(-1);

  // Найти индекс активного таба
  const currentIndex = items.findIndex((item) => isTabActive(pathname, item));

  // При смене активного таба — запустить последовательный хаптик через промежуточные элементы
  React.useEffect(() => {
    if (prevIndexRef.current === -1) {
      // Первый рендер, не запускаем анимацию
      prevIndexRef.current = currentIndex;
      return;
    }

    const prevIndex = prevIndexRef.current;
    const distance = Math.abs(currentIndex - prevIndex);
    const delayBetweenSteps = 50; // мс между шагами (синхронно с морфингом View Transitions)

    // Проходим через промежуточные элементы и срабатываем хаптик на каждом
    let step = 0;
    const interval = setInterval(() => {
      if (step <= distance) {
        haptics.selection();
        step++;
      } else {
        clearInterval(interval);
      }
    }, delayBetweenSteps);

    prevIndexRef.current = currentIndex;

    return () => clearInterval(interval);
  }, [currentIndex, haptics]);

  const handleTabClick = React.useCallback(() => {
    // Хаптик уже срабатывает через useEffect, но на клик тоже можно оставить для мгновенной обратной связи
    haptics.selection();
  }, [haptics]);

  return (
    <nav
      aria-label="Основная навигация"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "bg-surface-primary border-t border-border",
        "pb-[env(safe-area-inset-bottom,0px)]",
        className,
      )}
    >
      <ul className="flex items-center justify-around gap-1 px-3 pt-2 pb-2">
        {items.map((item) => {
          const active = isTabActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href as never}
                aria-current={active ? "page" : undefined}
                onClick={handleTabClick}
                style={
                  active
                    ? { viewTransitionName: "bottom-tab-indicator" }
                    : undefined
                }
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-14 rounded-full",
                  "transition-colors",
                  active
                    ? "bg-accent-light text-accent"
                    : "text-fg-secondary hover:text-fg-primary",
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "stroke-[2.25]")}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
