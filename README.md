# ABG PrefabDOM — 3D-виджет ЖБИ-панели

Интерактивный 3D-виджет трёхслойной железобетонной prefab-панели для сайта ABG:
пирог стены (фасадный железобетон → утеплитель по проекту → несущий железобетон), связи Peikko, тепловой профиль,
сравнение с газобетоном, калькулятор проекта и форма «спросить инженера».

|  |  |
|---|---|
| Прод | https://abg.hiborg-space.ru/ |
| Демо встраивания | https://abg.hiborg-space.ru/embed-demo.html |
| Брендовый предпросмотр | `/abg-preview.html` после сборки или на dev-сервере |
| Репозиторий | `sander419/ABG3d`, ветка `main` |
| Хостинг | VPS, отдельный поддомен + отдельный nginx-конфиг + отдельный деплой |
| Язык интерфейса | русский |

## Стек

React 19 · TypeScript · Vite 8 · three.js (`@react-three/fiber`, `@react-three/drei`) ·
Tailwind 4 · recharts (график сравнения) · maath. Сборка и тесты — Bun. Тяжёлые части грузятся
лениво отдельными чанками: 3D-сцена (three.js + drei) и recharts.

## Быстрый старт

```bash
bun install
bun run dev        # http://localhost:3000
bun run build      # прод-сборка → dist/
```

| Команда | Что делает |
|---|---|
| `bun run dev` | dev-сервер Vite, порт 3000, слушает сеть (`--host`) |
| `bun run build` | сборка в `dist/` |
| `bun run preview` | локальный предпросмотр собранного `dist/` |
| `bun run lint` | `tsc --noEmit` |
| `bun test` | тесты (Bun) |

**Собирать только Bun.** `npm ci` / `npm install` падают на peer-конфликте:
`@react-three/fiber` требует `react <19.3`, а в проекте `react ^19.3`. В репозитории лежит
`bun.lock`.

## Что где лежит

```
src/
  App.tsx                     — раскладка: левый рельс анатомии, 3D-сцена, правый рельс CTA
  components/Panel3D/         — 3D-сцена, модель панели, шейдер PIR, колауты, ErrorBoundary
  components/UI/              — модалки (калькулятор, инженер, сравнение), рельсы, HUD
  data/panelConfig.ts         — метрики и тексты (единый источник)
  lib/leads.ts                — валидация контакта, payload заявки, отправка, адрес приёма
  lib/widgetParams.ts         — параметры URL (`?v=`, `?mode=`, `?open=`)
  lib/widgetEvents.ts         — события виджета наружу (postMessage)
  hooks/useLeadSubmit.ts      — состояние формы заявки (idle → sending → success | error)
public/                       — og.png, embed-demo.html, abg-preview.html,
                                brand/ (официальный логотип), fonts/ (self-hosted IBM Plex)
scripts/self-host-fonts.py    — загрузка/пересборка локальных шрифтов
docs/                         — рабочие заметки по правкам виджета + docs/leads-channel.md (канал заявок)
tests/                        — тесты Bun (логика, заявки, события)
```

## Встраивание на сайт заказчика

Рабочий способ на сегодня — `<iframe>`. Виджет на отдельном поддомене, `X-Frame-Options`
не выставляется, встраивание разрешено доменам из `Content-Security-Policy: frame-ancestors`
(см. ниже).

```html
<iframe
  src="https://abg.hiborg-space.ru/?v=thermal2"
  title="ABG — 3D-анатомия ЖБИ-панели"
  width="100%"
  height="640"
  style="border:0;border-radius:12px;overflow:hidden"
  loading="lazy"
  allow="fullscreen"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

Живой пример с переключателями режимов, логом событий и копированием сниппета —
https://abg.hiborg-space.ru/embed-demo.html (исходник: `public/embed-demo.html`).

### Параметры URL

| Параметр | Значения | Смысл |
|---|---|---|
| `?v=` / `?mode=` | `exploded`, `assembled`, `structure`, `thermal` (+ синонимы `thermal2`, `teplo`, `heat`, `rebar`, `layers`, `razobran`, `sborka`, `assembly`) | стартовый режим 3D-сцены |
| `?open=` | `calc`, `consult`, `compare` | сразу открыть модалку (калькулятор / инженер / сравнение) |
| `?leads=` | `https://…` | адрес приёма заявок для этой вставки |

Пример: `?v=thermal2&open=calc` — открыть виджет в режиме «ТЕПЛО» с калькулятором.
`?mode=` имеет приоритет над `?v=`. Неизвестные значения молча игнорируются —
виджет остаётся рабочим при любом мусоре в query-строке.

### Адрес приёма заявок

В production-сборке адрес уже задан: `.env.production` →
`VITE_LEADS_ENDPOINT=https://abg.hiborg-space.ru/api/leads`. Приёмник — сервис `abg-leads`
на VPS (SQLite + CSV + уведомление в Telegram; переключение на CRM/SMTP и формат хранения —
`docs/leads-channel.md`). Если адреса нет вовсе, формы честно показывают «отправка недоступна»
и **ничего не отправляют**. Порядок разрешения адреса (первый найденный выигрывает):

1. `window.ABG3D_LEADS_ENDPOINT` — рантайм-настройка в том же окне, где крутится виджет
   (скриптовое встраивание, тесты);
2. `?leads=https://…` в URL виджета — рабочий вариант для `<iframe>`;
3. `VITE_LEADS_ENDPOINT=https://…` при сборке;
4. ничего → «канал заявок не настроен».

**Важно про iframe:** окно родительской страницы внутри iframe недоступно (same-origin policy),
поэтому `window.ABG3D_LEADS_ENDPOINT`, выставленный на сайте ABG, до виджета **не доедет**.
Для iframe передавайте адрес в `src`:

```html
<iframe src="https://abg.hiborg-space.ru/?leads=https://abgtz.com/api/leads" …></iframe>
```

Принимаются только `https://` (и `http://localhost` для отладки) — остальное отбрасывается.
Сервер приёма должен отдавать CORS-заголовки: запрос идёт как `POST`, `Content-Type:
application/json`, `credentials: omit`, без preflight-проблем (заголовки простые).

Тело заявки (`POST` на адрес приёма):

```json
{
  "kind": "calculator",
  "contact": "+7 999 123-45-67",
  "message": "…",
  "topic": "…",
  "areaM2": 120,
  "floors": 1,
  "panelsApprox": 48,
  "source": "abg3d-widget",
  "page": "https://abgtz.com/",
  "submittedAt": "2026-09-18T18:00:00.000Z",
  "elapsedMs": 4200
}
```

Успех считается только по HTTP 2xx (`{ "id": "…" }` в JSON-ответе — опционально). Анти-спам:
скрытый honeypot + минимальное время заполнения (0.9 с). Спам-бот не доходит до сети вообще.

### События виджета наружу (postMessage)

Страница-хост может слушать, что происходит внутри iframe: виджет шлёт `postMessage`
родительскому окну. Персональные данные в событиях **не передаются** (ни контакта, ни текста
заявки).

```js
window.addEventListener('message', (e) => {
  // Обязательно проверяем источник: слушателей может быть много.
  if (e.data?.source !== 'abg3d-widget') return;

  switch (e.data.type) {
    case 'abg3d:mode':    // { mode: 'exploded' | 'assembled' | 'structure' | 'thermal' }
    case 'abg3d:overlay': // { overlay: 'calc' | 'consult' | 'compare' | null, open: boolean }
    case 'abg3d:lead':    // { kind: 'calculator' | 'consult', status, reason?, httpStatus? }
  }
  // сюда удобно вешать цели аналитики (Метрика/GA)
});
```

- `abg3d:mode` приходит и при загрузке виджета — это признак, что виджет поднялся;
- `abg3d:lead` — итог отправки заявки: `status: 'success'` только после 2xx,
  `unconfigured` — канал не настроен, `error` — сбой (`reason`: `network`/`timeout`/`http`);
- целевой origin — `'*'`, приёмник обязан проверять `event.data.source`;
- контракт и реализация: `src/lib/widgetEvents.ts` (тесты — `tests/widgetEvents.test.ts`).

### script + API вместо iframe

Пока **не реализовано** — это открытое решение заказчика. Если решим уходить от iframe, нужно
добавить: отдельную UMD-сборку, точку входа `window.ABG3d.mount(el, options)`, команды
внутрь виджета (`postMessage` в обратную сторону: переключить режим, открыть модалку) и
изоляцию стилей (Tailwind внутри хост-страницы конфликтует). До этого момента `postMessage`
работает только в одну сторону — из виджета в хост (см. раздел выше).

## Деплой

```
push в main  →  cron на VPS (каждые 5 минут)  →  /root/abg3d/deploy.sh  →  /var/www/abg
```

`/root/abg3d/deploy.sh` (копия в репозитории не лежит — он живёт на VPS):

1. `git fetch origin main`, `git merge --ff-only origin/main`;
2. сверка с маркером `/root/.abg-deployed-commit`: если HEAD уже равен `origin/main`, но
   последний успешный деплой — другой коммит, сборка перезапускается (иначе cron молча
   застревал бы на упавшем билде);
3. `bun install && bun run build` (production-режим подхватывает `.env.production` —
   в частности `VITE_LEADS_ENDPOINT`);
4. `cp -r dist/* /var/www/abg/`, `rsync -a --delete dist/assets/ /var/www/abg/assets/`
   (assets чистятся, чтобы не копились сироты со старыми хешами).

Ручной прогон: `ssh root@<vps> 'sh /root/abg3d/deploy.sh --force'`, лог —
`/var/log/abg-deploy.log`, cron — `*/5 * * * *`.

### nginx (`/etc/nginx/sites-available/abg`)

Копия прод-конфига — `deploy/nginx-abg.conf` в репозитории (источник истины — сервер:
certbot правит файл сам, поэтому правки синхронизируем руками).

| Путь | Заголовки |
|---|---|
| `/index.html` (`=`) | `Cache-Control: no-store, must-revalidate`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: frame-ancestors …` |
| `/` и прочее | `try_files … /index.html`, `X-Content-Type-Options: nosniff` |
| `/assets/` | `expires 1y` + `Cache-Control: public, immutable` (хеш в имени файла — так и надо) |

`add_header` в location **не наследует** заголовки родителя, поэтому в `location = /index.html`
`X-Content-Type-Options` продублирован — не удаляйте его при правках.

`frame-ancestors` — белый список доменов, которым разрешено встраивать виджет:

```
add_header Content-Security-Policy "frame-ancestors 'self' https://abgtz.com https://*.abgtz.com https://hiborg-space.ru https://*.hiborg-space.ru";
```

Домен сайта ABG подтверждён не до конца (`abgtz.com` из контактов, помечен «уточнить»): если
прод-сайт живёт на другом домене — **добавьте его в этот список**, иначе браузер покажет в
iframe пустоту (`Refused to frame … because an ancestor violates frame-ancestors`).
После правки: `nginx -t && systemctl reload nginx`.

### Внешние зависимости

| Что | Куда ходит | Статус |
|---|---|---|
| Страница и активы виджета | только `abg.hiborg-space.ru` | внешних CDN нет: шрифты IBM Plex лежат в `public/fonts` (`scripts/self-host-fonts.py`), HDRI убран, 3D-свет процедурный |
| Приём заявок | `https://abg.hiborg-space.ru/api/leads` по умолчанию | переопределяется `?leads=` (iframe) или `window.ABG3D_LEADS_ENDPOINT` |

## Известные ограничения

- Приём заявок по умолчанию идёт на VPS-сервис `abg-leads` (`/api/leads`: SQLite + CSV +
  уведомление в Telegram). Нужен заказчику другой канал (CRM / SMTP / его вебхук) — меняется
  один адрес, см. `docs/leads-channel.md`.
- Цифры и формулировки в правом рельсе помечены как иллюстративные — нужны утверждённые
  заказчиком значения (R₀, λ, температуры, классы).
- Встраивание протестировано в headless Edge (Chromium); iOS Safari и слабые Android
  не проверялись.
- События виджета работают в одну сторону (виджет → хост); команд внутрь нет.
- Аналитики внутри виджета нет — счётчик вешается на стороне сайта через события.

## Лицензия / авторство

Внутренний проект: 3D-виджет ABG, разработка — Александр Ляпнев (`sander419`).
