import React from 'react';

export interface PrimaryActionButtonProps {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'urgent' | 'secondary' | 'success';
  disabled?: boolean;
  fullWidth?: boolean;
  id?: string;
  className?: string;
  trailing?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  'aria-busy'?: boolean;
}

const variantClass = {
  primary: 'elm-cta elm-cta--primary elm-cta-sheen',
  urgent: 'elm-cta elm-cta--urgent elm-cta-sheen',
  secondary: 'elm-cta elm-cta--secondary',
  success: 'elm-cta elm-cta--success elm-cta-sheen',
};

/**
 * Dominant operational CTA — board-spec PrimaryActionButton.
 * Supports urgent (dock POD) and primary (connect) variants with hover sheen.
 */
const PrimaryActionButton = React.forwardRef<HTMLButtonElement, PrimaryActionButtonProps>(
  (
    {
      label,
      sublabel,
      icon,
      onClick,
      variant = 'primary',
      disabled = false,
      fullWidth = true,
      id,
      className = '',
      trailing,
      type = 'button',
      'aria-busy': ariaBusy,
    },
    ref
  ) => (
    <button
      ref={ref}
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-busy={ariaBusy}
      className={[
        variantClass[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? <span className="elm-cta-icon shrink-0">{icon}</span> : null}
      <span className={`elm-cta-copy min-w-0 ${sublabel ? 'flex-1 text-left' : 'text-center'}`}>
        <span className="elm-cta-label block">{label}</span>
        {sublabel ? <span className="elm-cta-sublabel block">{sublabel}</span> : null}
      </span>
      {trailing ? (
        <span className="shrink-0" aria-hidden>
          {trailing}
        </span>
      ) : null}
    </button>
  )
);

PrimaryActionButton.displayName = 'PrimaryActionButton';

export default PrimaryActionButton;
