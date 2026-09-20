import type { KeyboardEvent } from 'react';

/** Keyboard interaction for button-based radio groups, including wrapping. */
export function handleRadioKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
  const group = event.currentTarget.closest('[role="radiogroup"]');
  const options = Array.from(group?.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)') ?? []);
  if (!options.length) return;
  event.preventDefault();
  const index = options.indexOf(event.currentTarget);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
    : (index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length;
  options[next].focus();
  options[next].click();
}
