"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

/**
 * LogoutButton — POST /api/auth/logout → refresh + redirect /.
 */
export function LogoutButton(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = React.useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="mt-6 inline-flex items-center justify-center gap-2 h-12 rounded-xl border border-border bg-surface-primary text-error font-medium hover:bg-error/5 transition-colors disabled:opacity-60"
    >
      <LogOut className="h-5 w-5" aria-hidden="true" />
      {loading ? "Выход..." : "Выйти"}
    </button>
  );
}
