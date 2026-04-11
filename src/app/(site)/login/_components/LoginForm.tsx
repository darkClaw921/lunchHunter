"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const loginSchema = z.object({
  email: z.string().email("Неверный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/profile";

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setServerError(body.error ?? "Ошибка входа");
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setServerError("Сетевая ошибка");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-fg-secondary">Email</span>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <span className="text-xs text-error">{errors.email.message}</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-fg-secondary">Пароль</span>
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? (
          <span className="text-xs text-error">{errors.password.message}</span>
        ) : null}
      </label>

      {serverError ? (
        <div
          role="alert"
          className="text-sm text-error bg-error/10 px-3 py-2 rounded-md"
        >
          {serverError}
        </div>
      ) : null}

      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? "Вход..." : "Войти"}
      </Button>

      <div className="text-center text-sm text-fg-secondary">
        Ещё нет аккаунта?{" "}
        <Link href="/register" className="text-accent font-medium hover:underline">
          Зарегистрироваться
        </Link>
      </div>
    </form>
  );
}
