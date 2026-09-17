import React, { useState } from 'react';
import { X, Check, MessageSquare, Send, PhoneCall } from 'lucide-react';

interface EngineerConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineerConsultModal: React.FC<EngineerConsultModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [topic, setTopic] = useState<string>('peikko');
  const [contact, setContact] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [sent, setSent] = useState<boolean>(false);

  if (!isOpen) return null;

  const topics = [
    { id: 'peikko', label: 'Узлы Peikko (PDM / PVL)' },
    { id: 'project', label: 'Проектная адаптация под ЖБИ' },
    { id: 'delivery', label: 'Доставка и кран-монтаж' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#FBFBFB] rounded-2xl border border-black/10 p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] text-[#18181B] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
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
          <h2 className="text-base sm:text-lg font-mono font-semibold tracking-tight uppercase text-[#18181B]">
            Спросить инженера ABG
          </h2>
          <p className="text-xs text-[#71717A]">
            Ответим на технические вопросы по конструктиву и терморазрывам Peikko
          </p>
        </div>

        {sent ? (
          <div className="py-10 flex flex-col items-center text-center space-y-3">
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
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Topic Choice */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-[#52525B] uppercase tracking-wider block">
                ТЕМА ВОПРОСА:
              </span>
              <div className="space-y-1.5">
                {topics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
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
              <label className="font-mono text-[10px] text-[#52525B] uppercase tracking-wider block">
                ВОПРОС ИЛИ ПАРАМЕТРЫ ПРОЕКТА:
              </label>
              <textarea
                rows={3}
                placeholder="Например: интересует возможность установки панорамного остекления в фасадный слой..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E4E4E7] focus:border-[#18181B] bg-white font-mono text-xs outline-none transition-colors resize-none"
              />
            </div>

            {/* Contact Input */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] text-[#52525B] uppercase tracking-wider block">
                ТЕЛЕФОН / TELEGRAM:
              </label>
              <input
                type="text"
                required
                placeholder="@username или +7 (___) ___-__-__"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E4E4E7] focus:border-[#18181B] bg-white font-mono text-xs outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#18181B] hover:bg-black text-white font-mono text-xs uppercase tracking-[0.2em] font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>ОТПРАВИТЬ ИНЖЕНЕРУ</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
