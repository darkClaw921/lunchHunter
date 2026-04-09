"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface TopNavLink {
  href: string;
  label: string;
  /** Префиксы pathname, при совпадении с которыми ссылка считается активной */
  matchPrefixes?: string[];
}

export interface TopNavProps {
  links?: TopNavLink[];
  className?: string;
}

export const DEFAULT_TOPNAV_LINKS: TopNavLink[] = [
  { href: "/", label: "Поиск", matchPrefixes: ["/", "/search"] },
  { href: "/business-lunch", label: "Бизнес-ланчи", matchPrefixes: ["/business-lunch"] },
  { href: "/map", label: "Карта", matchPrefixes: ["/map"] },
  { href: "/restaurant", label: "Рестораны", matchPrefixes: ["/restaurant"] },
];

function isActive(link: TopNavLink, pathname: string | undefined): boolean {
  if (!pathname) return false;
  const prefixes = link.matchPrefixes ?? [link.href];
  return prefixes.some((p) => {
    if (p === "/") return pathname === "/";
    return pathname === p || pathname.startsWith(p + "/");
  });
}

/**
 * Desktop TopNav (≥md).
 *
 * Высота 64px, горизонтальный flex, padding 48px по бокам (Home) / 32px на
 * прочих страницах. Логотип LunchHunter (иконка `utensils` accent + текст),
 * центральные ссылки (Поиск / Бизнес-ланчи / Карта / Рестораны) и круг-аватар
 * 36px справа. Активная ссылка подсвечивается accent-цветом.
 *
 * Pixel-perfect соответствует pencil desktop-фреймам (nav-блоки 64px, padding
 * 48/32, gap 32 между ссылками, fontSize 15/500).
 *
 * Server component — pathname передаётся через пропы.
 */
export function TopNav({
  links = DEFAULT_TOPNAV_LINKS,
  className,
}: TopNavProps): React.JSX.Element {
  const pathname = usePathname();
  return (
    <header
      className={cn(
        "hidden md:flex h-16 w-full items-center justify-between",
        "bg-surface-primary border-b border-border-light px-8 lg:px-12",
        className,
      )}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <UtensilsCrossed className="h-6 w-6 text-accent" aria-hidden="true" />
        <span className="text-[20px] font-bold tracking-tight text-fg-primary">
          lancHunter
        </span>
      </Link>

      {/* Center nav links */}
      <nav className="flex items-center gap-8">
        {links.map((link) => {
          const active = isActive(link, pathname);
          return (
            <Link
              key={link.href}
              href={link.href as never}
              className={cn(
                "text-[15px] font-medium transition-colors",
                active
                  ? "text-accent"
                  : "text-fg-secondary hover:text-fg-primary",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right — avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Профиль"
          className="h-9 w-9 rounded-full bg-accent grid place-items-center text-white text-[13px] font-semibold hover:bg-accent-dark transition-colors"
        >
          И
        </button>
      </div>
    </header>
  );
}

export default TopNav;
