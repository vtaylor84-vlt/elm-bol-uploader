import React from 'react';

interface ElmBrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: boolean;
  align?: 'left' | 'center';
  /** Page-title usage only. Application chrome must use `div`. */
  as?: 'h1' | 'div';
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-[2rem]',
};

const ElmBrandLogo: React.FC<ElmBrandLogoProps> = ({
  size = 'md',
  subtitle = true,
  align = 'left',
  as: Tag = 'div',
}) => (
  <div className={align === 'center' ? 'text-center' : 'text-left'}>
    <Tag
      className={`${sizeClasses[size]} font-black tracking-[0.08em] leading-none`}
      aria-label="ELM CONNECT"
    >
      <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500">
        ELM
      </span>
      <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-300 via-blue-400 to-blue-600">
        CONNECT
      </span>
    </Tag>
    {subtitle ? (
      <p className="mt-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.42em] text-zinc-500">
        Elite Logistics Manager
      </p>
    ) : null}
  </div>
);

export default ElmBrandLogo;
