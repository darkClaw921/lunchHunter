# src/lib/utils/fuzzy-match.ts

Fuzzy-match для сопоставления названий заведений. Использует Dice coefficient (bigram overlap) на нормализованных строках (lowercase, без пунктуации). Экспортирует: matchEstablishmentName(ocrName, restaurantName) — возвращает { match: boolean, confidence: number }. Порог совпадения >= 0.3. Также экспортирует diceCoefficient(a, b) для тестирования. Используется в API reviews и receipts для проверки соответствия чека ресторану.
