import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { CheckCircle, SlidersHorizontal, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Phase, saveCycleRecordAsync, updateCycleRatingAsync } from "@/lib/database";
import { PolarRing } from "./PolarRing";
import { TimerDisplay } from "./TimerDisplay";
import { ControlButtons } from "./ControlButtons";
import { Tag } from "./TagSelector";
import { BreathTag } from "./BreathTagSelector";
import { TimerHeader } from "./timer/TimerHeader";
import { PrimaryNavigation } from "./layout/PrimaryNavigation";
import { FocusContextPanel } from "./timer/FocusContextPanel";
import { TimerModals } from "./timer/TimerModals";
import { useDocumentPipSupport } from "./DocumentPictureInPicture";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useAuth } from "@/hooks/useAuth";
import { useSpotify } from "@/hooks/useSpotify";
import { useSessionSync } from "@/hooks/useSessionSync";
import { useNotifications } from "@/hooks/useNotifications";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import {
  PHASE_ORDER as phaseOrder,
  PHASE_NAMES as phaseNames,
  getPhaseDynamicColors,
} from "@/lib/phaseTokens";

export function PomodoroTimer() {
  const { session, settings, loading, updateSession } = useSessionSync();
  const [showPopup, setShowPopup] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [showMissionsPopup, setShowMissionsPopup] = useState(false);
  const [showPip, setShowPip] = useState(false);
  const [showContextSheet, setShowContextSheet] = useState(false);

  // Persistência local de tags e notas da sessão
  const [selectedTags, setSelectedTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem('ocean_flow_immersion_tags');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [diveTags, setDiveTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem('ocean_flow_dive_tags');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [breathTags, setBreathTags] = useState<BreathTag[]>(() => {
    try {
      const saved = localStorage.getItem('ocean_flow_breath_tags');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [diveNotes, setDiveNotes] = useState<string>(() => {
    try {
      return localStorage.getItem('ocean_flow_dive_notes') || '';
    } catch {
      return '';
    }
  });

  const [lastBreathCycleId, setLastBreathCycleId] = useState<string | null>(null);
  const [glowPhase, setGlowPhase] = useState(0);

  const startTimeRef = useRef<string | null>(null);
  const pendingPhaseRef = useRef<Phase | null>(null);

  const { signOut } = useAuth();
  const { currentTrack } = useSpotify();
  const navigate = useNavigate();
  const { width, height, isLandscape, isShortLandscape, isCompact, isDesktop, isDesktopCompact, isBottomNav } = useBreakpoint();
  const { notifyPhaseComplete, notifyOverfocus, notifyCycleComplete, requestPermission } = useNotifications();

  // Sincronização contínua com localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ocean_flow_immersion_tags', JSON.stringify(selectedTags));
    } catch (e) {
      console.error('Error saving immersion tags:', e);
    }
  }, [selectedTags]);

  useEffect(() => {
    try {
      localStorage.setItem('ocean_flow_dive_tags', JSON.stringify(diveTags));
    } catch (e) {
      console.error('Error saving dive tags:', e);
    }
  }, [diveTags]);

  useEffect(() => {
    try {
      localStorage.setItem('ocean_flow_breath_tags', JSON.stringify(breathTags));
    } catch (e) {
      console.error('Error saving breath tags:', e);
    }
  }, [breathTags]);

  useEffect(() => {
    try {
      localStorage.setItem('ocean_flow_dive_notes', diveNotes);
    } catch (e) {
      console.error('Error saving dive notes:', e);
    }
  }, [diveNotes]);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Document PIP support check
  const documentPipSupported = useDocumentPipSupport();

  // Keep screen on while timer is running
  useWakeLock(session?.is_running || false);

  // Derived state from session
  const currentPhase = (session?.current_phase as Phase) || 'immersion';
  const timeLeft = session?.time_left || 0;
  const totalTime = session?.total_time || (settings?.immersionMinutes || 5) * 60;
  const isRunning = session?.is_running || false;
  const cycleCount = session?.cycle_count || 0;
  const isOvertime = session?.is_overtime || false;
  const extraTime = session?.extra_time_seconds || 0;

  const getPhaseTime = useCallback((phase: Phase) => {
    if (!settings) return 5 * 60;
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

  const saveCycle = useCallback(async (completed: boolean): Promise<string | null> => {
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
        endTime: new Date().toISOString(),
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
    startTimeRef.current = new Date().toISOString();

    updateSession({
      current_phase: phase,
      time_left: time,
      total_time: time,
      is_running: true,
      started_at: startTimeRef.current,
      is_overtime: false,
      extra_time_seconds: 0,
      cycle_count: phase === 'immersion' ? cycleCount + 1 : cycleCount,
    });

    setShowPopup(false);
  }, [getPhaseTime, updateSession, cycleCount]);

  const handlePhaseComplete = useCallback(async () => {
    updateSession({
      is_overtime: true,
      is_running: true,
      extra_time_seconds: 0,
    });

    notifyOverfocus();
  }, [updateSession, notifyOverfocus]);

  const handleOverfocusDecision = useCallback(async (_includeExtraTime: boolean) => {
    updateSession({
      is_running: false,
      is_overtime: false,
    });

    const cycleId = await saveCycle(true);

    if (currentPhase === 'breath' && cycleId) {
      setLastBreathCycleId(cycleId);
      setShowRatingPopup(true);
      notifyCycleComplete(cycleCount);
    }

    const next = getNextPhase(currentPhase);
    notifyPhaseComplete(currentPhase, next);
    pendingPhaseRef.current = next;
    setShowPopup(true);
  }, [currentPhase, saveCycle, updateSession, notifyPhaseComplete, notifyCycleComplete, cycleCount]);

  const handleSkip = useCallback(async () => {
    updateSession({ is_running: false, is_overtime: false });
    await saveCycle(false);

    const next = getNextPhase(currentPhase);
    pendingPhaseRef.current = next;
    setShowPopup(true);
  }, [currentPhase, saveCycle, updateSession]);

  const handleCompleteCycle = useCallback(async () => {
    updateSession({ is_running: false, is_overtime: false });
    const cycleId = await saveCycle(true);

    if (currentPhase === 'breath' && cycleId) {
      setLastBreathCycleId(cycleId);
      setShowRatingPopup(true);
    }

    const next = getNextPhase(currentPhase);
    pendingPhaseRef.current = next;
    setShowPopup(true);
  }, [currentPhase, saveCycle, updateSession]);

  const handlePlayPause = useCallback(() => {
    if (!isRunning && !startTimeRef.current) {
      startTimeRef.current = new Date().toISOString();
    }
    updateSession({
      is_running: !isRunning,
      started_at: !isRunning ? new Date().toISOString() : session?.started_at,
    });
  }, [isRunning, updateSession, session?.started_at]);

  const handleContinue = () => {
    if (pendingPhaseRef.current) {
      startPhase(pendingPhaseRef.current);
      pendingPhaseRef.current = null;
    }
  };

  const handleWait = () => {
    setShowPopup(false);
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
    updateSession({
      time_left: phaseDuration,
      total_time: phaseDuration,
      started_at: null,
      is_running: false,
      is_overtime: false,
      extra_time_seconds: 0,
    });
  }, [currentPhase, getPhaseTime, updateSession]);

  const handleTimeChange = useCallback((newTimeSeconds: number) => {
    updateSession({
      time_left: newTimeSeconds,
      total_time: newTimeSeconds,
    });
  }, [updateSession]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (isOvertime) {
        updateSession({ extra_time_seconds: extraTime + 1 });
      } else if (timeLeft <= 1) {
        handlePhaseComplete();
      } else {
        updateSession({ time_left: timeLeft - 1 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isOvertime, extraTime, handlePhaseComplete, updateSession]);

  // Pulsing glow animation
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowPhase(prev => (prev + 0.05) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const displayMinutes = isOvertime
    ? Math.floor(extraTime / 60)
    : Math.floor(timeLeft / 60);
  const displaySeconds = isOvertime
    ? extraTime % 60
    : timeLeft % 60;
  const progress = isOvertime ? 1 : 1 - (timeLeft / totalTime);

  // Dynamic colors
  const phaseColorsData = useMemo(() => {
    return getPhaseDynamicColors(currentPhase, progress);
  }, [currentPhase, progress]);

  const timerColor = useMemo(() => {
    const { hue, sat } = phaseColorsData;
    return `hsl(${hue}, ${Math.min(70, sat + 20)}%, 85%)`;
  }, [phaseColorsData]);

  const ringColor = useMemo(() => {
    const { hue, sat } = phaseColorsData;
    return `hsl(${hue}, ${Math.min(90, sat + 10)}%, 60%)`;
  }, [phaseColorsData]);

  const backgroundStyle = useMemo(() => {
    const { hue, sat, light } = phaseColorsData;
    const glowOpacity = 0.12 + Math.sin(glowPhase) * 0.06;
    const glowSize = 75 + Math.sin(glowPhase * 0.7) * 10;
    const glowLight = Math.min(75, light + 35);

    return {
      background: `
        radial-gradient(ellipse ${glowSize}% ${glowSize * 0.7}% at 50% 35%, hsla(${hue}, ${sat}%, ${glowLight}%, ${glowOpacity}) 0%, transparent 70%),
        linear-gradient(180deg, hsl(${hue}, ${sat}%, ${light}%) 0%, hsl(${hue}, ${sat * 0.9}%, ${Math.max(3, light * 0.8)}%) 100%)
      `
    };
  }, [phaseColorsData, glowPhase]);

  // Dimensionamento polar com clamp e dvh
  const ringSize = useMemo(() => {
    if (isShortLandscape) {
      return Math.max(160, Math.min(210, Math.round(height * 0.46)));
    }
    if (isCompact) {
      return Math.max(180, Math.min(230, Math.round(Math.min(width * 0.65, height * 0.32))));
    }
    if (isLandscape) {
      return Math.max(200, Math.min(320, Math.round(Math.min(height * 0.52, width * 0.32))));
    }
    if (isDesktop || isDesktopCompact) {
      return Math.max(240, Math.min(340, Math.round(Math.min(height * 0.44, 340))));
    }
    // Mobile portrait / tablet portrait:
    return Math.max(210, Math.min(290, Math.round(Math.min(width * 0.68, height * 0.36))));
  }, [width, height, isShortLandscape, isCompact, isLandscape, isDesktop, isDesktopCompact]);

  // Duas colunas em telas amplas (desktop >= 900px ou modo paisagem)
  const isTwoColumn = isLandscape || width >= 900;

  // Resumo de tag ativa para exibir no gatilho de contexto em telas compactas
  const activeTagSummary = useMemo(() => {
    if (currentPhase === 'immersion') {
      return selectedTags.length > 0 ? selectedTags.map(t => t.name).join(', ') : 'Adicionar tags';
    }
    if (currentPhase === 'dive') {
      return diveTags.length > 0 ? diveTags.map(t => t.name).join(', ') : 'Adicionar tags';
    }
    return breathTags.length > 0 ? breathTags.map(t => t.name).join(', ') : 'Momento de descanso';
  }, [currentPhase, selectedTags, diveTags, breathTags]);

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-sm font-medium">Carregando Ocean Flow...</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "focus-shell relative flex min-h-[100dvh] w-full flex-col justify-between overflow-hidden transition-all duration-1000 ease-in-out",
        isBottomNav ? 'pb-[calc(5rem+env(safe-area-inset-bottom))]' : 'pl-[76px]'
      )}
      style={backgroundStyle}
    >
      {/* Top Header Compartilhado */}
      <div className="relative z-20 w-full px-4 pt-3 sm:px-6">
        <TimerHeader
          onOpenPip={() => setShowPip(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Área Central: Unificada e Responsiva */}
      <main className="relative z-10 flex flex-1 w-full items-center justify-center px-4 py-2 sm:px-6">
        {isTwoColumn ? (
          /* Layout de Duas Colunas (Desktop / Paisagem) */
          <div className="grid w-full max-w-5xl grid-cols-2 items-center gap-8 py-2">
            {/* Coluna Esquerda: Anel Polar, Timer e Controles */}
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-slide-up">
                <span
                  className={cn(
                    "text-sm font-semibold tracking-wider uppercase px-4 py-1.5 rounded-full glass border border-white/10",
                    isOvertime
                      ? 'text-yellow-400 border-yellow-400/30'
                      : (currentPhase === 'breath' ? 'text-sky-200' : 'text-foreground/90')
                  )}
                >
                  {isOvertime ? '🔥 Overfocus' : phaseNames[currentPhase]}
                </span>
              </div>

              <div className="relative flex items-center justify-center">
                <PolarRing
                  progress={progress}
                  size={ringSize}
                  strokeWidth={isShortLandscape ? 6 : 8}
                  color={isOvertime ? 'hsl(45, 100%, 55%)' : ringColor}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <TimerDisplay
                    minutes={displayMinutes}
                    seconds={displaySeconds}
                    phase={currentPhase}
                    onTimeChange={!isRunning && !isOvertime ? handleTimeChange : undefined}
                    editable={!isRunning && !isOvertime}
                    compact={isShortLandscape || ringSize < 240}
                    dynamicColor={isOvertime ? undefined : timerColor}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-2.5">
                <ControlButtons
                  isRunning={isRunning}
                  onPlayPause={handlePlayPause}
                  onSkip={handleSkip}
                  onReset={handleReset}
                  compact={isShortLandscape}
                />

                {isRunning && (
                  <button
                    type="button"
                    onClick={() => isOvertime ? handleOverfocusDecision(true) : handleCompleteCycle()}
                    className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-slate-900/30 px-5 py-2 text-xs font-medium text-slate-200/90 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
                  >
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Concluir fase
                  </button>
                )}
              </div>
            </div>

            {/* Coluna Direita: Painel de Contexto (Tags, Spotify, Missões) */}
            <div className="flex flex-col items-center justify-center rounded-3xl glass border border-white/10 p-6 backdrop-blur-2xl">
              <FocusContextPanel
                currentPhase={currentPhase}
                cycleCount={cycleCount}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                diveTags={diveTags}
                onDiveTagsChange={setDiveTags}
                diveNotes={diveNotes}
                onDiveNotesChange={setDiveNotes}
                breathTags={breathTags}
                onBreathTagsChange={setBreathTags}
                onOpenMissions={() => setShowMissionsPopup(true)}
                compact={false}
              />
            </div>
          </div>
        ) : (
          /* Layout Compacto sem Scroll (Mobile / Retrato) */
          <div className="flex h-full w-full max-w-sm flex-col items-center justify-between py-2">
            {/* Indicador de Ciclo e Fase */}
            <div className="mb-2 flex w-full items-center justify-between gap-2">
              <div className="glass rounded-full px-3.5 py-1 text-xs text-slate-200/90 font-medium border border-white/10">
                Ciclo <span className="ml-1 font-semibold text-white">{cycleCount}</span>
              </div>
              <div
                className={cn(
                  "rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider glass border border-white/10",
                  isOvertime ? 'text-yellow-400 border-yellow-400/30' : 'text-sky-100/90'
                )}
              >
                {isOvertime ? '🔥 Overfocus' : phaseNames[currentPhase]}
              </div>
            </div>

            {/* Anel Polar com Timer Central */}
            <div className="relative my-auto flex items-center justify-center">
              <PolarRing
                progress={progress}
                size={ringSize}
                strokeWidth={7}
                color={isOvertime ? 'hsl(45, 100%, 55%)' : ringColor}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <TimerDisplay
                  minutes={displayMinutes}
                  seconds={displaySeconds}
                  phase={currentPhase}
                  onTimeChange={!isRunning && !isOvertime ? handleTimeChange : undefined}
                  editable={!isRunning && !isOvertime}
                  compact={ringSize < 240}
                  dynamicColor={isOvertime ? undefined : timerColor}
                />
              </div>
            </div>

            {/* Controles do Timer */}
            <div className="mt-2 flex flex-col items-center gap-2">
              <ControlButtons
                isRunning={isRunning}
                onPlayPause={handlePlayPause}
                onSkip={handleSkip}
                onReset={handleReset}
                compact={isCompact}
              />

              {isRunning && (
                <button
                  type="button"
                  onClick={() => isOvertime ? handleOverfocusDecision(true) : handleCompleteCycle()}
                  className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-slate-900/30 px-4 py-2 text-xs font-medium text-slate-200/90 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
                >
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Concluir fase
                </button>
              )}
            </div>

            {/* Gatilho Rápido para Sheet de Contexto (Tags, Spotify, Missões) */}
            <div className="mt-3 w-full">
              <button
                type="button"
                onClick={() => setShowContextSheet(true)}
                className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-2xl glass border border-white/15 px-4 py-2.5 text-xs font-medium text-slate-200/90 backdrop-blur-xl transition hover:bg-white/10 active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 truncate">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-sky-300 shrink-0" />
                  <span className="truncate text-slate-300">
                    <strong className="text-white font-semibold">Contexto:</strong> {activeTagSummary}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-sky-200">
                  <span className="text-[11px] font-semibold">Abrir</span>
                  <ChevronUp className="h-4 w-4" />
                </div>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sheet de Contexto para Telas Compactas / Mobile */}
      <Sheet open={showContextSheet} onOpenChange={setShowContextSheet}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-white/20 bg-slate-950/95 p-6 backdrop-blur-2xl"
        >
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="text-base font-semibold text-white flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-sky-400" />
              Contexto da Sessão de Foco
            </SheetTitle>
          </SheetHeader>
          <FocusContextPanel
            currentPhase={currentPhase}
            cycleCount={cycleCount}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            diveTags={diveTags}
            onDiveTagsChange={setDiveTags}
            diveNotes={diveNotes}
            onDiveNotesChange={setDiveNotes}
            breathTags={breathTags}
            onBreathTagsChange={setBreathTags}
            onOpenMissions={() => {
              setShowContextSheet(false);
              setShowMissionsPopup(true);
            }}
            compact={false}
          />
        </SheetContent>
      </Sheet>

      {/* Modais, Popups e PiP Centralizados */}
      <TimerModals
        showPopup={showPopup}
        nextPhase={pendingPhaseRef.current || getNextPhase(currentPhase)}
        onContinue={handleContinue}
        onWait={handleWait}
        showRatingPopup={showRatingPopup}
        onRatingSubmit={handleRatingSubmit}
        onRatingSkip={handleRatingSkip}
        extraTime={extraTime}
        showMissionsPopup={showMissionsPopup}
        onCloseMissions={() => setShowMissionsPopup(false)}
        showPip={showPip}
        onClosePip={() => setShowPip(false)}
        documentPipSupported={documentPipSupported}
        timeLeft={timeLeft}
        totalTime={totalTime}
        currentPhase={currentPhase}
        isRunning={isRunning}
        isOvertime={isOvertime}
        onPlayPause={handlePlayPause}
        onSkip={handleSkip}
        currentTrack={currentTrack ? {
          name: currentTrack.name,
          artist: currentTrack.artist,
          albumArt: currentTrack.albumArt,
        } : null}
      />
      <PrimaryNavigation />
    </div>
  );
}
