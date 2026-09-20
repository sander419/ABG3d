import React, { useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { ModalShell } from './ModalShell';
import './comparison.css';

interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalculator: () => void;
}

const perspectives = [
  {
    id: 'assembly', label: 'Монтаж', number: '01',
    headline: 'Больше готовности. Меньше операций на участке.',
    benefit: 'Стена приезжает крупным элементом: несущий слой, утеплитель и наружный бетон уже объединены на заводе.',
    abgTitle: 'Собрать готовое', blockTitle: 'Создать на месте',
    abg: 'Панель устанавливают краном, соединяют по проекту и герметизируют стыки. Основная работа над слоями стены выполнена до доставки.',
    block: 'Стену выкладывают из отдельных блоков. Перемычки, армирование, армопояса и отделку выполняют по принятой конструктивной схеме.',
    abgSteps: ['Изготовление на заводе', 'Монтаж панели', 'Узлы и стыки'],
    blockSteps: ['Кладка блоков', 'Проектные усиления', 'Фасадные работы'],
    caveat: 'Панелям нужны подъезд для доставки, место для крана и подготовленное основание. Общий срок сравнивают вместе с проектированием и производством.',
  },
  {
    id: 'facade', label: 'Архитектура', number: '02',
    headline: 'Характер фасада закладывается в конструкцию.',
    benefit: 'Наружный бетонный слой позволяет связать архитектурную поверхность и конструкцию в одном заводском решении.',
    abgTitle: 'Фасад как часть панели', blockTitle: 'Фасад как отдельный этап',
    abg: 'Фактуру, геометрию поверхности и расположение стыков согласуют при проектировании. Возможность заводской отделки зависит от выбранной комплектации.',
    block: 'Газобетон служит основанием для выбранной фасадной системы. Штукатурку, облицовку или навесной фасад подбирают и выполняют отдельно.',
    abgSteps: ['Архитектурное решение', 'Формование поверхности', 'Сборка фасада'],
    blockSteps: ['Возведение стены', 'Подготовка основания', 'Устройство фасада'],
    caveat: 'Газобетон даёт широкий выбор фасадных систем. Для честного сравнения в обе сметы включают одинаковый уровень наружной и внутренней отделки.',
  },
  {
    id: 'thermal', label: 'Тепловой контур', number: '03',
    headline: 'У каждого слоя — своя задача.',
    benefit: 'В панели ABG несущая функция и теплоизоляция разделены: утеплитель расположен между двумя бетонными слоями.',
    abgTitle: 'Выделенный слой утепления', blockTitle: 'Теплоизоляционные свойства блока',
    abg: 'Толщину и материал утеплителя подбирают под проект. Теплопередачу через связи, примыкания и межпанельные стыки учитывают в расчёте.',
    block: 'Результат зависит от плотности, толщины и влажности блоков, а также швов и узлов. Дополнительное утепление требуется не во всех проектах.',
    abgSteps: ['Наружный бетон', 'Теплоизоляция', 'Несущий бетон'],
    blockSteps: ['Блок выбранной марки', 'Кладочные швы', 'Узлы по расчёту'],
    caveat: 'Это сравнение устройства стен. Какая стена теплее и сколько стоит отопление, определяют расчётом для одного климата и одинаковых условий эксплуатации.',
  },
] as const;

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({ isOpen, onClose, onOpenCalculator }) => {
  const [selected, setSelected] = useState(0);
  const perspective = perspectives[selected];

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} labelledBy="comparison-modal-title" panelClassName="comparison-shell max-w-[1080px] p-0">
      <div className="comparison-heading">
        <div><p className="comparison-eyebrow">ABG / две логики строительства</p><h2 id="comparison-modal-title">Разница — <em>в подходе.</em></h2></div>
        <button type="button" onClick={onClose} aria-label="Закрыть сравнение" className="comparison-close"><X size={20} strokeWidth={1.5} /></button>
      </div>
      <div className="comparison-body">
        <div role="group" aria-label="Что сравниваем" className="comparison-switch">
          {perspectives.map((item, index) => <button type="button" key={item.id} aria-pressed={index === selected} onClick={() => setSelected(index)}><span>{item.number}</span>{item.label}</button>)}
        </div>
        <div className="comparison-insight" aria-live="polite" aria-atomic="true">
          <h3>{perspective.headline}</h3><p>{perspective.benefit}</p>
        </div>
        <div className="comparison-pair" data-perspective={perspective.id}>
          <article className="comparison-wall comparison-wall-abg">
            <div className="comparison-wall-label"><span>ABG</span><span>Заводская система</span></div>
            <div className="comparison-art"><img src="/brand/panel-study.svg" alt="Схема панели: два бетонных слоя и утеплитель между ними" width="480" height="270" /><span className="comparison-art-caption">Три слоя. Один элемент.</span></div>
            <div className="comparison-wall-copy"><h4>{perspective.abgTitle}</h4><p>{perspective.abg}</p><ol>{perspective.abgSteps.map((step) => <li key={step}>{step}</li>)}</ol></div>
          </article>
          <article className="comparison-wall comparison-wall-block">
            <div className="comparison-wall-label"><span>Газобетон</span><span>Блочная кладка</span></div>
            <div className="comparison-art"><img src="/brand/block-study.svg" alt="Схема стены из отдельных газобетонных блоков с перевязкой швов" width="480" height="270" /><span className="comparison-art-caption">Стена формируется на площадке.</span></div>
            <div className="comparison-wall-copy"><h4>{perspective.blockTitle}</h4><p>{perspective.block}</p><ol>{perspective.blockSteps.map((step) => <li key={step}>{step}</li>)}</ol></div>
          </article>
        </div>
        <p className="comparison-note"><span>В вашем проекте</span>{perspective.caveat}</p>
        <details className="comparison-sources"><summary>Основа сравнения</summary><p>Принципы устройства стен: <a href="https://abgtz.com/bystrovozvodimye-prefab-doma-iz-betonnyh-trehsloynyh-paneley-po-tehnologii-peikkor.html" target="_blank" rel="noopener noreferrer">технология ABG</a> и <a href="https://istkult.ru/help/faq/" target="_blank" rel="noopener noreferrer">технические разъяснения производителя газобетона ISTKULT</a>. Иллюстрации показывают принцип и не являются рабочими чертежами. Сроки и стоимость здесь не ранжируются.</p></details>
      </div>
      <div className="comparison-footer"><p>Выберите технологию под свой дом.<span>Сравните полный состав работ и комплектацию.</span></p><button type="button" onClick={onOpenCalculator}>Обсудить проект ABG <ArrowUpRight size={16} strokeWidth={1.5} /></button></div>
    </ModalShell>
  );
};
