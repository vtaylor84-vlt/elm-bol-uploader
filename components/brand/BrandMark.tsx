import React from 'react';
import type { BrandThemeId } from '../../utils/carrierBrand.ts';

interface BrandMarkProps {
  theme?: BrandThemeId;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  /** Decorative when true — parent must provide accessible name. */
  decorative?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<BrandMarkProps['size']>, string> = {
  sm: 'brand-mark brand-mark--sm',
  md: 'brand-mark brand-mark--md',
  lg: 'brand-mark brand-mark--lg',
  hero: 'brand-mark brand-mark--hero',
};

const ALT: Record<BrandThemeId, string> = {
  elm: 'ELM CONNECT',
  bst: 'BST Expedite',
  glx: 'Greenleaf Xpress',
};

const SRC: Record<BrandThemeId, string> = {
  elm: '/assets/elm-connect-mark.png',
  bst: '/assets/bst-logo.svg',
  glx: '/assets/glx-logo.png',
};

/**
 * Single brand identity system — ELM CONNECT mark, or carrier logo when authoritative.
 */
const BrandMark: React.FC<BrandMarkProps> = ({
  theme = 'elm',
  size = 'md',
  decorative = false,
  className = '',
}) => (
  <img
    src={SRC[theme]}
    alt={decorative ? '' : ALT[theme]}
    className={`${SIZE[size]} ${className}`.trim()}
    decoding="async"
    draggable={false}
  />
);

export default BrandMark;
