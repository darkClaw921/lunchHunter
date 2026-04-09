"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/Input";

export interface SearchHomeFormProps {
  placeholder?: string;
  initialQuery?: string;
}

/**
 * Форма поиска в шапке Home. При submit переходит на /search?q=...
 */
export function SearchHomeForm({
  placeholder,
  initialQuery = "",
}: SearchHomeFormProps): React.JSX.Element {
  const router = useRouter();
  const [value, setValue] = React.useState(initialQuery);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const q = value.trim();
    if (q.length === 0) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={onSubmit}>
      <SearchInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Поиск"
      />
    </form>
  );
}
