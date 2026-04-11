# src/app/api/reviews/route.ts

API route для отзывов ресторанов. POST — создание отзыва: validateSession(), multipart/form-data (file, restaurantId, text, rating 1-5), OCR чека через recognizeReceipt(), fuzzy match с confidence >= 0.3, сохранение фото через sharp в /uploads/, insert в reviews + receipts. Возвращает { id, status }. GET — список approved отзывов для ресторана (?restaurantId=N) с данными авторов. Зависимости: sharp, receipt-ocr, fuzzy-match, reviews.ts, receipts.ts.
