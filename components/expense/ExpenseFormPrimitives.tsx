import React from 'react';

export const expenseLabelClass =
  'block text-[9px] font-black uppercase tracking-[0.32em] text-zinc-400 mb-2.5';

export const expenseInputClass =
  'w-full min-h-[52px] px-4 py-3.5 rounded-xl bg-[#06060c]/90 border border-zinc-800/90 text-[15px] text-white placeholder:text-zinc-600 placeholder:normal-case outline-none transition-all duration-200 focus:border-blue-500/55 focus:ring-2 focus:ring-blue-500/15 focus:shadow-[0_0_20px_rgba(59,130,246,0.08)]';

export const expenseSelectClass = `${expenseInputClass} appearance-none cursor-pointer`;

interface ExpenseFieldLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const ExpenseFieldLabel: React.FC<ExpenseFieldLabelProps> = ({
  htmlFor,
  required,
  children,
}) => (
  <label htmlFor={htmlFor} className={expenseLabelClass}>
    {children}
    {required ? <span className="text-red-400 ml-1">*</span> : null}
  </label>
);

interface SegmentedToggleProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  name: string;
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  name,
}: SegmentedToggleProps<T>) {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
      aria-label={name}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`min-h-[48px] rounded-xl border text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
              selected
                ? 'border-blue-500/60 bg-blue-500/20 text-blue-200 shadow-[0_0_16px_rgba(59,130,246,0.2)]'
                : 'border-zinc-800 bg-zinc-950/60 text-zinc-500 hover:border-zinc-700'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

interface RevealFieldProps {
  show: boolean;
  children: React.ReactNode;
}

export const RevealField: React.FC<RevealFieldProps> = ({ show, children }) => {
  if (!show) return null;
  return <div className="expense-reveal-field space-y-2">{children}</div>;
};
