# Калькулятор дома ABG

Страница `calculator.html` (исходники — `src/calculator/`): посетитель выбирает регион и проект,
видит цену базовой комплектации, что в неё входит и не входит, платёж по семейной ипотеке и схему
оплаты через эскроу, оставляет заявку или пишет в WhatsApp/Telegram ABG.

Зачем: на abgtz.com (проверено 23.09.2026) нет ни одной формы заявки — только телефон и мессенджеры,
хотя прайс опубликован. Калькулятор превращает интерес к цене в заявку с уже посчитанными вводными.

## Данные

- Цены — `src/calculator/houses.ts`, переписаны из прайса ABG
  (https://abgtz.com/stoimost-vozvedeniya-doma-iz-trehsloynyh-betonnyh-paneley.html, «Цены на 01.01.2026»).
  Тест `tests/calculator.test.ts` сверяет каждую строку: площадь × цена за м² = итог (±0,1 %).
- Когда ABG обновит прайс: поправить строки и `PRICES_DATE`, прогнать `bun test`.
- Ипотека — `src/calculator/mortgage.ts`: семейная 6 %, взнос от 20 %, лимит 12 млн ₽ (Москва/МО,
  СПб/ЛО), сверх лимита — рыночная ставка (по умолчанию 20,8 % — ориентир ДОМ.РФ на 12.2025, поле
  редактируется). Правительство обсуждает изменения программы с октября 2026 — проверять перед показом.

## Заявки

Та же отправка, что у 3D-виджета (`useLeadSubmit`, `VITE_LEADS_ENDPOINT` / `window.ABG3D_LEADS_ENDPOINT`),
`kind: 'calculator'`, `topic: 'house-calculator'`, весь расчёт — в `message`. Без настроенного адреса
форма честно пишет, что отправка недоступна, и остаются кнопки WhatsApp/Telegram.

## Встраивание

```html
<iframe src="https://<домен>/calculator.html?embed=1&region=spb" style="width:100%;border:0" title="Калькулятор дома ABG"></iframe>
<script>
  // Калькулятор сообщает свою высоту: {source: 'abg-calculator', type: 'height', height}
  addEventListener('message', (e) => {
    if (e.data?.source === 'abg-calculator' && e.data.type === 'height') {
      document.querySelector('iframe[title="Калькулятор дома ABG"]').style.height = e.data.height + 'px';
    }
  });
</script>
```

`embed=1` скрывает шапку, `region=spb` открывает калькулятор на ценах Петербурга.
