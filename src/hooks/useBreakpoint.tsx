import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type BreakpointRange =
  | 'compact'          // < 360px largura ou < 560px altura
  | 'mobile'           // 360 - 599px largura
  | 'tablet-portrait'  // 600 - 899px largura
  | 'desktop-compact'  // 900 - 1199px largura
  | 'desktop'          // 1200 - 1599px largura
  | 'wide';            // >= 1600px largura

export interface ViewportState {
  width: number;
  height: number;
  range: BreakpointRange;
  isCompact: boolean;
  isMobile: boolean;
  isTabletPortrait: boolean;
  isDesktopCompact: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isLandscape: boolean;
  isShortLandscape: boolean; // Paisagem com altura <= 520px
  isBottomNav: boolean;      // Telas < 900px (celular e tablet retrato usam barra inferior - D2)
}

function calculateViewportState(width: number, height: number): ViewportState {
  const isLandscape = width > height && width / height > 1.15;
  const isShortLandscape = isLandscape && height <= 520;
  
  let range: BreakpointRange;
  const isCompact = width < 360 || height < 560;

  if (isCompact) {
    range = 'compact';
  } else if (width < 600) {
    range = 'mobile';
  } else if (width < 900) {
    range = 'tablet-portrait';
  } else if (width < 1200) {
    range = 'desktop-compact';
  } else if (width < 1600) {
    range = 'desktop';
  } else {
    range = 'wide';
  }

  const isMobile = range === 'mobile' || (width < 600 && !isCompact);
  const isTabletPortrait = range === 'tablet-portrait';
  const isDesktopCompact = range === 'desktop-compact';
  const isDesktop = range === 'desktop';
  const isWide = range === 'wide';
  // Conforme decisão D2: tablet retrato (600 a 899 px) usa barra inferior, igual ao celular (< 900 px)
  const isBottomNav = width < 900;

  return {
    width,
    height,
    range,
    isCompact,
    isMobile,
    isTabletPortrait,
    isDesktopCompact,
    isDesktop,
    isWide,
    isLandscape,
    isShortLandscape,
    isBottomNav,
  };
}

const defaultState: ViewportState = calculateViewportState(
  typeof window !== 'undefined' ? window.innerWidth : 1024,
  typeof window !== 'undefined' ? window.innerHeight : 768
);

const ViewportContext = createContext<ViewportState>(defaultState);

export const ViewportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ViewportState>(defaultState);

  useEffect(() => {
    let timeoutId: number | undefined;

    const handleResize = () => {
      // Debounce leve para evitar recalculos em excesso durante resize contínuo
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setState(calculateViewportState(window.innerWidth, window.innerHeight));
      }, 50);
    };

    // Leitura imediata
    setState(calculateViewportState(window.innerWidth, window.innerHeight));

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <ViewportContext.Provider value={state}>
      {children}
    </ViewportContext.Provider>
  );
};

export function useBreakpoint(): ViewportState {
  const context = useContext(ViewportContext);
  // Se usado fora do provider, calcula com base nas dimensões atuais de window
  if (!context) {
    if (typeof window !== 'undefined') {
      return calculateViewportState(window.innerWidth, window.innerHeight);
    }
    return defaultState;
  }
  return context;
}

export const useViewport = useBreakpoint;
