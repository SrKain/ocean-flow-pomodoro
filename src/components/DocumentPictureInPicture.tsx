import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, Music } from 'lucide-react';
import { Phase } from '@/lib/database';
import { createRoot, Root } from 'react-dom/client';

interface SpotifyTrackInfo {
  name: string;
  artist: string;
  albumArt?: string;
}

interface DocumentPictureInPictureProps {
  isOpen: boolean;
  onClose: () => void;
  timeLeft: number;
  totalTime: number;
  currentPhase: Phase;
  isRunning: boolean;
  isOvertime?: boolean;
  extraTime?: number;
  onPlayPause: () => void;
  onSkip?: () => void;
  currentTrack?: SpotifyTrackInfo | null;
}

const phaseNames: Record<Phase, string> = {
  immersion: 'Imersão',
  dive: 'Mergulho',
  breath: 'Respiração',
};

const phaseColors: Record<Phase, string> = {
  immersion: 'hsl(195, 85%, 70%)',
  dive: 'hsl(200, 80%, 65%)',
  breath: 'hsl(25, 90%, 65%)',
};

// Dark background gradients matching app theme
const phaseBackgrounds: Record<Phase, string> = {
  immersion: 'linear-gradient(135deg, hsl(195, 50%, 10%) 0%, hsl(200, 55%, 6%) 100%)',
  dive: 'linear-gradient(135deg, hsl(200, 50%, 10%) 0%, hsl(205, 55%, 6%) 100%)',
  breath: 'linear-gradient(135deg, hsl(25, 40%, 10%) 0%, hsl(20, 45%, 6%) 100%)',
};

// PIP Content Component
function PipContent({
  timeLeft,
  totalTime,
  currentPhase,
  isRunning,
  isOvertime,
  extraTime,
  onPlayPause,
  onSkip,
  onClose,
  currentTrack,
}: Omit<DocumentPictureInPictureProps, 'isOpen'>) {
  const minutes = isOvertime 
    ? Math.floor((extraTime || 0) / 60) 
    : Math.floor(timeLeft / 60);
  const seconds = isOvertime 
    ? (extraTime || 0) % 60 
    : timeLeft % 60;
  const progress = isOvertime ? 1 : 1 - (timeLeft / totalTime);
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        background: isOvertime 
          ? 'linear-gradient(135deg, hsl(45, 40%, 10%) 0%, hsl(40, 45%, 6%) 100%)' 
          : phaseBackgrounds[currentPhase],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'white',
        gap: '8px',
      }}
    >
      {/* Timer circle */}
      <div style={{ position: 'relative', width: '100px', height: '100px' }}>
        <svg 
          style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} 
          viewBox="0 0 80 80"
        >
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke="hsla(0, 0%, 100%, 0.1)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="35"
            fill="none"
            stroke={isOvertime ? 'hsl(45, 100%, 55%)' : phaseColors[currentPhase]}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isOvertime ? 0 : strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 6px ${isOvertime ? 'hsl(45, 100%, 55%)' : phaseColors[currentPhase]})`,
              transition: 'stroke-dashoffset 1s linear',
            }}
          />
        </svg>
        {/* Time display */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: isOvertime ? 'hsl(45, 100%, 75%)' : 'white'
          }}>
            {isOvertime && '+'}
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Phase name */}
      <span style={{ 
        fontSize: '11px', 
        color: isOvertime ? 'hsl(45, 80%, 70%)' : phaseColors[currentPhase],
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {isOvertime ? '🔥 Overfocus' : phaseNames[currentPhase]}
      </span>

      {/* Now Playing */}
      {currentTrack && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          background: 'hsla(0, 0%, 100%, 0.05)',
          borderRadius: '6px',
          maxWidth: '100%',
        }}>
          {currentTrack.albumArt ? (
            <img 
              src={currentTrack.albumArt} 
              alt="Album art"
              style={{ width: '20px', height: '20px', borderRadius: '3px' }}
            />
          ) : (
            <Music style={{ width: '14px', height: '14px', color: 'hsl(142, 70%, 45%)' }} />
          )}
          <div style={{ 
            overflow: 'hidden', 
            fontSize: '10px',
            lineHeight: '1.2',
            flex: 1,
            minWidth: 0,
          }}>
            <div style={{ 
              color: 'white', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              fontWeight: '500',
            }}>
              {currentTrack.name}
            </div>
            <div style={{ 
              color: 'hsla(0, 0%, 100%, 0.6)', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
            }}>
              {currentTrack.artist}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={onPlayPause}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'hsla(0, 0%, 100%, 0.1)',
            border: '1px solid hsla(0, 0%, 100%, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'hsla(0, 0%, 100%, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'hsla(0, 0%, 100%, 0.1)'}
        >
          {isRunning ? (
            <Pause style={{ width: '16px', height: '16px' }} />
          ) : (
            <Play style={{ width: '16px', height: '16px', marginLeft: '2px' }} />
          )}
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'hsla(0, 0%, 100%, 0.1)',
              border: '1px solid hsla(0, 0%, 100%, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'hsla(0, 0%, 100%, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'hsla(0, 0%, 100%, 0.1)'}
          >
            <SkipForward style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </div>
    </div>
  );
}

export function DocumentPictureInPicture({
  isOpen,
  onClose,
  timeLeft,
  totalTime,
  currentPhase,
  isRunning,
  isOvertime,
  extraTime,
  onPlayPause,
  onSkip,
  currentTrack,
}: DocumentPictureInPictureProps) {
  const pipWindowRef = useRef<Window | null>(null);
  const rootRef = useRef<Root | null>(null);

  // Check if Document PIP API is supported
  const isSupported = 'documentPictureInPicture' in window;

  const openPip = useCallback(async () => {
    if (!isSupported) {
      console.warn('Document Picture-in-Picture API not supported');
      return;
    }

    try {
      // @ts-ignore - Document PIP API types not in standard TypeScript
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 200,
        height: currentTrack ? 280 : 220,
      });

      pipWindowRef.current = pipWindow;

      // Copy styles
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = styleSheet.href || '';
          pipWindow.document.head.appendChild(link);
        }
      });

      // Create root container
      const container = pipWindow.document.createElement('div');
      container.id = 'pip-root';
      container.style.cssText = 'width: 100%; height: 100%; margin: 0; padding: 0;';
      pipWindow.document.body.appendChild(container);
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.padding = '0';
      pipWindow.document.body.style.overflow = 'hidden';

      // Create React root
      rootRef.current = createRoot(container);
      rootRef.current.render(
        <PipContent
          timeLeft={timeLeft}
          totalTime={totalTime}
          currentPhase={currentPhase}
          isRunning={isRunning}
          isOvertime={isOvertime}
          extraTime={extraTime}
          onPlayPause={onPlayPause}
          onSkip={onSkip}
          onClose={onClose}
          currentTrack={currentTrack}
        />
      );

      // Handle window close
      pipWindow.addEventListener('pagehide', () => {
        rootRef.current?.unmount();
        rootRef.current = null;
        pipWindowRef.current = null;
        onClose();
      });

    } catch (error) {
      console.error('Error opening Document PIP:', error);
    }
  }, [isSupported, timeLeft, totalTime, currentPhase, isRunning, isOvertime, extraTime, onPlayPause, onSkip, onClose, currentTrack]);

  // Update PIP content when state changes
  useEffect(() => {
    if (pipWindowRef.current && rootRef.current) {
      rootRef.current.render(
        <PipContent
          timeLeft={timeLeft}
          totalTime={totalTime}
          currentPhase={currentPhase}
          isRunning={isRunning}
          isOvertime={isOvertime}
          extraTime={extraTime}
          onPlayPause={onPlayPause}
          onSkip={onSkip}
          onClose={onClose}
          currentTrack={currentTrack}
        />
      );
    }
  }, [timeLeft, totalTime, currentPhase, isRunning, isOvertime, extraTime, onPlayPause, onSkip, onClose, currentTrack]);

  // Open/close PIP window
  useEffect(() => {
    if (isOpen && !pipWindowRef.current) {
      openPip();
    } else if (!isOpen && pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
  }, [isOpen, openPip]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
      }
      if (rootRef.current) {
        rootRef.current.unmount();
      }
    };
  }, []);

  // Return null - PIP renders in its own window
  return null;
}

// Hook to check if Document PIP is supported
export function useDocumentPipSupport() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('documentPictureInPicture' in window);
  }, []);

  return isSupported;
}
