"use client";

/**
 * Manual shared-element morph через FLIP-технику и Web Animations API.
 *
 * Зачем: View Transitions API доступен только в Chrome/Edge desktop и
 * Safari TP. На iOS Safari < 18.2, многих Android WebView и в Telegram
 * Mini App его нет — а пользователь всё равно ожидает плавное перетекание
 * карточки в hero страницы ресторана.
 *
 * Решение: классический FLIP (First, Last, Invert, Play):
 *
 * 1. **First**: замеряем getBoundingClientRect стартового элемента
 *    (карточка ресторана в списке). Если внутри карточки есть
 *    `[data-vt-morph-source]` — морфим именно его (обложку), а не всю
 *    карточку с текстом. Это критично: иначе при разных aspect-ratio
 *    карточки и hero изображение деформируется, а текст карточки летит
 *    мусором поверх hero.
 * 2. Создаём клон cover-обёртки (или fall back на саму карточку),
 *    абсолютно позиционируем его в overlay-слое (position: fixed на body),
 *    скрываем оригинал.
 * 3. Запускаем navigation (router.push). React начинает рендерить новую
 *    страницу — loading.tsx → реальный page.tsx.
 * 4. **Last**: ждём через MutationObserver появление DOM-элемента с
 *    атрибутом `data-vt-target="<kind>"` на новой странице. Это hero-блок
 *    в `restaurant/[id]/loading.tsx` или `page.tsx`.
 * 5. **Invert + Play**: анимируем `left`/`top`/`width`/`height` клона
 *    напрямую (НЕ через `transform: scale`). Это критично: клон содержит
 *    `<img object-cover>`, который при изменении контейнера автоматически
 *    пересчитывает свой crop на каждом кадре — без деформации и без
 *    выхода за границы. `transform: scale` дал бы либо растяжение
 *    (sx≠sy), либо клон, торчащий за hero (uniform scale). После того
 *    как клон достигает target размеров (offset 0.6), запускается
 *    cross-fade между клоном (opacity 1→0) и оригинальным target
 *    (opacity 0→1) для бесшовной передачи.
 * 6. После окончания анимации удаляем клон, восстанавливаем target.
 *
 * Web Animations API поддержан везде где есть Chrome/Safari/Firefox
 * последних 5 лет — то есть на ВСЕХ устройствах, на которых может быть
 * запущена эта PWA.
 *
 * Используется как Telegram Mini App / legacy WebView fallback из
 * `navigate()` в `@/lib/transitions` и хука `useFlipMorph`.
 */

interface ManualFlipMorphOptions {
  /** Стартовый DOM-элемент (нажатая карточка). */
  sourceEl: HTMLElement;
  /** CSS-селектор финального элемента. Будет искаться через MutationObserver
   *  после navigation. Например `[data-vt-target="restaurant-hero"]`. */
  targetSelector: string;
  /** Функция, которая запускает navigation (router.push). */
  navigate: () => void;
  /** Длительность анимации в мс. */
  duration?: number;
  /** Easing-кривая. */
  easing?: string;
  /** Максимальное время ожидания target элемента. */
  timeoutMs?: number;
}

const DEFAULT_DURATION_MS = 380;
/**
 * Easing по умолчанию — читаем из CSS custom property `--ease-out-quart`,
 * определённой в `globals.css` (ANIMATIONS_GUIDE §1.1). Если по какой-то
 * причине токен не найден (раннее инициализирование, SSR), падаем на
 * его фактическое значение.
 */
function getDefaultEasing(): string {
  if (typeof window === "undefined") {
    return "cubic-bezier(0.25, 1, 0.5, 1)";
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--ease-out-quart")
    .trim();
  return value || "cubic-bezier(0.25, 1, 0.5, 1)";
}
const DEFAULT_TARGET_TIMEOUT_MS = 1500;
/**
 * Доля длительности (от 0 до 1), на которой клон полностью непрозрачен —
 * после неё начинается cross-fade clone→target. 0.6 значит первые 60%
 * анимации клон 100% видим, последние 40% — fade-out до 0.
 */
const CLONE_FADE_OUT_OFFSET = 0.6;

/**
 * Ищет внутри элемента вложенный `[data-vt-morph-source]`-узел и
 * возвращает его. Если не находит — возвращает сам элемент.
 *
 * Это позволяет морфить только cover-обёртку карточки (без текста и
 * метаданных), что даёт чистый image-to-image переход в hero. Если
 * cover-обёртки нет (карточка только из текста, например в map bottom
 * sheet) — fallback на всю карточку.
 */
function resolveMorphSource(el: HTMLElement): HTMLElement {
  const inner = el.querySelector<HTMLElement>("[data-vt-morph-source]");
  return inner ?? el;
}

/**
 * Ждёт появления элемента в DOM через MutationObserver.
 * Сначала проверяет document.querySelector синхронно — если уже есть, резолвит.
 * Иначе подписывается на мутации body, и резолвит когда селектор найден.
 * По истечении timeoutMs резолвит null.
 */
function waitForElement(
  selector: string,
  timeoutMs: number,
): Promise<HTMLElement | null> {
  return new Promise<HTMLElement | null>((resolve) => {
    // Сначала проверяем синхронно — а вдруг target уже есть.
    const existing = document.querySelector<HTMLElement>(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      const found = document.querySelector<HTMLElement>(selector);
      if (found) {
        observer.disconnect();
        if (timeoutId !== null) clearTimeout(timeoutId);
        resolve(found);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-vt-target"],
    });

    timeoutId = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

/**
 * Создаёт visual клон элемента и абсолютно позиционирует его поверх
 * оригинала. Возвращает клон.
 *
 * Важные стили:
 * - `position: fixed` + `left/top/width/height` — мы будем анимировать
 *   эти four properties напрямую через WAAPI. НЕ используем transform,
 *   потому что transform даёт scale-деформацию или выход img за границы.
 * - `overflow: hidden` — гарантирует что вложенный `<img>` не торчит за
 *   границы клона при ресайзе (img растёт по object-cover, и без overflow
 *   hidden она бы выезжала за пределы кропа).
 * - `box-sizing: border-box` — width/height включают любые border/padding.
 * - `transition: none` на клоне и его потомках — отключает любые
 *   CSS-transitions, которые могли бы конфликтовать с Web Animations API.
 */
function createOverlayClone(
  sourceEl: HTMLElement,
  rect: DOMRect,
): HTMLElement {
  const clone = sourceEl.cloneNode(true) as HTMLElement;

  // Снимаем интерактивность с клона.
  clone.style.position = "fixed";
  clone.style.left = `${rect.left}px`;
  clone.style.top = `${rect.top}px`;
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.margin = "0";
  clone.style.zIndex = "9999";
  clone.style.pointerEvents = "none";
  clone.style.boxSizing = "border-box";
  clone.style.overflow = "hidden";
  clone.style.willChange = "left, top, width, height, border-radius, opacity";
  // Клон должен выглядеть нейтрально во время полёта — только мягкая тень.
  clone.style.outline = "none";
  clone.style.boxShadow = "0 16px 36px rgba(0,0,0,0.18)";
  // Сбрасываем любые transform которые могли быть на исходном элементе.
  clone.style.transform = "none";
  // Отключаем CSS-transitions на клоне и его потомках, чтобы не было
  // конфликтов с Web Animations API. transition:none убирает плавное
  // изменение свойств, оставляя только наши keyframes.
  clone.style.transition = "none";
  clone.querySelectorAll<HTMLElement>("*").forEach((child) => {
    child.style.transition = "none";
  });

  return clone;
}

/**
 * Главная функция: запускает FLIP-морф между sourceEl и target,
 * который появится после navigate().
 *
 * Поведение:
 * 1. resolveMorphSource(sourceEl) — выбираем между cover-обёрткой
 *    (`[data-vt-morph-source]`) и всей карточкой.
 * 2. Snapshot rect выбранного источника.
 * 3. Создаём overlay clone, скрываем оригинал.
 * 4. navigate().
 * 5. waitForElement(targetSelector).
 * 6. Если target найден — анимируем clone к нему через изменение
 *    left/top/width/height, с cross-fade в финале.
 * 7. Если target не найден за timeoutMs — fade-out clone и отказ от анимации.
 * 8. Cleanup: удалить clone, восстановить target.
 */
export async function manualFlipMorph(
  opts: ManualFlipMorphOptions,
): Promise<void> {
  const {
    sourceEl,
    targetSelector,
    navigate,
    duration = DEFAULT_DURATION_MS,
    easing = getDefaultEasing(),
    timeoutMs = DEFAULT_TARGET_TIMEOUT_MS,
  } = opts;

  if (typeof document === "undefined") {
    navigate();
    return;
  }

  // Решаем что именно морфим: вложенный morph-source (обложка) или сама
  // карточка целиком. Cover-обёртка даёт чистый image-to-image переход
  // без визуального мусора от текста карточки.
  const morphSourceEl = resolveMorphSource(sourceEl);
  const sourceRect = morphSourceEl.getBoundingClientRect();
  if (sourceRect.width === 0 || sourceRect.height === 0) {
    // Не визуальный элемент — просто навигируем.
    navigate();
    return;
  }

  // Создаём overlay clone и добавляем в body.
  const clone = createOverlayClone(morphSourceEl, sourceRect);
  document.body.appendChild(clone);

  // Скрываем ОРИГИНАЛЬНУЮ КАРТОЧКУ ЦЕЛИКОМ (а не только cover) — чтобы
  // не было дублирующегося текста под клоном на старой странице во время
  // анимации. Восстанавливать не нужно: React размонтирует sourceEl при
  // router.push.
  const originalSourceVisibility = sourceEl.style.visibility;
  sourceEl.style.visibility = "hidden";

  // Запускаем navigation.
  navigate();

  // Ждём появления target.
  const targetEl = await waitForElement(targetSelector, timeoutMs);

  if (!targetEl) {
    // Цель не появилась — мягко убираем клон.
    try {
      const fadeOut = clone.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 160, easing: "ease-out", fill: "forwards" },
      );
      await fadeOut.finished.catch(() => undefined);
    } catch {
      /* noop */
    }
    clone.remove();
    if (document.body.contains(sourceEl)) {
      sourceEl.style.visibility = originalSourceVisibility;
    }
    return;
  }

  // Скрываем целевой hero на время полёта клона. Используем opacity, а не
  // visibility — это позволяет анимировать его fade-in во время cross-fade
  // в самом конце.
  const originalTargetOpacity = targetEl.style.opacity;
  const originalTargetWillChange = targetEl.style.willChange;
  targetEl.style.opacity = "0";
  targetEl.style.willChange = "opacity";

  // Замеряем target rect (Last).
  const targetRect = targetEl.getBoundingClientRect();

  // Берём border-radius целевого элемента, чтобы клон в финале
  // соответствовал. Это даёт визуальный morph border-radius.
  const targetStyles = window.getComputedStyle(targetEl);
  const targetBorderRadius = targetStyles.borderRadius || "0";
  const sourceBorderRadius =
    window.getComputedStyle(morphSourceEl).borderRadius || "0";

  // Animate clone от source к target напрямую через left/top/width/height
  // (не transform). Это даёт ровно target-размеры в финале — img внутри
  // клона с object-cover автоматически пересчитывает crop, без выхода
  // за границы и без растяжения. Cross-fade происходит в последние
  // (1 - CLONE_FADE_OUT_OFFSET) долей анимации, когда клон уже на месте.
  let cloneAnimation: Animation | null = null;
  let targetAnimation: Animation | null = null;
  try {
    cloneAnimation = clone.animate(
      [
        {
          left: `${sourceRect.left}px`,
          top: `${sourceRect.top}px`,
          width: `${sourceRect.width}px`,
          height: `${sourceRect.height}px`,
          borderRadius: sourceBorderRadius,
          opacity: 1,
          offset: 0,
        },
        {
          left: `${targetRect.left}px`,
          top: `${targetRect.top}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          borderRadius: targetBorderRadius,
          opacity: 1,
          offset: CLONE_FADE_OUT_OFFSET,
        },
        {
          left: `${targetRect.left}px`,
          top: `${targetRect.top}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          borderRadius: targetBorderRadius,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration,
        easing,
        fill: "forwards",
      },
    );

    // Параллельно — fade-in оригинального target в последние 40% анимации,
    // когда клон уже физически совпадает с target по позиции и размеру.
    targetAnimation = targetEl.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: CLONE_FADE_OUT_OFFSET },
        { opacity: 1, offset: 1 },
      ],
      {
        duration,
        easing,
        fill: "forwards",
      },
    );

    await Promise.all([
      cloneAnimation.finished.catch(() => undefined),
      targetAnimation.finished.catch(() => undefined),
    ]);
  } catch {
    // Web Animations API недоступен — мгновенный финал.
  }

  // Cleanup: удаляем клон, восстанавливаем target.
  clone.remove();
  // Снимаем inline-стили, которые мы навесили на target, чтобы не
  // мешать его обычному рендеру.
  targetEl.style.opacity = originalTargetOpacity;
  targetEl.style.willChange = originalTargetWillChange;
  // sourceEl уже не существует (React unmount) — но на всякий случай.
  if (document.body.contains(sourceEl)) {
    sourceEl.style.visibility = originalSourceVisibility;
  }
}
