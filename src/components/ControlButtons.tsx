import { Play, Pause, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface ControlButtonsProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
  compact?: boolean;
}

export function ControlButtons({ isRunning, onPlayPause, onSkip, compact = false }: ControlButtonsProps) {
  return (
    <div className={cn("flex items-center justify-center", compact ? "gap-2" : "gap-4")}>
      <button
        onClick={onSkip}
        className={cn(
          "rounded-full glass-button flex items-center justify-center",
          "transition-all hover:scale-105",
          compact ? "w-10 h-10" : "w-14 h-14"
        )}
        aria-label="Pular fase"
      >
        <SkipForward className={cn(compact ? "w-4 h-4" : "w-6 h-6", "text-foreground")} />
      </button>
      
      <button
        onClick={onPlayPause}
        className={cn(
          "rounded-full flex items-center justify-center",
          "transition-all duration-200 hover:scale-105",
          isRunning && "animate-pulse-glow",
          compact ? "w-14 h-14" : "w-20 h-20"
        )}
        style={{
          background: 'linear-gradient(180deg, hsl(200, 80%, 58%) 0%, hsl(200, 80%, 48%) 100%)',
          boxShadow: '0 8px 24px hsla(200, 80%, 55%, 0.4), inset 0 1px 0 hsla(0, 0%, 100%, 0.3), inset 0 -2px 0 hsla(0, 0%, 0%, 0.1)',
          color: 'hsl(210, 50%, 8%)'
        }}
        aria-label={isRunning ? "Pausar" : "Iniciar"}
      >
        {isRunning ? (
          <Pause className={cn(compact ? "w-5 h-5" : "w-8 h-8")} />
        ) : (
          <Play className={cn(compact ? "w-5 h-5" : "w-8 h-8", "ml-0.5")} />
        )}
      </button>

      <div className={cn(compact ? "w-10 h-10" : "w-14 h-14")} /> {/* Spacer for symmetry */}
    </div>
  );
}
