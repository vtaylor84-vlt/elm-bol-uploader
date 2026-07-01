import React from 'react';

const STEPS = ['Details', 'Upload', 'Review', 'Submit'] as const;

export type ExpenseWizardStep = (typeof STEPS)[number];

interface ExpenseStepperProps {
  current: ExpenseWizardStep;
}

const stepIndex = (step: ExpenseWizardStep) => STEPS.indexOf(step);

const ExpenseStepper: React.FC<ExpenseStepperProps> = ({ current }) => {
  const activeIdx = stepIndex(current);

  return (
    <div className="flex items-start justify-between gap-1 sm:gap-2 px-1">
      {STEPS.map((label, i) => {
        const isActive = i === activeIdx;
        const isComplete = i < activeIdx;
        return (
          <div key={label} className="flex-1 flex flex-col items-center min-w-0">
            <div className="relative w-full flex items-center">
              {i > 0 ? (
                <div
                  className={`absolute right-1/2 left-0 top-1/2 h-px -translate-y-1/2 ${
                    isComplete || isActive ? 'bg-blue-500/50' : 'bg-zinc-800'
                  }`}
                />
              ) : null}
              {i < STEPS.length - 1 ? (
                <div
                  className={`absolute left-1/2 right-0 top-1/2 h-px -translate-y-1/2 ${
                    isComplete ? 'bg-blue-500/50' : 'bg-zinc-800'
                  }`}
                />
              ) : null}
              <div
                className={`relative z-10 mx-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all duration-300 ${
                  isActive
                    ? 'border-blue-400 bg-blue-500/25 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.35)] scale-110'
                    : isComplete
                      ? 'border-green-500/50 bg-green-500/15 text-green-400'
                      : 'border-zinc-700 bg-zinc-950 text-zinc-600'
                }`}
              >
                {isComplete ? '✓' : i + 1}
              </div>
            </div>
            <p
              className={`mt-2 text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-center transition-colors ${
                isActive ? 'text-blue-400' : isComplete ? 'text-zinc-500' : 'text-zinc-600'
              }`}
            >
              {label}
            </p>
            {isActive ? (
              <div className="mt-1 h-0.5 w-8 rounded-full bg-blue-500 expense-step-underline" />
            ) : (
              <div className="mt-1 h-0.5 w-8" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseStepper;
