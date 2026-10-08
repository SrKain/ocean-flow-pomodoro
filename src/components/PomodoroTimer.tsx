import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Settings, BarChart3, LogOut, CheckCircle, Calendar, Minimize2, Menu, ClipboardList } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Phase, saveCycleRecordAsync, updateCycleRatingAsync } from "@/lib/database";
import { PolarRing } from "./PolarRing";
import { TimerDisplay } from "./TimerDisplay";
import { ControlButtons } from "./ControlButtons";
import { TagSelector, Tag } from "./TagSelector";
import { DiveTagSelector } from "./DiveTagSelector";
import { BreathTagSelector, BreathTag } from "./BreathTagSelector";
import { PhasePopup } from "./PhasePopup";
import { RatingPopup } from "./RatingPopup";
import { NowPlaying } from "./NowPlaying";
import { MissionsPopup } from "./MissionsPopup";
import { MissionsWidget } from "./MissionsWidget";
import { DocumentPictureInPicture, useDocumentPipSupport } from "./DocumentPictureInPicture";
import { PictureInPicture } from "./PictureInPicture";
import { OverfocusPopup } from "./OverfocusPopup";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useAuth } from "@/hooks/useAuth";
import { useSpotify } from "@/hooks/useSpotify";
import { useSessionSync } from "@/hooks/useSessionSync";
import { useLandscapeMode } from "@/hooks/useLandscapeMode";
import { useNotifications } from "@/hooks/useNotifications";
import { getOvertimeSeconds, getRemainingSeconds, TimerClock } from "@/lib/timerEngine";

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
  const { session, settings, loading, updateSession } = useSessionSync();
  const [showPopup, setShowPopup] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [showMissionsPopup, setShowMissionsPopup] = useState(false);
  const [showPip, setShowPip] = useState(false);
  const [showOverfocusPopup, setShowOverfocusPopup] = useState(false);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [transitionCountdown, setTransitionCountdown] = useState<number | null>(null);
  const [pendingPhase, setPendingPhase] = useState<Phase | null>(null);
  const [showNavigation, setShowNavigation] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [diveTags, setDiveTags] = useState<Tag[]>([]);
  const [breathTags, setBreathTags] = useState<BreathTag[]>([]);
  const [diveNotes, setDiveNotes] = useState('');
  const [lastBreathCycleId, setLastBreathCycleId] = useState<string | null>(null);
  const [glowPhase, setGlowPhase] = useState(0); // For pulsing glow animation
  const [liveTimeLeft, setLiveTimeLeft] = useState<number>(0);
  const [liveExtraTime, setLiveExtraTime] = useState<number>(0);

  const startTimeRef = useRef<string | null>(null);
  const pendingPhaseRef = useRef<Phase | null>(null);
  const completionHandledRef = useRef(false);
  
  const { signOut } = useAuth();
  const { currentTrack } = useSpotify();
  const navigate = useNavigate();
  const { isLandscape } = useLandscapeMode();
  const { notifyPhaseComplete, notifyOverfocus, notifyCycleComplete, requestPermission } = useNotifications();
  
  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);
  
  // Check if Document PIP is supported, fallback to regular PIP
  const documentPipSupported = useDocumentPipSupport();

  // Keep screen on while timer is running
  useWakeLock(session?.is_running || false);

  // Derived state from session
  const currentPhase = (session?.current_phase as Phase) || 'immersion';
  const totalTime = session?.total_time || (settings?.immersionMinutes || 25) * 60;
  const isRunning = session?.is_running || false;
  const cycleCount = session?.cycle_count || 0;
  const isOvertime = session?.is_overtime || false;
  const extraTime = isOvertime ? liveExtraTime : (session?.extra_time_seconds || 0);
  const timeLeft = isRunning && !isOvertime ? liveTimeLeft : (session?.time_left ?? liveTimeLeft ?? 0);
  const timerClock = useMemo<TimerClock>(() => ({
    duration: totalTime,
    startedAt: session?.started_at ? new Date(session.started_at).getTime() : null,
    endAt: session?.end_at ? new Date(session.end_at).getTime() : null,
    pausedAt: session?.paused_at ? new Date(session.paused_at).getTime() : null,
    remainingWhenPaused: session?.remaining_when_paused ?? session?.time_left ?? totalTime,
    status: session?.timer_status ?? (isOvertime ? 'overtime' : isRunning ? 'running' : 'idle'),
    overtimeStartedAt: session?.overtime_started_at ? new Date(session.overtime_started_at).getTime() : null,
  }), [isOvertime, isRunning, session?.end_at, session?.overtime_started_at, session?.paused_at, session?.remaining_when_paused, session?.started_at, session?.time_left, session?.timer_status, totalTime]);

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

  const saveCycle = useCallback(async (completed: boolean, endTime?: string): Promise<string | null> => {
    if (startTimeRef.current) {
      const immersionTagNames = selectedTags.map(t => t.name).join(', ');
      const diveTagNames = diveTags.map(t => t.name).join(', ');
      const breathTagNames = breathTags.map(t => t.name).join(', ');
      
      let tagValue: string | undefined;
      let actionsValue: string | undefined;
      
      if (currentPhase === 'immersion') {
        tagValue = immersionTagNames;
      } else if (currentPhase === 'dive') {
        tagValue = diveTagNames;
        actionsValue = diveNotes;
      } else if (currentPhase === 'breath') {
        tagValue = breathTagNames;
      }

      const spotifyTrackName = currentTrack?.name;
      const spotifyArtist = currentTrack?.artist;
      const spotifyAlbum = currentTrack?.album;
      
      const cycleId = await saveCycleRecordAsync({
        phase: currentPhase,
        startTime: startTimeRef.current,
        endTime: endTime ?? new Date().toISOString(),
        tag: tagValue,
        actions: actionsValue,
        completed,
        spotifyTrackName,
        spotifyArtist,
        spotifyAlbum,
      });
      
      return cycleId;
    }
    return null;
  }, [currentPhase, selectedTags, diveTags, breathTags, diveNotes, currentTrack]);

  const startPhase = useCallback((phase: Phase) => {
    const time = getPhaseTime(phase);
    const now = Date.now();
    startTimeRef.current = new Date(now).toISOString();
    completionHandledRef.current = false;
    setLiveExtraTime(0);
    
    updateSession({
      current_phase: phase,
      time_left: time,
      total_time: time,
      is_running: true,
      started_at: startTimeRef.current,
      end_at: new Date(now + time * 1000).toISOString(),
      paused_at: null,
      remaining_when_paused: time,
      overtime_started_at: null,
      timer_status: 'running',
      is_overtime: false,
      extra_time_seconds: 0,
      cycle_count: phase === 'immersion' ? cycleCount + 1 : cycleCount,
    });
    
    setShowPopup(false);
  }, [getPhaseTime, updateSession, cycleCount]);

  const queueNextPhase = useCallback((phase: Phase) => {
    pendingPhaseRef.current = phase;
    setPendingPhase(phase);
    if (settings?.autoAdvance) {
      setShowPopup(false);
      setTransitionCountdown(3);
    } else {
      setShowPopup(true);
    }
  }, [settings?.autoAdvance]);

  const handlePhaseComplete = useCallback(async () => {
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;
    setLiveTimeLeft(0);
    const deadline = session?.end_at
      ? new Date(session.end_at)
      : new Date((session?.started_at ? new Date(session.started_at).getTime() : Date.now()) + (session?.time_left ?? totalTime) * 1000);

    if (currentPhase === 'dive') {
      setLiveExtraTime(0);
      updateSession({
        time_left: 0,
        end_at: null,
        is_overtime: true,
        is_running: true,
        started_at: null,
        paused_at: null,
        remaining_when_paused: 0,
        overtime_started_at: deadline.toISOString(),
        timer_status: 'overtime',
        extra_time_seconds: 0,
      });
      notifyOverfocus();
      setShowOverfocusPopup(true);
      return;
    }

    updateSession({
      time_left: 0,
      end_at: null,
      is_running: false,
      started_at: null,
      paused_at: null,
      remaining_when_paused: 0,
      overtime_started_at: null,
      timer_status: 'completed',
    });
    const cycleId = await saveCycle(true, deadline.toISOString());
    if (currentPhase === 'breath' && cycleId) {
      setLastBreathCycleId(cycleId);
      setShowRatingPopup(true);
      notifyCycleComplete(cycleCount);
    }
    const next = getNextPhase(currentPhase);
    notifyPhaseComplete(currentPhase, next);
    queueNextPhase(next);
  }, [currentPhase, cycleCount, notifyCycleComplete, notifyOverfocus, notifyPhaseComplete, queueNextPhase, saveCycle, session?.end_at, session?.started_at, session?.time_left, totalTime, updateSession]);

  const handleOverfocusDecision = useCallback(async (includeExtraTime: boolean) => {
    setShowOverfocusPopup(false);
    const regularEnd = session?.overtime_started_at ?? new Date().toISOString();
    const recordEnd = includeExtraTime ? new Date().toISOString() : regularEnd;
    
    updateSession({
      is_running: false,
      is_overtime: false,
      end_at: null,
      started_at: null,
      paused_at: null,
      remaining_when_paused: 0,
      overtime_started_at: null,
      timer_status: 'completed',
    });
    
    const cycleId = await saveCycle(true, recordEnd);
    
    if (currentPhase === 'breath' && cycleId) {
      setLastBreathCycleId(cycleId);
      setShowRatingPopup(true);
      notifyCycleComplete(cycleCount);
    }
    
    const next = getNextPhase(currentPhase);
    notifyPhaseComplete(currentPhase, next);
    queueNextPhase(next);
  }, [currentPhase, saveCycle, session?.overtime_started_at, updateSession, notifyPhaseComplete, notifyCycleComplete, cycleCount, queueNextPhase]);

  const handleSkip = useCallback(async () => {
    completionHandledRef.current = true;
    updateSession({
      is_running: false,
      is_overtime: false,
      end_at: null,
      started_at: null,
      paused_at: null,
      overtime_started_at: null,
      timer_status: 'completed',
    });
    await saveCycle(false);
    
    const next = getNextPhase(currentPhase);
    queueNextPhase(next);
  }, [currentPhase, saveCycle, updateSession, queueNextPhase]);

  const handleCompleteCycle = useCallback(async () => {
    completionHandledRef.current = true;
    updateSession({
      is_running: false,
      is_overtime: false,
      end_at: null,
      started_at: null,
      paused_at: null,
      overtime_started_at: null,
      timer_status: 'completed',
    });
    const cycleId = await saveCycle(true);
    
    if (currentPhase === 'breath' && cycleId) {
      setLastBreathCycleId(cycleId);
      setShowRatingPopup(true);
    }
    
    const next = getNextPhase(currentPhase);
    queueNextPhase(next);
  }, [currentPhase, saveCycle, updateSession, queueNextPhase]);

  const handlePlayPause = useCallback(() => {
    const now = Date.now();
    const remainingNow = Math.max(0, isRunning ? getRemainingSeconds(timerClock, now) : liveTimeLeft || session?.time_left || getPhaseTime(currentPhase));

    if (isRunning) {
      setLiveTimeLeft(remainingNow);
      updateSession({
        is_running: false,
        started_at: session?.started_at ?? new Date(now).toISOString(),
        end_at: null,
        paused_at: new Date(now).toISOString(),
        remaining_when_paused: remainingNow,
        timer_status: 'paused',
        time_left: remainingNow,
        total_time: totalTime || remainingNow,
      });
      return;
    }

    const nextStartedAt = new Date(now).toISOString();
    if (!startTimeRef.current) startTimeRef.current = nextStartedAt;
    completionHandledRef.current = false;
    setLiveTimeLeft(remainingNow);
    updateSession({
      is_running: true,
      started_at: nextStartedAt,
      end_at: new Date(now + remainingNow * 1000).toISOString(),
      paused_at: null,
      remaining_when_paused: remainingNow,
      timer_status: 'running',
      time_left: remainingNow,
      total_time: totalTime || remainingNow,
    });
  }, [currentPhase, getPhaseTime, isRunning, liveTimeLeft, session?.started_at, session?.time_left, timerClock, totalTime, updateSession]);

  const handleContinue = () => {
    setTransitionCountdown(null);
    if (pendingPhaseRef.current) {
      startPhase(pendingPhaseRef.current);
      pendingPhaseRef.current = null;
      setPendingPhase(null);
    }
  };

  const handleWait = () => {
    setTransitionCountdown(null);
    setShowPopup(false);
    updateSession({ timer_status: 'transition' });
  };

  const confirmSkip = async () => {
    setShowSkipConfirmation(false);
    await handleSkip();
  };

  const handleRatingSubmit = async (rating: number) => {
    if (lastBreathCycleId) {
      await updateCycleRatingAsync(lastBreathCycleId, rating);
      setLastBreathCycleId(null);
    }
    setShowRatingPopup(false);
  };

  const handleRatingSkip = () => {
    setLastBreathCycleId(null);
    setShowRatingPopup(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleReset = useCallback(() => {
    const phaseDuration = getPhaseTime(currentPhase);
    completionHandledRef.current = false;
    setLiveExtraTime(0);
    setLiveTimeLeft(phaseDuration);
    updateSession({
      time_left: phaseDuration,
      total_time: phaseDuration,
      started_at: null,
      end_at: null,
      paused_at: null,
      remaining_when_paused: phaseDuration,
      overtime_started_at: null,
      timer_status: 'idle',
      is_running: false,
      is_overtime: false,
      extra_time_seconds: 0,
    });
  }, [currentPhase, getPhaseTime, updateSession]);

  const handleTimeChange = useCallback((newTimeSeconds: number) => {
    completionHandledRef.current = false;
    setLiveTimeLeft(newTimeSeconds);
    updateSession({
      time_left: newTimeSeconds,
      total_time: newTimeSeconds,
      started_at: null,
      end_at: null,
      paused_at: null,
      remaining_when_paused: newTimeSeconds,
      overtime_started_at: null,
      timer_status: 'idle',
      is_running: false,
      is_overtime: false,
    });
  }, [updateSession]);

  useEffect(() => {
    if (!session) return;
    if (session.started_at && !startTimeRef.current) startTimeRef.current = session.started_at;
    if (session.is_overtime && session.overtime_started_at) {
      setLiveExtraTime(getOvertimeSeconds({ ...timerClock, status: 'overtime' }));
    } else if (!session.is_running) {
      setLiveTimeLeft(session.remaining_when_paused ?? session.time_left ?? 0);
    }
  }, [session, timerClock]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning || isOvertime || (!session?.end_at && !session?.started_at)) return;

    const tick = () => {
      const endAt = session.end_at
        ? new Date(session.end_at).getTime()
        : new Date(session.started_at!).getTime() + (session.time_left ?? totalTime) * 1000;
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setLiveTimeLeft(next);

      if (next <= 0) {
        handlePhaseComplete();
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRunning, isOvertime, session?.end_at, session?.started_at, session?.time_left, totalTime, handlePhaseComplete]);

  useEffect(() => {
    if (!isOvertime || !session?.overtime_started_at) return;

    const tick = () => {
      setLiveExtraTime(getOvertimeSeconds({ ...timerClock, status: 'overtime' }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOvertime, session?.overtime_started_at, timerClock]);

  useEffect(() => {
    if (transitionCountdown === null) return;

    const timeout = setTimeout(() => {
      if (transitionCountdown <= 1) {
        const nextPhase = pendingPhaseRef.current;
        setTransitionCountdown(null);
        if (nextPhase) {
          pendingPhaseRef.current = null;
          startPhase(nextPhase);
        }
      } else {
        setTransitionCountdown((current) => current === null ? null : current - 1);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [transitionCountdown, startPhase]);

  const cancelAutoAdvance = () => {
    setTransitionCountdown(null);
    setShowPopup(true);
  };

  const startPendingPhase = () => {
    if (!pendingPhase) return;
    startPhase(pendingPhase);
    pendingPhaseRef.current = null;
    setPendingPhase(null);
  };

  // Pulsing glow animation
  useEffect(() => {
    if (!isRunning || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = setInterval(() => {
      setGlowPhase(prev => (prev + 0.05) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, [isRunning]);

  const displayMinutes = isOvertime 
    ? Math.floor(extraTime / 60) 
    : Math.floor(timeLeft / 60);
  const displaySeconds = isOvertime 
    ? extraTime % 60 
    : timeLeft % 60;
  const progress = isOvertime ? 1 : 1 - (timeLeft / totalTime);

  // Easing function for smoother color transitions
  const easeInOutCubic = (t: number): number => {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Calculate phase colors based on progress (with easing) - DARK MODE ONLY
  const getPhaseColors = () => {
    const easedProgress = easeInOutCubic(progress);
    
    if (currentPhase === 'dive') {
      // Start: azul escuro profundo (hsl 215, 50%, 8%)
      // End: laranja escuro/âmbar (hsl 25, 45%, 15%)
      const hue = 215 - easedProgress * 190; // 215 → 25
      const sat = 50 - easedProgress * 5; // 50% → 45%
      const light = 8 + easedProgress * 7; // 8% → 15%
      return { hue, sat, light };
    }
    
    if (currentPhase === 'breath') {
      // Start: laranja escuro/âmbar (hsl 25, 45%, 15%)
      // End: azul escuro ciano (hsl 200, 50%, 12%)
      const hue = 25 + easedProgress * 175; // 25 → 200
      const sat = 45 + easedProgress * 5; // 45% → 50%
      const light = 15 - easedProgress * 3; // 15% → 12%
      return { hue, sat, light };
    }
    
    if (currentPhase === 'immersion') {
      // Start: azul escuro ciano (hsl 200, 50%, 12%)
      // End: azul escuro profundo (hsl 215, 50%, 8%)
      const hue = 200 + easedProgress * 15; // 200 → 215
      const sat = 50; // mantém 50%
      const light = 12 - easedProgress * 4; // 12% → 8%
      return { hue, sat, light };
    }
    
    return { hue: 215, sat: 50, light: 8 };
  };

  // Get timer text color based on background (contrasting) - always light for dark mode
  const getTimerColor = () => {
    const { hue, sat } = getPhaseColors();
    // Always use light, bright text for dark backgrounds
    return `hsl(${hue}, ${Math.min(70, sat + 20)}%, 85%)`;
  };

  // Get ring color (brighter version of background)
  const getRingColor = () => {
    const { hue, sat } = getPhaseColors();
    // Ring is always bright and saturated for visibility
    return `hsl(${hue}, ${Math.min(90, sat + 10)}%, 60%)`;
  };

  // Calculate background style based on phase and progress with pulsing glow
  const getBackgroundStyle = () => {
    const { hue, sat, light } = getPhaseColors();
    const glowOpacity = isRunning ? 0.12 + Math.sin(glowPhase) * 0.06 : 0.08;
    const glowSize = isRunning ? 75 + Math.sin(glowPhase * 0.7) * 10 : 70;
    const glowLight = Math.min(75, light + 35);

    if (isOvertime) {
      return {
        background: 'radial-gradient(ellipse 70% 50% at 50% 35%, hsla(45, 90%, 55%, 0.14) 0%, transparent 70%), linear-gradient(180deg, hsl(38, 30%, 10%) 0%, hsl(220, 45%, 5%) 100%)',
      };
    }
    
    return {
      background: `
        radial-gradient(ellipse ${glowSize}% ${glowSize * 0.7}% at 50% 35%, hsla(${hue}, ${sat}%, ${glowLight}%, ${glowOpacity}) 0%, transparent 70%),
        linear-gradient(180deg, hsl(${hue}, ${sat}%, ${light}%) 0%, hsl(${hue}, ${sat * 0.9}%, ${Math.max(3, light * 0.8)}%) 100%)
      `
    };
  };

  const mobileNavigation = (
    <Sheet open={showNavigation} onOpenChange={setShowNavigation}>
      <SheetContent side="right" className="glass-popup w-[min(84vw,20rem)] border-white/10 pb-[max(env(safe-area-inset-bottom),1.5rem)] pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)] pt-[max(env(safe-area-inset-top),1.5rem)]">
        <SheetHeader>
          <SheetTitle>Ocean Flow</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2">
          <Link onClick={() => setShowNavigation(false)} to="/summary" className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-foreground hover:bg-white/5">
            <Calendar className="h-5 w-5" />Resumo
          </Link>
          <Link onClick={() => setShowNavigation(false)} to="/dashboard" className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-foreground hover:bg-white/5">
            <BarChart3 className="h-5 w-5" />Dashboard
          </Link>
          <Link onClick={() => setShowNavigation(false)} to="/settings" className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-foreground hover:bg-white/5">
            <Settings className="h-5 w-5" />Configurações
          </Link>
          <button onClick={() => { setShowNavigation(false); setShowMissionsPopup(true); }} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-foreground hover:bg-white/5">
            <ClipboardList className="h-5 w-5" />Missões
          </button>
          <button onClick={() => { setShowNavigation(false); setShowPip(true); }} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-foreground hover:bg-white/5">
            <Minimize2 className="h-5 w-5" />Picture-in-Picture
          </button>
          <button onClick={handleLogout} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-foreground hover:bg-white/5">
            <LogOut className="h-5 w-5" />Sair
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  // Landscape layout for mobile
  if (isLandscape) {
    return (
      <div 
        className="min-h-[100dvh] w-full transition-all duration-1000 ease-in-out"
        style={getBackgroundStyle()}
      >
        <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-between px-[max(env(safe-area-inset-left),1.5rem)] py-4 pr-[max(env(safe-area-inset-right),1.5rem)]">
          {/* Left side - Timer */}
          <div className="flex flex-col items-center justify-center flex-1">
            {/* Phase indicator */}
            <div className="mb-2 animate-slide-up">
              <span className={cn(
                "text-base font-medium tracking-wide uppercase",
                isOvertime ? 'text-yellow-400' : (currentPhase === 'breath' ? 'text-foreground/90' : 'text-foreground/80')
              )}>
                {isOvertime ? '🔥 Overfocus' : phaseNames[currentPhase]}
              </span>
              <p className="mt-1 text-xs text-foreground/60">
                {isOvertime ? 'Tempo extra' : isRunning ? 'Em foco' : pendingPhase ? 'Ciclo concluído' : session?.timer_status === 'paused' ? 'Pausado' : 'Pronto'}
              </p>
            </div>

            {/* Timer with Polar Ring */}
            <div className="relative flex items-center justify-center mb-4">
              <PolarRing 
                progress={progress} 
                size={200}
                strokeWidth={6}
                color={isOvertime ? 'hsl(45, 100%, 55%)' : getRingColor()}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <TimerDisplay 
                  minutes={displayMinutes} 
                  seconds={displaySeconds}
                  phase={currentPhase}
                  onTimeChange={!isRunning && !isOvertime ? handleTimeChange : undefined}
                  editable={!isRunning && !isOvertime}
                  compact
                  dynamicColor={isOvertime ? undefined : getTimerColor()}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-2">
              <ControlButtons
                isRunning={isRunning}
                onPlayPause={handlePlayPause}
                onSkip={() => setShowSkipConfirmation(true)}
                onReset={handleReset}
                compact
              />
              
              {isRunning && !isOvertime && (
                <button
                  onClick={handleCompleteCycle}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg glass-button text-xs font-medium text-foreground/80 hover:text-foreground transition-colors"
                >
                  <CheckCircle className="w-3 h-3" />
                  Concluir
                </button>
              )}
            </div>
            {pendingPhase && !showPopup && transitionCountdown === null && (
              <div className="glass mt-3 flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Próxima fase</p>
                  <p className="font-medium text-foreground">{phaseNames[pendingPhase]} · {Math.round(getPhaseTime(pendingPhase) / 60)} min</p>
                </div>
                <button onClick={startPendingPhase} className="min-h-11 rounded-xl bg-primary px-4 font-medium text-primary-foreground">Começar</button>
              </div>
            )}
          </div>

          {/* Right side - Info Panel */}
          <div className="flex flex-col items-center justify-center flex-1 gap-4 max-w-xs">
            {/* Cycle counter */}
            <div className="glass px-4 py-2 rounded-full">
              <span className="text-sm text-muted-foreground">Ciclo </span>
              <span className="text-foreground font-semibold">{cycleCount}</span>
            </div>

            {/* Now Playing */}
            <NowPlaying compact />

            {/* Phase-specific inputs */}
            {!isRunning && (
              <div className="w-full animate-slide-up">
                {currentPhase === 'immersion' && (
                  <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} compact />
                )}
                {currentPhase === 'dive' && (
                  <DiveTagSelector selectedTags={diveTags} onTagsChange={setDiveTags} notes={diveNotes} onNotesChange={setDiveNotes} compact />
                )}
                {currentPhase === 'breath' && (
                  <div className="space-y-2">
                    <div className="text-center">
                      <span className="text-2xl">🌊</span>
                      <p className="text-sm text-foreground/80 font-medium">Descanso</p>
                    </div>
                    <BreathTagSelector selectedTags={breathTags} onTagsChange={setBreathTags} compact />
                  </div>
                )}
              </div>
            )}

            {/* Missions widget */}
            {!isRunning && <MissionsWidget onClick={() => setShowMissionsPopup(true)} compact />}
          </div>

          {/* Top right buttons */}
          <button
            onClick={() => setShowNavigation(true)}
            className="absolute right-[max(env(safe-area-inset-right),1rem)] top-[max(env(safe-area-inset-top),0.75rem)] z-20 flex h-11 w-11 items-center justify-center rounded-full glass-button md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="absolute right-4 top-3 hidden gap-2 md:flex">
            <button
              onClick={() => setShowPip(true)}
              className="w-10 h-10 rounded-full glass-button flex items-center justify-center"
              aria-label="Picture in Picture"
            >
              <Minimize2 className="w-4 h-4 text-foreground" />
            </button>
            <Link
              to="/summary"
              className="w-10 h-10 rounded-full glass-button flex items-center justify-center"
              aria-label="Resumo do Dia"
            >
              <Calendar className="w-4 h-4 text-foreground" />
            </Link>
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-full glass-button flex items-center justify-center"
              aria-label="Dashboard"
            >
              <BarChart3 className="w-4 h-4 text-foreground" />
            </Link>
            <Link
              to="/settings"
              className="w-10 h-10 rounded-full glass-button flex items-center justify-center"
              aria-label="Configurações"
            >
              <Settings className="w-4 h-4 text-foreground" />
            </Link>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full glass-button flex items-center justify-center"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>
        {mobileNavigation}

        {/* Popups */}
        <PhasePopup
          isOpen={showPopup}
          nextPhase={pendingPhaseRef.current || getNextPhase(currentPhase)}
          onContinue={handleContinue}
          onWait={handleWait}
        />
        <RatingPopup
          isOpen={showRatingPopup}
          onSubmit={handleRatingSubmit}
          onSkip={handleRatingSkip}
        />
        <OverfocusPopup
          isOpen={showOverfocusPopup}
          extraTimeSeconds={extraTime}
          onInclude={() => handleOverfocusDecision(true)}
          onDiscard={() => handleOverfocusDecision(false)}
        />
        <Dialog open={showSkipConfirmation} onOpenChange={setShowSkipConfirmation}>
          <DialogContent className="glass-popup max-w-sm border-white/10 text-center">
            <DialogHeader>
              <DialogTitle className="text-foreground">Pular {phaseNames[currentPhase]}?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Esta fase será registrada como não concluída.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSkipConfirmation(false)} className="glass-button min-h-11 flex-1 text-foreground">Continuar</button>
              <button onClick={confirmSkip} className="min-h-11 flex-1 rounded-xl bg-destructive/20 text-destructive">Descartar fase</button>
            </div>
          </DialogContent>
        </Dialog>
        {transitionCountdown !== null && (
          <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/20 backdrop-blur-sm" role="status" aria-live="polite">
            <p className="text-sm font-medium uppercase tracking-widest text-foreground/80">Próxima fase</p>
            <span className="text-6xl font-light text-foreground" aria-label={`Começa em ${transitionCountdown} segundos`}>{transitionCountdown}</span>
            <button onClick={cancelAutoAdvance} className="glass-button min-h-11 px-5 text-sm text-foreground">Escolher depois</button>
          </div>
        )}
        <MissionsPopup
          isOpen={showMissionsPopup}
          onClose={() => setShowMissionsPopup(false)}
        />
        {documentPipSupported ? (
          <DocumentPictureInPicture
            isOpen={showPip}
            onClose={() => setShowPip(false)}
            timeLeft={timeLeft}
            totalTime={totalTime}
            currentPhase={currentPhase}
            isRunning={isRunning}
            isOvertime={isOvertime}
            extraTime={extraTime}
            onPlayPause={handlePlayPause}
            onSkip={handleSkip}
          />
        ) : (
          <PictureInPicture
            isOpen={showPip}
            onClose={() => setShowPip(false)}
            timeLeft={timeLeft}
            totalTime={totalTime}
            currentPhase={currentPhase}
            isRunning={isRunning}
            onPlayPause={handlePlayPause}
          />
        )}
      </div>
    );
  }

  // Portrait layout (original)
  return (
    <div
      className="focus-shell transition-all duration-1000 ease-in-out"
      style={getBackgroundStyle()}
    >
      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col pb-[max(env(safe-area-inset-bottom),1rem)] pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)] pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6">
        <header className="mb-2 flex w-full items-center justify-between gap-3">
          <div className="glass flex items-center gap-2 rounded-full border border-white/10 px-3 py-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-sky-100/80">
              Ocean Flow
            </span>
          </div>

          <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-900/20 p-1.5 backdrop-blur-xl md:flex">
            <Link
              to="/summary"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/5 hover:text-white"
              aria-label="Resumo do Dia"
              title="Resumo do Dia"
            >
              <Calendar className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/5 hover:text-white"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <BarChart3 className="h-4 w-4" />
            </Link>
            <Link
              to="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/5 hover:text-white"
              aria-label="Configurações"
              title="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setShowPip(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/5 hover:text-white"
              aria-label="Picture in Picture"
              title="Picture in Picture"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/5 hover:text-white"
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
          <button
            onClick={() => setShowNavigation(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full glass-button md:hidden"
            aria-label="Abrir menu"
            title="Abrir menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        </header>
        {mobileNavigation}

        <main className="flex flex-1 flex-col items-center justify-center pb-4 pt-2">
          <div className="mb-6 flex w-full max-w-xs items-center justify-between gap-3">
            <div className="glass rounded-full px-3 py-2 text-xs text-slate-200/80">
              ciclo <span className="ml-1 font-semibold text-white">{cycleCount}</span>
            </div>
            <div className="glass rounded-full px-3 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-sky-100/70">
              {isOvertime ? 'Overfocus' : phaseNames[currentPhase]}
            </div>
          </div>
          <p className="-mt-4 mb-4 text-center text-xs text-foreground/60">
            {isOvertime ? 'Tempo extra' : isRunning ? 'Em foco' : pendingPhase ? 'Ciclo concluído' : session?.timer_status === 'paused' ? 'Pausado' : 'Pronto'}
          </p>

          <div className="relative mb-5 flex items-center justify-center">
            <PolarRing
              progress={progress}
              size={typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.7, 320) : 280}
              strokeWidth={8}
              color={isOvertime ? 'hsl(45, 100%, 55%)' : getRingColor()}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <TimerDisplay
                minutes={displayMinutes}
                seconds={displaySeconds}
                phase={currentPhase}
                onTimeChange={!isRunning && !isOvertime ? handleTimeChange : undefined}
                editable={!isRunning && !isOvertime}
                dynamicColor={isOvertime ? undefined : getTimerColor()}
              />
            </div>
          </div>

          <div className="mb-5 w-full max-w-sm">
            <NowPlaying compact />
          </div>

          {!isRunning && (
            <div className="mb-7 w-full max-w-sm">
              {currentPhase === 'immersion' && <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />}
              {currentPhase === 'dive' && <DiveTagSelector selectedTags={diveTags} onTagsChange={setDiveTags} notes={diveNotes} onNotesChange={setDiveNotes} />}
              {currentPhase === 'breath' && (
                <div className="space-y-3">
                  <div className="text-center text-sm text-slate-200/75">Momento de descanso</div>
                  <BreathTagSelector selectedTags={breathTags} onTagsChange={setBreathTags} />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <ControlButtons
              isRunning={isRunning}
              onPlayPause={handlePlayPause}
              onSkip={() => setShowSkipConfirmation(true)}
              onReset={handleReset}
            />

            {isRunning && !isOvertime && (
              <button
                onClick={handleCompleteCycle}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/20 px-4 py-2 text-xs font-medium text-slate-200/80 backdrop-blur-xl transition hover:text-white"
              >
                <CheckCircle className="h-4 w-4" />
                Concluir fase
              </button>
            )}
          </div>
          {pendingPhase && !showPopup && transitionCountdown === null && (
            <div className="glass mt-4 flex w-full max-w-sm items-center justify-between gap-3 rounded-2xl px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Próxima fase</p>
                <p className="font-medium text-foreground">{phaseNames[pendingPhase]} · {Math.round(getPhaseTime(pendingPhase) / 60)} min</p>
              </div>
              <button onClick={startPendingPhase} className="min-h-11 rounded-xl bg-primary px-4 font-medium text-primary-foreground">Começar</button>
            </div>
          )}
        </main>

        {/* Phase Popup */}
        <PhasePopup
          isOpen={showPopup}
          nextPhase={pendingPhaseRef.current || getNextPhase(currentPhase)}
          onContinue={handleContinue}
          onWait={handleWait}
        />

        {/* Rating Popup */}
        <RatingPopup
          isOpen={showRatingPopup}
          onSubmit={handleRatingSubmit}
          onSkip={handleRatingSkip}
        />

        {/* Overfocus Popup */}
        <OverfocusPopup
          isOpen={showOverfocusPopup}
          extraTimeSeconds={extraTime}
          onInclude={() => handleOverfocusDecision(true)}
          onDiscard={() => handleOverfocusDecision(false)}
        />

        <Dialog open={showSkipConfirmation} onOpenChange={setShowSkipConfirmation}>
          <DialogContent className="glass-popup max-w-sm border-white/10 text-center">
            <DialogHeader>
              <DialogTitle className="text-foreground">Pular {phaseNames[currentPhase]}?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Esta fase será registrada como não concluída.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSkipConfirmation(false)} className="glass-button min-h-11 flex-1 text-foreground">Continuar</button>
              <button onClick={confirmSkip} className="min-h-11 flex-1 rounded-xl bg-destructive/20 text-destructive">Descartar fase</button>
            </div>
          </DialogContent>
        </Dialog>
        {transitionCountdown !== null && (
          <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/20 backdrop-blur-sm" role="status" aria-live="polite">
            <p className="text-sm font-medium uppercase tracking-widest text-foreground/80">{pendingPhase ? phaseNames[pendingPhase] : 'Próxima fase'}</p>
            <span className="text-6xl font-light text-foreground" aria-label={`Começa em ${transitionCountdown} segundos`}>{transitionCountdown}</span>
            <button onClick={cancelAutoAdvance} className="glass-button min-h-11 px-5 text-sm text-foreground">Escolher depois</button>
          </div>
        )}

        {/* Missions Popup */}
        <MissionsPopup
          isOpen={showMissionsPopup}
          onClose={() => setShowMissionsPopup(false)}
        />

        {/* Picture in Picture - Document PIP or fallback */}
        {documentPipSupported ? (
          <DocumentPictureInPicture
            isOpen={showPip}
            onClose={() => setShowPip(false)}
            timeLeft={timeLeft}
            totalTime={totalTime}
            currentPhase={currentPhase}
            isRunning={isRunning}
            isOvertime={isOvertime}
            extraTime={extraTime}
            onPlayPause={handlePlayPause}
            onSkip={handleSkip}
            currentTrack={currentTrack ? {
              name: currentTrack.name,
              artist: currentTrack.artist,
              albumArt: currentTrack.albumArt,
            } : null}
          />
        ) : (
          <PictureInPicture
            isOpen={showPip}
            onClose={() => setShowPip(false)}
            timeLeft={timeLeft}
            totalTime={totalTime}
            currentPhase={currentPhase}
            isRunning={isRunning}
            isOvertime={isOvertime}
            extraTime={extraTime}
            onPlayPause={handlePlayPause}
            currentTrack={currentTrack ? {
              name: currentTrack.name,
              artist: currentTrack.artist,
              albumArt: currentTrack.albumArt,
            } : null}
          />
        )}
      </div>
    </div>
  );
}
