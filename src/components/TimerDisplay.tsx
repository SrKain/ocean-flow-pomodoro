import { useState } from "react";
import { cn } from "@/lib/utils";
import { Phase } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  phase: Phase;
  onTimeChange?: (newTimeSeconds: number) => void;
  editable?: boolean;
}

const phaseColors: Record<Phase, string> = {
  immersion: 'text-ocean-light',
  dive: 'text-primary',
  breath: '', // Special styling for breath
};

export function TimerDisplay({ 
  minutes, 
  seconds, 
  phase,
  onTimeChange,
  editable = true,
}: TimerDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMinutes, setEditMinutes] = useState(minutes);
  const [editSeconds, setEditSeconds] = useState(seconds);

  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleOpen = () => {
    if (!editable || !onTimeChange) return;
    setEditMinutes(minutes);
    setEditSeconds(seconds);
    setIsEditing(true);
  };

  const handleSave = () => {
    const totalSeconds = (editMinutes * 60) + editSeconds;
    if (totalSeconds > 0 && onTimeChange) {
      onTimeChange(totalSeconds);
    }
    setIsEditing(false);
  };

  const handleQuickAdjust = (deltaMinutes: number) => {
    const newMinutes = Math.max(0, editMinutes + deltaMinutes);
    setEditMinutes(newMinutes);
  };

  return (
    <>
      <div 
        className={cn(
          "relative water-reflection",
          editable && onTimeChange && "cursor-pointer hover:scale-105 transition-transform"
        )}
        onClick={handleOpen}
      >
        <div 
          className={cn(
            "text-7xl sm:text-8xl font-light tracking-tight transition-colors duration-500",
            phase === 'breath' ? 'timer-text-breath' : cn('timer-text', phaseColors[phase])
          )}
        >
          {timeStr}
        </div>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="glass border-white/10 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-foreground text-center">
              Ajustar tempo
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            {/* Quick adjust buttons */}
            <div className="flex justify-center gap-2">
              {[-10, -5, +5, +10].map((delta) => (
                <Button
                  key={delta}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdjust(delta)}
                  className="glass-button border-white/10"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </Button>
              ))}
            </div>

            {/* Manual input */}
            <div className="flex items-center justify-center gap-2">
              <Input
                type="number"
                min={0}
                max={120}
                value={editMinutes}
                onChange={(e) => setEditMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 text-center text-2xl bg-white/5 border-white/10"
              />
              <span className="text-2xl text-foreground">:</span>
              <Input
                type="number"
                min={0}
                max={59}
                value={editSeconds}
                onChange={(e) => setEditSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-20 text-center text-2xl bg-white/5 border-white/10"
              />
            </div>

            <Button 
              onClick={handleSave}
              className="w-full glass-button border-white/20"
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}