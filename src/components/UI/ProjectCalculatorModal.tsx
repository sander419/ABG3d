import React, { useEffect, useState } from 'react';
import { X, Check, ArrowRight, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useLeadSubmit } from '../../hooks/useLeadSubmit';
import { handleRadioKeyDown } from '../../lib/radioKeyboard';

interface ProjectCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Калькулятор домокомплекта.
 *
 * Рефакторинг логики:
 *  - заявка реально уходит POST'ом (см. src/lib/leads.ts), успех — только по 2xx;
 *  - состояния idle → sending → success | error, при ошибке данные не теряются,
 *    есть кнопка повтора;
 *  - закрытие: крестик, Escape, клик по затемнению; при повторном открытии форма
 *    стартует заново (раньше оставался экран «Запрос принят» от прошлой отправки);
 *  - honeypot-поле для отсечения спам-ботов.
 */
export const ProjectCalculatorModal: React.FC<ProjectCalculatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [area, setArea] = useState<number>(180);
  const [floors, setFloors] = useState<number>(2);
  const [phone, setPhone] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');

  const { status, isSubmitting, fieldError, failureMessage, submit } = useLeadSubmit('calculator', isOpen);

  // Honeypot обнуляется при каждом открытии: иначе браузерный автозаполнитель
  // однажды заполнит скрытое поле и все последующие отправки молча уйдут «в бота».
  useEffect(() => {
    if (isOpen) setHoneypot('');
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit({
      contact: phone,
      honeypot,
      areaM2: area,
      floors,
    });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="max-w-xl p-5 sm:p-8"
      labelledBy="calculator-modal-title"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Закрыть калькулятор"
        className="absolute top-4 right-4 sm:top-5 sm:right-5 min-h-10 min-w-10 rounded-sm text-[#77746C] hover:bg-[#F4DD45]/15 hover:text-[#181814] active:scale-[0.96] transition-[transform,background-color,color] cursor-pointer inline-flex items-center justify-center"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Modal Header */}
      <div className="space-y-1 border-b border-black/10 pb-5 pr-8">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#71717A]">
            ABG / ПРЕДВАРИТЕЛЬНЫЙ ЗАПРОС
          </span>
          <span className="w-1 h-1 rounded-full bg-[#18181B]" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#9A7A22]">
            ДЛЯ ИНЖЕНЕРА
          </span>
        </div>
        <h2
          id="calculator-modal-title"
          className="text-lg sm:text-xl font-mono font-semibold tracking-[-0.03em] uppercase text-[#18181B] text-balance"
        >
          Запросить предварительный расчёт
        </h2>
        <p className="max-w-[58ch] text-[13px] sm:text-sm leading-relaxed text-[#625F58] text-pretty">
          Оставьте исходные параметры — инженер уточнит состав домокомплекта, решения и сроки для вашего проекта.
        </p>
      </div>

      {status === 'success' ? (
        <div className="py-12 flex flex-col items-center text-center space-y-3" data-testid="calculator-success" role="status">
          <div className="w-12 h-12 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-[#18181B]">
            Запрос отправлен инженеру
          </h3>
          <p className="text-xs text-[#52525B] max-w-xs">
            Мы сформируем предварительную раскладку панелей под ваши параметры ({area} м², {floors} эт.) и свяжемся по указанному контакту.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 rounded-sm bg-[#181814] text-white font-mono text-xs uppercase tracking-wider active:scale-[0.96] transition-transform cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6" noValidate>
          {/* Honeypot: скрытое поле, живые пользователи его не видят и не заполняют */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="calculator-honeypot">Не заполняйте это поле</label>
            <input
              id="calculator-honeypot"
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Param 1: Area Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#52525B] uppercase tracking-wider">
                ПЛОЩАДЬ ДОМА:
              </span>
              <span className="text-[#18181B] font-semibold text-sm">
                {area} м²
              </span>
            </div>
            <input
              type="range"
              min="80"
              max="400"
              step="10"
              value={area}
              aria-label="Площадь дома, м²"
              onChange={(e) => setArea(parseInt(e.target.value, 10))}
              className="w-full accent-[#18181B] cursor-pointer h-1.5 bg-[#E4E4E7] rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] font-mono text-[#A1A1AA]">
              <span>80 м²</span>
              <span>240 м²</span>
              <span>400 м²</span>
            </div>
          </div>

          {/* Param 2: Floors Selector */}
          <div className="space-y-2">
            <span className="font-mono text-xs text-[#52525B] uppercase tracking-wider block">
              ЭТАЖНОСТЬ:
            </span>
            <div role="radiogroup" aria-label="Этажность дома" className="grid grid-cols-2 gap-1 rounded-sm bg-[#ECE9DF] p-1 border border-black/10">
              {[1, 2].map((num) => (
                <button
                  key={num}
                  type="button"
                  role="radio"
                  aria-checked={floors === num}
                  tabIndex={floors === num ? 0 : -1}
                  onKeyDown={handleRadioKeyDown}
                  onClick={() => setFloors(num)}
                  className={`py-2 px-3 rounded-[2px] font-mono text-xs uppercase tracking-wider border border-transparent active:scale-[0.99] transition-[transform,background-color,color,box-shadow] cursor-pointer ${
                    floors === num
                      ? 'bg-[#181814] text-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.2)]'
                      : 'text-[#52525B] hover:bg-white/55'
                  }`}
                >
                  {num} {num === 1 ? 'этаж' : 'этажа'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-sm bg-[#FAF9F5] border border-black/10">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#71717A]">В ответ на запрос</p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#52525B]">Предварительный состав, вопросы к архитектуре, ориентир по этапам и список данных для точного расчёта.</p>
          </div>

          {/* Input Phone */}
          <div className="space-y-1.5">
            <label
              htmlFor="calculator-phone"
              className="font-mono text-[10px] text-[#52525B] uppercase tracking-wider block"
            >
              ТЕЛЕФОН ДЛЯ СВЯЗИ:
            </label>
            <input
              id="calculator-phone"
              type="tel"
              required
              placeholder="+7 (___) ___-__-__"
              autoComplete="tel"
              aria-invalid={fieldError ? true : undefined}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-describedby={fieldError ? 'calculator-phone-error' : undefined}
              className={`w-full min-h-12 px-4 py-2.5 rounded-sm border bg-[#FFFEFA] font-mono text-base sm:text-sm transition-[border-color,box-shadow] ${
                fieldError ? 'border-red-400 focus:border-red-500' : 'border-[#E4E4E7] focus:border-[#18181B]'
              }`}
            />
            {fieldError && (
              <p id="calculator-phone-error" className="text-xs font-mono text-red-700" data-testid="calculator-field-error">
                {fieldError}
              </p>
            )}
          </div>

          {status === 'error' && failureMessage && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-800"
              role="alert"
              data-testid="calculator-error"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{failureMessage}</p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="font-mono text-[10px] uppercase tracking-wider underline cursor-pointer"
                >
                  Повторить отправку
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="calculator-submit"
            className="w-full min-h-12 py-3 rounded-sm bg-[#F4DD45] hover:bg-[#F8E66A] disabled:bg-[#A9A59B] disabled:cursor-wait text-[#181814] font-mono text-xs uppercase tracking-[0.16em] font-semibold active:scale-[0.96] transition-[transform,background-color] cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>ОТПРАВЛЯЕМ…</span>
              </>
            ) : status === 'error' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ПОВТОРИТЬ ОТПРАВКУ</span>
              </>
            ) : (
              <>
                <span>ОТПРАВИТЬ ПАРАМЕТРЫ ИНЖЕНЕРУ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="text-[11px] leading-relaxed font-mono text-[#7A7770] text-center text-pretty">
            * Виджет показывает принцип конструкции. Рабочие решения, спецификация и теплотехника выпускаются по проекту.
          </div>
        </form>
      )}
    </ModalShell>
  );
};
