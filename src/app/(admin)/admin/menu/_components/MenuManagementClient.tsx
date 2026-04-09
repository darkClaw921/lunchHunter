"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  Search,
  UtensilsCrossed,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * MenuManagementClient — выбор ресторана, табы категорий, таблица позиций,
 * форма добавления позиции и карточка OCR «Загрузить меню из фото»
 * (Phase 7, работает через POST /api/admin/menu/ocr).
 *
 * OCR flow:
 *  1. Пользователь выбирает файл → показываем preview.
 *  2. Клик «Распознать» → POST multipart → список MenuItemDraft с чекбоксами.
 *  3. Пользователь редактирует/снимает галочки → клик «Сохранить в меню» →
 *     bulk insert через существующий POST /api/admin/menu (action=create-item).
 */

interface OcrDraft {
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  selected: boolean;
}

interface RestaurantRef {
  id: number;
  name: string;
}
interface Category {
  id: number;
  name: string;
}
interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  status: "active" | "hidden";
  categoryId: number | null;
  photoUrl: string | null;
}

export interface MenuManagementClientProps {
  restaurants: readonly RestaurantRef[];
  selectedRestaurantId: number | null;
  categories: readonly Category[];
  items: readonly MenuItem[];
}

export function MenuManagementClient({
  restaurants,
  selectedRestaurantId,
  categories,
  items,
}: MenuManagementClientProps): React.JSX.Element {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = React.useState<number | null>(
    categories[0]?.id ?? null,
  );
  const [addOpen, setAddOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newPrice, setNewPrice] = React.useState("");
  const [query, setQuery] = React.useState("");

  // OCR state
  const ocrInputRef = React.useRef<HTMLInputElement>(null);
  const [ocrFile, setOcrFile] = React.useState<File | null>(null);
  const [ocrPreviewUrl, setOcrPreviewUrl] = React.useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const [ocrError, setOcrError] = React.useState<string | null>(null);
  const [ocrDrafts, setOcrDrafts] = React.useState<OcrDraft[]>([]);
  const [ocrSaving, setOcrSaving] = React.useState(false);

  React.useEffect(() => {
    if (!ocrFile) {
      setOcrPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(ocrFile);
    setOcrPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [ocrFile]);

  const resetOcr = (): void => {
    setOcrFile(null);
    setOcrDrafts([]);
    setOcrError(null);
    if (ocrInputRef.current) ocrInputRef.current.value = "";
  };

  const handleOcrFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = e.target.files?.[0] ?? null;
    setOcrDrafts([]);
    setOcrError(null);
    if (!file) {
      setOcrFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setOcrError("Файл слишком большой (максимум 10 МБ)");
      setOcrFile(null);
      return;
    }
    setOcrFile(file);
  };

  const handleRecognize = async (): Promise<void> => {
    if (!ocrFile) return;
    setOcrLoading(true);
    setOcrError(null);
    setOcrDrafts([]);
    try {
      const fd = new FormData();
      fd.append("file", ocrFile);
      const res = await fetch("/api/admin/menu/ocr", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as {
        items?: Array<{
          name: string;
          description?: string | null;
          price: number;
          category?: string | null;
        }>;
        error?: string;
      };
      if (!res.ok) {
        setOcrError(json.error ?? "Не удалось распознать меню");
        return;
      }
      const drafts: OcrDraft[] = (json.items ?? []).map((i) => ({
        name: i.name,
        description: i.description ?? null,
        price: i.price,
        category: i.category ?? null,
        selected: true,
      }));
      if (drafts.length === 0) {
        setOcrError("Модель не нашла позиций на фото");
        return;
      }
      setOcrDrafts(drafts);
    } catch (err) {
      setOcrError(
        err instanceof Error ? err.message : "Ошибка запроса к серверу",
      );
    } finally {
      setOcrLoading(false);
    }
  };

  const updateDraft = (idx: number, patch: Partial<OcrDraft>): void => {
    setOcrDrafts((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    );
  };

  const removeDraft = (idx: number): void => {
    setOcrDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleBulkInsert = async (): Promise<void> => {
    if (!selectedRestaurantId) return;
    const chosen = ocrDrafts.filter((d) => d.selected && d.name && d.price > 0);
    if (chosen.length === 0) return;
    setOcrSaving(true);
    setOcrError(null);
    try {
      for (const d of chosen) {
        const res = await fetch("/api/admin/menu", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "create-item",
            restaurantId: selectedRestaurantId,
            categoryId: activeCategoryId,
            name: d.name,
            description: d.description,
            price: d.price,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(err.error ?? `Ошибка сохранения «${d.name}»`);
        }
      }
      resetOcr();
      router.refresh();
    } catch (err) {
      setOcrError(
        err instanceof Error ? err.message : "Не удалось сохранить позиции",
      );
    } finally {
      setOcrSaving(false);
    }
  };

  const selectedRestaurant = restaurants.find(
    (r) => r.id === selectedRestaurantId,
  );

  const filtered = items.filter((it) => {
    if (activeCategoryId !== null && it.categoryId !== activeCategoryId) {
      return false;
    }
    if (query && !it.name.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    return true;
  });

  const activeCount = activeCategoryId
    ? items.filter((i) => i.categoryId === activeCategoryId).length
    : items.length;

  const handleSwitchRestaurant = (id: number): void => {
    router.push(`/admin/menu?restaurantId=${id}`);
  };

  const handleAddItem = async (): Promise<void> => {
    if (!selectedRestaurantId || !newName || !newPrice) return;
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "create-item",
        restaurantId: selectedRestaurantId,
        categoryId: activeCategoryId,
        name: newName,
        description: newDesc || null,
        price: Number.parseInt(newPrice, 10),
      }),
    });
    if (res.ok) {
      setNewName("");
      setNewDesc("");
      setNewPrice("");
      setAddOpen(false);
      router.refresh();
    }
  };

  if (!selectedRestaurant) {
    return (
      <div className="p-8 text-center text-fg-muted">
        Сначала создайте ресторан
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-semibold text-fg-primary">
            Меню — {selectedRestaurant.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedRestaurantId ?? ""}
            onChange={(e) => handleSwitchRestaurant(Number(e.target.value))}
            className="h-10 rounded-lg border border-border bg-surface-primary px-3 text-sm text-fg-primary outline-none focus:border-accent"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <Button variant="secondary">Загрузить фото меню</Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setAddOpen((v) => !v)}
          >
            Добавить позицию
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-primary shadow-sm">
        {/* Tabs: categories */}
        <div className="px-6 pt-5 flex items-center gap-2 flex-wrap">
          {categories.map((c) => {
            const active = c.id === activeCategoryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategoryId(c.id)}
                className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-white"
                    : "bg-surface-secondary text-fg-secondary hover:text-fg-primary"
                }`}
              >
                {c.name}
              </button>
            );
          })}
          <button
            type="button"
            className="h-9 px-4 rounded-full text-sm font-medium text-accent bg-accent-light hover:bg-accent-light/70"
          >
            + Добавить
          </button>
        </div>

        <div className="px-6 pt-5 pb-3 flex items-center justify-between gap-4">
          <p className="text-sm text-fg-secondary">
            {activeCount} {pluralize(activeCount, "позиция", "позиции", "позиций")}
          </p>
          <div className="w-64">
            <Input
              leftIcon={<Search className="h-4 w-4" />}
              placeholder="Поиск позиции..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputSize="sm"
            />
          </div>
        </div>

        {addOpen ? (
          <div className="px-6 pb-5 flex items-end gap-3 border-b border-border-light">
            <div className="flex-1">
              <Input
                placeholder="Название"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex-[2]">
              <Input
                placeholder="Описание"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
            <div className="w-32">
              <Input
                type="number"
                placeholder="Цена ₽"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
            </div>
            <Button onClick={handleAddItem} size="sm">
              Добавить
            </Button>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-fg-muted text-sm">
            Нет позиций в этой категории
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-fg-muted uppercase tracking-wide border-b border-border-light">
                <th className="px-6 py-3 font-medium">Название</th>
                <th className="px-6 py-3 font-medium">Описание</th>
                <th className="px-6 py-3 font-medium text-right">Цена</th>
                <th className="px-6 py-3 font-medium">Статус</th>
                <th className="px-6 py-3 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className="border-b border-border-light">
                  <td className="px-6 py-3 font-medium text-fg-primary">
                    {it.name}
                  </td>
                  <td className="px-6 py-3 text-fg-secondary max-w-[360px] truncate">
                    {it.description ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums text-fg-primary font-medium">
                    {it.price} ₽
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center h-6 px-2 rounded-md text-xs font-medium ${
                        it.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-fg-muted/10 text-fg-muted"
                      }`}
                    >
                      {it.status === "active" ? "Активна" : "Скрыта"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Редактировать"
                        className="h-8 w-8 flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-secondary hover:text-accent"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Удалить"
                        className="h-8 w-8 flex items-center justify-center rounded-md text-fg-secondary hover:bg-error/10 hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* OCR — реальное распознавание через POST /api/admin/menu/ocr */}
      <div className="rounded-2xl border border-border bg-surface-primary p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-accent-light flex items-center justify-center shrink-0">
            <Upload className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-base font-semibold text-fg-primary">
                Загрузить фото меню
              </h3>
              <span className="text-[11px] font-medium uppercase tracking-wide text-accent bg-accent-light px-2 py-0.5 rounded-full">
                AI распознавание
              </span>
            </div>
            <p className="text-sm text-fg-secondary mb-4">
              Загрузите фотографию бумажного меню — Grok-4 распознает все
              позиции с ценами. Проверьте и сохраните разом.
            </p>

            <input
              ref={ocrInputRef}
              type="file"
              accept="image/*"
              onChange={handleOcrFileChange}
              className="hidden"
            />

            {!ocrFile ? (
              <button
                type="button"
                onClick={() => ocrInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent hover:bg-accent-light/30 transition-colors"
              >
                <p className="text-sm text-fg-muted">
                  Нажмите, чтобы выбрать фото меню
                </p>
                <p className="text-xs text-fg-muted mt-1">PNG, JPG до 10 МБ</p>
              </button>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  {ocrPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ocrPreviewUrl}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded-lg border border-border"
                    />
                  ) : null}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-fg-primary truncate">
                      {ocrFile.name}
                    </div>
                    <div className="text-xs text-fg-muted">
                      {(ocrFile.size / 1024 / 1024).toFixed(2)} МБ
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={handleRecognize}
                        disabled={ocrLoading}
                        leftIcon={
                          ocrLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : undefined
                        }
                      >
                        {ocrLoading ? "Распознаём..." : "Распознать"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={resetOcr}
                        disabled={ocrLoading}
                      >
                        Отменить
                      </Button>
                    </div>
                  </div>
                </div>

                {ocrError ? (
                  <div
                    role="alert"
                    className="text-sm text-error bg-error/10 px-3 py-2 rounded-md"
                  >
                    {ocrError}
                  </div>
                ) : null}

                {ocrDrafts.length > 0 ? (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="px-4 py-3 bg-surface-secondary flex items-center justify-between">
                      <span className="text-sm font-medium text-fg-primary">
                        Распознано позиций: {ocrDrafts.length}
                      </span>
                      <Button
                        size="sm"
                        onClick={handleBulkInsert}
                        disabled={
                          ocrSaving ||
                          ocrDrafts.filter((d) => d.selected).length === 0
                        }
                      >
                        {ocrSaving
                          ? "Сохраняем..."
                          : `Сохранить в меню (${ocrDrafts.filter((d) => d.selected).length})`}
                      </Button>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-fg-muted uppercase tracking-wide border-b border-border-light">
                          <th className="px-3 py-2 w-10" />
                          <th className="px-3 py-2 font-medium">Название</th>
                          <th className="px-3 py-2 font-medium">Описание</th>
                          <th className="px-3 py-2 font-medium">Категория</th>
                          <th className="px-3 py-2 font-medium text-right">
                            Цена
                          </th>
                          <th className="px-3 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {ocrDrafts.map((d, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-border-light last:border-b-0"
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={d.selected}
                                onChange={(e) =>
                                  updateDraft(idx, {
                                    selected: e.target.checked,
                                  })
                                }
                                aria-label={`Выбрать «${d.name}»`}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                inputSize="sm"
                                value={d.name}
                                onChange={(e) =>
                                  updateDraft(idx, { name: e.target.value })
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                inputSize="sm"
                                value={d.description ?? ""}
                                onChange={(e) =>
                                  updateDraft(idx, {
                                    description: e.target.value || null,
                                  })
                                }
                              />
                            </td>
                            <td className="px-3 py-2 text-fg-secondary">
                              {d.category ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Input
                                inputSize="sm"
                                type="number"
                                className="text-right"
                                value={d.price.toString()}
                                onChange={(e) =>
                                  updateDraft(idx, {
                                    price:
                                      Number.parseInt(e.target.value, 10) || 0,
                                  })
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeDraft(idx)}
                                className="h-7 w-7 flex items-center justify-center rounded-md text-fg-muted hover:bg-error/10 hover:text-error"
                                aria-label="Убрать"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function pluralize(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
