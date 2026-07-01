import React from 'react';
import {
  DRIVER_SELECT_MANUAL,
  DRIVER_SELECT_NOT_LISTED,
  EXPENSE_TYPE_OPTIONS,
  PAID_WITH_OPTIONS,
  isCustomDriverSelection,
  type ExpenseFormState,
} from '../../types/expense.ts';
import { formatCurrencyInput } from '../../utils/expenseForm.ts';
import type { DriverOption, TruckOption } from '../../services/terminalDataService.ts';
import ExpenseDateField from './ExpenseDateField.tsx';
import {
  ExpenseFieldLabel,
  RevealField,
  SegmentedToggle,
  expenseInputClass,
  expenseSelectClass,
  expenseSelectPlaceholderClass,
} from './ExpenseFormPrimitives.tsx';

interface ExpenseDetailsFormProps {
  form: ExpenseFormState;
  trucks: TruckOption[];
  drivers: DriverOption[];
  isAdmin: boolean;
  currentDriverLabel?: string;
  trucksLoading?: boolean;
  trucksError?: string;
  onChange: (patch: Partial<ExpenseFormState>) => void;
  onTruckSelect: (truckNumber: string) => void;
}

const ExpenseDetailsForm: React.FC<ExpenseDetailsFormProps> = ({
  form,
  trucks,
  drivers,
  isAdmin,
  currentDriverLabel,
  trucksLoading,
  trucksError,
  onChange,
  onTruckSelect,
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
            onChange={(e) =>
              onChange({
                selectedDriverName: e.target.value,
                customDriverName: isCustomDriverSelection(e.target.value) ? form.customDriverName : '',
              })
            }
          >
            <option value="">Select driver</option>
            {drivers.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
            <option value={DRIVER_SELECT_MANUAL}>Manual Entry</option>
            <option value={DRIVER_SELECT_NOT_LISTED}>Driver Not Listed</option>
          </select>
          <p className="text-[10px] text-zinc-500 normal-case mt-2 leading-relaxed">
            Select the driver this expense belongs to.
          </p>
        </div>

        <RevealField show={isCustomDriverSelection(form.selectedDriverName)}>
          <ExpenseFieldLabel htmlFor="custom-driver-name" required>
            Enter Driver Name
          </ExpenseFieldLabel>
          <input
            id="custom-driver-name"
            className={expenseInputClass}
            placeholder="Driver full name"
            value={form.customDriverName}
            onChange={(e) => onChange({ customDriverName: e.target.value })}
          />
        </RevealField>

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

    <div className="elm-form-grid">
      <div>
        <ExpenseFieldLabel htmlFor="expense-truck" required>
          Truck Number
        </ExpenseFieldLabel>
        <select
          id="expense-truck"
          className={`${expenseSelectClass} ${expenseSelectPlaceholderClass(form.truckNumber)}`}
          value={form.truckNumber}
          onChange={(e) => onTruckSelect(e.target.value)}
          disabled={trucksLoading}
          required
        >
          <option value="" disabled hidden>
            {trucksLoading ? 'Loading trucks...' : 'Select truck number'}
          </option>
          {trucks.map((t) => (
            <option key={t.truckNumber} value={t.truckNumber}>
              {t.truckNumber}
              {t.companyCode ? ` (${t.companyCode})` : ''}
            </option>
          ))}
        </select>
        {trucksError ? (
          <p className="text-[10px] text-amber-400/90 normal-case mt-2">{trucksError}</p>
        ) : null}
        {form.companyCode ? (
          <p className="text-[9px] text-zinc-600 mt-1.5 font-mono uppercase">
            Company: {form.companyCode}
          </p>
        ) : null}
      </div>

      <ExpenseDateField
        value={form.expenseDate}
        onChange={(expenseDate) => onChange({ expenseDate })}
      />

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
          className={`${expenseSelectClass} ${expenseSelectPlaceholderClass(form.paidWith)}`}
          value={form.paidWith}
          required
          onChange={(e) =>
            onChange({
              paidWith: e.target.value as ExpenseFormState['paidWith'],
              paidWithOther: '',
            })
          }
        >
          <option value="" disabled hidden>
            Select paid with
          </option>
          {PAID_WITH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <RevealField show={form.paidWith === 'other'}>
          <ExpenseFieldLabel htmlFor="paid-other" required>
            Please specify payment method
          </ExpenseFieldLabel>
          <input
            id="paid-other"
            className={expenseInputClass}
            placeholder="Describe payment method"
            value={form.paidWithOther}
            onChange={(e) => onChange({ paidWithOther: e.target.value })}
          />
        </RevealField>
      </div>

      <div>
        <ExpenseFieldLabel htmlFor="expense-type" required>
          Expense Type
        </ExpenseFieldLabel>
        <select
          id="expense-type"
          className={`${expenseSelectClass} ${expenseSelectPlaceholderClass(form.expenseType)}`}
          value={form.expenseType}
          required
          onChange={(e) =>
            onChange({
              expenseType: e.target.value as ExpenseFormState['expenseType'],
              expenseTypeOther: '',
            })
          }
        >
          <option value="" disabled hidden>
            Select expense type
          </option>
          {EXPENSE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <RevealField show={form.expenseType === 'other'}>
          <ExpenseFieldLabel htmlFor="type-other" required>
            Please specify expense type
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
    </div>

    <p className="text-[10px] text-zinc-600 normal-case text-center pt-1">
      Fields marked with <span className="text-red-400">*</span> are required.
    </p>
  </div>
);

export default ExpenseDetailsForm;
