import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Loader2, MessageCircle, Send } from 'lucide-react';
import { useLeadSubmit } from '../hooks/useLeadSubmit';
import { handleRadioKeyDown } from '../lib/radioKeyboard';
import {
  BUILD_TIME, CATALOG_URL, HOUSES, INCLUDED, INDIVIDUAL_SURCHARGE_PER_M2, NOT_INCLUDED,
  PRICES_DATE, PRICES_SOURCE_URL, REGIONS, Region, House, housePrice, houseName,
} from './houses';
import {
  DEFAULT_MARKET_RATE, DEFAULT_TERM_YEARS, FAMILY_LIMIT, FAMILY_RATE, MIN_DOWN_SHARE,
  formatMln, formatRub, planMortgage,
} from './mortgage';

const WHATSAPP_PHONE = '79990311899';
const TELEGRAM_URL = 'https://t.me/ABGtz';
const PRIVACY_URL = 'https://abgtz.com/politica';

const DOWN_SHARES = [0.2, 0.3, 0.4, 0.5];
const TERMS = [15, 20, 25, 30];

function readInitialRegion(): Region {
  const value = new URLSearchParams(window.location.search).get('region');
  return value === 'spb' ? 'spb' : 'msk';
}

const Section: React.FC<{ step: string; title: string; hint?: string; children: React.ReactNode }> = ({ step, title, hint, children }) => (
  <section className="border-t border-black/10 pt-6">
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[11px] text-[#947552]">{step}</span>
      <h2 className="text-[19px] font-normal tracking-[-0.02em]">{title}</h2>
    </div>
    {hint && <p className="mt-1.5 pl-7 text-[13px] leading-relaxed text-[#6F695F]">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const Choice: React.FC<{ active: boolean; onSelect: () => void; children: React.ReactNode; className?: string }> = ({ active, onSelect, children, className = '' }) => (
  <button
    type="button"
    role="radio"
    aria-checked={active}
    tabIndex={active ? 0 : -1}
    onKeyDown={handleRadioKeyDown}
    onClick={onSelect}
    className={`min-h-11 px-3 text-[13px] transition-colors ${active ? 'bg-[#1D1C19] text-[#F3F0E9]' : 'bg-white/60 text-[#3F3B35] hover:bg-white'} ${className}`}
  >{children}</button>
);

export const CalculatorApp: React.FC = () => {
  const [region, setRegion] = useState<Region>(readInitialRegion);
  const [houseId, setHouseId] = useState('abg-130');
  const [individual, setIndividual] = useState(false);
  const [extras, setExtras] = useState(0);
  const [familyEligible, setFamilyEligible] = useState(true);
  const [downShare, setDownShare] = useState(MIN_DOWN_SHARE);
  const [years, setYears] = useState(DEFAULT_TERM_YEARS);
  const [marketRate, setMarketRate] = useState(DEFAULT_MARKET_RATE);
  const [sort, setSort] = useState<'price' | 'area'>('price');

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const { status, isSubmitting, fieldError, failureMessage, submit } = useLeadSubmit('calculator', true);

  const house = HOUSES.find((item) => item.id === houseId) ?? HOUSES[0];
  const price = housePrice(house, region, individual);
  const contractPrice = price + extras;
  const downPayment = Math.round(contractPrice * downShare);
  const plan = useMemo(
    () => planMortgage({ price: contractPrice, downPayment, familyEligible, marketRate, years }),
    [contractPrice, downPayment, familyEligible, marketRate, years],
  );

  const sortedHouses = useMemo(() => [...HOUSES].sort((a, b) => (
    sort === 'price' ? a.prices[region].total - b.prices[region].total : a.areaM2 - b.areaM2
  )), [sort, region]);

  const summary = [
    `Расчёт с калькулятора ABG (цены на ${PRICES_DATE}).`,
    `Проект: ${houseName(house)}, ${house.floors}${individual ? ', индивидуальный проект' : ''}.`,
    `Регион: ${REGIONS[region].label}.`,
    `Цена базовой комплектации: ${formatRub(price)}.`,
    extras > 0 ? `Хочу включить в кредит доп. работы: ${formatRub(extras)}.` : null,
    `Ипотека: ${familyEligible ? 'семейная 6%' : 'без льготы'}, взнос ${Math.round(downShare * 100)}% (${formatRub(downPayment)}), срок ${years} лет, платёж ≈ ${formatRub(plan.monthly)}/мес.`,
    name.trim() ? `Имя: ${name.trim()}.` : null,
  ].filter(Boolean).join('\n');

  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(summary)}`;

  // Tell the host page how tall the calculator is when embedded in an iframe.
  useEffect(() => {
    if (window.parent === window) return;
    const post = () => window.parent.postMessage({ source: 'abg-calculator', type: 'height', height: document.documentElement.scrollHeight }, '*');
    const observer = new ResizeObserver(post);
    observer.observe(document.body);
    post();
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!consent) { setConsentError(true); return; }
    await submit({ contact, honeypot, message: summary, topic: 'house-calculator', areaM2: house.areaM2 });
  };

  const embedded = new URLSearchParams(window.location.search).get('embed') === '1';

  return (
    <div className="min-h-full bg-[#EDE9E1] text-[#1D1C19]">
      {!embedded && (
        <header className="border-b border-black/10 bg-[#F3F0E9]">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <a href="https://abgtz.com" className="inline-flex bg-[#1D1C19] px-3 py-2"><img src="/brand/autobiography-logo.png" alt="Автобиография" className="h-5 w-auto" /></a>
            <a href="tel:+78124099282" className="font-mono text-[12px] text-[#5F5A51] hover:text-[#1D1C19]">+7 812 409-92-82</a>
          </div>
        </header>
      )}

      <main className="mx-auto grid max-w-[1180px] gap-10 px-5 pb-28 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-16">
        <div className="min-w-0 space-y-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#947552]">Калькулятор дома из бетонных панелей</p>
            <h1 className="mt-3 max-w-[18ch] text-[34px] font-normal leading-[1.05] tracking-[-0.04em] sm:text-[44px]">Сколько стоит ваш дом и какой будет платёж</h1>
            <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-[#5F5A51]">Цены — из прайса ABG на {PRICES_DATE}. Строительство {BUILD_TIME}, по семейной ипотеке через эскроу: ABG аккредитован в Сбере и ДОМ.РФ.</p>
          </div>

          <Section step="01" title="Где будет дом">
            <div role="radiogroup" aria-label="Регион строительства" className="grid grid-cols-2 gap-1 sm:max-w-md">
              {(Object.keys(REGIONS) as Region[]).map((id) => (
                <Choice key={id} active={region === id} onSelect={() => setRegion(id)}>
                  <span className="block">{REGIONS[id].label}</span>
                  <span className={`block text-[11px] ${region === id ? 'text-[#C9BFAE]' : 'text-[#8A8378]'}`}>{REGIONS[id].area}</span>
                </Choice>
              ))}
            </div>
          </Section>

          <Section step="02" title="Выберите проект" hint="Цена — за дом в базовой комплектации: фундамент, стены, перекрытия, кровля, монтаж.">
            <div className="mb-3 flex items-center gap-2 text-[12px] text-[#6F695F]">
              <span>Сортировать:</span>
              {(['price', 'area'] as const).map((key) => (
                <button key={key} type="button" aria-pressed={sort === key} onClick={() => setSort(key)} className={`px-2 py-1 ${sort === key ? 'bg-black/10 text-[#1D1C19]' : 'hover:text-[#1D1C19]'}`}>{key === 'price' ? 'по цене' : 'по площади'}</button>
              ))}
            </div>
            <div role="radiogroup" aria-label="Проект дома" className="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
              {sortedHouses.map((item: House) => {
                const active = item.id === house.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    tabIndex={active ? 0 : -1}
                    onKeyDown={handleRadioKeyDown}
                    onClick={() => setHouseId(item.id)}
                    className={`flex flex-col items-start gap-1 border p-3 text-left transition-colors ${active ? 'border-[#1D1C19] bg-[#1D1C19] text-[#F3F0E9]' : 'border-black/10 bg-white/60 hover:bg-white'}`}
                  >
                    <span className="flex w-full items-baseline justify-between gap-2">
                      <span className="text-[16px] tracking-[-0.02em]">{houseName(item)}</span>
                      {item.isNew && <span className={`font-mono text-[9px] uppercase tracking-[0.14em] ${active ? 'text-[#C9A874]' : 'text-[#947552]'}`}>new</span>}
                    </span>
                    <span className={`text-[12px] ${active ? 'text-[#C9BFAE]' : 'text-[#7A746A]'}`}>{item.note ?? item.floors}</span>
                    <span className="mt-1 font-mono text-[14px] tabular-nums">{formatMln(item.prices[region].total)}</span>
                  </button>
                );
              })}
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-[13px] text-[#3F3B35]">
              <input type="checkbox" checked={individual} onChange={(event) => setIndividual(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1D1C19]" />
              <span>Нужен индивидуальный проект <span className="text-[#7A746A]">(+{INDIVIDUAL_SURCHARGE_PER_M2.toLocaleString('ru-RU')} ₽ за м²)</span></span>
            </label>
            <p className="mt-3 text-[12px] text-[#7A746A]">Планировки и фото — в <a href={CATALOG_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#1D1C19]">каталоге ABG</a>.</p>
          </Section>

          <Section step="03" title="Что входит в цену">
            <div className="grid gap-6 sm:grid-cols-2">
              <ul className="space-y-2 text-[13px] leading-relaxed">
                {INCLUDED.map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#947552]" aria-hidden="true" /><span>{item}</span></li>)}
              </ul>
              <div>
                <p className="text-[13px] text-[#3F3B35]">Не входит в базовую комплектацию, считается в смете отдельно:</p>
                <ul className="mt-2 space-y-1 text-[13px] text-[#6F695F]">
                  {NOT_INCLUDED.map((item) => <li key={item}>— {item}</li>)}
                </ul>
                <label className="mt-4 block text-[12px] text-[#3F3B35]" htmlFor="calc-extras">Хотите включить это в кредит? Укажите примерную сумму:</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="calc-extras"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100000}
                    value={extras || ''}
                    placeholder="0"
                    onChange={(event) => setExtras(Math.max(0, Number(event.target.value) || 0))}
                    className="min-h-11 w-40 border border-black/15 bg-white px-3 font-mono text-[14px] tabular-nums"
                  />
                  <span className="text-[13px] text-[#6F695F]">₽</span>
                </div>
              </div>
            </div>
          </Section>

          <Section step="04" title="Ипотека" hint="Семейная ипотека — 6 %, взнос от 20 %, льготная часть до 12 млн ₽ в Москве и Петербурге. Сверх лимита — по рыночной ставке банка.">
            <label className="flex cursor-pointer items-start gap-3 text-[13px]">
              <input type="checkbox" checked={familyEligible} onChange={(event) => setFamilyEligible(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#1D1C19]" />
              <span>У нас есть право на семейную ипотеку <span className="block text-[12px] text-[#7A746A]">Обычно — если в семье есть ребёнок до 6 лет. Точные условия подтверждает банк.</span></span>
            </label>

            <p className="mt-5 text-[12px] text-[#6F695F]">Первоначальный взнос</p>
            <div role="radiogroup" aria-label="Первоначальный взнос" className="mt-1.5 grid grid-cols-4 gap-1 sm:max-w-md">
              {DOWN_SHARES.map((share) => <Choice key={share} active={downShare === share} onSelect={() => setDownShare(share)}>{Math.round(share * 100)} %</Choice>)}
            </div>
            <p className="mt-1.5 font-mono text-[12px] tabular-nums text-[#6F695F]">{formatRub(downPayment)}</p>

            <p className="mt-5 text-[12px] text-[#6F695F]">Срок кредита</p>
            <div role="radiogroup" aria-label="Срок кредита" className="mt-1.5 grid grid-cols-4 gap-1 sm:max-w-md">
              {TERMS.map((term) => <Choice key={term} active={years === term} onSelect={() => setYears(term)}>{term} лет</Choice>)}
            </div>

            {(!familyEligible || plan.marketPart > 0) && (
              <div className="mt-5">
                <label htmlFor="calc-market-rate" className="text-[12px] text-[#6F695F]">Рыночная ставка, % <span className="text-[#8A8378]">(ориентир ДОМ.РФ по кредитам на ИЖС — {DEFAULT_MARKET_RATE.toLocaleString('ru-RU')} %; точную ставку даст банк)</span></label>
                <input
                  id="calc-market-rate"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={40}
                  step={0.1}
                  value={marketRate}
                  onChange={(event) => setMarketRate(Math.min(40, Math.max(0, Number(event.target.value) || 0)))}
                  className="mt-1.5 block min-h-11 w-28 border border-black/15 bg-white px-3 font-mono text-[14px] tabular-nums"
                />
              </div>
            )}
          </Section>

          <Section step="05" title="Как проходит оплата по эскроу">
            <ol className="grid gap-3 text-[13px] leading-relaxed sm:grid-cols-3">
              {[
                ['Договор и кредит', 'Банк одобряет ипотеку, деньги кладут на эскроу-счёт — подрядчик их пока не получает.'],
                ['Стройка', `ABG строит дом ${BUILD_TIME}. Платёж по кредиту идёт с момента выдачи.`],
                ['Дом на учёте', 'Когда дом поставлен на кадастровый учёт, банк перечисляет деньги ABG.'],
              ].map(([title, text], index) => (
                <li key={title} className="border-l border-[#947552]/40 pl-3"><span className="font-mono text-[11px] text-[#947552]">{index + 1}</span><span className="mt-1 block text-[#1D1C19]">{title}</span><span className="mt-1 block text-[#6F695F]">{text}</span></li>
              ))}
            </ol>
          </Section>
        </div>

        {/* Result */}
        <aside id="calc-result" className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-[#1D1C19] p-6 text-[#F3F0E9] shadow-[0_24px_70px_rgba(31,28,23,0.22)]">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#C9A874]">{houseName(house)} · {REGIONS[region].short}</p>
            <p className="mt-4 text-[12px] text-[#B9B4AA]">Дом в базовой комплектации</p>
            <p className="mt-1 font-mono text-[30px] leading-none tabular-nums tracking-[-0.03em]">{formatRub(price)}</p>
            <p className="mt-2 text-[12px] text-[#B9B4AA]">{house.prices[region].perM2.toLocaleString('ru-RU')} ₽ за м²{individual ? ' + индивидуальный проект' : ''} · срок {BUILD_TIME}</p>
            {extras > 0 && <p className="mt-2 text-[12px] text-[#B9B4AA]">+ доп. работы в кредит: {formatRub(extras)}</p>}

            <div className="mt-6 border-t border-white/15 pt-5">
              <p className="text-[12px] text-[#B9B4AA]">Платёж по ипотеке</p>
              <p className="mt-1 font-mono text-[30px] leading-none tabular-nums tracking-[-0.03em]">{plan.loan > 0 ? formatRub(plan.monthly) : '—'}<span className="text-[14px] text-[#B9B4AA]"> / мес</span></p>
              <dl className="mt-4 space-y-2 text-[12px]">
                <div className="flex justify-between gap-4"><dt className="text-[#9B968D]">Кредит</dt><dd className="font-mono tabular-nums">{formatRub(plan.loan)}</dd></div>
                {plan.familyPart > 0 && <div className="flex justify-between gap-4"><dt className="text-[#9B968D]">по семейной, {FAMILY_RATE} %</dt><dd className="font-mono tabular-nums">{formatRub(plan.familyPart)}</dd></div>}
                {plan.marketPart > 0 && <div className="flex justify-between gap-4"><dt className="text-[#9B968D]">по рыночной, {marketRate.toLocaleString('ru-RU')} %</dt><dd className="font-mono tabular-nums">{formatRub(plan.marketPart)}</dd></div>}
                <div className="flex justify-between gap-4"><dt className="text-[#9B968D]">Взнос, {Math.round(downShare * 100)} %</dt><dd className="font-mono tabular-nums">{formatRub(downPayment)}</dd></div>
              </dl>
              {familyEligible && plan.marketPart > 0 && (
                <p className="mt-3 text-[11px] leading-relaxed text-[#C9A874]">Кредит больше льготного лимита {formatMln(FAMILY_LIMIT)} — остаток считается по рыночной ставке.</p>
              )}
            </div>

            <div className="mt-6 border-t border-white/15 pt-5">
              {status === 'success' ? (
                <div role="status" className="text-[13px] leading-relaxed">
                  <p className="flex items-center gap-2 text-[15px]"><Check className="h-4 w-4 text-[#C9A874]" /> Заявка отправлена</p>
                  <p className="mt-2 text-[#B9B4AA]">Инженер ABG пришлёт смету по вашему расчёту и подскажет, как подать заявку на ипотеку.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-3">
                  <p className="text-[15px]">Получить смету и проверить одобрение</p>
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="calc-hp">Не заполняйте</label>
                    <input id="calc-hp" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
                  </div>
                  <input aria-label="Имя" placeholder="Имя" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="min-h-11 w-full border border-white/20 bg-white/5 px-3 text-[14px] placeholder:text-[#8A8378]" />
                  <input
                    aria-label="Телефон или Telegram"
                    placeholder="Телефон или @telegram"
                    type="tel"
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    autoComplete="tel"
                    aria-invalid={fieldError ? true : undefined}
                    aria-describedby={fieldError ? 'calc-contact-error' : undefined}
                    className={`min-h-11 w-full border bg-white/5 px-3 text-[14px] placeholder:text-[#8A8378] ${fieldError ? 'border-red-400' : 'border-white/20'}`}
                  />
                  {fieldError && <p id="calc-contact-error" className="text-[12px] text-red-300">{fieldError}</p>}
                  <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-[#B9B4AA]">
                    <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setConsentError(false); }} className="mt-0.5 h-4 w-4 shrink-0 accent-[#C9A874]" />
                    <span>Согласен на обработку персональных данных по <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">политике ABG</a></span>
                  </label>
                  {consentError && <p className="text-[12px] text-red-300">Нужно согласие, чтобы мы могли связаться с вами.</p>}
                  {status === 'error' && failureMessage && <p role="alert" className="text-[12px] text-red-300">{failureMessage} Можно написать напрямую — кнопки ниже.</p>}
                  <button type="submit" disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#F3F0E9] text-[13px] font-medium text-[#1D1C19] transition-colors hover:bg-white disabled:opacity-60">
                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Отправляем…</> : <>Получить смету <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 border border-white/20 hover:bg-white/10"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 border border-white/20 hover:bg-white/10"><Send className="h-4 w-4" /> Telegram</a>
              </div>
              <p className="mt-2 text-[11px] text-[#8A8378]">В WhatsApp расчёт подставится в сообщение сам.</p>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-[#7A746A]">
            Цены — <a href={PRICES_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">прайс ABG на {PRICES_DATE}</a>, без учёта ипотечных расходов. Условия семейной ипотеки — на сентябрь 2026 года, могут измениться; ставку и одобрение подтверждает банк. Расчёт ориентировочный и не является офертой.
          </p>
        </aside>
      </main>

      {/* Mobile: the result sits below the long form, so keep the key numbers in reach. */}
      <a href="#calc-result" className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-[#1D1C19] px-5 py-3 text-[#F3F0E9] shadow-[0_-12px_40px_rgba(31,28,23,0.25)] lg:hidden">
        <span className="min-w-0">
          <span className="block truncate text-[11px] text-[#B9B4AA]">{houseName(house)} · {formatMln(price)}</span>
          <span className="block font-mono text-[16px] tabular-nums">{plan.loan > 0 ? `${formatRub(plan.monthly)} / мес` : formatRub(price)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[12px]">Смета <ArrowRight className="h-4 w-4" /></span>
      </a>
    </div>
  );
};
