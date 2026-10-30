import React, { createContext, useContext, useState, useEffect } from 'react';

export type ViewMode = 'mobile' | 'desktop';

interface ViewModeContextType {
  viewMode: ViewMode;
  detectedMode: ViewMode;
  isMobile: boolean;
  isDesktop: boolean;
  toggleViewMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  resetToAuto: () => void;
  hasUserPreference: boolean;
  isSimulatedMobileOnDesktop: boolean;
  mobileFrameMode: 'frame' | 'fluid';
  setMobileFrameMode: (m: 'frame' | 'fluid') => void;
  showDetectionToast: boolean;
  dismissDetectionToast: () => void;
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: 'desktop',
  detectedMode: 'desktop',
  isMobile: false,
  isDesktop: true,
  toggleViewMode: () => {},
  setViewMode: () => {},
  resetToAuto: () => {},
  hasUserPreference: false,
  isSimulatedMobileOnDesktop: false,
  mobileFrameMode: 'fluid',
  setMobileFrameMode: () => {},
  showDetectionToast: false,
  dismissDetectionToast: () => {},
});

/**
 * Intelligent device detection helper:
 * - Checks navigator.userAgent for mobile OS identifiers (iOS, Android, etc.)
 * - Checks touch support combined with viewport dimensions
 * - Checks window.innerWidth breakpoint
 */
export function detectDevice(): ViewMode {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(userAgent);
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isNarrowScreen = window.innerWidth <= 768;

  // If mobile UA or narrow screen or touch + narrow
  if (isMobileUA || isNarrowScreen || (isTouch && window.innerWidth < 1024)) {
    return 'mobile';
  }
  return 'desktop';
}

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial Device Detection
  const [detectedMode, setDetectedMode] = useState<ViewMode>(() => detectDevice());

  // 2. Active View Mode (stored or detected)
  const [hasUserPreference, setHasUserPreference] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('prava_view_mode'));
    } catch {
      return false;
    }
  });

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('prava_view_mode') as ViewMode;
      if (saved === 'mobile' || saved === 'desktop') {
        return saved;
      }
    } catch {}
    return detectDevice();
  });

  // Mobile frame simulator on desktop (fluid or realistic smartphone frame)
  const [mobileFrameMode, setMobileFrameMode] = useState<'frame' | 'fluid'>(() => {
    try {
      const saved = localStorage.getItem('prava_mobile_frame') as 'frame' | 'fluid';
      return saved === 'frame' ? 'frame' : 'fluid';
    } catch {
      return 'fluid';
    }
  });

  // Show a one-time subtle detection toast on entrance
  const [showDetectionToast, setShowDetectionToast] = useState<boolean>(false);

  // Run on mount to ensure accurate client dimensions
  useEffect(() => {
    try {
      localStorage.removeItem('prava_view_mode');
    } catch {}
    const detected = detectDevice();
    setDetectedMode(detected);
    setViewModeState(detected);
  }, []);

  // Update localStorage when mobileFrameMode changes
  useEffect(() => {
    try {
      localStorage.setItem('prava_mobile_frame', mobileFrameMode);
    } catch {}
  }, [mobileFrameMode]);

  // Set view mode with explicit user persistence
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    setHasUserPreference(true);
    try {
      localStorage.setItem('prava_view_mode', mode);
    } catch {}
  };

  // Toggle between mobile & desktop
  const toggleViewMode = () => {
    const next = viewMode === 'mobile' ? 'desktop' : 'mobile';
    setViewMode(next);
  };

  // Reset to auto-detected mode
  const resetToAuto = () => {
    const detected = detectDevice();
    setViewModeState(detected);
    setHasUserPreference(false);
    try {
      localStorage.removeItem('prava_view_mode');
    } catch {}
  };

  const dismissDetectionToast = () => {
    setShowDetectionToast(false);
  };

  // Are we running mobile mode while physically on a wide desktop screen?
  const [isWideScreen, setIsWideScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      const detected = detectDevice();
      setDetectedMode(detected);
      setViewModeState(detected);
      setIsWideScreen(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSimulatedMobileOnDesktop = isWideScreen && viewMode === 'mobile';

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        detectedMode,
        isMobile: viewMode === 'mobile',
        isDesktop: viewMode === 'desktop',
        toggleViewMode,
        setViewMode,
        resetToAuto,
        hasUserPreference,
        isSimulatedMobileOnDesktop,
        mobileFrameMode,
        setMobileFrameMode,
        showDetectionToast,
        dismissDetectionToast,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => useContext(ViewModeContext);
