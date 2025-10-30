# Сводка дизайна проекта

Этот документ описывает визуальный дизайн, анимации, типографику, иконки, цвета, фоновые паттерны и общие UI‑паттерны проекта. Все примеры и ссылки привязаны к текущему коду.

## Технологии и стек
- **Фреймворк**: React + TypeScript (Vite).
- **Стили**: Tailwind CSS + кастомный CSS в `src/index.css`.
- **Постобработка**: PostCSS (`postcss.config.js`).
- **Иконки**: `lucide-react` (контурные UI‑иконки) и `react-icons` (бренд‑иконки из `react-icons/si`, некоторые `fa`). Пакет `hugeicons-react` установлен, но в коде не используется.
- **i18n и анимация текста**: собственный контекст `src/lib/i18n.tsx` с компонентом `LangSwap` для плавной подсветки при смене языка.

## Глобальные стили и паттерны (`src/index.css`)
- **Tailwind директивы**: `@tailwind base; @tailwind components; @tailwind utilities;`.
- **Кастомные keyframes**:
  - `fade-in` — плавное появление с лёгким смещением по Y.
  - `fade-in-up` — появление + подъём сильнее, чем `fade-in`.
  - `slide-in-left` — появление со сдвигом слева. На момент подготовки документа в компонентах не задействован.
- **Готовые utility‑классы анимации**:
  - `.animate-fade-in` → `animation: fade-in 0.6s ease-out`.
  - `.animate-fade-in-up` → `animation: fade-in-up 0.5s ease-out forwards` (+ начальная `opacity: 0`).
  - `.animate-slide-in-left` → `animation: slide-in-left 0.5s ease-out`.
- **Плавный скролл**: `html { scroll-behavior: smooth; }`.
- **Скроллбар**: тонкий, тёмный трек, светлеющий при hover.
- **Фон всей страницы**:
  - Базовый цвет: `#0a0a0a`.
  - Псевдо‑слой `body::before` с комбинированным паттерном (точки + вертикаль/горизонтальные линии) в тёплом оттенке:
    - `radial-gradient(rgba(255, 214, 120, 0.06) 1px, transparent 1px)` — точки.
    - `linear-gradient(rgba(255, 214, 120, 0.035) 1px, transparent 1px)` — горизонтали.
    - `linear-gradient(90deg, rgba(255, 214, 120, 0.035) 1px, transparent 1px)` — вертикали.
    - Размер ячейки: `22px`.
  - Контент сайта располагается поверх (`.site-content { position: relative; z-index: 1; }`).
- **Фоновые паттерны секций**:
  - `.bg-grid-pattern::before` — только сетка (две линейные сетки, размер 32px).
  - `.bg-dots-pattern::before` — только точки (радиальный градиент, размер 22px).
  - Оба паттерна рисуются через `::before`, не перехватывают события (pointer‑events: none) и занимают весь блок (`inset: 0`).
- **Моноширинный шрифт**: принудительная подмена Tailwind `font-mono` на JetBrains Mono.

## Типографика
- **Шрифты** (загружаются в `index.html`):
  - `Inter` (wght 300, 400, 500, 600) — основной.
  - `JetBrains Mono` (wght 400, 500) — подписи, теги, служебный текст через класс `font-mono`.
- **Размеры**:
  - Крупные заголовки: `text-[88px]` в `Hero`, `text-[48px]` в блоках секций.
  - Основной служебный текст/подписи: `text-[13px]` (часто в `font-mono`).
- **Стиль**:
  - Частая **курсивная** выделенность ключевых слов.
  - `tracking-tight` для плотных заголовков.
  - Подписи и второй тон: `#6b6b6b`/`#4a4a4a`/`#a7a7a7`.

## Цветовая система
- **Базовый фон**: `#0a0a0a`.
- **Поверхности**: `#0b0b0b`, `#0f0f0f`, `#121212`.
- **Текст**: основной — `#ffffff`, вторичный — `#cfcfcf`, третичный — `#a7a7a7`, вспомогательный — `#6b6b6b` и `#4a4a4a`.
- **Границы**: `#1f1f1f` (часто пунктир/dashed), `#1a1a1a`, hover‑состояние — `#2a2a2a`/`#3a3a3a`.
- **Акценты**:
  - Тёплый акцент: `#F3E6A2` (в заголовках и маркерах), также оттенок `#e0a96d` для иконки звезды.
  - Градиентный акцент текста: `from-[#7CF8E5] to-[#C3FBFF]` (в `Hero`).
  - Подсветка на карточках: `radial-gradient(... rgba(255,255,255,0.06) ...)` под курсором.
- **Паттерны фона**: точки/сетка в теплых полупрозрачных цветах (см. выше `body::before`).

## Анимации и взаимодействия
- **Ключевые анимации** (`src/index.css`):
  - `fade-in` и `fade-in-up` применяются через классы `.animate-fade-in`, `.animate-fade-in-up`. Используются в `Hero`, `Projects`, `Skills`, `About` для плавного появления блоков и карточек. В списках применяется ступенчатая задержка через `style={{ animationDelay: ... }}`.
  - `slide-in-left` определён, но не используется.
- **Переходы и наведения**:
  - Везде используются `transition-*` и `group-hover:*` эффекты (масштаб, перемещение иконок, подсветка бордеров/фона кнопок и чипов).
- **Параллакс‑наклон карточек** (`src/components/ProjectCard.tsx`):
  - Реализован через обработчики `onMouseMove`/`onMouseLeave` и трансформации: `perspective(900px) translate3d(...) rotateX(...) rotateY(...)`.
  - Координаты курсора пишутся в CSS‑переменные `--mx`/`--my` и используется радиальный подсвет «ауры» на `:hover`.
  - Учитывается `prefers-reduced-motion`: при активном режиме эффект отключается.
- **Анимация текста при смене языка** (`LangSwap` в `src/lib/i18n.tsx`):
  - При смене `lang` на 260мс добавляется класс с белым цветом (`text-white`) и плавной задержкой (`transitionDelay`) — даёт «мягкую вспышку» для слов.
- **Плавный скролл к секциям**: `scroll-behavior: smooth` + функции `scrollToSection()` в `Header`/`Hero` с учётом отступа под фиксированный header.

## Иконки
- **UI‑иконки (контурные)**: `lucide-react` — заголовки секций, навигация, статусы, управляющие элементы (`Header.tsx`, `Hero.tsx`, `Projects.tsx`, `ProjectCard.tsx`, `Skills.tsx`, `NowPlaying.tsx`, `WeatherCard.tsx`, `WorkNow.tsx`). Размеры чаще `w-[14px] h-[14px]` или `w-4 h-4`.
- **Бренд‑иконки**: `react-icons/si` — стеки технологий и соцсети (`SkillIcons.tsx`, `About.tsx`, `NowPlaying.tsx`). Цвета задаются инлайном под бренд (например, TypeScript `#3178c6`).
- **Неиспользуемый пакет**: `hugeicons-react` — присутствует в зависимостях, но не найден в коде.

## Компоненты и UI‑паттерны
- **Header (`src/components/Header.tsx`)**
  - Фиксирован сверху, прозрачный фон. При скролле часть контента «уезжает» влево (анимация через классы Tailwind).
  - Навигация — компактные «капсулы» с иконкой, пунктирным подчёркиванием и стрелкой `ArrowRight` при наведении.
  - Переключатель языка (RU/EN), текущие дата и время в UTC+5.
  - Мобильная версия — выпадающее меню под панелью, без полноэкранных оверлеев.
- **Hero (`src/components/Hero.tsx`)**
  - Большой заголовок с именем и грядентной вставкой роли, плавное появление блока (`.animate-fade-in`).
  - Кнопки‑капсулы (CTA к проектам, ссылки на GitHub/Telegram) с hover‑масштабом и изменением бордера/фона.
  - Фон секции: `.bg-grid-pattern`.
- **Projects (`src/components/Projects.tsx`)**
  - Переключение категорий (AI/Edu) — кнопки‑капсулы с иконками `lucide-react`.
  - Карточки проектов — собственный параллакс/подсветка, бейджи с моно‑подписями.
  - Фон секции: `.bg-dots-pattern`.
- **ProjectCard (`src/components/ProjectCard.tsx`)**
  - Поверхность с пунктирной границей, подсветка «ауры» под курсором, моно‑бейджи стека с маленькими иконками из `SkillIcons`.
- **Skills (`src/pages/Skills.tsx`)**
  - Две колонки категорий (Frontend/Backend) + нижний блок Environment/CI/CD.
  - «Чипы» навыков с подсветкой цветного блюра на hover, подписи моно‑шрифтом.
  - Фон секции: `.bg-grid-pattern`.
- **About (`src/pages/About.tsx`)**
  - Фото профиля, моно‑параграф, соц‑ссылки (капсулы), сетка из 3 карточек: `NowPlaying`, `WorkNow`, `WeatherCard`.
  - Футер с моно‑подписями.
  - Фон секции: `.bg-dots-pattern`.
- **NowPlaying (`src/components/NowPlaying.tsx`)**
  - Карточка с пунктирной границей, динамическая «аура» из двух радиальных градиентов, вычисляемая по доминирующему цвету обложки.
  - Прогресс‑бар трека в доминирующем цвете. Инфо об устройстве/громкости.
- **WorkNow (`src/components/WorkNow.tsx`)** и **WeatherCard (`src/components/WeatherCard.tsx`)**
  - Карточки с полупрозрачным диагональным градиентом‑оверлеем, моно‑подписи и статусы (активен/не активен, погода/UV/PM10).

## Слои и компоновка
- **Контейнеры секций**: `max-w-[1400px] mx-auto`, отступы `px-8 py-20`, высота секции — `min-h-screen`.
- **Сетки**: `grid grid-cols-1 md:grid-cols-2` (где нужно) и `gap-*` для отступов.
- **Z‑index**: контент секций в `relative z-10`, фоновые паттерны через `::before` с `z-index: 0`.

## Доступность и производительность
- **Уважение к `prefers-reduced-motion`**: параллакс карточек отключается для пользователей, снизивших анимации.
- **Alt‑тексты и aria‑атрибуты**: у интерактивных кнопок/меню есть `aria-label`, у изображений — `alt`.
- **Стабильные размеры и контрасты**: маленькие кегли в моно‑подписях компенсируются контрастом и интерлиньяжем.

## Как расширять дизайн
- **Цвета/темы**:
  - Добавляйте переменные/константы в `tailwind.config.js` через `theme.extend` (сейчас файл пустой), чтобы унифицировать палитру и тени.
- **Анимации**:
  - Новые keyframes и утилиты — в `src/index.css`, придерживайтесь нейминга `animate-*`.
  - Для последовательных появлений используйте инлайн‑`style={{ animationDelay: '100ms' }}`.
- **Фоны**:
  - Создавайте дополнительные классы по образцу `.bg-grid-pattern`/`.bg-dots-pattern` как `::before`‑оверлеи.
- **Иконки**:
  - UI — через `lucide-react` (единый визуальный стиль). Бренды/стек — через `react-icons` с бренд‑цветами.
- **Типографика**:
  - Расширьте веса/гарнитуры в `<link href=...>` в `index.html`, при необходимости добавьте локальные `@font-face`.

## Ключевые файлы
- `tailwind.config.js`
- `postcss.config.js`
- `index.html` (подключение шрифтов)
- `src/index.css` (фоновые паттерны, анимации, скроллбар, типографика mono)
- `src/lib/i18n.tsx` (`LangSwap` для анимации текста)
- Компоненты UI: `src/components/Header.tsx`, `Hero.tsx`, `Projects.tsx`, `ProjectCard.tsx`, `NowPlaying.tsx`, `WorkNow.tsx`, `WeatherCard.tsx`
- Страницы: `src/pages/Skills.tsx`, `src/pages/About.tsx`

## Глобальный гайд для ИИ: как преобразовать любой сайт в этот стиль

- **Цель**: стандартизировать вид любого сайта под визуальный язык этого проекта (тёмные поверхности, моно‑подписи, капсульные элементы, мягкие анимации, фон из точек/сетки и тёплый акцент).
- **Подход**: использовать дизайн‑токены и переносимый CSS‑пакет. Для Tailwind — расширение `tailwind.config.js`, для обычного CSS — «Portable CSS Pack». Ниже — шаги и эвристики.

### 1) Design Tokens (CSS‑переменные)

Используйте единый набор переменных. Это позволит быстро «перекрашивать» и управлять контрастом:

```css
:root {
  /* Палитра */
  --color-bg: #0a0a0a;              /* фон страницы */
  --color-surface-1: #0b0b0b;       /* базовые карточки */
  --color-surface-2: #0f0f0f;       /* элементы/кнопки */
  --color-surface-3: #121212;       /* глубокий фон */
  --color-text-1: #ffffff;          /* основной текст */
  --color-text-2: #cfcfcf;          /* вторичный */
  --color-text-3: #a7a7a7;          /* третичный */
  --color-text-4: #6b6b6b;          /* подписи */
  --color-text-5: #4a4a4a;          /* тонкие подписи */
  --color-border-1: #1f1f1f;        /* контуры, карточки */
  --color-border-2: #1a1a1a;        /* тёмные контуры */
  --color-border-hover-1: #2a2a2a;  /* hover */
  --color-border-hover-2: #3a3a3a;  /* hover усиленный */
  --color-accent-warm: #F3E6A2;     /* тёплый акцент */
  --color-accent-warm-2: #e0a96d;   /* иконки/метки */
  --grad-hero-from: #7CF8E5;        /* hero‑градиент */
  --grad-hero-to:   #C3FBFF;

  /* Радиусы */
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;  /* капсулы/карточки */

  /* Типографика */
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --text-xs: 13px;     /* подписи/значки */
  --text-sm: 15px;     /* мелкий текст */
  --text-base: 18px;   /* базовый крупнее */
  --h2: 48px;          /* заголовки секций */
  --h1: 88px;          /* главный заголовок */

  /* Анимации */
  --easing: cubic-bezier(0.2, 0.8, 0.2, 1);
  --dur-fast: 200ms;
  --dur-mid: 300ms;
}
```

### 2) Portable CSS Pack (для сайтов без Tailwind)

Скопируйте блок ниже в глобальные стили сайта (или подключите отдельным файлом). Это «порт» ключевых визуальных правил:

```css
/* Шрифты подключите через <link> в <head> как в index.html проекта */
html { scroll-behavior: smooth; }
body {
  background: var(--color-bg);
  color: var(--color-text-1);
  font-family: var(--font-sans);
  position: relative;
}
body::before {
  content: "";
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    radial-gradient(rgba(255, 214, 120, 0.06) 1px, transparent 1px),
    linear-gradient(rgba(255, 214, 120, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 214, 120, 0.035) 1px, transparent 1px);
  background-size: 22px 22px, 22px 22px, 22px 22px;
  background-position: center center;
}
.site-content { position: relative; z-index: 1; }

/* Секции: паттерны */
.bg-grid-pattern { position: relative; }
.bg-grid-pattern::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(255, 214, 120, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 214, 120, 0.035) 1px, transparent 1px);
  background-size: 32px 32px; background-position: center center;
}
.bg-dots-pattern { position: relative; }
.bg-dots-pattern::before {
  content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image: radial-gradient(rgba(255, 214, 120, 0.06) 1.5px, transparent 1.5px);
  background-size: 22px 22px; background-position: center center;
}

/* Моно‑подписи */
.font-mono { font-family: var(--font-mono) !important; }

/* Анимации */
@keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fade-in-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slide-in-left { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
.animate-fade-in { animation: fade-in .6s ease-out; }
.animate-fade-in-up { animation: fade-in-up .5s ease-out forwards; opacity: 0; }
.animate-slide-in-left { animation: slide-in-left .5s ease-out; }

/* Капсулы (кнопки/линки) */
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 14px; font-size: var(--text-xs);
  background: color-mix(in srgb, var(--color-surface-2) 100%, transparent);
  border: 1px solid var(--color-border-2); color: var(--color-text-2);
  border-radius: 999px; transition: all var(--dur-fast) ease-out;
}
.btn:hover { background: #141414; border-color: var(--color-border-hover-1); color: #fff; }

/* Карточки */
.card {
  position: relative; background: var(--color-surface-1);
  border: 1px dashed var(--color-border-1); border-radius: var(--radius-lg);
  padding: 24px; overflow: hidden;
}
.card__aura { pointer-events: none; position: absolute; inset: 0; opacity: 0; transition: opacity var(--dur-mid) ease-out; }
.card:hover .card__aura { opacity: 1; }

/* Чипы/бейджи */
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 8px; font-size: 11px; border-radius: 999px;
  background: var(--color-surface-2); border: 1px solid var(--color-border-2);
  color: #dcdcdc; font-family: var(--font-mono);
}

/* Ссылки с пунктирным подчёркиванием */
.link-dotted { position: relative; padding-right: 14px; }
.link-dotted::after { content: ""; position: absolute; left: 0; right: 14px; bottom: -2px; border-bottom: 1px dotted var(--color-border-1); }
.link-dotted:hover::after { border-bottom-color: var(--color-border-hover-1); }

/* Scrollbar (WebKit) */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--color-bg); }
::-webkit-scrollbar-thumb { background: var(--color-border-1); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-border-hover-1); }

/* Предпочтения по анимациям */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in, .animate-fade-in-up, .animate-slide-in-left { animation: none !important; opacity: 1 !important; }
}
```

Рекомендуется: для «ауры» карточек на `:hover` использовать радиальный градиент, центрированный по курсору (как в проекте). Для сайтов без JS‑интеграции можно использовать статичную лёгкую подсветку.

### 3) Tailwind‑интеграция (если сайт на Tailwind)

Добавьте/расширьте `tailwind.config.js`:

```js
// tailwind.config.js (фрагмент)
export default {
  content: ["./**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface1: "#0b0b0b",
        surface2: "#0f0f0f",
        surface3: "#121212",
        text1: "#ffffff",
        text2: "#cfcfcf",
        text3: "#a7a7a7",
        text4: "#6b6b6b",
        text5: "#4a4a4a",
        border1: "#1f1f1f",
        border2: "#1a1a1a",
        borderH1: "#2a2a2a",
        borderH2: "#3a3a3a",
        accentWarm: "#F3E6A2",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New"],
      },
      borderRadius: { lg: "20px", md: "14px", sm: "10px" },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "fade-in-up": { from: { opacity: "0", transform: "translateY(30px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-left": { from: { opacity: "0", transform: "translateX(-30px)" }, to: { opacity: "1", transform: "translateX(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "slide-in-left": "slide-in-left 0.5s ease-out",
      },
    },
  },
  plugins: [],
}
```

Добавьте утилиты паттернов (как в `src/index.css`) — через `@layer utilities` или отдельный CSS.

### 4) Маппинг существующего сайта (эвристики)

- **База**: установите фон `#0a0a0a`, текст `#fff`, вторичный `#cfcfcf`. Подключите `Inter` и `JetBrains Mono`.
- **Фоны**: оберните корневую обёртку в `.site-content`; на `body::before` — глобальные точки+сетка; для секций — `.bg-grid-pattern`/`.bg-dots-pattern`.
- **Заголовки**: крупнейший заголовок сделайте `--h1`/`text-[88px]` (или максимально приближённый), секционные — `--h2` (`48px`). Последнее ключевое слово можно выделять курсивом + тёплым акцентом; для hero — применить градиент `from-[#7CF8E5] to-[#C3FBFF]` с `bg-clip-text text-transparent` (или линейный градиент с обрезкой текста в CSS).
- **Кнопки/ссылки‑капсулы**: все `button`, `[role=button]`, `a.btn`, `input[type=submit]` привести к виду `.btn` (капсула: `background #0f0f0f`, `border #1f1f1f`, hover → `#141414` + `#2a2a2a`).
- **Карточки**: контейнеры наподобие `section, article, .card, .panel, .box` привести к `.card` (фон `#0b0b0b`, пунктирная граница, большой радиус). При желании — подсветка «ауры» на hover.
- **Чипы/бейджи**: элементы метаданных привести к `.chip` (моно‑шрифт, `11px`, капсула, тонкая граница).
- **Ссылки‑текст**: заменить подчёркивание на пунктирный бордер снизу (`.link-dotted`) и лёгкий сдвиг/масштаб иконки на hover.
- **Формы**: поля и селекты стилизовать под `--color-surface-2` с тонкой границей `#1a1a1a`, радиус `--radius-md`, фокус‑кольцо через осветление границы.
- **Иконки**: для UI — контурные (`lucide`/аналог), размер ~14–16px, цвет унаследовать (`currentColor`). Бренд‑иконки можно оставить цветными.
- **Анимации**: назначайте `.animate-fade-in(-up)` на крупные блоки с ступенчатой задержкой (100–200мс между карточками). Уважайте `prefers-reduced-motion`.

### 5) Мини‑чеклист «Готово как в проекте»

- [ ] Шрифты `Inter`/`JetBrains Mono` подключены, `font-mono` реально моноширинный.
- [ ] Фон страницы — точки+сетка через `body::before`, контент в `z-index: 1`.
- [ ] Базовые поверхности и бордеры соответствуют палитре; карточки с пунктирной границей и большим радиусом.
- [ ] CTA/линки — капсулы с плавным hover; текстовые ссылки — пунктир‑подчёркивание.
- [ ] Заголовки крупные, с курсивным акцентом/градиентом в hero.
- [ ] Анимации появления на секции/карточки, с уважением `prefers-reduced-motion`.
- [ ] Иконки контурные, размеры 14–16px, выравниваются по текстовой строке.

### 6) Откат/настройка контраста

- Все цвета вынесены в переменные — для отката/адаптации достаточно подправить `:root`.
- Увеличить контраст: осветлите `--color-text-2/3` и/или границы `--color-border-*`.
- Уменьшить «шум» фона: понизьте альфу градиентов или увеличьте `background-size`.

### 7) Примечание по производительности

- Фоновые паттерны — это градиенты, они быстры на современных браузерах; избегайте больших PNG/SVG паттернов на `body`.
- Ограничивайте количество параллакс‑эффектов; используйте `will-change: transform` и `transform-gpu` только на интерактивных блоках.
