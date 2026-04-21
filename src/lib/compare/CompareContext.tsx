"use client";

import * as React from "react";

export interface CompareLunch {
  id: number;
  name: string;
  price: number;
  timeFrom: string;
  timeTo: string;
  restaurantName: string;
  restaurantSlug: string;
  rating: number | null;
  distanceMeters: number;
  servingNow: boolean;
  courses: string[];
  coverUrl: string | null;
}

interface CompareContextValue {
  items: CompareLunch[];
  add: (lunch: CompareLunch) => void;
  remove: (id: number) => void;
  toggle: (lunch: CompareLunch) => void;
  has: (id: number) => boolean;
  clear: () => void;
}

const CompareContext = React.createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "lh_compare_lunches";
const MAX_COMPARE = 4;

function readFromStorage(): CompareLunch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CompareLunch[]) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [items, setItems] = React.useState<CompareLunch[]>([]);

  // Hydrate from localStorage after mount
  React.useEffect(() => {
    setItems(readFromStorage());
  }, []);

  const persist = React.useCallback((next: CompareLunch[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }, []);

  const add = React.useCallback(
    (lunch: CompareLunch) => {
      setItems((prev) => {
        if (prev.some((l) => l.id === lunch.id)) return prev;
        if (prev.length >= MAX_COMPARE) return prev;
        const next = [...prev, lunch];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  const remove = React.useCallback(
    (id: number) => {
      setItems((prev) => {
        const next = prev.filter((l) => l.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  const toggle = React.useCallback(
    (lunch: CompareLunch) => {
      setItems((prev) => {
        if (prev.some((l) => l.id === lunch.id)) {
          const next = prev.filter((l) => l.id !== lunch.id);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {}
          return next;
        }
        if (prev.length >= MAX_COMPARE) return prev;
        const next = [...prev, lunch];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  const has = React.useCallback(
    (id: number) => items.some((l) => l.id === id),
    [items],
  );

  const clear = React.useCallback(() => {
    persist([]);
  }, [persist]);

  const value = React.useMemo<CompareContextValue>(
    () => ({ items, add, remove, toggle, has, clear }),
    [items, add, remove, toggle, has, clear],
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = React.useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
