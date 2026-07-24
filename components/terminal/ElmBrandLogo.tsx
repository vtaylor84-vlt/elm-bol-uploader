import React from 'react';
import BrandMark from '../brand/BrandMark.tsx';

interface ElmBrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  /** @deprecated Subtitle removed — identity is the globe mark only. */
  subtitle?: boolean;
  align?: 'left' | 'center';
  /** Page-title usage only. Application chrome must use `div`. */
  as?: 'h1' | 'div';
  className?: string;
}

/**
 * Canonical ELM CONNECT identity — official globe mark (not a second wordmark).
 */
const ElmBrandLogo: React.FC<ElmBrandLogoProps> = ({
  size = 'md',
  align = 'left',
  as: Tag = 'div',
  className = '',
}) => (
  <Tag
    className={`elm-brand-logo elm-brand-logo--${align} ${className}`.trim()}
    aria-label="ELM CONNECT"
  >
    <BrandMark theme="elm" size={size === 'hero' ? 'hero' : size} decorative />
  </Tag>
);

export default ElmBrandLogo;
