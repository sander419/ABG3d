/**
 * ABG house catalogue with published prices.
 *
 * Source: https://abgtz.com/stoimost-vozvedeniya-doma-iz-trehsloynyh-betonnyh-paneley.html
 * ("Цены на 01.01.2026"), copied as published. Prices are for the base package
 * (foundation slab + house kit + roof + sealed facade joints), without mortgage costs,
 * within ЦКАД/КАД + 20 km. When ABG updates the page, update this file and PRICES_DATE.
 */

export type Region = 'msk' | 'spb';

export const PRICES_DATE = '01.01.2026';
export const PRICES_SOURCE_URL = 'https://abgtz.com/stoimost-vozvedeniya-doma-iz-trehsloynyh-betonnyh-paneley.html';
export const CATALOG_URL = 'https://abgtz.com/houses';

export const REGIONS: Record<Region, { label: string; short: string; area: string }> = {
  msk: { label: 'Москва и область', short: 'Москва', area: 'в пределах ЦКАД + 20 км' },
  spb: { label: 'Петербург и Ленобласть', short: 'Петербург', area: 'в пределах КАД + 20 км' },
};

/** Surcharge for an individual project, per m² (same in both regions). */
export const INDIVIDUAL_SURCHARGE_PER_M2 = 3000;

export interface House {
  id: string;
  areaM2: number;
  floors: string;
  isNew: boolean;
  note?: string;
  prices: Record<Region, { perM2: number; total: number }>;
}

export const HOUSES: readonly House[] = [
  { id: 'abg-108', areaM2: 108, floors: '1 этаж', isNew: true, prices: { msk: { perM2: 95877, total: 10354691 }, spb: { perM2: 88006, total: 9504607 } } },
  { id: 'abg-109', areaM2: 109, floors: '1 этаж', isNew: false, prices: { msk: { perM2: 89019, total: 9703037 }, spb: { perM2: 82134, total: 8952644 } } },
  { id: 'abg-121', areaM2: 121, floors: '1 этаж', isNew: true, prices: { msk: { perM2: 95789, total: 11590430 }, spb: { perM2: 88412, total: 10698814 } } },
  { id: 'abg-123', areaM2: 123, floors: '1 этаж', isNew: false, prices: { msk: { perM2: 89678, total: 11030378 }, spb: { perM2: 82421, total: 10137762 } } },
  { id: 'abg-130', areaM2: 130, floors: '1 этаж', isNew: false, prices: { msk: { perM2: 85462, total: 11110093 }, spb: { perM2: 78596, total: 10217477 } } },
  { id: 'abg-141', areaM2: 141, floors: '1 этаж', isNew: true, prices: { msk: { perM2: 98013, total: 13819770 }, spb: { perM2: 89665, total: 12642710 } } },
  { id: 'abg-147', areaM2: 147, floors: '1 этаж', isNew: false, prices: { msk: { perM2: 85206, total: 12525210 }, spb: { perM2: 77548, total: 11399620 } } },
  { id: 'abg-157-1', areaM2: 157, floors: '1 этаж', isNew: true, prices: { msk: { perM2: 91008, total: 14288256 }, spb: { perM2: 79733, total: 12518081 } } },
  { id: 'abg-163', areaM2: 163, floors: '1 этаж', isNew: true, prices: { msk: { perM2: 89059, total: 14516466 }, spb: { perM2: 82153, total: 13390877 } } },
  { id: 'abg-200', areaM2: 200, floors: '1 этаж', isNew: false, prices: { msk: { perM2: 90920, total: 18184052 }, spb: { perM2: 83416, total: 16683266 } } },
  { id: 'abg-156', areaM2: 156, floors: '2 этажа', isNew: false, prices: { msk: { perM2: 78442, total: 12236910 }, spb: { perM2: 69918, total: 10907208 } } },
  { id: 'abg-157-2', areaM2: 157, floors: '2 этажа', isNew: true, prices: { msk: { perM2: 77916, total: 12232823 }, spb: { perM2: 69918, total: 10977126 } } },
  { id: 'abg-166', areaM2: 166, floors: '1–2 этажа', isNew: true, prices: { msk: { perM2: 81835, total: 13584565 }, spb: { perM2: 75054, total: 12458976 } } },
  { id: 'abg-217', areaM2: 217, floors: '2 этажа + гараж', isNew: true, note: 'дом 157 м² + гараж 60 м²', prices: { msk: { perM2: 80077, total: 17376739 }, spb: { perM2: 72268, total: 15682259 } } },
  { id: 'abg-238', areaM2: 238, floors: '1–2 этажа', isNew: true, prices: { msk: { perM2: 91477, total: 21771588 }, spb: { perM2: 82781, total: 19701912 } } },
];

export function houseName(house: House): string {
  return `ABG ${house.areaM2} м²`;
}

/** Price of the base package for a house, optionally as an individual project. */
export function housePrice(house: House, region: Region, individual: boolean): number {
  const base = house.prices[region].total;
  return individual ? base + house.areaM2 * INDIVIDUAL_SURCHARGE_PER_M2 : base;
}

/** What the published price covers, in ABG's own words (base package). */
export const INCLUDED = [
  'Фундамент: монолитная плита 300 мм с утеплением, гидроизоляцией и вводами сетей',
  'Домокомплект: трёхслойные стены 390 мм с утеплителем 200 мм, внутренние стены, плиты перекрытия',
  'Доставка панелевозами и монтаж',
  'Плоская кровля ТехноНИКОЛЬ с утеплителем и водостоками',
  'Герметизация межпанельных швов на фасаде',
];

/** Not listed in ABG's base package — priced separately in the estimate. */
export const NOT_INCLUDED = [
  'окна и входные двери',
  'отопление, водоснабжение, канализация, электрика внутри дома',
  'внутренняя отделка',
  'окраска фасада',
  'участок и подключение к внешним сетям',
];

export const BUILD_TIME = 'от 1,5 до 3 месяцев';
