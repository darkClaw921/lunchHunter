"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BackButtonProps {
  /** Визуальный вариант кнопки. */
  variant?: "icon" | "pill";
  /**
   * Fallback-путь, если в history нет предыдущей записи
   * (например, при прямом открытии страницы по ссылке).
   * По умолчанию — главная страница.
   */
  fallbackHref?: string;
  /** Дополнительные классы поверх дефолтных. */
  className?: string;
  /** Текст для pill-варианта. */
  label?: string;
  /** aria-label для icon-варианта. */
  ariaLabel?: string;
}

/**
 * Кнопка «Назад», использующая history back с безопасным fallback.
 *
 * Если у документа есть история навигации (пользователь пришёл сюда
 * с другой страницы), вызывает `router.back()`. Иначе — переходит
 * на `fallbackHref` (по умолчанию `/`), чтобы не застрять на детальной
 * странице при прямом открытии.
 */
export function BackButton({
  variant = "icon",
  fallbackHref = "/",
  className,
  label = "Назад к результатам",
  ariaLabel = "Назад",
}: BackButtonProps): React.JSX.Element {
  const router = useRouter();

  const handleClick = React.useCallback((): void => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }, [router, fallbackHref]);

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-surface-secondary text-[13px] text-fg-secondary hover:bg-surface-secondary/70 transition-colors",
          className,
        )}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(
        "absolute top-4 left-4 h-10 w-10 grid place-items-center rounded-full bg-white/90 backdrop-blur text-fg-primary shadow-md",
        className,
      )}
    >
      <ArrowLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
