# src/lib/hooks/useFlipMorph.ts

Тонкая React-обёртка ("use client") над manualFlipMorph из @/lib/morph.

# Экспорты
- interface UseFlipMorphOptions { sourceEl: HTMLElement | null; targetSelector: string; navigate: () => void }
- useFlipMorph(): (opts: UseFlipMorphOptions) => Promise<void>

Возвращает стабильный useCallback([]) async функцию. Инкапсулирует guard: если sourceEl == null (например, ref ещё не разрешился) — просто вызывает opts.navigate() без попытки морфа. Это упрощает код консьюмеров — им не нужно дублировать этот guard в каждом onClick.

# Когда использовать
Используется в консьюмерах, которые нуждаются в Telegram Mini App fallback (когда нативный View Transitions API недоступен). На устройствах с VT API обычно предпочтительнее просто использовать navigate() из @/lib/transitions, который сам разберётся с выбором стратегии.

# Файл
src/lib/hooks/useFlipMorph.ts

# Пример
const startFlipMorph = useFlipMorph();
const cardRef = useRef<HTMLDivElement>(null);
const router = useRouter();
const onClick = () => startFlipMorph({
  sourceEl: cardRef.current,
  targetSelector: [data-vt-target="restaurant-hero"],
  navigate: () => router.push(/restaurant/${id}),
});
