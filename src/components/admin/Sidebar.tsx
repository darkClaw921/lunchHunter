"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  Sparkles,
  Users,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Admin Sidebar по pencil lanchHunter.pen frame Admin - Dashboard.
 *
 * Ширина 240px, dark fill #0A0A0A (bg-surface-inverse), белый текст,
 * оранжевый logo-badge, активный пункт с accent-подсветкой (bg rgba(255,92,0,0.12)).
 *
 * Используется в src/app/admin/layout.tsx на десктопе.
 */
export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefixes?: readonly string[];
}

export const ADMIN_NAV: readonly SidebarNavItem[] = [
  {
    href: "/admin",
    label: "Дашборд",
    icon: LayoutDashboard,
    matchPrefixes: ["/admin"],
  },
  {
    href: "/admin/restaurants",
    label: "Рестораны",
    icon: Store,
    matchPrefixes: ["/admin/restaurants"],
  },
  {
    href: "/admin/menu",
    label: "Меню",
    icon: UtensilsCrossed,
    matchPrefixes: ["/admin/menu"],
  },
  {
    href: "/admin/business-lunch",
    label: "Бизнес-ланчи",
    icon: Sparkles,
    matchPrefixes: ["/admin/business-lunch"],
  },
  {
    href: "/admin/users",
    label: "Пользователи",
    icon: Users,
    matchPrefixes: ["/admin/users"],
  },
  {
    href: "/admin/settings",
    label: "Настройки",
    icon: Settings,
    matchPrefixes: ["/admin/settings"],
  },
];

function isNavActive(pathname: string, item: SidebarNavItem): boolean {
  // /admin должен быть активен только на точном совпадении, иначе пересекается со всем
  if (item.href === "/admin") return pathname === "/admin";
  if (item.matchPrefixes && item.matchPrefixes.length > 0) {
    return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
  }
  return pathname === item.href;
}

export interface AdminSidebarProps {
  items?: readonly SidebarNavItem[];
  onLogout?: () => void;
  className?: string;
}

export function AdminSidebar({
  items = ADMIN_NAV,
  onLogout,
  className,
}: AdminSidebarProps): React.JSX.Element {
  const pathname = usePathname() ?? "/admin";

  return (
    <aside
      aria-label="Админ навигация"
      className={cn(
        "w-60 shrink-0 h-screen sticky top-0",
        "bg-surface-inverse text-fg-inverse",
        "flex flex-col",
        className,
      )}
    >
      <div className="px-6 py-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-bold"
        >
          LH
        </span>
        <span className="text-base font-semibold tracking-tight">
          lancHunter
        </span>
      </div>

      <nav className="flex-1 px-3">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href as never}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 h-10 rounded-md",
                    "text-sm font-medium transition-colors",
                    active
                      ? "bg-[rgba(255,92,0,0.12)] text-accent"
                      : "text-fg-inverse/70 hover:text-fg-inverse hover:bg-white/5",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {onLogout ? (
        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 h-10 rounded-md",
              "text-sm font-medium text-fg-inverse/70 hover:text-fg-inverse hover:bg-white/5 transition-colors",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Выйти</span>
          </button>
        </div>
      ) : null}
    </aside>
  );
}
