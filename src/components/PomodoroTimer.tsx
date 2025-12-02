import { useState, useEffect, useCallback, useRef } from "react";
import { Settings, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Phase, getSettingsAsync, saveCycleRecordAsync, PomodoroSettings } from "@/lib/database";
import { PolarRing } from "./PolarRing";
import { TimerDisplay } from "./TimerDisplay";
import { ControlButtons } from "./ControlButtons";
import { TagInput } from "./TagInput";
import { PhasePopup } from "./PhasePopup";
import { useWakeLock } from "@/hooks/useWakeLock";

const phaseOrder: Phase[] = ['immersion', 'dive', 'breath'];

const phaseNames: Record<Phase, string> = {
  immersion: 'Imersão',
  dive: 'Mergulho',
  breath: 'Respiração',
};

const phaseColors: Record<Phase, string> = {
  immersion: 'hsl(195, 85%, 65%)',
  dive: 'hsl(200, 80%, 55%)',
  breath: 'hsl(25, 90%, 40%)',
};

export function PomodoroTimer() {
  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>('immersion');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [tag, setTag] = useState('');
  const [actions, setActions] = useState('');
  const [cycleCount, setCycleCount] = useState(0);
  
  const startTimeRef = useRef<string | null>(null);
  const pendingPhaseRef = useRef<Phase | null>(null);

  // Keep screen on while timer is running
  useWakeLock(isRunning);

  // Load settings on mount
  useEffect(() => {
    getSettingsAsync().then((s) => {
      setSettings(s);
      setTimeLeft(s.immersionMinutes * 60);
      setTotalTime(s.immersionMinutes * 60);
    });
  }, []);

  const getPhaseTime = useCallback((phase: Phase) => {
    if (!settings) return 25 * 60;
    switch (phase) {
      case 'immersion': return settings.immersionMinutes * 60;
      case 'dive': return settings.diveMinutes * 60;
      case 'breath': return settings.breathMinutes * 60;
    }
  }, [settings]);

  const getNextPhase = (current: Phase): Phase => {
    const currentIndex = phaseOrder.indexOf(current);
    return phaseOrder[(currentIndex + 1) % phaseOrder.length];
  };

  const saveCycle = useCallback((completed: boolean) => {
    if (startTimeRef.current) {
      saveCycleRecordAsync({
        phase: currentPhase,
        startTime: startTimeRef.current,
        endTime: new Date().toISOString(),
        tag: currentPhase === 'immersion' ? tag : undefined,
        actions: currentPhase === 'dive' ? actions : undefined,
        completed,
      });
    }
  }, [currentPhase, tag, actions]);

  const startPhase = useCallback((phase: Phase) => {
    const time = getPhaseTime(phase);
    setCurrentPhase(phase);
    setTimeLeft(time);
    setTotalTime(time);
    startTimeRef.current = new Date().toISOString();
    setIsRunning(true);
    setShowPopup(false);
    
    if (phase === 'immersion') {
      setCycleCount(prev => prev + 1);
    }
  }, [getPhaseTime]);

  const handlePhaseComplete = useCallback(() => {
    setIsRunning(false);
    saveCycle(true);
    
    const next = getNextPhase(currentPhase);
    pendingPhaseRef.current = next;
    setShowPopup(true);
    // Phase does NOT auto-start - waits for user confirmation
  }, [currentPhase, saveCycle]);

  const handleSkip = useCallback(() => {
    setIsRunning(false);
    saveCycle(false);
    
    const next = getNextPhase(currentPhase);
    pendingPhaseRef.current = next;
    setShowPopup(true);
  }, [currentPhase, saveCycle]);

  const handlePlayPause = () => {
    if (!isRunning && !startTimeRef.current) {
      startTimeRef.current = new Date().toISOString();
    }
    setIsRunning(prev => !prev);
  };

  const handleContinue = () => {
    if (pendingPhaseRef.current) {
      startPhase(pendingPhaseRef.current);
      pendingPhaseRef.current = null;
    }
  };

  const handleWait = () => {
    setShowPopup(false);
  };

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handlePhaseComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - (timeLeft / totalTime);

  // Calculate background style based on phase and progress
  const getBackgroundStyle = () => {
    if (currentPhase === 'dive') {
      // Pure black for OLED
      return { background: '#000000' };
    }
    
    if (currentPhase === 'immersion') {
      // Light blue that darkens over time
      const lightness = 60 - (progress * 35); // From 60% to 25%
      return {
        background: `linear-gradient(180deg, hsl(195, 85%, ${lightness}%) 0%, hsl(215, 65%, ${lightness - 15}%) 100%)`
      };
    }
    
    if (currentPhase === 'breath') {
      // Dark → Light → Dark cycle
      // 0-50%: dark to light, 50-100%: light to dark
      let lightness;
      if (progress <= 0.5) {
        // Going from dark (35%) to light (65%)
        lightness = 35 + (progress * 2 * 30);
      } else {
        // Going from light (65%) back to dark (35%)
        lightness = 65 - ((progress - 0.5) * 2 * 30);
      }
      return {
        background: `linear-gradient(180deg, hsl(30, 80%, ${lightness}%) 0%, hsl(25, 70%, ${lightness - 10}%) 100%)`
      };
    }
    
    return {};
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-all duration-1000 ease-in-out"
      style={getBackgroundStyle()}
    >
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 z-10">
        {/* Top bar buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <Link
            to="/dashboard"
            className="w-12 h-12 rounded-full glass-button flex items-center justify-center"
            aria-label="Dashboard"
          >
            <BarChart3 className="w-5 h-5 text-foreground" />
          </Link>
          <Link
            to="/settings"
            className="w-12 h-12 rounded-full glass-button flex items-center justify-center"
            aria-label="Configurações"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </Link>
        </div>

        {/* Cycle counter */}
        <div className="absolute top-6 left-6 glass px-4 py-2 rounded-full">
          <span className="text-sm text-muted-foreground">Ciclo </span>
          <span className="text-foreground font-semibold">{cycleCount}</span>
        </div>

        {/* Phase indicator */}
        <div className="mb-8 animate-slide-up">
          <span className={cn(
            "text-lg font-medium tracking-wide uppercase",
            currentPhase === 'breath' ? 'text-foreground/90' : 'text-foreground/80'
          )}>
            {phaseNames[currentPhase]}
          </span>
        </div>

        {/* Timer with Polar Ring */}
        <div className="relative flex items-center justify-center mb-8">
          <PolarRing 
            progress={progress} 
            size={300}
            strokeWidth={8}
            color={phaseColors[currentPhase]}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <TimerDisplay 
              minutes={minutes} 
              seconds={seconds}
              phase={currentPhase}
            />
          </div>
        </div>

        {/* Phase-specific inputs */}
        <div className="w-full max-w-sm mb-8 animate-slide-up">
          {currentPhase === 'immersion' && (
            <TagInput
              value={tag}
              onChange={setTag}
              placeholder="🎯 Tag de foco (ex: Estudar JS)"
            />
          )}
          {currentPhase === 'dive' && (
            <TagInput
              value={actions}
              onChange={setActions}
              placeholder="📝 Ações do mergulho..."
              multiline
            />
          )}
          {currentPhase === 'breath' && (
            <div className="text-center py-4">
              <span className="text-3xl">🌊</span>
              <p className="mt-2 text-foreground/80 font-medium">Momento de descanso</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <ControlButtons
          isRunning={isRunning}
          onPlayPause={handlePlayPause}
          onSkip={handleSkip}
        />

        {/* Phase Popup */}
        <PhasePopup
          isOpen={showPopup}
          nextPhase={pendingPhaseRef.current || getNextPhase(currentPhase)}
          onContinue={handleContinue}
          onWait={handleWait}
        />
      </div>
    </div>
  );
}
