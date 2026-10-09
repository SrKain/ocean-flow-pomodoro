import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ControlButtonsProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
  onReset?: () => void;
  compact?: boolean;
}

export function ControlButtons({
  isRunning,
  onPlayPause,
  onSkip,
  onReset,
  compact = false,
}: ControlButtonsProps) {
  return (
    <div className={cn("flex items-center justify-center", compact ? "gap-2" : "gap-3")}>
      {onReset && (
        <button
          onClick={onReset}
          className={cn(
            "rounded-full glass-button flex items-center justify-center border border-white/10",
            compact ? "w-11 h-11" : "w-12 h-12"
          )}
          aria-label="Resetar fase"
          title="Resetar fase"
        >
          <RotateCcw className={cn(compact ? "w-4 h-4" : "w-5 h-5", "text-foreground/80")} />
        </button>
      )}

      <button
        onClick={onSkip}
        className={cn(
          "rounded-full glass-button flex items-center justify-center border border-white/10",
          "transition-all hover:scale-[1.02] active:scale-100",
          compact ? "w-11 h-11" : "w-14 h-14"
        )}
        aria-label="Pular fase"
        title="Pular fase"
      >
        <SkipForward className={cn(compact ? "w-4 h-4" : "w-5 h-5", "text-foreground/80")} />
      </button>

      <button
        onClick={onPlayPause}
        className={cn(
          "rounded-full flex items-center justify-center border border-white/10",
          "transition-all duration-200 active:scale-95",
          compact ? "w-16 h-16" : "w-20 h-20",
          isRunning && "animate-pulse-glow"
        )}
        style={{
          background: 'linear-gradient(180deg, hsl(200, 80%, 58%) 0%, hsl(200, 80%, 48%) 100%)',
          boxShadow: '0 10px 28px hsla(200, 80%, 55%, 0.42), inset 0 1px 0 hsla(0,0%,100%,0.35), inset 0 -2px 0 hsla(0,0%,0%,0.08)',
          color: 'hsl(210, 50%, 8%)'
        }}
        aria-label={isRunning ? "Pausar" : "Iniciar"}
        title={isRunning ? "Pausar" : "Iniciar"}
      >
        {isRunning ? (
          <Pause className={cn(compact ? "w-5 h-5" : "w-8 h-8")} />
        ) : (
          <Play className={cn(compact ? "w-5 h-5" : "w-8 h-8", "ml-0.5")} />
        )}
      </button>
    </div>
  );
}
