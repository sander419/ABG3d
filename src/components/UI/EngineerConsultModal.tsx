import React, { useEffect, useState } from 'react';
import { X, Check, Send, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useLeadSubmit } from '../../hooks/useLeadSubmit';
import { handleRadioKeyDown } from '../../lib/radioKeyboard';

interface EngineerConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOPICS = [
  { id: 'peikko', label: 'Узлы Peikko (PDM / PVL)' },
  { id: 'project', label: 'Проектная адаптация под ЖБИ' },
  { id: 'delivery', label: 'Доставка и кран-монтаж' },
];

/**
 * Форма вопроса инженеру.
 *
 * Рефакторинг логики: реальная отправка POST'ом с проверкой 2xx, состояния
 * idle → sending → success | error, honeypot, Escape/клик по затемнению,
 * сброс формы при повторном открытии (раньше «Сообщение отправлено»
 * показывалось навсегда и повторно отправить было нельзя).
 */
export const EngineerConsultModal: React.FC<EngineerConsultModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [topic, setTopic] = useState<string>('peikko');
  const [contact, setContact] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');

  const { status, isSubmitting, fieldError, failureMessage, submit } = useLeadSubmit('consult', isOpen);

  // См. ProjectCalculatorModal: honeypot не должен переживать закрытие формы.
  useEffect(() => {
    if (isOpen) setHoneypot('');
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit({ contact, message, topic, honeypot });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="max-w-lg p-5 sm:p-8"
      labelledBy="consult-modal-title"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Закрыть форму вопроса"
        className="absolute top-4 right-4 sm:top-5 sm:right-5 min-h-10 min-w-10 rounded-sm text-[#77746C] hover:bg-[#F4DD45]/15 hover:text-[#181814] active:scale-[0.96] transition-[transform,background-color,color] cursor-pointer inline-flex items-center justify-center"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      {/* Modal Header */}
      <div className="space-y-1 border-b border-black/10 pb-5 pr-8">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#71717A]">
            КОНСУЛЬТАЦИЯ
          </span>
          <span className="w-1 h-1 rounded-full bg-[#18181B]" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#9A7A22]">
            ИНЖЕНЕРНЫЙ ОТДЕЛ
          </span>
        </div>
        <h2
          id="consult-modal-title"
          className="text-lg sm:text-xl font-mono font-semibold tracking-[-0.03em] uppercase text-[#18181B] text-balance"
        >
          Спросить инженера ABG
        </h2>
        <p className="max-w-[58ch] text-[13px] sm:text-sm leading-relaxed text-[#625F58] text-pretty">
          Обсудим конструкцию панели, соединения Peikko и исходные данные вашего проекта.
        </p>
      </div>

      {status === 'success' ? (
        <div className="py-10 flex flex-col items-center text-center space-y-3" data-testid="consult-success" role="status">
          <div className="w-12 h-12 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-mono font-semibold uppercase tracking-wider text-[#18181B]">
            Сообщение отправлено
          </h3>
          <p className="text-xs text-[#52525B] max-w-xs">
            Ведущий конструктор завода свяжется с вами в течение 15 минут в рабочее время.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 rounded-sm bg-[#181814] text-white font-mono text-xs uppercase tracking-wider active:scale-[0.96] transition-transform cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          {/* Honeypot */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="consult-honeypot">Не заполняйте это поле</label>
            <input
              id="consult-honeypot"
              name="company_website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Topic Choice */}
          <div className="space-y-2">
            <span className="font-mono text-[10px] text-[#52525B] uppercase tracking-wider block">
              ТЕМА ВОПРОСА:
            </span>
            <div role="radiogroup" aria-label="Тема вопроса" className="overflow-hidden rounded-sm border border-black/10 bg-[#FFFEFA] divide-y divide-black/10">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={topic === t.id}
                  tabIndex={topic === t.id ? 0 : -1}
                  onKeyDown={handleRadioKeyDown}
                  onClick={() => setTopic(t.id)}
                  className={`w-full py-2.5 px-3 text-left font-mono text-xs transition-[background-color,color,transform] active:scale-[0.99] cursor-pointer flex items-center justify-between ${
                    topic === t.id
                      ? 'bg-[#181814] text-white font-medium'
                      : 'text-[#52525B] hover:bg-[#F4DD45]/[0.06]'
                  }`}
                >
                  <span>{t.label}</span>
                  {topic === t.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Message input */}
          <div className="space-y-1.5">
            <label
              htmlFor="consult-message"
              className="font-mono text-[10px] text-[#52525B] uppercase tracking-wider block"
            >
              ВОПРОС ИЛИ ПАРАМЕТРЫ ПРОЕКТА:
            </label>
            <textarea
              id="consult-message"
              rows={3}
              maxLength={2000}
              placeholder="Например: интересует возможность установки панорамного остекления в фасадный слой..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-sm border border-black/10 focus:border-[#9A7A22] bg-[#FFFEFA] font-mono text-base sm:text-sm transition-[border-color,box-shadow] resize-none"
            />
          </div>

          {/* Contact Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="consult-contact"
              className="font-mono text-[10px] text-[#52525B] uppercase tracking-wider block"
            >
              ТЕЛЕФОН / TELEGRAM:
            </label>
            <input
              id="consult-contact"
              type="text"
              required
              placeholder="@username или +7 (___) ___-__-__"
              autoComplete="tel"
              aria-invalid={fieldError ? true : undefined}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              aria-describedby={fieldError ? 'consult-contact-error' : undefined}
              className={`w-full min-h-12 px-4 py-2.5 rounded-sm border bg-[#FFFEFA] font-mono text-base sm:text-sm transition-[border-color,box-shadow] ${
                fieldError ? 'border-red-400 focus:border-red-500' : 'border-[#E4E4E7] focus:border-[#18181B]'
              }`}
            />
            {fieldError && (
              <p id="consult-contact-error" className="text-xs font-mono text-red-700" data-testid="consult-field-error">
                {fieldError}
              </p>
            )}
          </div>

          {status === 'error' && failureMessage && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-800"
              role="alert"
              data-testid="consult-error"
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
            data-testid="consult-submit"
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
                <span>ОТПРАВИТЬ ИНЖЕНЕРУ</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      )}
    </ModalShell>
  );
};
