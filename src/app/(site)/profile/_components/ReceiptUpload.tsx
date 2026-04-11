"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Camera, Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

/**
 * ReceiptUpload — клиентская форма загрузки чека.
 *
 * Фото-инпут (image/*, camera capture), превью загруженного фото,
 * POST на /api/receipts. После успешной загрузки показывает превью OCR
 * результата (позиции, сумма, дата, заведение).
 *
 * Props:
 * - onSuccess — колбэк после успешной загрузки (для обновления списка)
 */

interface OcrItem {
  name: string;
  quantity: number;
  price: number;
}

interface OcrResult {
  establishmentName: string | null;
  items: OcrItem[];
  total: number | null;
  date: string | null;
  time: string | null;
}

interface UploadResponse {
  id: number;
  ocr: OcrResult;
}

interface ReceiptUploadProps {
  onSuccess?: () => void;
}

export function ReceiptUpload({ onSuccess }: ReceiptUploadProps): React.JSX.Element {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/receipts", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Ошибка ${res.status}`);
      }

      const data: UploadResponse = await res.json();
      setResult(data);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  }, [file, onSuccess]);

  const handleReset = useCallback(() => {
    setPreview(null);
    setFile(null);
    setError(null);
    setResult(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  // Success state — show OCR result
  if (result) {
    const { ocr } = result;
    return (
      <div className="rounded-2xl border border-border bg-surface-primary p-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-[14px] font-semibold text-fg-primary">
            Чек загружен
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto h-8 w-8 grid place-items-center rounded-full hover:bg-surface-secondary transition-colors"
          >
            <X className="h-4 w-4 text-fg-muted" />
          </button>
        </div>

        {/* OCR summary */}
        <div className="flex flex-col gap-3">
          {ocr.establishmentName ? (
            <div className="text-[13px] text-fg-secondary">
              <span className="text-fg-muted">Заведение: </span>
              {ocr.establishmentName}
            </div>
          ) : null}

          {ocr.date ? (
            <div className="text-[13px] text-fg-secondary">
              <span className="text-fg-muted">Дата: </span>
              {ocr.date}
              {ocr.time ? ` ${ocr.time}` : ""}
            </div>
          ) : null}

          {ocr.items.length > 0 ? (
            <div>
              <div className="text-[12px] text-fg-muted mb-1.5">Позиции:</div>
              <ul className="flex flex-col gap-1">
                {ocr.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between text-[13px] py-1 px-2 rounded-lg bg-surface-secondary"
                  >
                    <span className="text-fg-primary truncate flex-1 min-w-0">
                      {item.name}
                      {item.quantity > 1 ? ` x${item.quantity}` : ""}
                    </span>
                    <span className="text-fg-secondary font-medium shrink-0 ml-2">
                      {formatPrice(item.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {ocr.total != null ? (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-[14px] font-semibold text-fg-primary">
                Итого
              </span>
              <span className="text-[16px] font-bold text-accent">
                {formatPrice(ocr.total)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-primary p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Выберите фото чека"
      />

      {/* Preview or upload zone */}
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Превью чека"
            className="w-full max-h-[300px] object-contain rounded-xl bg-surface-secondary"
          />
          <button
            type="button"
            onClick={handleReset}
            className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-colors"
        >
          <div className="h-12 w-12 rounded-full bg-accent-light text-accent grid place-items-center">
            <Camera className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-[14px] font-medium text-fg-primary">
              Загрузить фото чека
            </p>
            <p className="text-[12px] text-fg-muted mt-0.5">
              Нажмите или сделайте фото
            </p>
          </div>
        </button>
      )}

      {/* Error */}
      {error ? (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Upload button */}
      {preview && !result ? (
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading}
          className={cn(
            "mt-3 w-full flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-[14px] transition-colors",
            loading
              ? "bg-accent/50 text-white cursor-not-allowed"
              : "bg-accent text-white hover:bg-accent/90",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Распознаём чек...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Загрузить и распознать
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
