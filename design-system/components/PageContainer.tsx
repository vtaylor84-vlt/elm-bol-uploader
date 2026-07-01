import React from 'react';
import { TERMINAL_SHELL } from '../../components/terminal/terminalLayout.ts';

type PageWidth = 'narrow' | 'content' | 'wide' | 'full';

interface PageContainerProps {
  children: React.ReactNode;
  width?: PageWidth;
  className?: string;
  animate?: boolean;
}

const widthClass: Record<PageWidth, string> = {
  narrow: 'max-w-lg',
  content: 'max-w-3xl',
  wide: 'max-w-5xl',
  full: 'max-w-7xl',
};

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  width = 'content',
  className = '',
  animate = true,
}) => (
  <div
    className={[
      TERMINAL_SHELL,
      widthClass[width],
      'mx-auto w-full py-4 sm:py-6 lg:py-8',
      animate ? 'elm-page-enter' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    {children}
  </div>
);

export default PageContainer;
