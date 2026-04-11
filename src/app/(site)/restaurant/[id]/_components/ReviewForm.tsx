"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { Star, Camera, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ReviewFormProps {
  restaurantId: number;
  onSuccess?: () => void;
}

type FormStatus = "idle" | "loading" | "success" | "error";

/**
 * Форма создания отзыва с загрузкой фото чека.
 * POST на /api/reviews с multipart/form-data.
 */
export function ReviewForm({
  restaurantId,
  onSuccess,
}: ReviewFormProps): React.JSX.Element {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selected);
  }

  function resetForm() {
    setRating(0);
    setText("");
    setFile(null);
    setPreview(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      setErrorMessage("Выберите рейтинг от 1 до 5");
      setStatus("error");
      return;
    }
    if (!text.trim()) {
      setErrorMessage("Напишите текст отзыва");
      setStatus("error");
      return;
    }
    if (!file) {
      setErrorMessage("Прикрепите фото чека");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("restaurantId", String(restaurantId));
    formData.append("text", text.trim());
    formData.append("rating", String(rating));

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          ocrEstablishment?: string;
        };
        if (res.status === 422) {
          setErrorMessage(
            data.ocrEstablishment
              ? `Чек не соответствует заведению (распознано: "${data.ocrEstablishment}")`
              : "Чек не соответствует заведению",
          );
        } else if (res.status === 401) {
          setErrorMessage("Необходимо войти в аккаунт");
        } else {
          setErrorMessage(data.error ?? "Ошибка при отправке отзыва");
        }
        setStatus("error");
        return;
      }

      setStatus("success");
      resetForm();
      onSuccess?.();
    } catch {
      setErrorMessage("Ошибка сети. Попробуйте позже.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-secondary p-6 text-center">
        <CheckCircle className="h-8 w-8 text-emerald-500" />
        <p className="text-[14px] font-medium text-fg-primary">
          Отзыв отправлен!
        </p>
        <p className="text-[12px] text-fg-muted">
          Спасибо за ваш отзыв. Он появится после проверки.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-2 text-[13px] font-medium text-accent hover:text-accent/80 transition-colors"
        >
          Написать ещё
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl bg-surface-secondary p-4"
    >
      {/* Star rating */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-fg-muted">Оценка</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
                aria-label={`${starValue} звёзд`}
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    starValue <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-fg-muted/30",
                  )}
                />
              </button>
            );
          })}
          {rating > 0 && (
            <span className="ml-2 text-[13px] font-medium text-fg-secondary">
              {rating}/5
            </span>
          )}
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="review-text"
          className="text-[12px] font-medium text-fg-muted"
        >
          Ваш отзыв
        </label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Расскажите о вашем опыте..."
          rows={3}
          className="rounded-xl border border-border-light bg-surface-primary px-3 py-2 text-[13px] text-fg-primary placeholder:text-fg-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
        />
      </div>

      {/* File input */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium text-fg-muted">
          Фото чека
        </span>
        {preview ? (
          <div className="relative w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Превью чека"
              className="h-24 w-24 rounded-xl object-cover border border-border-light"
            />
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white grid place-items-center text-[10px] font-bold hover:bg-red-600 transition-colors"
            >
              &times;
            </button>
          </div>
        ) : (
          <label
            htmlFor="review-file"
            className="flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-border-light bg-surface-primary px-4 py-3 text-[13px] text-fg-muted hover:border-accent/50 hover:text-accent transition-colors"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            Прикрепить фото чека
          </label>
        )}
        <input
          ref={fileInputRef}
          id="review-file"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>

      {/* Error */}
      {status === "error" && errorMessage && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-semibold transition-colors",
          "bg-accent text-white hover:bg-accent/90",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Отправка...
          </>
        ) : (
          "Отправить отзыв"
        )}
      </button>
    </form>
  );
}

export default ReviewForm;
