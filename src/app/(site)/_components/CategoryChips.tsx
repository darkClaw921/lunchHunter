"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Chip } from "@/components/ui/Chip";

interface CategoryChipsProps {
  categories: Array<{ key: string; label: string }>;
  activeKey: string | null;
}

export function CategoryChips({
  categories,
  activeKey,
}: CategoryChipsProps): React.JSX.Element {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleClick = (key: string): void => {
    const nextUrl = activeKey === key ? "/" : `/?cat=${encodeURIComponent(key)}`;
    startTransition(() => {
      router.push(nextUrl);
    });
  };

  return (
    <div className="px-5 mt-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map((c) => (
          <Chip
            key={c.key}
            active={c.key === activeKey}
            onClick={() => handleClick(c.key)}
          >
            {c.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
