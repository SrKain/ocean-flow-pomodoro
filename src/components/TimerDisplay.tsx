import { cn } from "@/lib/utils";
import { Phase } from "@/lib/storage";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  phase: Phase;
}

const phaseColors: Record<Phase, string> = {
  immersion: 'text-ocean-light',
  dive: 'text-primary',
  breath: '', // Special styling for breath
};

export function TimerDisplay({ minutes, seconds, phase }: TimerDisplayProps) {
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="relative water-reflection">
      <div 
        className={cn(
          "text-7xl sm:text-8xl font-light tracking-tight transition-colors duration-500",
          phase === 'breath' ? 'timer-text-breath' : cn('timer-text', phaseColors[phase])
        )}
      >
        {timeStr}
      </div>
    </div>
  );
}