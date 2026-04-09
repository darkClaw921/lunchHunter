import { asc } from "drizzle-orm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db/client";
import { restaurants } from "@/lib/db/schema";
import { AddBusinessLunchWizard } from "./_components/AddBusinessLunchWizard";

/**
 * Admin Add Business Lunch /admin/business-lunch/new — 2-шаговая форма
 * (pencil фрейм Rwb40).
 *
 * Шаги: "Программа и содержание" → "Состав и ценообразование".
 * Единая форма: ресторан, цена/скидка/расписание, меню по дням с
 * аккордеонами курсов (салат/суп/основное/напитки). Справа sticky-сайдбар
 * 380px: AI-ассистент (OCR + текстовый ввод), превью, фото, советы.
 */
export default async function AdminAddBusinessLunchPage(): Promise<React.JSX.Element> {
  const allRestaurants = await db
    .select({ id: restaurants.id, name: restaurants.name })
    .from(restaurants)
    .orderBy(asc(restaurants.name));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/business-lunch"
          className="h-9 w-9 flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-primary"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-fg-primary">
          Новый бизнес-ланч
        </h1>
      </div>

      <AddBusinessLunchWizard restaurants={allRestaurants} />
    </div>
  );
}
