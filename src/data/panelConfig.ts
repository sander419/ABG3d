export type WidgetViewMode = 'assembled' | 'exploded' | 'structure' | 'thermal';

export interface LayerState {
  id: 'facade' | 'insulation' | 'structural' | 'anchors';
  index: string;
  title: string;
  subtitle: string;
  thickness: string;
  spec: string;
  positionOffset: [number, number, number]; // Смещение в режиме Exploded [X, Y, Z]
  hovered: boolean;
  active: boolean;
}

export interface LuxuryComparisonRow {
  parameter: string;
  metric: string;
  prefab: {
    title: string;
    detail: string;
    highlight: string;
  };
  traditional: {
    title: string;
    detail: string;
    highlight: string;
  };
}

export const PANEL_CONFIG = {
  meta: {
    brand: 'ABG PREFABDOM',
    series: 'ARCHITECTURAL RESIDENCE 390',
    title: 'Трёхслойная ограждающая панель капитального дома',
    totalThicknessMm: 390,
    r0Value: '9.2',
    r0Unit: '(м²·°C)/Вт',
    assemblyTime: '2–5 дней',
    acoustics: '54 дБ',
    warranty: '50 лет гарантии',
  },

  layers: [
    {
      id: 'facade',
      index: '01',
      title: 'Архитектурный железобетон B35',
      subtitle: 'Безупречная геометрия и защита от атмосферных воздействий',
      thickness: '70 мм',
      spec: 'Морозостойкость F300 / Водонепроницаемость W8',
      positionOffset: [0, 0, 0.18], // +180 мм вперед
      hovered: false,
      active: false,
    },
    {
      id: 'insulation',
      index: '02',
      title: 'Плита PIR (полиизоцианурат)',
      subtitle: 'Монолитный бесшовный контур теплоизоляции',
      thickness: '200 мм',
      spec: 'Теплопроводность λ = 0.022 Вт/(м·К) / Без усадки',
      positionOffset: [0, 0, 0.04], // +40 мм наружу
      hovered: false,
      active: false,
    },
    {
      id: 'structural',
      index: '03',
      title: 'Конструкционный монолит B30',
      subtitle: 'Несущий остов и теплоаккумулирующая емкость дома',
      thickness: '120 мм',
      spec: 'Прочность до 350 кгс/см² / Идеальная плоскость',
      positionOffset: [0, 0, -0.12], // -120 мм вглубь
      hovered: false,
      active: false,
    },
    {
      id: 'anchors',
      index: '04',
      title: 'Связи Peikko PDM и петли PVL',
      subtitle: 'Диагональные композитные фермы без мостиков холода',
      thickness: 'Ø 10 мм',
      spec: 'Шлифованная сталь / Сборка дома за 2–5 дней',
      positionOffset: [0, 0, 0], // закреплены в несущем слое
      hovered: false,
      active: false,
    },
  ] as LayerState[],

  comparison: [
    {
      parameter: 'Прочность конструкции',
      metric: 'B30 vs B2.5',
      prefab: {
        title: 'Монолитный железобетон B30',
        detail: 'Выдерживает нагрузку свыше 300 кгс/см². Позволяет возводить панорамные пролеты и тяжелые монолитные перекрытия без риска трещин.',
        highlight: 'В 10 раз прочнее',
      },
      traditional: {
        title: 'Блоки газобетона D400–D500',
        detail: 'Хрупкий пористый материал (25–35 кгс/см²). Требует дополнительных железобетонных армопоясов и чувствителен к нагрузкам.',
        highlight: 'Требует усиления',
      },
    },
    {
      parameter: 'Тепловой комфорт',
      metric: 'R₀ = 9.2 vs 2.8',
      prefab: {
        title: 'Бесшовный контур PIR 200 мм',
        detail: 'Заводское прессование утеплителя и композитные связи без металла исключают продувание. Сопротивление теплопередаче почти втрое выше нормы.',
        highlight: 'Премиальная энергоэффективность',
      },
      traditional: {
        title: 'Кладка со швами + мокрый фасад',
        detail: 'Тысячи метров швов между блоками и неизбежные риски продувания при ручной работе на объекте.',
        highlight: 'Зависит от рабочих',
      },
    },
    {
      parameter: 'Сроки возведения стен',
      metric: '2–5 дней vs 2–3 мес',
      prefab: {
        title: 'Чистый монтаж автокраном',
        detail: 'Дом изготавливается в идеальных заводских условиях. На участке — бесшумная сборка готовых элементов без строительного мусора.',
        highlight: 'Экономия 3+ месяцев жизни',
      },
      traditional: {
        title: 'Ручная поблочная кладка',
        detail: 'Месяцы замеса растворов, штробления и шума на участке, с последующей технологической сушкой перед чистовой отделкой.',
        highlight: 'Длительная стройка',
      },
    },
    {
      parameter: 'Усадка и отделка',
      metric: '0 мм vs до 0.5 мм/м',
      prefab: {
        title: 'Стабильная заводская геометрия',
        detail: 'Бетон пропарен в камере и набрал 100% прочности. Никаких трещин по дизайнерской отделке и дорогой штукатурке.',
        highlight: 'Отделка сразу после сборки',
      },
      traditional: {
        title: 'Влажностная усадка газоблока',
        detail: 'Блоки отдают влагу до полутора лет после монтажа, провоцируя появление паутины трещин по стенам.',
        highlight: 'Риск паутины трещин',
      },
    },
  ] as LuxuryComparisonRow[],
};
