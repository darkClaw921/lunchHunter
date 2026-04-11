# src/lib/db/reviews.ts

Server-side helpers для работы с отзывами ресторанов. Паттерн аналогичен favorites.ts. Экспортирует: createReview(data: CreateReviewData) — insert в таблицу reviews; getReviewsByRestaurant(restaurantId, limit?) — JOIN с users, только approved, DESC по createdAt; getRestaurantReviewStats(restaurantId) — возвращает { count, avgRating }. Зависимости: drizzle-orm, ./client, ./schema.
