import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { parseAmount, toInputString } from '../../lib/money';
import { inputClasses } from './Field';

interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number | null;
  onChange: (value: number | null) => void;
  /** Reports the inline parse error (or null) so the surrounding Field can show it. */
  onErrorChange?: ((message: string | null) => void) | undefined;
  allowNegative?: boolean;
  severity?: 'error' | 'warning' | undefined;
  align?: 'left' | 'right';
}

/**
 * Money input that keeps its own text while the user types, commits parsed
 * values immediately (so the preview updates live) and refuses invalid input
 * with an inline message instead of silently coercing it.
 */
export function AmountInput({
  value,
  onChange,
  onErrorChange,
  allowNegative = false,
  severity,
  align = 'right',
  className = '',
  placeholder = '0.00',
  ...rest
}: AmountInputProps) {
  const [text, setText] = useState(() => toInputString(value));
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the visible text in sync with external changes when the user is not editing
  // and the current text is valid (an invalid entry stays visible so it can be fixed).
  useEffect(() => {
    if (!focused && error === null) setText(toInputString(value));
  }, [value, focused, error]);

  useEffect(() => {
    onErrorChange?.(error);
  }, [error, onErrorChange]);

  const handleChange = (next: string) => {
    setText(next);
    const result = parseAmount(next, { allowNegative });
    if (result.ok) {
      setError(null);
      if (result.value !== value) onChange(result.value);
    } else {
      setError(result.message);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if (error === null) setText(toInputString(value));
      }}
      aria-invalid={error !== null || severity === 'error' ? true : undefined}
      className={`${inputClasses(error ? 'error' : severity)} tabular-nums ${align === 'right' ? 'text-right' : ''} ${className}`}
      {...rest}
    />
  );
}
