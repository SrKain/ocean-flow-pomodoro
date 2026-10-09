import { useBreakpoint } from './useBreakpoint';

export function useLandscapeMode() {
  const { width, isLandscape, isShortLandscape } = useBreakpoint();

  // Compatibilidade com lógica legada de PomodoroTimer:
  // Mobile/tablet se largura < 1024px; landscape se orientação horizontal
  const mobile = width < 1024;
  const landscape = isLandscape && (mobile || isShortLandscape);

  return {
    isLandscape: landscape,
    isMobile: mobile,
  };
}
