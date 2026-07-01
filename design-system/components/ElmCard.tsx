import React from 'react';

type ElmCardVariant = 'default' | 'glass' | 'verified' | 'muted';

interface ElmCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: ElmCardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
}

const variantClass: Record<ElmCardVariant, string> = {
  default: 'elm-card',
  glass: 'terminal-glass-panel',
  verified: 'terminal-module-panel terminal-verified-card',
  muted: 'elm-card elm-card-muted',
};

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8 lg:p-10',
};

const ElmCard: React.FC<ElmCardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  as: Tag = 'div',
}) => (
  <Tag className={`${variantClass[variant]} ${paddingClass[padding]} ${className}`.trim()}>
    {children}
  </Tag>
);

export default ElmCard;
