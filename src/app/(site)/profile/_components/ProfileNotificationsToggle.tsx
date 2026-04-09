"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Клиентский toggle для настроек «Уведомления».
 * На Phase 6 подключим к реальным пользовательским настройкам в БД.
 */
export function ProfileNotificationsToggle(): React.JSX.Element {
  const [enabled, setEnabled] = React.useState(true);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Уведомления"
      onClick={() => setEnabled((v) => !v)}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors shrink-0",
        enabled ? "bg-accent" : "bg-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
