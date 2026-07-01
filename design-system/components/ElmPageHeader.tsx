import React from 'react';

interface ElmPageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

const ElmPageHeader: React.FC<ElmPageHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}) => (
  <header
    className={[
      'space-y-2',
      align === 'center' ? 'text-center' : 'text-left',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <p className="elm-eyebrow">{eyebrow}</p>
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
      {title}
    </h1>
    {description ? (
      <p className="text-sm sm:text-base text-zinc-400 normal-case max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    ) : null}
  </header>
);

export default ElmPageHeader;
