import React from 'react';
import type { GlassGlowColor } from '../tokens.ts';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: GlassGlowColor;
  variant?: 'solid' | 'interactive' | 'accent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
  onClick?: () => void;
  id?: string;
  'aria-label'?: string;
}

const glowClass: Record<GlassGlowColor, string> = {
  none: '',
  blue: 'elm-glass-glow-blue',
  indigo: 'elm-glass-glow-indigo',
  cyan: 'elm-glass-glow-cyan',
  emerald: 'elm-glass-glow-emerald',
  amber: 'elm-glass-glow-amber',
  rose: 'elm-glass-glow-rose',
};

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

/**
 * Glassmorphic surface — board-spec GlassCard.
 * Prefer this for Mission Control / login cards; ElmCard remains for legacy modules.
 */
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glowColor = 'cyan',
  variant = 'solid',
  padding = 'md',
  as: Tag = 'div',
  onClick,
  id,
  'aria-label': ariaLabel,
}) => {
  const interactive = variant === 'interactive' || Boolean(onClick);
  const classes = [
    'elm-glass-card',
    glowClass[glowColor],
    variant === 'accent' ? 'elm-glass-card--accent' : '',
    interactive ? 'elm-glass-card--interactive' : '',
    paddingClass[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (interactive && Tag === 'div') {
    return (
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        className={`${classes} text-left w-full`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  }

  return (
    <Tag id={id} aria-label={ariaLabel} className={classes}>
      {children}
    </Tag>
  );
};

export default GlassCard;
