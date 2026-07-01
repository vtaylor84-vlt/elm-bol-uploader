import React from 'react';

type ElmButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ElmButtonSize = 'md' | 'lg';

interface ElmButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ElmButtonVariant;
  size?: ElmButtonSize;
  fullWidth?: boolean;
  trailing?: React.ReactNode;
}

const variantClass: Record<ElmButtonVariant, string> = {
  primary: 'elm-btn-primary terminal-btn-primary',
  secondary: 'elm-btn-secondary',
  ghost: 'elm-btn-ghost',
  danger: 'elm-btn-danger',
};

const sizeClass: Record<ElmButtonSize, string> = {
  md: 'min-h-[48px] px-5 text-[11px] tracking-[0.22em]',
  lg: 'min-h-[52px] px-6 text-sm tracking-[0.26em]',
};

const ElmButton = React.forwardRef<HTMLButtonElement, ElmButtonProps>(
  (
    {
      variant = 'primary',
      size = 'lg',
      fullWidth = false,
      trailing,
      className = '',
      children,
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={[
        'elm-btn font-black uppercase rounded-xl transition-all duration-200',
        'inline-flex items-center justify-center gap-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantClass[variant],
        sizeClass[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span>{children}</span>
      {trailing}
    </button>
  )
);

ElmButton.displayName = 'ElmButton';

export default ElmButton;
