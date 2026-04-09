# src/components/ui/FavoriteButton.tsx

FavoriteButton — клиентская кнопка добавления/удаления элемента в избранное. Client component ("use client").

**Поддерживает три типа targetType:** restaurant | menu_item | lunch
**Три визуальных варианта (variant):**
- icon (default) — маленькая иконка h-8 w-8 grid place-items-center rounded-full
- button — большая кнопка h-14 w-full с иконкой + текстом ("Добавить в избранное" / "В избранном")
- iconFloating — floating круг h-10 w-10 bg-white/90 backdrop-blur (для hero-изображений)

**Пропы (FavoriteButtonProps):**
- targetType, targetId — идентификация элемента
- initialFavorited — начальное состояние с сервера (false для гостей)
- isAuthenticated — залогинен ли пользователь
- variant — визуальный вариант
- className, ariaLabel, label, labelActive — кастомизация

**Логика:**
- Оптимистичное обновление: мгновенно переключает состояние, затем POST /api/favorites
- При ошибке — откат состояния через setFavorited(!next)
- Неавторизованный пользователь — router.push("/profile") для Telegram login
- pending-защита предотвращает двойные клики

**Press feedback + хаптики (Фаза 4):**
- useHaptics подключён, хаптик вызывается МГНОВЕННО до API-запроса:
  - haptics.success() при добавлении в избранное (next=true) — "положительный" паттерн вибрации
  - haptics.light() при удалении из избранного (next=false) — мягкий тап
- active:scale-[0.97] на variant="button", active:scale-90 на icon/iconFloating (для маленьких кнопок заметнее)
- transition-transform duration-100 везде

**Экспорты:** FavoriteButton, FavoriteTargetType, FavoriteButtonProps
**Зависимости:** next/navigation, lucide-react (Heart), @/lib/utils/cn, @/lib/hooks/useHaptics
