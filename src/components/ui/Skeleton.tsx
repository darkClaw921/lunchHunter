import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Skeleton — примитив-плейсхолдер с shimmer-эффектом.
 *
 * Используется в `loading.tsx` на каждом тяжёлом сегменте (`search`,
 * `map`, `restaurant/[id]`, `business-lunch`, `profile`, `favorites`),
 * чтобы пользователь видел каркас финального контента раньше, чем
 * сервер закончит подготовку HTML.
 *
 * Базовый класс `.skeleton` (линейный градиент + shimmer-анимация 1.4s)
 * определён в `src/app/globals.css`. Компонент только тонкая обёртка
 * над `<div>`: передаёт width/height через inline-style, опционально
 * `borderRadius` и добавляет любые tailwind-классы через `className`.
 *
 * Server-compatible: не использует `'use client'`, можно рендерить
 * и в server component, и в client.
 */
export interface SkeletonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "style"> {
  /** Ширина элемента (px или CSS-значение). */
  width?: number | string;
  /** Высота элемента (px или CSS-значение). */
  height?: number | string;
  /** Радиус скругления (переопределяет дефолтный `8px` из `.skeleton`). */
  rounded?: number | string;
  /** Доп. inline-стили (сливаются с width/height/rounded). */
  style?: React.CSSProperties;
}

export function Skeleton({
  width,
  height,
  rounded,
  className,
  style,
  ...props
}: SkeletonProps) {
  const mergedStyle: React.CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(rounded !== undefined ? { borderRadius: rounded } : {}),
    ...style,
  };

  return (
    <div
      className={cn("skeleton", className)}
      style={mergedStyle}
      aria-hidden="true"
      {...props}
    />
  );
}
