import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/auth/session";
import { RegisterForm } from "./_components/RegisterForm";

export const metadata: Metadata = {
  title: "Регистрация — lancHunter",
};

export const dynamic = "force-dynamic";

export default async function RegisterPage(): Promise<React.JSX.Element> {
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
          <h1 className="text-lg font-semibold text-fg-primary mb-1">
            Регистрация
          </h1>
          <p className="text-sm text-fg-secondary mb-6">
            Создайте аккаунт за 30 секунд
          </p>
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
