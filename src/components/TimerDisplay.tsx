import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  phase: Phase;
  onTimeChange?: (newTimeSeconds: number) => void;
  editable?: boolean;
  compact?: boolean;
  dynamicColor?: string;
}

const phaseColors: Record<Phase, string> = {
  immersion: 'text-sky-200',
  dive: 'text-blue-200',
  breath: 'text-orange-200',
};

const presets = [15, 25, 45, 60, 90];

export function TimerDisplay({
  minutes,
  seconds,
  phase,
  onTimeChange,
  editable = true,
  compact = false,
  dynamicColor,
}: TimerDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editMinutes, setEditMinutes] = useState(minutes);
  const [editSeconds, setEditSeconds] = useState(seconds);
  const isMobile = useIsMobile();

  const timeStr = useMemo(
    () => `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    [minutes, seconds]
  );

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
    setEditMinutes((current) => Math.max(0, current + deltaMinutes));
  };

  const applyPreset = (minutesValue: number) => {
    setEditMinutes(minutesValue);
    setEditSeconds(0);
  };

  const durationForm = (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-2">
        <span className="text-3xl font-semibold text-foreground">
          {String(editMinutes).padStart(2, '0')}:{String(editSeconds).padStart(2, '0')}
        </span>
      </div>

      <div className="flex justify-center gap-2">
        {[-10, -5, 5, 10].map((delta) => (
          <Button
            key={delta}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(delta)}
            className="glass-button min-h-11 border-white/10 px-3 text-sm text-foreground/80"
          >
            {delta > 0 ? `+${delta}` : delta}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <Input
          type="number"
          min={0}
          max={120}
          value={editMinutes}
          aria-label="Minutos"
          onChange={(event) => setEditMinutes(Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0))}
          className="h-12 w-24 border-white/10 bg-white/5 text-center text-2xl text-foreground"
        />
        <span className="text-2xl text-foreground/70">:</span>
        <Input
          type="number"
          min={0}
          max={59}
          value={editSeconds}
          aria-label="Segundos"
          onChange={(event) => setEditSeconds(Math.min(59, Math.max(0, Number.parseInt(event.target.value || '0', 10) || 0)))}
          className="h-12 w-24 border-white/10 bg-white/5 text-center text-2xl text-foreground"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {presets.map((preset) => (
          <Button
            key={preset}
            variant="outline"
            size="sm"
            onClick={() => applyPreset(preset)}
            className="glass-button min-h-11 border-white/10 px-2 text-xs text-foreground/80"
          >
            {preset} min
          </Button>
        ))}
      </div>

      <Button onClick={handleSave} className="min-h-12 w-full rounded-2xl bg-primary text-primary-foreground hover:brightness-110">
        Confirmar
      </Button>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "relative select-none",
          editable && onTimeChange && "cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
        )}
        onClick={handleOpen}
        role={editable && onTimeChange ? "button" : undefined}
        tabIndex={editable && onTimeChange ? 0 : undefined}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && editable && onTimeChange) {
            event.preventDefault();
            handleOpen();
          }
        }}
        aria-label={editable && onTimeChange ? 'Ajustar duração do timer' : undefined}
      >
        <div
          className={cn(
            "font-light tracking-[-0.08em] transition-colors duration-500",
            compact ? "text-4xl sm:text-5xl" : "text-[clamp(3.4rem,12vw,8rem)]",
            !dynamicColor && (phase === 'breath' ? 'timer-text-breath' : cn('timer-text', phaseColors[phase]))
          )}
          style={dynamicColor ? {
            color: dynamicColor,
            textShadow: `0 0 30px ${dynamicColor}, 0 0 60px ${dynamicColor}55, 0 2px 8px rgba(0,0,0,0.2)`,
          } : undefined}
        >
          {timeStr}
        </div>
      </div>

      {isMobile ? (
        <Sheet open={isEditing} onOpenChange={setIsEditing}>
          <SheetContent side="bottom" className="glass-popup max-h-[88dvh] overflow-y-auto rounded-t-[28px] border-white/10 px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
            <SheetHeader className="pr-8 text-left">
              <SheetTitle>Ajustar duração</SheetTitle>
            </SheetHeader>
            {durationForm}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="glass border-white/10 max-w-sm rounded-[28px] p-5 sm:p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-center text-lg font-medium text-foreground">Ajustar duração</DialogTitle>
            </DialogHeader>
            {durationForm}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}