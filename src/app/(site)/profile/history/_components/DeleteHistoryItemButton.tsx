"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

/**
 * Кнопка удаления одной записи истории поиска.
 * Вызывает DELETE /api/profile/search-history/[id] и рефрешит страницу.
 */
export function DeleteHistoryItemButton({
  id,
}: {
  id: number;
}): React.JSX.Element {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleClick(): Promise<void> {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/profile/search-history/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Удалить"
      className="h-8 w-8 grid place-items-center rounded-full text-fg-muted hover:bg-surface-secondary hover:text-fg-primary disabled:opacity-50 shrink-0 transition-colors"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
