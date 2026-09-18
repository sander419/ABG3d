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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
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
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
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
        className={`relative w-full bg-[#FBFBFB] rounded-2xl border border-black/10 shadow-[0_20px_60px_rgba(0,0,0,0.12)] text-[#18181B] outline-none select-text ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
};
