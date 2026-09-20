/**
 * Общий каркас модалки для виджета.
 *
 * Зачем: до рефакторинга обе модалки были «глухими» — клик по затемнению не
 * закрывал (в отличие от ComparisonDrawer), Escape не работал, фокус оставался
 * за модалкой, не было role/aria, а `select-none` на контейнере не давал
 * выделить и скопировать телефон/спецификацию. Всё это — обработчики событий
 * и доступность, а не дизайн: вёрстка внутри не меняется.
 */
import React, { useEffect, useRef } from 'react';

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  /** Классы ширины/размеров контентного блока. */
  panelClassName?: string;
  /** id элемента с заголовком для aria-labelledby. */
  labelledBy?: string;
  /** Закрывать по клику на затемнение (по умолчанию true). */
  closeOnBackdropClick?: boolean;
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  panelClassName = '',
  labelledBy,
  closeOnBackdropClick = true,
  children,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = (typeof document !== 'undefined'
      ? (document.activeElement as HTMLElement | null)
      : null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )).filter((element) => !element.hasAttribute('hidden') && element.offsetParent !== null);

        if (focusable.length === 0) {
          event.preventDefault();
          dialogRef.current.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const focusOutside = !dialogRef.current.contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current || focusOutside)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || focusOutside)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Фокус уходит на диалог (не на первый range-инпут — иначе ползунок
    // перехватывает стрелки сразу при открытии).
    const focusTimer = setTimeout(() => {
      dialogRef.current?.focus({ preventScroll: true });
    }, 30);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#171612]/72 p-3 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain sm:p-6"
      onClick={closeOnBackdropClick ? onClose : undefined}
      data-testid="modal-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain bg-[#F3F0E9] border border-black/10 shadow-[0_32px_100px_rgba(0,0,0,0.42)] text-[#1D1C19] outline-none select-text ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
};
