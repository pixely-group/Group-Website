import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { inputClasses } from './Field';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  severity?: 'error' | 'warning' | undefined;
}

export function TextInput({ value, onChange, severity, className = '', ...rest }: TextInputProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputClasses(severity)} ${className}`}
      {...rest}
    />
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  severity?: 'error' | 'warning' | undefined;
}

export function TextArea({ value, onChange, severity, className = '', ...rest }: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${inputClasses(severity)} h-auto min-h-24 py-2 leading-snug ${className}`}
      {...rest}
    />
  );
}
