import React from 'react';

interface ResponsiveSplitProps {
  primary: React.ReactNode;
  secondary: React.ReactNode;
  /** Stack order on mobile: primary-first (default) or secondary-first */
  mobileOrder?: 'primary-first' | 'secondary-first';
  className?: string;
  gap?: 'md' | 'lg';
}

/**
 * Mobile: stacked. Desktop (lg+): two intentional columns.
 */
const ResponsiveSplit: React.FC<ResponsiveSplitProps> = ({
  primary,
  secondary,
  mobileOrder = 'primary-first',
  className = '',
  gap = 'lg',
}) => {
  const gapClass = gap === 'lg' ? 'gap-6 lg:gap-8 xl:gap-10' : 'gap-4 lg:gap-6';

  return (
    <div
      className={[
        'grid grid-cols-1 lg:grid-cols-2 items-start',
        gapClass,
        className,
      ].join(' ')}
    >
      <div className={mobileOrder === 'secondary-first' ? 'order-2 lg:order-1' : 'order-1'}>
        {primary}
      </div>
      <div className={mobileOrder === 'secondary-first' ? 'order-1 lg:order-2' : 'order-2'}>
        {secondary}
      </div>
    </div>
  );
};

export default ResponsiveSplit;
