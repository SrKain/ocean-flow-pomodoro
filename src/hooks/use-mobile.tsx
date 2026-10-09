import { useBreakpoint } from "./useBreakpoint";

export function useIsMobile(): boolean {
  const { width } = useBreakpoint();
  return width < 768;
}
