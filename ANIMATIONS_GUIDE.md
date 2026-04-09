# Гайд по бесшовным анимациям интерфейса

> Адаптация принципов из статьи Konstantin Shkurko *«Искусство бесшовных переходов в iOS — от 60 FPS до идеального UX»* (habr.com/ru/articles/1000184/) под веб-стек **Next.js 15 + React 19 + Tailwind CSS 4**.

---

## Содержание

1. [Философия и три закона анимаций](#1-философия-и-три-закона-анимаций)
2. [Веб-аналоги iOS API](#2-веб-аналоги-ios-api)
3. [Чек-лист перед стартом](#3-чек-лист-перед-стартом)
4. [Шаг 1. Подготовка проекта](#шаг-1-подготовка-проекта)
5. [Шаг 2. Базовые CSS-переходы и Tailwind utilities](#шаг-2-базовые-css-переходы-и-tailwind-utilities)
6. [Шаг 3. View Transitions API в Next.js App Router](#шаг-3-view-transitions-api-в-nextjs-app-router)
7. [Шаг 4. Shared Element Transitions (аналог matchedGeometryEffect)](#шаг-4-shared-element-transitions-аналог-matchedgeometryeffect)
8. [Шаг 5. FLIP-техника для list ↔ detail](#шаг-5-flip-техника-для-list--detail)
9. [Шаг 6. Кастомные React-хуки для анимаций](#шаг-6-кастомные-react-хуки-для-анимаций)
10. [Шаг 7. Борьба с jank, мигании и layout shift](#шаг-7-борьба-с-jank-миганием-и-layout-shift)
11. [Шаг 8. Профилирование и отладка](#шаг-8-профилирование-и-отладка)
12. [Шаг 9. Реальный кейс — Restaurant Grid → Restaurant Detail](#шаг-9-реальный-кейс--restaurant-grid--restaurant-detail)
13. [Анти-паттерны](#анти-паттерны)
14. [Чек-лист готовности](#чек-лист-готовности)

---

## 1. Философия и три закона анимаций

Все принципы оригинальной статьи переносятся в веб без потерь. Запомните три правила:

### Закон №1. Perceived performance важнее actual performance
Запускайте анимацию **мгновенно**, даже если данные ещё грузятся. Пользователь не почувствует 100 мс задержки внутри анимации, но мгновенно заметит 100 мс перед её началом.

```tsx
// Плохо: ждём ответ API, потом запускаем анимацию
async function open() {
  const data = await fetchDetail(id);
  setDetail(data);          // <- анимация только теперь
}

// Хорошо: показываем оптимистический UI, дозагружаем уже в полёте
function open() {
  setDetail(optimisticDataFromList);  // <- анимация началась
  startTransition(async () => {
    const fresh = await fetchDetail(id);
    setDetail(fresh);
  });
}
```

### Закон №2. Меньше — лучше
Одна выверенная анимация лучше десяти посредственных. Если есть сомнение — не добавлять.

### Закон №3. Тестируйте на слабых устройствах
Если 60 FPS не держится на mid-range Android — упрощайте, удаляйте `box-shadow`, отключайте `backdrop-filter`, переходите на `transform`/`opacity`-only анимации.

### Когда анимация **нужна**
- Смена контекста (переход между экранами)
- Обратная связь (нажатие кнопки, переключение)
- Загрузка (skeleton, спиннер, прогресс)

### Когда анимация **избыточна**
- Декоративные «выезжания» текста
- Каскадные задержки длиннее 300 мс
- Микро-эффекты, которых пользователь не успевает заметить

---

## 2. Веб-аналоги iOS API

| iOS / SwiftUI | Веб-аналог |
|---|---|
| `matchedGeometryEffect` + `@Namespace` | **View Transitions API** + `view-transition-name` |
| `withAnimation { ... }` | `document.startViewTransition(() => setState(...))` |
| `.transition(.opacity)` | CSS `@starting-style` или `transition` + классы |
| `.spring(response, dampingFraction)` | CSS `cubic-bezier()` или Web Animations API `easing` |
| `AnimatableModifier` | Custom React hook + `requestAnimationFrame` |
| `GeometryReader` | `getBoundingClientRect()` + `ResizeObserver` |
| `LazyVGrid` + `transition` | CSS Grid + FLIP technique |
| `Slow Animations (Cmd+T)` | DevTools → **Rendering → Emulate CSS animation speed** |
| `Core Animation Instrument` | DevTools → **Performance → Frames** |
| `Color Blended Layers` | DevTools → **Layers panel** + **Paint flashing** |

---

## 3. Чек-лист перед стартом

- [ ] Проект работает на актуальном Next.js (>= 15) и React (>= 19)
- [ ] Tailwind 4 настроен (есть `globals.css` с `@import "tailwindcss"`)
- [ ] Анимации только через `transform`, `opacity`, `filter`, `clip-path` — это GPU-friendly свойства
- [ ] `prefers-reduced-motion` уважается на уровне всего сайта

```css
/* src/app/globals.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Шаг 1. Подготовка проекта

### 1.1. Глобальные CSS-переменные с easing-функциями

Унифицируйте кривые движения. Без них каждая анимация будет «своя» и итоговый UI станет рваным.

```css
/* src/app/globals.css */
:root {
  /* Длительности */
  --dur-instant: 80ms;
  --dur-fast:    160ms;
  --dur-base:    240ms;
  --dur-slow:    400ms;

  /* Easing-функции */
  --ease-out-quart:  cubic-bezier(0.25, 1,    0.5,  1);     /* для появления */
  --ease-in-quart:   cubic-bezier(0.5,  0,    0.75, 0);     /* для исчезновения */
  --ease-in-out:     cubic-bezier(0.4,  0,    0.2,  1);     /* материал */
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);     /* лёгкая «пружина» */
  --ease-snappy:     cubic-bezier(0.2,  0.9,  0.3,  1.2);   /* отскок */
}
```

### 1.2. Правило по умолчанию для интерактивных элементов

```css
button, a, [role="button"] {
  transition:
    transform var(--dur-fast) var(--ease-out-quart),
    opacity   var(--dur-fast) var(--ease-out-quart),
    background-color var(--dur-fast) var(--ease-in-out);
}

button:active, [role="button"]:active {
  transform: scale(0.97);
}
```

> **Важно:** никогда не пишите `transition: all`. Это рендер-килер: браузер начинает следить за каждым свойством и включает дорогостоящие layer recomposites.

---

## Шаг 2. Базовые CSS-переходы и Tailwind utilities

### 2.1. Появление с `@starting-style`

`@starting-style` — нативный аналог SwiftUI `.transition(.opacity)`. Работает в Chromium 117+, Safari 17.5+, Firefox 129+.

```css
.modal {
  opacity: 1;
  transform: translateY(0);
  transition: opacity var(--dur-base) var(--ease-out-quart),
              transform var(--dur-base) var(--ease-out-quart);
}

@starting-style {
  .modal {
    opacity: 0;
    transform: translateY(16px);
  }
}
```

### 2.2. Tailwind 4 — кастомные утилиты

```css
@theme {
  --animate-fade-in: fade-in var(--dur-base) var(--ease-out-quart) both;
  --animate-pop-in:  pop-in  var(--dur-base) var(--ease-spring) both;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pop-in {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
```

Использование:

```tsx
<div className="animate-fade-in">Загруженный контент</div>
<button className="animate-pop-in">Подтвердить</button>
```

### 2.3. Stagger через `style={{ animationDelay }}`

```tsx
{items.map((item, i) => (
  <Card
    key={item.id}
    className="animate-fade-in"
    style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
  />
))}
```

> Ограничивайте максимум суммарной задержки **300 мс**. Иначе UI «течёт» дольше, чем нужно (Закон №2).

---

## Шаг 3. View Transitions API в Next.js App Router

View Transitions API — это и есть веб-эквивалент `withAnimation { ... }` из SwiftUI: одна функция, и DOM-изменения разворачиваются в плавную кросс-фейд-анимацию.

### 3.1. Включение в Next.js 15

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
```

### 3.2. Глобальный CSS

```css
/* src/app/globals.css */
@view-transition {
  navigation: auto;
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: var(--dur-base);
  animation-timing-function: var(--ease-out-quart);
}

/* отдельный fade для основного контента */
::view-transition-old(root) {
  animation-name: fade-out;
}
::view-transition-new(root) {
  animation-name: fade-in;
}

@keyframes fade-out { to { opacity: 0; } }
@keyframes fade-in  { from { opacity: 0; } }
```

### 3.3. Программный запуск (для неперемещений)

```tsx
'use client';
import { flushSync } from 'react-dom';

function toggleTheme() {
  if (!document.startViewTransition) {
    setDark(d => !d);
    return;
  }
  document.startViewTransition(() => {
    flushSync(() => setDark(d => !d));
  });
}
```

> `flushSync` нужен потому, что View Transitions API делает «снимок» DOM до и после колбэка. Без `flushSync` React успеет применить изменения только после снапшота — анимации не будет.

---

## Шаг 4. Shared Element Transitions (аналог matchedGeometryEffect)

Это самая мощная часть API: один и тот же `view-transition-name` на двух страницах = плавный morph между ними.

### 4.1. На странице списка

```tsx
// src/app/(site)/_components/RestaurantCard.tsx
export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link href={`/restaurant/${restaurant.id}`} className="block">
      <img
        src={restaurant.image}
        alt={restaurant.name}
        style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
        className="aspect-[4/3] w-full rounded-2xl object-cover"
      />
      <h3
        style={{ viewTransitionName: `restaurant-title-${restaurant.id}` }}
        className="mt-3 text-base font-semibold"
      >
        {restaurant.name}
      </h3>
    </Link>
  );
}
```

### 4.2. На странице детали

```tsx
// src/app/(site)/restaurant/[id]/page.tsx
export default async function RestaurantDetail({ params }) {
  const restaurant = await getRestaurant(params.id);
  return (
    <article>
      <img
        src={restaurant.image}
        alt={restaurant.name}
        style={{ viewTransitionName: `restaurant-image-${restaurant.id}` }}
        className="h-[60vh] w-full object-cover"
      />
      <h1
        style={{ viewTransitionName: `restaurant-title-${restaurant.id}` }}
        className="px-4 text-3xl font-bold"
      >
        {restaurant.name}
      </h1>
    </article>
  );
}
```

### 4.3. Тонкая настройка анимации morph

```css
::view-transition-group(*) {
  animation-duration: var(--dur-slow);
  animation-timing-function: var(--ease-spring);
}

::view-transition-image-pair(*) {
  isolation: auto;          /* предотвращает белое мигание */
}
```

> **Важно:** `view-transition-name` должен быть **уникальным** в момент снапшота. Если на странице два элемента с одинаковым именем — браузер выбросит warning, и анимации не будет.

---

## Шаг 5. FLIP-техника для list ↔ detail

Когда нужна анимация **внутри одной страницы** (например раскрытие карточки в полноэкранный режим без навигации), используйте **FLIP**: First → Last → Invert → Play.

```ts
// src/lib/hooks/useFlip.ts
import { useLayoutEffect, useRef } from 'react';

export function useFlip<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null);
  const prev = useRef<DOMRect | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const last = el.getBoundingClientRect();

    if (prev.current) {
      const dx = prev.current.left - last.left;
      const dy = prev.current.top  - last.top;
      const sx = prev.current.width  / last.width;
      const sy = prev.current.height / last.height;

      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transform: 'none' },
        ],
        {
          duration: 400,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          fill: 'both',
        }
      );
    }
    prev.current = last;
  }, deps);

  return ref;
}
```

Использование:

```tsx
const ref = useFlip<HTMLDivElement>([isExpanded]);
return (
  <div
    ref={ref}
    className={isExpanded ? 'fixed inset-0 z-50' : 'aspect-[4/3] w-full'}
  >
    {children}
  </div>
);
```

> FLIP покрывает 90% сценариев, где View Transitions API недоступен (Safari < 17.5, Firefox без флагов).

---

## Шаг 6. Кастомные React-хуки для анимаций

### 6.1. `useMounted` — задержка анимации до hydration

```ts
import { useEffect, useState } from 'react';
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
```

Чтобы избежать SSR-flash:

```tsx
const mounted = useMounted();
return <div className={mounted ? 'animate-fade-in' : 'opacity-0'}>...</div>;
```

### 6.2. `usePrefersReducedMotion`

```ts
import { useEffect, useState } from 'react';
export function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduce;
}
```

### 6.3. `useViewTransition` — обёртка над API

```ts
export function useViewTransition() {
  return (callback: () => void) => {
    if (typeof document === 'undefined' || !document.startViewTransition) {
      callback();
      return;
    }
    document.startViewTransition(() => {
      flushSync(callback);
    });
  };
}
```

---

## Шаг 7. Борьба с jank, мигании и layout shift

### 7.1. Jank (микрофризы)

| Причина | Решение |
|---|---|
| Тяжёлые ре-рендеры в момент анимации | `useDeferredValue`, `startTransition`, мемоизация |
| Загрузка картинок без `width/height` | Всегда указывать размеры или `aspect-ratio` |
| `box-shadow` + `border-radius` на крупных элементах | Использовать `outline` или SVG-фильтр в `<defs>` |
| `backdrop-filter` в анимации | Убрать на время transition или заменить на статичный полупрозрачный фон |

### 7.2. Мигание (flash)

| Причина | Решение |
|---|---|
| Theme переключается без `color-scheme` | `<meta name="color-scheme" content="dark light">` |
| Картинка перерисовывается заново | `priority` + `next/image` + одинаковый src на обеих страницах |
| `view-transition-name` пропадает между снапшотами | Назначать имя через `style`, а не через CSS-класс с условием |

### 7.3. Layout shift

```tsx
// Плохо
<img src={url} className="w-full" />

// Хорошо: фиксируем aspect-ratio
<img src={url} className="aspect-[4/3] w-full object-cover" />

// Ещё лучше: next/image со skeleton-фоном
<Image
  src={url}
  alt=""
  width={800}
  height={600}
  className="aspect-[4/3] w-full bg-neutral-200 object-cover"
/>
```

### 7.4. Закрепление высоты заголовков

```tsx
// Плохо
<h1 className="text-3xl">{title}</h1>

// Хорошо
<h1 className="min-h-[2.25rem] text-3xl">{title}</h1>
```

---

## Шаг 8. Профилирование и отладка

### 8.1. Замедление анимаций
DevTools → **Rendering** (вкладка скрыта в `⋮ → More tools → Rendering`) → **Emulate CSS animation speed: 0.25×**

### 8.2. Поиск jank
1. **Performance** → Record → выполнить анимацию → Stop
2. Смотреть строку **Frames**: красные блоки = пропущенные кадры (< 60 FPS)
3. В **Main** искать длинные «жёлтые» задачи > 16 мс — это main thread blocking

### 8.3. Поиск перерисовок
DevTools → **Rendering** → включить **Paint flashing**. Зелёные мигающие зоны — те, которые перерисовываются.

### 8.4. Layers panel
DevTools → ⋮ → More tools → **Layers**. Здесь видно, какие элементы получили GPU-слой. Если ваш `<div>`, который вы анимируете, **не на отдельном слое** — браузер каждый кадр пересоздаёт слой. Решение:

```css
.animated {
  will-change: transform, opacity;
  /* удалить will-change после окончания анимации */
}
```

> `will-change` — это указание браузеру. Никогда не оставляйте его постоянно: жрёт память.

---

## Шаг 9. Реальный кейс — Restaurant Grid → Restaurant Detail

Адаптируем кейс из статьи (Product Grid → Product Detail) под `lunchHunter`.

### Требования
- Никакого мигания при переходе
- Картинка ресторана плавно увеличивается
- Заголовок переезжает на новое место
- Текст описания появляется с задержкой 200 мс
- Стабильные 60 FPS на mid-range Android

### Решение

**1. Включить View Transitions API глобально** (см. Шаг 3.1).

**2. Назначить `view-transition-name` уникальным элементам:**

```tsx
// src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx
<Link
  href={`/restaurant/${r.id}`}
  className="group block"
>
  <Image
    src={r.image}
    alt={r.name}
    width={400}
    height={300}
    style={{ viewTransitionName: `r-image-${r.id}` }}
    className="aspect-[4/3] w-full rounded-2xl object-cover transition-transform group-hover:scale-[1.02]"
  />
  <h3
    style={{ viewTransitionName: `r-title-${r.id}` }}
    className="mt-3 text-base font-semibold"
  >
    {r.name}
  </h3>
</Link>
```

**3. На странице детали — те же имена:**

```tsx
// src/app/(site)/restaurant/[id]/page.tsx
<Image
  src={r.image}
  alt={r.name}
  width={1200}
  height={700}
  priority
  style={{ viewTransitionName: `r-image-${r.id}` }}
  className="h-[60vh] w-full object-cover"
/>
<h1
  style={{ viewTransitionName: `r-title-${r.id}` }}
  className="mt-6 px-4 text-4xl font-bold"
>
  {r.name}
</h1>
<p className="animate-fade-in px-4" style={{ animationDelay: '200ms' }}>
  {r.description}
</p>
```

**4. Кастомизация анимации morph:**

```css
::view-transition-group(r-image-*),
::view-transition-group(r-title-*) {
  animation-duration: 400ms;
  animation-timing-function: var(--ease-spring);
}
```

**5. Префетч изображения при `hover`/`touchstart`:**

```tsx
<Link
  href={`/restaurant/${r.id}`}
  prefetch
  onMouseEnter={() => {
    const img = new window.Image();
    img.src = r.imageHighRes;
  }}
>
```

> Это и есть iOS-приём с **long press prefetch** — мы догружаем тяжёлую версию изображения **до** того, как пользователь нажал.

### Что будет, если пропустить какой-то шаг

| Пропустили | Что увидит пользователь |
|---|---|
| `view-transition-name` на картинке | Кросс-фейд всей страницы, картинка не «летит» |
| Префетч высокого качества | Видно, как картинка «подгружается» внутри анимации |
| `aspect-ratio` на `<Image>` | Layout shift, заголовок прыгает вниз |
| `min-h` на `<h1>` | Текст разной высоты → дёрганая анимация группы |
| `priority` на следующей странице | Картинка моргнёт белым пятном при загрузке |

---

## Анти-паттерны

### ❌ `transition: all`
```css
/* Плохо */
.card { transition: all 200ms; }

/* Хорошо */
.card { transition: transform 200ms var(--ease-out-quart),
                    opacity   200ms var(--ease-out-quart); }
```

### ❌ Анимация `width`/`height`
```css
/* Плохо: триггерит layout */
.box { transition: width 300ms; }

/* Хорошо: используем transform: scale */
.box { transition: transform 300ms; }
.box.expanded { transform: scaleX(1.5); }
```

### ❌ Анимация `top`/`left`
Используйте `transform: translate()` — это GPU-friendly.

### ❌ Цепочка `setTimeout` для координации
```ts
// Плохо
setTimeout(() => setStep(1), 100);
setTimeout(() => setStep(2), 200);

// Хорошо: Web Animations API
el.animate([...], { duration: 300 }).onfinish = () => setNext();
```

### ❌ Анимация `box-shadow` напрямую
Анимируйте `opacity` псевдоэлемента с тенью:

```css
.card { position: relative; }
.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0 20px 40px -10px rgb(0 0 0 / 0.4);
  opacity: 0;
  transition: opacity 200ms var(--ease-out-quart);
}
.card:hover::after { opacity: 1; }
```

### ❌ Спрятанные элементы через `display: none → block`
View Transitions API и FLIP не умеют анимировать `display`. Используйте `opacity` + `pointer-events: none`, или `hidden="until-found"` для нативного поведения.

### ❌ `animation-delay` > 300 ms
Пользователь воспринимает это как «зависший» интерфейс.

---

## Чек-лист готовности

Перед мерджем фичи с анимациями пройдитесь по списку:

- [ ] Все анимации — только `transform` и `opacity` (или объяснимое исключение)
- [ ] Нет `transition: all` нигде в кодовой базе
- [ ] `prefers-reduced-motion: reduce` отключает анимации
- [ ] У всех `<img>` указаны `width`/`height` или `aspect-ratio`
- [ ] У заголовков с динамическим текстом задан `min-height`
- [ ] Замедление 0.25× в DevTools не выявило мигания
- [ ] Performance-запись держит 60 FPS на throttled CPU 4×
- [ ] Paint flashing не подсвечивает фон страницы во время анимации
- [ ] `will-change` снимается после окончания анимации
- [ ] Все `view-transition-name` уникальны в момент снапшота
- [ ] Картинки на странице-приёмнике имеют `priority` и одинаковый `src`
- [ ] Превью контента (skeleton) не «прыгает» в реальный контент

---

## Резюме одной строкой

> Цель плавных переходов — не «впихнуть анимацию», а **сделать её незаметной**. Хорошая анимация — та, после которой пользователь даже не помнит, что она была. Интерфейс должен **течь, а не прыгать**.

---

### Источники
- Konstantin Shkurko, *«Искусство бесшовных переходов в iOS»* — habr.com/ru/articles/1000184/
- MDN: [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
- MDN: [`@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
- web.dev: [FLIP technique](https://web.dev/articles/animations-guide)
- Chrome for Developers: [Smooth and simple transitions with the View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions)
