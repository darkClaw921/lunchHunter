import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { validateSession } from "@/lib/auth/session";
import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = {
  title: "Вход — lancHunter",
};

export const dynamic = "force-dynamic";

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await validateSession();
  if (session) {
    redirect("/profile");
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <span
            aria-hidden="true"
            className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-white text-base font-bold"
          >
            LH
          </span>
          <span className="text-xl font-semibold tracking-tight text-fg-primary">
            lancHunter
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-primary shadow-sm p-6">
          <h1 className="text-lg font-semibold text-fg-primary mb-1">Вход</h1>
          <p className="text-sm text-fg-secondary mb-6">
            Войдите, чтобы сохранять избранное и получать уведомления
          </p>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
