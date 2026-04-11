"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { usePushSubscription } from "@/lib/hooks/usePushSubscription";

/**
 * Toggle для push-уведомлений в профиле пользователя.
 * Подписывает/отписывает через Web Push API + /api/notifications/subscribe.
 */
export function ProfileNotificationsToggle(): React.JSX.Element {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushSubscription();
  const isDenied = permission === "denied";

  const handleToggle = React.useCallback(async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={isSubscribed}
        aria-label="Уведомления"
        disabled={!isSupported || isLoading || isDenied}
        onClick={handleToggle}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors shrink-0",
          !isSupported && "opacity-50 cursor-not-allowed",
          isSubscribed ? "bg-accent" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            isSubscribed ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
      {!isSupported && (
        <span className="text-[11px] text-fg-muted">
          Браузер не поддерживает
        </span>
      )}
      {isSupported && isDenied && (
        <span className="text-[11px] text-fg-muted">
          Заблокировано в браузере
        </span>
      )}
    </div>
  );
}
