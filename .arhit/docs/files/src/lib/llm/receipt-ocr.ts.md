# src/lib/llm/receipt-ocr.ts

OCR чеков через Vision LLM. Реюзает prepareImageForLlm() из ocr.ts и getVisionModel() из client.ts. Экспортирует: recognizeReceipt(imageBuffer) — принимает Buffer, отправляет в LLM с Zod-схемой ReceiptOcrResultSchema, возвращает структурированный результат (establishmentName, items[], total, date, time). Также экспортирует ReceiptItemSchema и ReceiptOcrResultSchema для использования в API routes. Зависимости: ai (generateObject), zod, ./client, ./ocr.
