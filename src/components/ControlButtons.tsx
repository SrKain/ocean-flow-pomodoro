import { Play, Pause, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface ControlButtonsProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
}

export function ControlButtons({ isRunning, onPlayPause, onSkip }: ControlButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onSkip}
        className={cn(
          "w-14 h-14 rounded-full glass-button flex items-center justify-center",
          "transition-all hover:scale-105"
        )}
        aria-label="Pular fase"
      >
        <SkipForward className="w-6 h-6 text-foreground" />
      </button>
      
      <button
        onClick={onPlayPause}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center",
          "bg-primary text-primary-foreground",
          "transition-all hover:scale-105 hover:brightness-110",
          "shadow-lg shadow-primary/30",
          isRunning && "animate-pulse-glow"
        )}
        aria-label={isRunning ? "Pausar" : "Iniciar"}
      >
        {isRunning ? (
          <Pause className="w-8 h-8" />
        ) : (
          <Play className="w-8 h-8 ml-1" />
        )}
      </button>

      <div className="w-14 h-14" /> {/* Spacer for symmetry */}
    </div>
  );
}
