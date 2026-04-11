# src/app/api/leaderboard/route.ts

API route для лидерборда пользователей. GET ?category=total|beer|wine|tips — топ пользователей + процентиль текущего юзера. Возвращает { leaderboard: [...], userPercentile: number }. Валидирует категорию по VALID_CATEGORIES. Требует авторизацию. Зависимости: receipts.ts (getLeaderboard, getUserPercentile).
