"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
}

export interface MenuCategory {
  id: number;
  name: string;
  items: MenuItem[];
}

export interface RestaurantMenuProps {
  categories: MenuCategory[];
  /** Подсветить позиции, имя/описание которых содержит этот запрос. */
  highlightQuery: string;
  /** IDs блюд, которые уже в избранном у текущего пользователя. */
  favoritedMenuItemIds?: number[];
  /** Залогинен ли пользователь — определяет поведение FavoriteButton. */
  isAuthenticated?: boolean;
}

function matchesQuery(item: MenuItem, query: string): boolean {
  if (query.length === 0) return false;
  const lower = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(lower) ||
    (item.description ?? "").toLowerCase().includes(lower)
  );
}

export function RestaurantMenu({
  categories,
  highlightQuery,
  favoritedMenuItemIds = [],
  isAuthenticated = false,
}: RestaurantMenuProps): React.JSX.Element {
  const favoritedSet = React.useMemo(
    () => new Set(favoritedMenuItemIds),
    [favoritedMenuItemIds],
  );
  // По умолчанию выбираем категорию, в которой есть позиция под highlightQuery;
  // иначе — первая категория.
  const initialValue = React.useMemo(() => {
    if (highlightQuery) {
      const hit = categories.find((c) =>
        c.items.some((i) => matchesQuery(i, highlightQuery)),
      );
      if (hit) return String(hit.id);
    }
    return categories[0] ? String(categories[0].id) : "";
  }, [categories, highlightQuery]);

  if (categories.length === 0) {
    return (
      <div className="text-sm text-fg-muted">Меню пока не добавлено.</div>
    );
  }

  return (
    <Tabs defaultValue={initialValue}>
      <TabsList className="mb-4">
        {categories.map((c) => (
          <TabsTrigger key={c.id} value={String(c.id)}>
            {c.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((c) => (
        <TabsContent key={c.id} value={String(c.id)}>
          <div className="flex flex-col gap-2">
            {c.items.map((item) => {
              const highlighted = matchesQuery(item, highlightQuery);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border p-3 flex items-start justify-between gap-3",
                    highlighted
                      ? "bg-accent-light border-accent"
                      : "bg-surface-primary border-border",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "text-[14px] font-semibold",
                        highlighted ? "text-accent" : "text-fg-primary",
                      )}
                    >
                      {item.name}
                    </div>
                    {item.description ? (
                      <div className="text-[12px] text-fg-secondary mt-0.5 line-clamp-2">
                        {item.description}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <div
                      className={cn(
                        "text-[16px] font-bold leading-none",
                        highlighted ? "text-accent" : "text-fg-primary",
                      )}
                    >
                      {formatPrice(item.price)}
                    </div>
                    <FavoriteButton
                      targetType="menu_item"
                      targetId={item.id}
                      initialFavorited={favoritedSet.has(item.id)}
                      isAuthenticated={isAuthenticated}
                      variant="icon"
                    />
                  </div>
                </div>
              );
            })}
            {c.items.length === 0 ? (
              <div className="text-sm text-fg-muted py-4 text-center">
                Пока нет позиций в этой категории
              </div>
            ) : null}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
