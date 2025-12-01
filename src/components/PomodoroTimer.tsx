import { useState, useEffect, useCallback, useRef } from "react";
import { Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Phase, getSettings, saveCycleRecord, generateId } from "@/lib/storage";
import { PolarRing } from "./PolarRing";
import { TimerDisplay } from "./TimerDisplay";
import { ControlButtons } from "./ControlButtons";
import { TagInput } from "./TagInput";
import { PhasePopup } from "./PhasePopup";

const phaseOrder: Phase[] = ['immersion', 'dive', 'breath'];

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

export function PomodoroTimer() {
  const settings = getSettings();
  
  const [currentPhase, setCurrentPhase] = useState<Phase>('immersion');
  const [timeLeft, setTimeLeft] = useState(settings.immersionMinutes * 60);
  const [totalTime, setTotalTime] = useState(settings.immersionMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [tag, setTag] = useState('');
  const [actions, setActions] = useState('');
  const [cycleCount, setCycleCount] = useState(0);
  
  const startTimeRef = useRef<string | null>(null);
  const pendingPhaseRef = useRef<Phase | null>(null);

  const getPhaseTime = useCallback((phase: Phase) => {
    const s = getSettings();
    switch (phase) {
      case 'immersion': return s.immersionMinutes * 60;
      case 'dive': return s.diveMinutes * 60;
      case 'breath': return s.breathMinutes * 60;
    }
  }, []);

  const getNextPhase = (current: Phase): Phase => {
    const currentIndex = phaseOrder.indexOf(current);
    return phaseOrder[(currentIndex + 1) % phaseOrder.length];
  };

  const saveCycle = useCallback((completed: boolean) => {
    if (startTimeRef.current) {
      saveCycleRecord({
        id: generateId(),
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

  // Background classes based on phase
  const bgClass = cn(
    "min-h-screen transition-all duration-1000 ease-in-out",
    currentPhase === 'immersion' && "bg-immersion",
    currentPhase === 'dive' && "bg-dive",
    currentPhase === 'breath' && "bg-breath"
  );

  // Dynamic background darkness for immersion
  const overlayOpacity = currentPhase === 'immersion' ? progress * 0.4 : 0;

  return (
    <div className={bgClass}>
      {/* Darkness overlay for immersion phase */}
      <div 
        className="fixed inset-0 bg-black pointer-events-none transition-opacity duration-500"
        style={{ opacity: overlayOpacity }}
      />

      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        {/* Settings button */}
        <Link
          to="/settings"
          className="absolute top-6 right-6 w-12 h-12 rounded-full glass-button flex items-center justify-center"
          aria-label="Configurações"
        >
          <Settings className="w-5 h-5 text-foreground" />
        </Link>

        {/* Cycle counter */}
        <div className="absolute top-6 left-6 glass px-4 py-2 rounded-full">
          <span className="text-sm text-muted-foreground">Ciclo </span>
          <span className="text-foreground font-semibold">{cycleCount}</span>
        </div>

        {/* Phase indicator */}
        <div className="mb-8 animate-slide-up">
          <span className="text-lg font-medium text-foreground/80 tracking-wide uppercase">
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
            <div className="text-center text-foreground/60 py-4">
              <span className="text-2xl">🌊</span>
              <p className="mt-2">Momento de descanso</p>
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
