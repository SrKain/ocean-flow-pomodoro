import { useState, useEffect } from 'react';

export function useLandscapeMode() {
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const aspectRatio = width / height;
      
      // Consider mobile if width < 1024px (tablet/phone size)
      const mobile = width < 1024;
      // Consider landscape if aspect ratio > 1.2 (wider than tall)
      const landscape = aspectRatio > 1.2 && mobile;
      
      setIsMobile(mobile);
      setIsLandscape(landscape);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return { isLandscape, isMobile };
}
