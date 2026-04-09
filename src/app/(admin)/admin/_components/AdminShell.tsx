"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/Sidebar";

/**
 * AdminShell — client-обёртка над AdminSidebar + верхним toolbar + контентом.
 *
 * Sidebar — 240px dark slot слева, main content — flex-1.
 * Handler выхода делает POST на /api/admin/auth/logout и редиректит в /admin/login.
 */
export interface AdminShellProps {
  children: React.ReactNode;
  userName: string;
}

export function AdminShell({
  children,
  userName,
}: AdminShellProps): React.JSX.Element {
  const router = useRouter();

  const handleLogout = React.useCallback(async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-surface-secondary">
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 bg-surface-primary border-b border-border flex items-center justify-between px-8">
          <div className="text-sm text-fg-secondary">{userName}</div>
          <div className="text-xs text-fg-muted">
            {new Date().toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
