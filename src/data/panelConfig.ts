export type WidgetViewMode = 'assembled' | 'exploded' | 'structure' | 'thermal';
export type PanelDemoVariant = 'standard' | 'corner' | 'windows' | 'services';

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

export const PANEL_CONFIG = {
  meta: {
    brand: 'ABG',
    series: 'PREFAB WALL PANEL',
    title: 'Трёхслойная железобетонная панель',
    totalThicknessMm: 390,
  },

  layers: [
    {
      id: 'facade',
      index: '01',
      title: 'Фасадный железобетон',
      subtitle: 'Безупречная геометрия и защита от атмосферных воздействий',
      thickness: '70 мм',
      spec: 'Марка бетона и защитные характеристики — по проекту',
      positionOffset: [0, 0, 0.18], // +180 мм вперед
      hovered: false,
      active: false,
    },
    {
      id: 'insulation',
      index: '02',
      title: 'Теплоизоляция 2 × 100 мм',
      subtitle: 'Два слоя с перехлёстом и герметизацией швов',
      thickness: '200 мм',
      spec: 'ЭППС / PIR / минеральная вата — по проекту',
      positionOffset: [0, 0, 0.04], // +40 мм наружу
      hovered: false,
      active: false,
    },
    {
      id: 'structural',
      index: '03',
      title: 'Несущий железобетон',
      subtitle: 'Несущий остов и теплоаккумулирующая емкость дома',
      thickness: '120 мм',
      spec: 'Класс бетона и армирование — по расчёту конструктора',
      positionOffset: [0, 0, -0.12], // -120 мм вглубь
      hovered: false,
      active: false,
    },
    {
      id: 'anchors',
      index: '04',
      title: 'Связи Peikko PDM и петли PVL',
      subtitle: 'Соединительные элементы в составе проектного решения',
      thickness: 'по проекту',
      spec: 'Тип, количество и расположение — по рабочей документации',
      positionOffset: [0, 0, 0], // закреплены в несущем слое
      hovered: false,
      active: false,
    },
  ] as LayerState[],
};
