import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AddRestaurantForm } from "./_components/AddRestaurantForm";

/**
 * Admin Add Restaurant /admin/restaurants/new — двухколоночная форма
 * (основная информация | фото + карта + настройки). Соответствует
 * pencil-фрейму Admin - Add Restaurant.
 */
export default function AdminAddRestaurantPage(): React.JSX.Element {
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
          Добавить ресторан
        </h1>
      </div>

      <AddRestaurantForm />
    </div>
  );
}
