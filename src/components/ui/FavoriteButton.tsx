"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useHaptics } from "@/lib/hooks/useHaptics";

export type FavoriteTargetType = "restaurant" | "menu_item" | "lunch";

export interface FavoriteButtonProps {
  targetType: FavoriteTargetType;
  targetId: number;
  /** Начальное состояние, пришедшее с сервера (false для гостей). */
  initialFavorited: boolean;
  /** Залогинен ли пользователь. Гость редиректится в /profile. */
  isAuthenticated: boolean;
  /** Визуальный вариант. */
  variant?: "icon" | "button" | "iconFloating";
  className?: string;
  ariaLabel?: string;
  /** Для variant="button" — текстовая подпись. */
  label?: string;
  labelActive?: string;
}

/**
 * Клиентская кнопка добавления/удаления элемента из избранного.
 * Поддерживает три типа targetType: restaurant | menu_item | lunch.
 *
 * Оптимистичное обновление: мгновенно переключает состояние, затем
 * синхронизирует с сервером POST /api/favorites. При ошибке откатывается.
 * Неавторизованный пользователь редиректится в /profile (Telegram login).
 *
 * **Press feedback:**
 * - Scale-эффект на :active обеспечивается глобальным правилом в
 *   `globals.css` (`button, a, [role="button"]` → `scale(0.97)`). Все три
 *   варианта — обычные `<button>`, локальные `active:scale-*` не нужны.
 * - `haptics.success()` — при добавлении в избранное (false → true),
 *   «положительный» паттерн вибрации.
 * - `haptics.light()` — при удалении из избранного (true → false),
 *   мягкий тап без лишнего давления.
 * - Хаптик вызывается мгновенно (до API-запроса), чтобы отклик был
 *   одновременным с визуальным переключением сердечка.
 */
export function FavoriteButton({
  targetType,
  targetId,
  initialFavorited,
  isAuthenticated,
  variant = "icon",
  className,
  ariaLabel,
  label = "Добавить в избранное",
  labelActive = "В избранном",
}: FavoriteButtonProps): React.JSX.Element {
  const router = useRouter();
  const haptics = useHaptics();
  const [favorited, setFavorited] = React.useState(initialFavorited);
  const [pending, setPending] = React.useState(false);

  const handleClick = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (pending) return;

      if (!isAuthenticated) {
        router.push("/profile");
        return;
      }

      const next = !favorited;
      // Мгновенный тактильный отклик: success — при добавлении,
      // light — при удалении из избранного.
      if (next) {
        haptics.success();
      } else {
        haptics.light();
      }
      setFavorited(next);
      setPending(true);
      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType, targetId }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as { favorited: boolean };
        setFavorited(data.favorited);
      } catch {
        setFavorited(!next); // rollback
      } finally {
        setPending(false);
      }
    },
    [favorited, haptics, isAuthenticated, pending, router, targetId, targetType],
  );

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={favorited}
        disabled={pending}
        className={cn(
          "inline-flex items-center justify-center gap-2 h-14 px-6 rounded-lg font-semibold text-base w-full transition-colors",
          favorited
            ? "bg-accent-light text-accent border border-accent"
            : "bg-accent text-white hover:bg-accent-dark",
          pending ? "opacity-70" : "",
          className,
        )}
      >
        <Heart
          className={cn("h-5 w-5", favorited ? "fill-current" : "")}
          aria-hidden="true"
        />
        {favorited ? labelActive : label}
      </button>
    );
  }

  if (variant === "iconFloating") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={favorited}
        aria-label={ariaLabel ?? (favorited ? labelActive : label)}
        disabled={pending}
        className={cn(
          "h-10 w-10 grid place-items-center rounded-full bg-white/90 backdrop-blur shadow-md transition-colors",
          favorited ? "text-accent" : "text-fg-primary",
          className,
        )}
      >
        <Heart
          className={cn("h-5 w-5", favorited ? "fill-current" : "")}
          aria-hidden="true"
        />
      </button>
    );
  }

  // Default: icon (small inline)
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={ariaLabel ?? (favorited ? labelActive : label)}
      disabled={pending}
      className={cn(
        "shrink-0 h-8 w-8 grid place-items-center rounded-full transition-colors",
        favorited
          ? "text-accent bg-accent-light"
          : "text-fg-muted hover:text-accent hover:bg-accent-light/60",
        className,
      )}
    >
      <Heart
        className={cn("h-4 w-4", favorited ? "fill-current" : "")}
        aria-hidden="true"
      />
    </button>
  );
}
