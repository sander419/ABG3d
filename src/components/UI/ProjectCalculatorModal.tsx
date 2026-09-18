import React, { useEffect, useState } from 'react';
import { X, Check, ArrowRight, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useLeadSubmit } from '../../hooks/useLeadSubmit';

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

  // Illustrative calculations
  const wallPanelsApprox = Math.round((area * 0.45) * (floors === 1 ? 1.0 : 1.15));
  const assemblyDays = floors === 1 ? '2–3 дня' : '3–5 дней';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit({
      contact: phone,
      honeypot,
      areaM2: area,
      floors,
      panelsApprox: wallPanelsApprox,
    });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="max-w-lg p-6 sm:p-8"
      labelledBy="calculator-modal-title"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Закрыть калькулятор"
        className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Modal Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#71717A]">
            КАЛЬКУЛЯТОР PREFABDOM
          </span>
          <span className="w-1 h-1 rounded-full bg-[#18181B]" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#10B981]">
            ПРЕДВАРИТЕЛЬНЫЙ РАСЧЕТ
          </span>
        </div>
        <h2
          id="calculator-modal-title"
          className="text-base sm:text-lg font-mono font-semibold tracking-tight uppercase text-[#18181B]"
        >
          Расчет домокомплекта ЖБИ
        </h2>
        <p className="text-xs text-[#71717A]">
          Иллюстративный пример подбора железобетонных сэндвич-панелей 390 мм
        </p>
      </div>

      {status === 'success' ? (
        <div className="py-12 flex flex-col items-center text-center space-y-3" data-testid="calculator-success">
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
            className="mt-4 px-6 py-2 rounded-xl bg-[#18181B] text-white font-mono text-xs uppercase tracking-wider cursor-pointer"
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
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((num) => (
                <button
                  key={num}
                  type="button"
                  aria-pressed={floors === num}
                  onClick={() => setFloors(num)}
                  className={`py-2 px-3 rounded-xl font-mono text-xs uppercase tracking-wider border transition-all cursor-pointer ${
                    floors === num
                      ? 'border-[#18181B] bg-[#18181B] text-white font-semibold'
                      : 'border-[#E4E4E7] text-[#52525B] hover:border-[#A1A1AA]'
                  }`}
                >
                  {num} {num === 1 ? 'этаж' : 'этажа'}
                </button>
              ))}
            </div>
          </div>

          {/* Live Calculation Output Grid */}
          <div className="p-4 rounded-xl bg-white border border-black/[0.05] grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#A1A1AA] block">
                ПАНЕЛЕЙ
              </span>
              <span className="font-mono text-sm font-semibold text-[#18181B]">
                ~{wallPanelsApprox} шт
              </span>
              <span className="text-[8px] font-mono text-[#A1A1AA] block mt-0.5">
                примерный расчет
              </span>
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#A1A1AA] block">
                МОНТАЖ
              </span>
              <span className="font-mono text-sm font-semibold text-[#18181B]">
                {assemblyDays}
              </span>
              <span className="text-[8px] font-mono text-[#A1A1AA] block mt-0.5">
                на фундамент
              </span>
            </div>
            <div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#A1A1AA] block">
                R₀ ТЕПЛО
              </span>
              <span className="font-mono text-sm font-semibold text-[#10B981]">
                9.2
              </span>
              <span className="text-[8px] font-mono text-[#A1A1AA] block mt-0.5">
                (м²·°C)/Вт
              </span>
            </div>
          </div>

          {/* Input Phone */}
          <div className="space-y-1.5">
            <label
              htmlFor="calculator-phone"
              className="font-mono text-[10px] text-[#52525B] uppercase tracking-wider block"
            >
              ТЕЛЕФОН ДЛЯ ОТПРАВКИ СПЕЦИФИКАЦИИ:
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
              className={`w-full px-4 py-2.5 rounded-xl border bg-white font-mono text-xs outline-none transition-colors ${
                fieldError ? 'border-red-400 focus:border-red-500' : 'border-[#E4E4E7] focus:border-[#18181B]'
              }`}
            />
            {fieldError && (
              <p className="text-[10px] font-mono text-red-600" data-testid="calculator-field-error">
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
            className="w-full py-3 rounded-xl bg-[#18181B] hover:bg-black disabled:bg-[#52525B] disabled:cursor-wait text-white font-mono text-xs uppercase tracking-[0.2em] font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
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
                <span>ПОЛУЧИТЬ РАСЧЕТ И ЧЕРТЕЖИ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <div className="text-[9px] font-mono text-[#A1A1AA] text-center">
            * Все числовые значения толщин, сроков и энергоэффективности являются иллюстративными примерами конструкции/расчета.
          </div>
        </form>
      )}
    </ModalShell>
  );
};
