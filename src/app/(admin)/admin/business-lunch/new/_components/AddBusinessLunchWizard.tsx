"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Clock3,
  Image as ImageIcon,
  Loader2,
  Percent,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * AddBusinessLunchWizard — 2-шаговая форма добавления бизнес-ланча.
 *
 * Соответствует pencil-фрейму Rwb40 в lanchHunter.pen:
 *  • Шаги: "Программа и содержание" → "Состав и ценообразование"
 *  • Единая форма (ресторан, цена, скидка, время, дни, меню по дням
 *    с аккордеонами курсов: Салат / Суп / Основное / Напитки)
 *  • Sticky правая колонка 380px:
 *      - Accent card "AI-ассистент" (OCR фото + textarea описание)
 *      - Success card feedback
 *      - "Превью карточки" (live preview)
 *      - "Фото бизнес-ланча" (2x2 uploader-placeholders)
 *      - "Описание"
 *      - Warning card "Советы"
 *
 * API submit — тот же POST /api/admin/business-lunch. Курсы группируются
 * по категориям и отправляются как flat-строки с префиксом "Категория: название".
 */

interface RestaurantRef {
  id: number;
  name: string;
}

export interface AddBusinessLunchWizardProps {
  restaurants: readonly RestaurantRef[];
}

const COURSE_GROUPS = [
  { key: "salad", label: "Салат на выбор" },
  { key: "soup", label: "Суп дня" },
  { key: "main", label: "Основное блюдо" },
  { key: "drink", label: "Напитки" },
] as const;

type CourseGroupKey = (typeof COURSE_GROUPS)[number]["key"];

type GroupedCourses = Record<CourseGroupKey, string[]>;
type DayGrouped = Record<number, GroupedCourses>; // weekday 1..7

const WEEKDAYS: { weekday: number; label: string; full: string }[] = [
  { weekday: 1, label: "Пн", full: "Понедельник" },
  { weekday: 2, label: "Вт", full: "Вторник" },
  { weekday: 3, label: "Ср", full: "Среда" },
  { weekday: 4, label: "Чт", full: "Четверг" },
  { weekday: 5, label: "Пт", full: "Пятница" },
  { weekday: 6, label: "Сб", full: "Суббота" },
  { weekday: 7, label: "Вс", full: "Воскресенье" },
];

function emptyGroup(): GroupedCourses {
  return { salad: [], soup: [], main: [], drink: [] };
}

function computeMask(days: number[]): number {
  let mask = 0;
  for (const d of days) mask |= 1 << (d - 1);
  return mask;
}

function flattenGroup(g: GroupedCourses): string[] {
  const out: string[] = [];
  for (const gr of COURSE_GROUPS) {
    for (const item of g[gr.key]) {
      if (item.trim()) out.push(`${gr.label}: ${item.trim()}`);
    }
  }
  return out;
}

export function AddBusinessLunchWizard({
  restaurants,
}: AddBusinessLunchWizardProps): React.JSX.Element {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Form state
  const [restaurantId, setRestaurantId] = React.useState<number | null>(
    restaurants[0]?.id ?? null,
  );
  const [name, setName] = React.useState("Бизнес-ланч");
  const [price, setPrice] = React.useState("420");
  const [discount, setDiscount] = React.useState("0");
  const [timeFrom, setTimeFrom] = React.useState("12:00");
  const [timeTo, setTimeTo] = React.useState("16:00");
  const [selectedDays, setSelectedDays] = React.useState<number[]>([
    1, 2, 3, 4, 5,
  ]);
  const [description, setDescription] = React.useState("");

  const [activeDay, setActiveDay] = React.useState<number>(1);
  const [dayGrouped, setDayGrouped] = React.useState<DayGrouped>({});
  const [openGroups, setOpenGroups] = React.useState<
    Record<CourseGroupKey, boolean>
  >({ salad: true, soup: true, main: true, drink: false });

  // AI text description
  const [aiText, setAiText] = React.useState("");

  // OCR state
  const ocrInputRef = React.useRef<HTMLInputElement>(null);
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const [ocrError, setOcrError] = React.useState<string | null>(null);
  const [ocrSuccess, setOcrSuccess] = React.useState<string | null>(null);

  const getGroup = (day: number): GroupedCourses =>
    dayGrouped[day] ?? emptyGroup();

  const toggleDay = (d: number): void => {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  };

  const addItem = (day: number, group: CourseGroupKey): void => {
    setDayGrouped((prev) => {
      const cur = prev[day] ?? emptyGroup();
      return {
        ...prev,
        [day]: { ...cur, [group]: [...cur[group], ""] },
      };
    });
  };

  const updateItem = (
    day: number,
    group: CourseGroupKey,
    idx: number,
    val: string,
  ): void => {
    setDayGrouped((prev) => {
      const cur = prev[day] ?? emptyGroup();
      const next = [...cur[group]];
      next[idx] = val;
      return { ...prev, [day]: { ...cur, [group]: next } };
    });
  };

  const removeItem = (
    day: number,
    group: CourseGroupKey,
    idx: number,
  ): void => {
    setDayGrouped((prev) => {
      const cur = prev[day] ?? emptyGroup();
      return {
        ...prev,
        [day]: {
          ...cur,
          [group]: cur[group].filter((_, i) => i !== idx),
        },
      };
    });
  };

  const toggleGroupOpen = (g: CourseGroupKey): void => {
    setOpenGroups((p) => ({ ...p, [g]: !p[g] }));
  };

  const handleOcrUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setOcrError("Файл слишком большой (максимум 10 МБ)");
      return;
    }
    setOcrLoading(true);
    setOcrError(null);
    setOcrSuccess(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/business-lunch/ocr", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as {
        days?: Array<{ weekday: number; flat: string[] }>;
        error?: string;
      };
      if (!res.ok) {
        setOcrError(json.error ?? "Не удалось распознать меню");
        return;
      }
      const days = json.days ?? [];
      if (days.length === 0) {
        setOcrError("Модель не нашла дней на фото");
        return;
      }
      const foundWeekdays = days.map((d) => d.weekday);
      setSelectedDays((prev) =>
        Array.from(new Set([...prev, ...foundWeekdays])).sort(),
      );

      const next: DayGrouped = { ...dayGrouped };
      for (const d of days) {
        const g = next[d.weekday] ?? emptyGroup();
        // Вся плоская строка уходит в "main" — пользователь перегруппирует
        next[d.weekday] = { ...g, main: [...g.main, ...d.flat] };
      }
      setDayGrouped(next);
      const firstFound = foundWeekdays[0];
      if (firstFound !== undefined) setActiveDay(firstFound);
      setOcrSuccess(
        `Распознано дней: ${days.length}. Проверьте и отредактируйте.`,
      );
    } catch (err) {
      setOcrError(
        err instanceof Error ? err.message : "Ошибка запроса к серверу",
      );
    } finally {
      setOcrLoading(false);
      if (ocrInputRef.current) ocrInputRef.current.value = "";
    }
  };

  const canSubmit =
    restaurantId !== null &&
    name.trim() !== "" &&
    price !== "" &&
    selectedDays.length > 0 &&
    selectedDays.every((d) => flattenGroup(getGroup(d)).length > 0);

  const handleSubmit = async (): Promise<void> => {
    if (!restaurantId) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const body = {
        restaurantId,
        name,
        price: Number.parseInt(price, 10),
        timeFrom,
        timeTo,
        daysMask: computeMask(selectedDays),
        days: selectedDays.map((w) => ({
          weekday: w,
          courses: flattenGroup(getGroup(w)),
        })),
        status: "active" as const,
      };
      const res = await fetch("/api/admin/business-lunch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setSubmitError(err.error ?? "Не удалось сохранить");
        return;
      }
      router.push("/admin/business-lunch");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const restaurantName =
    restaurants.find((r) => r.id === restaurantId)?.name ?? "—";
  const finalPrice = Math.max(
    0,
    (Number.parseInt(price, 10) || 0) -
      (Number.parseInt(discount, 10) || 0),
  );

  const activeDayFull =
    WEEKDAYS.find((d) => d.weekday === activeDay)?.full ?? "Понедельник";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="flex flex-col gap-6 min-w-0">
        <Stepper step={step} />

        {/* Секция: Ресторан */}
        <section className="rounded-2xl border border-border bg-surface-primary p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-fg-primary">
            Выберите ресторан
          </h2>
          <Field label="Ресторан">
            <select
              value={restaurantId ?? ""}
              onChange={(e) => setRestaurantId(Number(e.target.value))}
              className="w-full h-11 rounded-lg border border-border bg-surface-secondary px-4 text-[15px] text-fg-primary outline-none focus:border-accent focus:bg-surface-primary"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Название бизнес-ланча">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Бизнес-ланч «Жаровня»"
            />
          </Field>
        </section>

        {/* Секция: Цена и расписание */}
        <section className="rounded-2xl border border-border bg-surface-primary p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-fg-primary">
            Цена и расписание
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Цена (₽)">
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="420"
              />
            </Field>
            <Field label="Скидка (₽)">
              <div className="relative">
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted pointer-events-none" />
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Время начала">
              <Input
                type="time"
                value={timeFrom}
                onChange={(e) => setTimeFrom(e.target.value)}
              />
            </Field>
            <Field label="Время окончания">
              <Input
                type="time"
                value={timeTo}
                onChange={(e) => setTimeTo(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Дни недели">
            <div className="flex items-center gap-2 flex-wrap">
              {WEEKDAYS.map((d) => {
                const on = selectedDays.includes(d.weekday);
                return (
                  <button
                    key={d.weekday}
                    type="button"
                    onClick={() => toggleDay(d.weekday)}
                    aria-pressed={on}
                    className={`h-10 min-w-10 px-3 rounded-full text-sm font-medium transition-colors ${
                      on
                        ? "bg-accent text-white"
                        : "bg-surface-secondary text-fg-secondary hover:text-fg-primary border border-border"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </section>

        {/* Секция: Меню по дням */}
        <section className="rounded-2xl border border-border bg-surface-primary p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-semibold text-fg-primary">
            Меню по дням
          </h2>

          <div
            role="tablist"
            className="flex items-center gap-2 flex-wrap border-b border-border-light pb-3"
          >
            {selectedDays.map((d) => {
              const wd = WEEKDAYS.find((x) => x.weekday === d);
              const active = activeDay === d;
              return (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveDay(d)}
                  className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent text-white"
                      : "bg-surface-secondary text-fg-secondary hover:text-fg-primary"
                  }`}
                >
                  {wd?.label ?? d}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-fg-primary">
              Блюда на {activeDayFull}
            </h3>
            {COURSE_GROUPS.map((gr) => {
              const open = openGroups[gr.key];
              const items = getGroup(activeDay)[gr.key];
              return (
                <div
                  key={gr.key}
                  className="rounded-xl border border-border overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroupOpen(gr.key)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between px-4 h-11 bg-surface-secondary hover:bg-border-light transition-colors"
                  >
                    <span className="text-sm font-medium text-fg-primary">
                      {gr.label}
                      <span className="ml-2 text-xs text-fg-muted">
                        ({items.length})
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-fg-muted transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {open ? (
                    <div className="p-3 flex flex-col gap-2 bg-surface-primary">
                      {items.map((val, idx) => (
                        <div
                          key={`${gr.key}-${idx}`}
                          className="flex items-center gap-2"
                        >
                          <Input
                            value={val}
                            onChange={(e) =>
                              updateItem(
                                activeDay,
                                gr.key,
                                idx,
                                e.target.value,
                              )
                            }
                            placeholder="Название варианта"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(activeDay, gr.key, idx)
                            }
                            aria-label="Удалить вариант"
                            className="h-10 w-10 flex items-center justify-center rounded-md text-fg-muted hover:text-error hover:bg-error/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addItem(activeDay, gr.key)}
                        className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-dark self-start px-2 py-1 rounded-md hover:bg-accent-light"
                      >
                        <Plus className="h-4 w-4" />
                        Добавить вариант
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {submitError ? (
          <div
            role="alert"
            className="text-sm text-error bg-error/10 px-3 py-2 rounded-md"
          >
            {submitError}
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(step === 2 ? 1 : 1)}
            disabled={step === 1}
          >
            Назад
          </Button>
          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!canSubmit}>
              Далее: состав и ценообразование
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "Сохраняем..." : "Опубликовать"}
            </Button>
          )}
        </div>
      </div>

      {/* Sticky sidebar */}
      <aside className="xl:sticky xl:top-6 flex flex-col gap-4">
        {/* AI card */}
        <div className="rounded-2xl bg-accent text-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-base font-semibold">AI-ассистент</h3>
          </div>
          <p className="text-sm text-white/85 mb-4">
            Загрузите фото меню или опишите словами — ассистент заполнит
            поля автоматически.
          </p>

          <input
            ref={ocrInputRef}
            type="file"
            accept="image/*"
            onChange={handleOcrUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => ocrInputRef.current?.click()}
            disabled={ocrLoading}
            className="w-full rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 px-4 h-11 flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-60 transition-colors"
          >
            {ocrLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {ocrLoading ? "Распознаём..." : "Загрузить фото меню"}
          </button>

          <div className="mt-3 flex flex-col gap-2">
            <textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="Или опишите меню текстом…"
              rows={3}
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-sm placeholder:text-white/60 text-white outline-none focus:bg-white/15"
            />
            <button
              type="button"
              className="w-full rounded-lg bg-white text-accent h-10 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Сгенерировать
            </button>
          </div>

          {ocrError ? (
            <div
              role="alert"
              className="mt-3 text-xs bg-white/15 px-3 py-2 rounded-md"
            >
              {ocrError}
            </div>
          ) : null}
          {ocrSuccess ? (
            <div
              role="status"
              className="mt-3 text-xs bg-white/15 px-3 py-2 rounded-md"
            >
              {ocrSuccess}
            </div>
          ) : null}
        </div>

        {/* Success feedback */}
        <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
          <p className="text-sm text-success font-medium">
            Это выглядит вкусно и сбалансировано
          </p>
          <p className="text-xs text-success/80 mt-1">
            Меню содержит все основные категории блюд.
          </p>
        </div>

        {/* Preview card */}
        <div className="rounded-2xl border border-border bg-surface-primary p-5 shadow-sm">
          <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-3">
            Превью карточки
          </h4>
          <div className="rounded-xl border border-border-light p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-fg-primary text-sm">
                {restaurantName}
              </div>
              <div className="text-right">
                {Number.parseInt(discount, 10) > 0 ? (
                  <div className="text-xs text-fg-muted line-through tabular-nums">
                    {price} ₽
                  </div>
                ) : null}
                <div className="text-base font-bold text-accent tabular-nums">
                  {finalPrice} ₽
                </div>
              </div>
            </div>
            <div className="text-xs text-fg-secondary flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {timeFrom}–{timeTo}
            </div>
            <div className="text-xs text-fg-muted line-clamp-2">
              {flattenGroup(getGroup(activeDay)).slice(0, 3).join(" • ") ||
                "Состав появится здесь…"}
            </div>
          </div>
        </div>

        {/* Photo uploader 2x2 */}
        <div className="rounded-2xl border border-border bg-surface-primary p-5 shadow-sm">
          <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-3">
            Фото бизнес-ланча
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-surface-secondary border border-dashed border-border flex items-center justify-center text-fg-muted"
              >
                <ImageIcon className="h-5 w-5" aria-hidden="true" />
              </div>
            ))}
            <button
              type="button"
              className="aspect-square rounded-lg border border-dashed border-accent/40 bg-accent-light text-accent flex flex-col items-center justify-center gap-1 hover:bg-accent-light/70"
            >
              <Plus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Добавить</span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-border bg-surface-primary p-5 shadow-sm">
          <h4 className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-3">
            Описание (опционально)
          </h4>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Расскажите о бизнес-ланче…"
            className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted outline-none focus:border-accent focus:bg-surface-primary"
          />
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <h4 className="text-sm font-semibold text-warning mb-2">Советы</h4>
          <ul className="flex flex-col gap-1.5 text-xs text-warning/90 list-disc pl-4">
            <li>Добавьте минимум 2 варианта в каждой категории</li>
            <li>Загрузите качественные фото — они увеличивают кликабельность</li>
            <li>Укажите время подачи, чтобы не путать гостей</li>
            <li>Опишите порции и вес — это помогает оправдать цену</li>
          </ul>
        </div>
      </aside>

    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 }): React.JSX.Element {
  const labels = ["Программа и содержание", "Состав и ценообразование"];
  return (
    <nav className="flex items-center gap-3" aria-label="Шаги">
      {labels.map((lbl, idx) => {
        const n = (idx + 1) as 1 | 2;
        const active = n === step;
        const done = n < step;
        return (
          <React.Fragment key={lbl}>
            <div className="flex items-center gap-2">
              <span
                className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-semibold ${
                  active || done
                    ? "bg-accent text-white"
                    : "bg-surface-secondary text-fg-muted"
                }`}
              >
                {n}
              </span>
              <span
                className={`text-sm ${
                  active ? "text-fg-primary font-medium" : "text-fg-muted"
                }`}
              >
                {lbl}
              </span>
            </div>
            {idx < labels.length - 1 ? (
              <span className="h-px w-8 bg-border" aria-hidden="true" />
            ) : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-fg-secondary">{label}</span>
      {children}
    </label>
  );
}
