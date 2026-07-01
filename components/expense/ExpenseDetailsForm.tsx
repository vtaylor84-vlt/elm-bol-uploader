import React from 'react';
import {
  EXPENSE_TYPE_OPTIONS,
  PAID_WITH_OPTIONS,
  type ExpenseFormState,
} from '../../types/expense.ts';
import { formatCurrencyInput } from '../../utils/expenseForm.ts';
import type { DriverOption } from '../../services/terminalDataService.ts';
import {
  ExpenseFieldLabel,
  RevealField,
  SegmentedToggle,
  expenseInputClass,
  expenseSelectClass,
} from './ExpenseFormPrimitives.tsx';

interface ExpenseDetailsFormProps {
  form: ExpenseFormState;
  trucks: string[];
  drivers: DriverOption[];
  isAdmin: boolean;
  currentDriverLabel?: string;
  trucksLoading?: boolean;
  onChange: (patch: Partial<ExpenseFormState>) => void;
}

const ExpenseDetailsForm: React.FC<ExpenseDetailsFormProps> = ({
  form,
  trucks,
  drivers,
  isAdmin,
  currentDriverLabel,
  trucksLoading,
  onChange,
}) => (
  <div className="space-y-5 sm:space-y-6">
    {isAdmin ? (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 space-y-4">
        <span className="inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border border-amber-500/40 text-amber-300">
          Admin
        </span>

        <div>
          <ExpenseFieldLabel htmlFor="expense-driver" required>
            Driver
          </ExpenseFieldLabel>
          <select
            id="expense-driver"
            className={expenseSelectClass}
            value={form.selectedDriverName}
            onChange={(e) => onChange({ selectedDriverName: e.target.value.toUpperCase() })}
          >
            <option value="">Select driver</option>
            {drivers.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-zinc-500 normal-case mt-2 leading-relaxed">
            Select the driver this expense belongs to.
          </p>
        </div>

        <div>
          <ExpenseFieldLabel required>Is this reimbursement for this driver?</ExpenseFieldLabel>
          <SegmentedToggle
            name="reimbursement"
            value={form.reimbursementForDriver ? 'yes' : 'no'}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            onChange={(v) => onChange({ reimbursementForDriver: v === 'yes' })}
          />
          {!form.reimbursementForDriver ? (
            <p className="text-[10px] text-zinc-500 normal-case mt-2 leading-relaxed">
              Expense will be recorded without creating a reimbursement request.
            </p>
          ) : null}
        </div>
      </div>
    ) : currentDriverLabel ? (
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-4 py-3">
        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Driver</p>
        <p className="text-sm font-semibold text-white mt-1">{currentDriverLabel}</p>
      </div>
    ) : null}

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <ExpenseFieldLabel htmlFor="expense-truck" required>
          Truck Number
        </ExpenseFieldLabel>
        {trucks.length > 0 ? (
          <select
            id="expense-truck"
            className={expenseSelectClass}
            value={form.truckNumber}
            onChange={(e) => onChange({ truckNumber: e.target.value })}
            disabled={trucksLoading}
          >
            <option value="">{trucksLoading ? 'Loading trucks...' : 'Select truck'}</option>
            {trucks.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="expense-truck"
            className={expenseInputClass}
            placeholder={trucksLoading ? 'Loading trucks...' : 'Enter truck number'}
            value={form.truckNumber}
            onChange={(e) => onChange({ truckNumber: e.target.value })}
            disabled={trucksLoading}
          />
        )}
      </div>

      <div>
        <ExpenseFieldLabel htmlFor="expense-date" required>
          Expense Date
        </ExpenseFieldLabel>
        <input
          id="expense-date"
          type="date"
          className={expenseInputClass}
          value={form.expenseDate}
          onChange={(e) => onChange({ expenseDate: e.target.value })}
        />
      </div>
    </div>

    <div>
      <ExpenseFieldLabel htmlFor="expense-amount" required>
        Reimbursement Amount
      </ExpenseFieldLabel>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg font-semibold">
          $
        </span>
        <input
          id="expense-amount"
          inputMode="decimal"
          className={`${expenseInputClass} pl-9 text-lg font-semibold tracking-wide`}
          placeholder="0.00"
          value={form.amount}
          onChange={(e) => onChange({ amount: formatCurrencyInput(e.target.value) })}
        />
      </div>
    </div>

    <div>
      <ExpenseFieldLabel htmlFor="expense-paid" required>
        Paid With
      </ExpenseFieldLabel>
      <select
        id="expense-paid"
        className={expenseSelectClass}
        value={form.paidWith}
        onChange={(e) =>
          onChange({ paidWith: e.target.value as ExpenseFormState['paidWith'], paidWithOther: '' })
        }
      >
        {PAID_WITH_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <RevealField show={form.paidWith === 'other'}>
        <ExpenseFieldLabel htmlFor="paid-other" required>
          Please Specify
        </ExpenseFieldLabel>
        <input
          id="paid-other"
          className={expenseInputClass}
          placeholder="How was this expense paid?"
          value={form.paidWithOther}
          onChange={(e) => onChange({ paidWithOther: e.target.value })}
        />
      </RevealField>
    </div>

    <div>
      <ExpenseFieldLabel htmlFor="expense-vendor" required>
        Vendor / Payee
      </ExpenseFieldLabel>
      <input
        id="expense-vendor"
        className={expenseInputClass}
        placeholder="Love's, Pilot, TA, Walmart..."
        value={form.vendor}
        onChange={(e) => onChange({ vendor: e.target.value })}
      />
    </div>

    <div>
      <ExpenseFieldLabel htmlFor="expense-type" required>
        Expense Type
      </ExpenseFieldLabel>
      <select
        id="expense-type"
        className={expenseSelectClass}
        value={form.expenseType}
        onChange={(e) =>
          onChange({
            expenseType: e.target.value as ExpenseFormState['expenseType'],
            expenseTypeOther: '',
          })
        }
      >
        {EXPENSE_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <RevealField show={form.expenseType === 'other'}>
        <ExpenseFieldLabel htmlFor="type-other" required>
          Please Specify
        </ExpenseFieldLabel>
        <input
          id="type-other"
          className={expenseInputClass}
          placeholder="Describe the expense type"
          value={form.expenseTypeOther}
          onChange={(e) => onChange({ expenseTypeOther: e.target.value })}
        />
      </RevealField>
    </div>

    <p className="text-[10px] text-zinc-600 normal-case text-center pt-1">
      Fields marked with <span className="text-red-400">*</span> are required.
    </p>
  </div>
);

export default ExpenseDetailsForm;
