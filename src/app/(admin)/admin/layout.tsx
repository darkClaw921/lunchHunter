import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { AdminShell } from "./_components/AdminShell";

/**
 * Admin route-group layout — защита всех /admin/* кроме /admin/login.
 *
 * Login живёт в отдельном route group `(admin-auth)/admin/login/page.tsx`
 * чтобы не попадать под этот layout и не создавать сайдбар.
 *
 * Серверный компонент: вызывает validateSession, если нет admin-сессии —
 * делает redirect('/admin/login'). Рендерит AdminShell (Sidebar + Topbar).
 */
export const metadata: Metadata = {
  title: "lancHunter Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const session = await validateSession();
  if (!session || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      userName={session.user.name ?? session.user.email ?? "Admin"}
    >
      {children}
    </AdminShell>
  );
}
