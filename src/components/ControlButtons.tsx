import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ControlButtonsProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
  onReset?: () => void;
  compact?: boolean;
  pausedLabel?: string;
}

export function ControlButtons({
  isRunning,
  onPlayPause,
  onSkip,
  onReset,
  compact = false,
  pausedLabel = "Continuar",
}: ControlButtonsProps) {
  return (
    <div className={cn("flex items-center justify-center", compact ? "gap-2" : "gap-3")}>
      {onReset && (
        <button
          onClick={onReset}
          className={cn(
            "glass-button flex items-center justify-center border border-white/10 text-foreground/80",
            compact ? "h-10 w-10" : "h-12 w-12"
          )}
          aria-label="Resetar fase"
          title="Resetar fase"
        >
          <RotateCcw className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        </button>
      )}

      <button
        onClick={onSkip}
        className={cn(
          "glass-button flex items-center justify-center border border-white/10 text-foreground/80",
          "transition-all hover:scale-[1.02] active:scale-100",
          compact ? "h-11 w-11" : "h-14 w-14"
        )}
        aria-label="Pular fase"
        title="Pular fase"
      >
        <SkipForward className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
      </button>

      <button
        onClick={onPlayPause}
        className={cn(
          "rounded-full flex items-center justify-center border border-white/10",
          "transition-all duration-200 active:scale-95",
          compact ? "h-16 w-16" : "h-20 w-20",
          isRunning && "animate-pulse-glow"
        )}
        style={{
          background: isRunning
            ? "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)"
            : "linear-gradient(180deg, hsl(200, 80%, 58%) 0%, hsl(200, 80%, 48%) 100%)",
          boxShadow: isRunning
            ? "0 10px 28px rgba(17, 24, 39, 0.35), inset 0 1px 0 rgba(255,255,255,0.22)"
            : "0 10px 28px hsla(200, 80%, 55%, 0.42), inset 0 1px 0 hsla(0,0%,100%,0.35), inset 0 -2px 0 hsla(0,0%,0%,0.08)",
          color: isRunning ? "hsl(200 20% 95%)" : "hsl(210, 50%, 8%)"
        }}
        aria-label={isRunning ? "Pausar" : pausedLabel}
        title={isRunning ? "Pausar" : pausedLabel}
      >
        {isRunning ? (
          <Pause className={cn(compact ? "h-5 w-5" : "h-8 w-8")} />
        ) : (
          <Play className={cn(compact ? "h-5 w-5" : "h-8 w-8", "ml-0.5")} />
        )}
      </button>
    </div>
  );
}
