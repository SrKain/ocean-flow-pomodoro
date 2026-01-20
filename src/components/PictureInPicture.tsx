import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, X, Move, Music } from 'lucide-react';
import { Phase } from '@/lib/database';

interface SpotifyTrackInfo {
  name: string;
  artist: string;
  albumArt?: string;
}

interface PictureInPictureProps {
  isOpen: boolean;
  onClose: () => void;
  timeLeft: number;
  totalTime: number;
  currentPhase: Phase;
  isRunning: boolean;
  isOvertime?: boolean;
  extraTime?: number;
  onPlayPause: () => void;
  currentTrack?: SpotifyTrackInfo | null;
}

const phaseNames: Record<Phase, string> = {
  immersion: 'Imersão',
  dive: 'Mergulho',
  breath: 'Respiração',
};

// Easing function for smoother color transitions
const easeInOutCubic = (t: number): number => {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Calculate dynamic colors based on phase and progress
const getPhaseColors = (phase: Phase, progress: number) => {
  const easedProgress = easeInOutCubic(progress);
  
  if (phase === 'dive') {
    const hue = 215 - easedProgress * 190;
    const sat = 50 - easedProgress * 5;
    const light = 8 + easedProgress * 7;
    return { hue, sat, light };
  }
  
  if (phase === 'breath') {
    const hue = 25 + easedProgress * 175;
    const sat = 45 + easedProgress * 5;
    const light = 15 - easedProgress * 3;
    return { hue, sat, light };
  }
  
  if (phase === 'immersion') {
    const hue = 200 + easedProgress * 15;
    const sat = 50;
    const light = 12 - easedProgress * 4;
    return { hue, sat, light };
  }
  
  return { hue: 215, sat: 50, light: 8 };
};

const getBackgroundGradient = (phase: Phase, progress: number, isOvertime: boolean) => {
  if (isOvertime) {
    return 'linear-gradient(135deg, hsl(45, 40%, 10%) 0%, hsl(40, 45%, 6%) 100%)';
  }
  const { hue, sat, light } = getPhaseColors(phase, progress);
  return `linear-gradient(135deg, hsl(${hue}, ${sat}%, ${light}%) 0%, hsl(${hue + 5}, ${sat + 5}%, ${Math.max(4, light - 4)}%) 100%)`;
};

const getRingColor = (phase: Phase, progress: number, isOvertime: boolean) => {
  if (isOvertime) {
    return 'hsl(45, 100%, 60%)';
  }
  const { hue, sat } = getPhaseColors(phase, progress);
  return `hsl(${hue}, ${Math.min(90, sat + 30)}%, 60%)`;
};

export function PictureInPicture({
  isOpen,
  onClose,
  timeLeft,
  totalTime,
  currentPhase,
  isRunning,
  isOvertime,
  extraTime,
  onPlayPause,
  currentTrack,
}: PictureInPictureProps) {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 150);
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 150);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current) {
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
      setIsDragging(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 150);
      const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 150);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }
  }, [isDragging, dragOffset]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleTouchMove, handleMouseUp]);

  if (!isOpen) return null;

  const displayTime = isOvertime ? (extraTime || 0) : timeLeft;
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;
  const progress = isOvertime ? 1 : 1 - (timeLeft / totalTime);
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = isOvertime ? 0 : circumference * (1 - progress);
  
  const backgroundGradient = getBackgroundGradient(currentPhase, progress, isOvertime || false);
  const activeColor = getRingColor(currentPhase, progress, isOvertime || false);

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] touch-none select-none"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div 
        className="relative w-44 rounded-2xl p-3 cursor-move border border-white/10 shadow-2xl"
        style={{
          background: backgroundGradient,
          backdropFilter: 'blur(20px)',
          transition: 'background 0.3s ease',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Drag handle indicator */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2">
          <Move className="w-3 h-3 text-white/30" />
        </div>
        
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-white" />
        </button>

        {/* Timer circle */}
        <div className="flex flex-col items-center pt-3">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
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
                stroke={activeColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: `drop-shadow(0 0 6px ${activeColor})`,
                }}
              />
            </svg>
            {/* Time display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-lg font-bold"
                style={{ color: isOvertime ? 'hsl(45, 100%, 75%)' : 'white' }}
              >
                {isOvertime && '+'}
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Phase name */}
          <span 
            className="text-xs font-medium uppercase tracking-wide mt-1"
            style={{ color: activeColor }}
          >
            {isOvertime ? '🔥 Overfocus' : phaseNames[currentPhase]}
          </span>

          {/* Now Playing */}
          {currentTrack && (
            <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-white/5 rounded-lg w-full">
              {currentTrack.albumArt ? (
                <img 
                  src={currentTrack.albumArt} 
                  alt="Album art"
                  className="w-6 h-6 rounded"
                />
              ) : (
                <Music className="w-4 h-4 text-green-500" />
              )}
              <div className="flex-1 min-w-0 text-[10px] leading-tight">
                <div className="text-white font-medium truncate">
                  {currentTrack.name}
                </div>
                <div className="text-white/60 truncate">
                  {currentTrack.artist}
                </div>
              </div>
            </div>
          )}

          {/* Play/Pause button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="w-9 h-9 mt-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
          >
            {isRunning ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
