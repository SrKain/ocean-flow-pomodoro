import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, X, Minimize2, Move } from 'lucide-react';
import { Phase } from '@/lib/database';

interface PictureInPictureProps {
  isOpen: boolean;
  onClose: () => void;
  timeLeft: number;
  totalTime: number;
  currentPhase: Phase;
  isRunning: boolean;
  onPlayPause: () => void;
}

const phaseNames: Record<Phase, string> = {
  immersion: 'Imersão',
  dive: 'Mergulho',
  breath: 'Respiração',
};

const phaseColors: Record<Phase, string> = {
  immersion: 'hsl(195, 85%, 65%)',
  dive: 'hsl(200, 80%, 55%)',
  breath: 'hsl(25, 90%, 60%)',
};

export function PictureInPicture({
  isOpen,
  onClose,
  timeLeft,
  totalTime,
  currentPhase,
  isRunning,
  onPlayPause,
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
      
      // Keep within viewport bounds
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

  // Handle touch events for mobile
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - (timeLeft / totalTime);
  const circumference = 2 * Math.PI * 35;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] touch-none select-none"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="relative w-36 glass-popup p-3 cursor-move"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Drag handle indicator */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2">
          <Move className="w-3 h-3 text-muted-foreground/50" />
        </div>
        
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-foreground" />
        </button>

        {/* Timer circle */}
        <div className="flex flex-col items-center pt-2">
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
                stroke={phaseColors[currentPhase]}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: `drop-shadow(0 0 6px ${phaseColors[currentPhase]})`,
                }}
              />
            </svg>
            {/* Time display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-foreground">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Phase name */}
          <span className="text-xs text-muted-foreground mt-1 mb-2">
            {phaseNames[currentPhase]}
          </span>

          {/* Play/Pause button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="w-8 h-8 rounded-full glass-button flex items-center justify-center"
          >
            {isRunning ? (
              <Pause className="w-4 h-4 text-foreground" />
            ) : (
              <Play className="w-4 h-4 text-foreground ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
