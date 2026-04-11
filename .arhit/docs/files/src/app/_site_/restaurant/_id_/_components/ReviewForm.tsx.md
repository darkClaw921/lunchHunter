# src/app/(site)/restaurant/[id]/_components/ReviewForm.tsx

Client component — форма создания отзыва с загрузкой фото чека. Фото-инпут (accept=image/*, capture=environment), интерактивный звёздный рейтинг (1-5), textarea для текста. POST на /api/reviews с multipart/form-data. Стейты: idle, loading, success, error. Props: restaurantId, onSuccess callback.
