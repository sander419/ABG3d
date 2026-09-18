import React, { useEffect, useState } from 'react';
import { X, Check, Send, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useLeadSubmit } from '../../hooks/useLeadSubmit';

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
      panelClassName="max-w-md p-6 sm:p-8"
      labelledBy="consult-modal-title"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Закрыть форму вопроса"
        className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Modal Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[#71717A]">
            КОНСУЛЬТАЦИЯ
          </span>
          <span className="w-1 h-1 rounded-full bg-[#18181B]" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#3B82F6]">
            ИНЖЕНЕРНЫЙ ОТДЕЛ
          </span>
        </div>
        <h2
          id="consult-modal-title"
          className="text-base sm:text-lg font-mono font-semibold tracking-tight uppercase text-[#18181B]"
        >
          Спросить инженера ABG
        </h2>
        <p className="text-xs text-[#71717A]">
          Ответим на технические вопросы по конструктиву и терморазрывам Peikko
        </p>
      </div>

      {status === 'success' ? (
        <div className="py-10 flex flex-col items-center text-center space-y-3" data-testid="consult-success">
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
            className="mt-4 px-6 py-2 rounded-xl bg-[#18181B] text-white font-mono text-xs uppercase tracking-wider cursor-pointer"
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
            <div className="space-y-1.5">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={topic === t.id}
                  onClick={() => setTopic(t.id)}
                  className={`w-full py-2 px-3 rounded-xl font-mono text-xs text-left transition-all cursor-pointer flex items-center justify-between ${
                    topic === t.id
                      ? 'bg-[#18181B] text-white font-medium'
                      : 'bg-white border border-[#E4E4E7] text-[#52525B] hover:border-[#A1A1AA]'
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
              className="w-full p-3 rounded-xl border border-[#E4E4E7] focus:border-[#18181B] bg-white font-mono text-xs outline-none transition-colors resize-none"
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
              className={`w-full px-4 py-2.5 rounded-xl border bg-white font-mono text-xs outline-none transition-colors ${
                fieldError ? 'border-red-400 focus:border-red-500' : 'border-[#E4E4E7] focus:border-[#18181B]'
              }`}
            />
            {fieldError && (
              <p className="text-[10px] font-mono text-red-600" data-testid="consult-field-error">
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
