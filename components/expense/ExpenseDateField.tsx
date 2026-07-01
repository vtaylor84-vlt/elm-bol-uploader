import React from 'react';
import { ExpenseFieldLabel, expenseInputClass } from './ExpenseFormPrimitives.tsx';

interface ExpenseDateFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-400/80 shrink-0 pointer-events-none">
    <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Native date input — best mobile UX (iOS/Android open system date picker on tap).
 */
const ExpenseDateField: React.FC<ExpenseDateFieldProps> = ({ value, onChange }) => (
  <div>
    <ExpenseFieldLabel htmlFor="expense-date" required>
      Expense Date
    </ExpenseFieldLabel>
    <div className="relative">
      <input
        id="expense-date"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${expenseInputClass} expense-date-input pr-12 cursor-pointer`}
        aria-label="Expense date"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2">
        <CalendarIcon />
      </span>
    </div>
  </div>
);

export default ExpenseDateField;
