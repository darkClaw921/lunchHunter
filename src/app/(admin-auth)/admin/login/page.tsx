import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { LoginForm } from "./_components/LoginForm";

/**
 * Admin Login page — /admin/login.
 *
 * Серверный компонент: если сессия уже валидна и пользователь — admin,
 * сразу редиректит на /admin. Иначе рендерит client-форму LoginForm.
 */
export const metadata: Metadata = {
  title: "Вход — lancHunter Admin",
};

export default async function AdminLoginPage(): Promise<React.JSX.Element> {
  const session = await validateSession();
  if (session && session.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <span
            aria-hidden="true"
            className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-white text-base font-bold"
          >
            LH
          </span>
          <span className="text-xl font-semibold tracking-tight text-fg-primary">
            lancHunter Admin
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-primary shadow-sm p-6">
          <h1 className="text-lg font-semibold text-fg-primary mb-1">
            Вход в админ-панель
          </h1>
          <p className="text-sm text-fg-secondary mb-6">
            Введите email и пароль администратора
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
