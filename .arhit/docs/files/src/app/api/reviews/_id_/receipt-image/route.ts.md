# src/app/api/reviews/[id]/receipt-image/route.ts

API route для просмотра фото чека отзыва. GET — только для админов (requireAdmin()). Возвращает { url } с путём к изображению чека для указанного отзыва. Используется в ReviewCard для кнопки 'Посмотреть чек'.
