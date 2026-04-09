"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/**
 * Клиентская кнопка «Очистить всё» для /profile/history.
 * Выполняет DELETE /api/profile/search-history и рефрешит страницу.
 */
export function ClearHistoryButton(): React.JSX.Element {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleClick(): Promise<void> {
    if (pending) return;
    const ok = window.confirm("Очистить всю историю поиска?");
    if (!ok) return;
    setPending(true);
    try {
      const res = await fetch("/api/profile/search-history", {
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
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium text-error hover:bg-error/5 disabled:opacity-50 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      Очистить всё
    </button>
  );
}
