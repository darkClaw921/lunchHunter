import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db/client";
import { restaurants } from "@/lib/db/schema";
import {
  RestaurantForm,
  type RestaurantFormInitial,
} from "../new/_components/AddRestaurantForm";

/**
 * Admin Edit Restaurant /admin/restaurants/[id] — страница редактирования
 * ресторана. Server component: загружает запись по id через Drizzle,
 * 404 если не найдена, иначе рендерит RestaurantForm в режиме edit.
 *
 * В Next.js 15 params — Promise, поэтому ожидается await params.
 */
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditRestaurantPage({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    notFound();
  }

  const [row] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, numericId))
    .limit(1);

  if (!row) {
    notFound();
  }

  const initial: RestaurantFormInitial = {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone,
    website: row.website,
    description: row.description,
    priceAvg: row.priceAvg,
    hoursJson: row.hoursJson,
    coverUrl: row.coverUrl,
    status: row.status,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/restaurants"
          className="h-9 w-9 flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-primary"
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold text-fg-primary">
          Редактировать ресторан
        </h1>
      </div>

      <RestaurantForm mode="edit" initial={initial} />
    </div>
  );
}
