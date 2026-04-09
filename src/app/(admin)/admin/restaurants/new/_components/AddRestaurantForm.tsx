"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * RestaurantForm — универсальная двухколоночная форма ресторана.
 *
 * Поддерживает два режима:
 * - create (по умолчанию): POST /api/admin/restaurants
 * - edit: PATCH /api/admin/restaurants/:id
 *
 * Левая колонка: название, slug, категория, адрес, lat/lng, телефон,
 * сайт, описание, цена, часы работы.
 * Правая колонка: upload обложки (POST /api/admin/upload), координаты
 * (заглушка карты), статус (draft/published).
 *
 * При успехе → router.push('/admin/restaurants').
 *
 * Экспортируется также под именем AddRestaurantForm для обратной
 * совместимости с new/page.tsx.
 */
const numericString = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v : Number.parseFloat(v)));

const schema = z.object({
  name: z.string().min(1, "Обязательно"),
  slug: z
    .string()
    .min(1, "Обязательно")
    .regex(/^[a-z0-9-]+$/, "Только a-z, 0-9, -"),
  category: z.string().min(1, "Обязательно"),
  address: z.string().min(1, "Обязательно"),
  lat: numericString.pipe(z.number().gte(-90).lte(90)),
  lng: numericString.pipe(z.number().gte(-180).lte(180)),
  phone: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  priceAvg: z
    .union([z.string(), z.number(), z.undefined()])
    .optional()
    .transform((v) =>
      v === undefined || v === "" ? undefined : Number.parseInt(String(v), 10),
    ),
  hoursText: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const CATEGORIES = [
  "Русская кухня",
  "Японская кухня",
  "Итальянская кухня",
  "Грузинская кухня",
  "Бургерная",
  "Вьетнамская кухня",
  "Бар",
  "Кафе",
  "Фастфуд",
];

export interface RestaurantFormInitial {
  id: number;
  name: string;
  slug: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  description: string | null;
  priceAvg: number | null;
  hoursJson: string | null;
  coverUrl: string | null;
  status: "draft" | "published" | "archived";
}

interface RestaurantFormProps {
  mode?: "create" | "edit";
  initial?: RestaurantFormInitial;
}

function extractHoursText(hoursJson: string | null): string {
  if (!hoursJson) return "";
  try {
    const parsed = JSON.parse(hoursJson) as { text?: string };
    return parsed.text ?? "";
  } catch {
    return "";
  }
}

export function RestaurantForm({
  mode = "create",
  initial,
}: RestaurantFormProps): React.JSX.Element {
  const router = useRouter();
  const [coverUrl, setCoverUrl] = React.useState<string | null>(
    initial?.coverUrl ?? null,
  );
  const [uploading, setUploading] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const defaultStatus: "draft" | "published" =
    initial?.status === "published" ? "published" : "draft";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          name: initial.name,
          slug: initial.slug,
          category: initial.category,
          address: initial.address,
          lat: initial.lat,
          lng: initial.lng,
          phone: initial.phone ?? "",
          website: initial.website ?? "",
          description: initial.description ?? "",
          priceAvg: initial.priceAvg ?? undefined,
          hoursText: extractHoursText(initial.hoursJson),
          status: defaultStatus,
        }
      : {
          name: "",
          slug: "",
          category: CATEGORIES[0],
          address: "",
          lat: 55.7558,
          lng: 37.6173,
          status: "draft",
        },
  });

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        setSubmitError("Не удалось загрузить фото");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      setCoverUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const body = {
      ...values,
      coverUrl,
      hoursJson: values.hoursText
        ? JSON.stringify({ text: values.hoursText })
        : null,
    };
    const url =
      mode === "edit" && initial
        ? `/api/admin/restaurants/${initial.id}`
        : "/api/admin/restaurants";
    const method = mode === "edit" ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setSubmitError(err.error ?? "Не удалось сохранить");
      return;
    }
    router.push("/admin/restaurants");
    router.refresh();
  });

  const handleDelete = async (): Promise<void> => {
    if (!initial) return;
    if (!confirm("Удалить ресторан без возможности восстановления?")) return;
    setSubmitError(null);
    const res = await fetch(`/api/admin/restaurants/${initial.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setSubmitError(err.error ?? "Не удалось удалить");
      return;
    }
    router.push("/admin/restaurants");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="xl:col-span-2 rounded-2xl border border-border bg-surface-primary p-6 shadow-sm flex flex-col gap-4">
        <h2 className="text-base font-semibold text-fg-primary">
          Основная информация
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Название" error={errors.name?.message}>
            <Input placeholder="Хмель и Солод" {...register("name")} />
          </Field>
          <Field label="Slug (URL)" error={errors.slug?.message}>
            <Input placeholder="khmel-i-solod" {...register("slug")} />
          </Field>
        </div>

        <Field label="Категория" error={errors.category?.message}>
          <select
            {...register("category")}
            className="w-full h-11 rounded-lg border border-border bg-surface-secondary px-4 text-[15px] text-fg-primary outline-none focus:border-accent focus:bg-surface-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Адрес" error={errors.address?.message}>
          <Input placeholder="ул. Пушкина, д. 15, Москва" {...register("address")} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Широта" error={errors.lat?.message}>
            <Input type="number" step="0.0001" {...register("lat")} />
          </Field>
          <Field label="Долгота" error={errors.lng?.message}>
            <Input type="number" step="0.0001" {...register("lng")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Телефон">
            <Input placeholder="+7 (495) 123-45-67" {...register("phone")} />
          </Field>
          <Field label="Сайт">
            <Input placeholder="https://example.com" {...register("website")} />
          </Field>
        </div>

        <Field label="Описание">
          <textarea
            rows={3}
            placeholder="Уютный гастропаб с большим выбором крафтового пива..."
            className="w-full rounded-lg border border-border bg-surface-secondary px-4 py-3 text-[15px] text-fg-primary outline-none focus:border-accent focus:bg-surface-primary resize-y min-h-[92px]"
            {...register("description")}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Часы работы">
            <Input placeholder="12:00 — 00:00" {...register("hoursText")} />
          </Field>
          <Field label="Средний чек (₽)">
            <Input type="number" placeholder="1500" {...register("priceAvg")} />
          </Field>
        </div>
      </section>

      <aside className="flex flex-col gap-6">
        <div className="rounded-2xl border border-border bg-surface-primary p-6 shadow-sm">
          <h3 className="text-base font-semibold text-fg-primary mb-3">
            Фото заведения
          </h3>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="Обложка"
              className="w-full aspect-video object-cover rounded-lg mb-3"
            />
          ) : null}
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-accent transition-colors">
            <Upload className="h-5 w-5 text-fg-muted" />
            <span className="text-sm text-fg-secondary">
              {uploading ? "Загрузка..." : "Добавить фото"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-border bg-surface-primary p-6 shadow-sm">
          <h3 className="text-base font-semibold text-fg-primary mb-3">
            Расположение на карте
          </h3>
          <div className="h-32 rounded-lg bg-surface-secondary flex items-center justify-center text-xs text-fg-muted">
            Координаты задаются вручную выше
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-primary p-6 shadow-sm">
          <h3 className="text-base font-semibold text-fg-primary mb-3">
            Настройки
          </h3>
          <Field label="Статус">
            <select
              {...register("status")}
              className="w-full h-11 rounded-lg border border-border bg-surface-secondary px-4 text-[15px] text-fg-primary outline-none focus:border-accent focus:bg-surface-primary"
            >
              <option value="draft">Черновик</option>
              <option value="published">Опубликован</option>
            </select>
          </Field>
        </div>

        {submitError ? (
          <div
            role="alert"
            className="text-sm text-error bg-error/10 px-3 py-2 rounded-md"
          >
            {submitError}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>

        {mode === "edit" && initial ? (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-error hover:underline self-start"
          >
            Удалить ресторан
          </button>
        ) : null}
      </aside>
    </form>
  );
}

/** Обратно-совместимый алиас для new/page.tsx */
export const AddRestaurantForm = RestaurantForm;

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-fg-secondary">{label}</span>
      {children}
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </label>
  );
}
