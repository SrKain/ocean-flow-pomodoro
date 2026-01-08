import { useState, useEffect, useCallback, useRef } from "react";
import { Settings, BarChart3, LogOut, CheckCircle, Calendar, Minimize2 } from "lucide-react";
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
import { useWakeLock } from "@/hooks/useWakeLock";
import { useAuth } from "@/hooks/useAuth";
import { useSpotify } from "@/hooks/useSpotify";
import { useSessionSync } from "@/hooks/useSessionSync";
import { useLandscapeMode } from "@/hooks/useLandscapeMode";

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
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [diveTags, setDiveTags] = useState<Tag[]>([]);
  const [breathTags, setBreathTags] = useState<BreathTag[]>([]);
  const [diveNotes, setDiveNotes] = useState('');
  const [lastBreathCycleId, setLastBreathCycleId] = useState<string | null>(null);
  
  const startTimeRef = useRef<string | null>(null);
  const pendingPhaseRef = useRef<Phase | null>(null);
  
  const { signOut } = useAuth();
  const { currentTrack } = useSpotify();
  const navigate = useNavigate();
  const { isLandscape } = useLandscapeMode();
  
  // Check if Document PIP is supported, fallback to regular PIP
  const documentPipSupported = useDocumentPipSupport();

  // Keep screen on while timer is running
  useWakeLock(session?.is_running || false);

  // Derived state from session
  const currentPhase = (session?.current_phase as Phase) || 'immersion';
  const timeLeft = session?.time_left || 0;
  const totalTime = session?.total_time || (settings?.immersionMinutes || 25) * 60;
  const isRunning = session?.is_running || false;
  const cycleCount = session?.cycle_count || 0;
  const isOvertime = session?.is_overtime || false;
  const extraTime = session?.extra_time_seconds || 0;

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
    
    setShowOverfocusPopup(true);
  }, [updateSession]);

  const handleOverfocusDecision = useCallback(async (includeExtraTime: boolean) => {
    setShowOverfocusPopup(false);
    
    updateSession({
      is_running: false,
      is_overtime: false,
    });
    
    const cycleId = await saveCycle(true);
    
    if (currentPhase === 'breath' && cycleId) {
      setLastBreathCycleId(cycleId);
      setShowRatingPopup(true);
    }
    
    const next = getNextPhase(currentPhase);
    pendingPhaseRef.current = next;
    setShowPopup(true);
  }, [currentPhase, saveCycle, updateSession]);

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

  const displayMinutes = isOvertime 
    ? Math.floor(extraTime / 60) 
    : Math.floor(timeLeft / 60);
  const displaySeconds = isOvertime 
    ? extraTime % 60 
    : timeLeft % 60;
  const progress = isOvertime ? 1 : 1 - (timeLeft / totalTime);

  // Calculate background style based on phase and progress
  // Mergulho: azul quase preto → laranja (respiração)
  // Respiração: laranja → azul claro (imersão)
  // Imersão: azul claro → azul quase preto (mergulho)
  const getBackgroundStyle = () => {
    if (currentPhase === 'dive') {
      // Start: azul quase preto (hsl 215, 50%, 5%)
      // End: laranja (hsl 25, 80%, 50%)
      const startHue = 215;
      const endHue = 25;
      const startSat = 50;
      const endSat = 80;
      const startLight = 5;
      const endLight = 50;
      
      // Interpolate hue (going through 0/360)
      const hue = startHue + progress * ((endHue + 360 - startHue) % 360 > 180 
        ? endHue - startHue 
        : (endHue + 360 - startHue));
      const normalizedHue = hue > 360 ? hue - 360 : (hue < 0 ? hue + 360 : hue);
      const sat = startSat + progress * (endSat - startSat);
      const light = startLight + progress * (endLight - startLight);
      
      return {
        background: `linear-gradient(180deg, hsl(${normalizedHue}, ${sat}%, ${light}%) 0%, hsl(${normalizedHue}, ${sat * 0.9}%, ${light * 0.8}%) 100%)`
      };
    }
    
    if (currentPhase === 'breath') {
      // Start: laranja (hsl 25, 80%, 50%)
      // End: azul claro (hsl 195, 85%, 60%)
      const startHue = 25;
      const endHue = 195;
      const startSat = 80;
      const endSat = 85;
      const startLight = 50;
      const endLight = 60;
      
      const hue = startHue + progress * (endHue - startHue);
      const sat = startSat + progress * (endSat - startSat);
      const light = startLight + progress * (endLight - startLight);
      
      return {
        background: `linear-gradient(180deg, hsl(${hue}, ${sat}%, ${light}%) 0%, hsl(${hue}, ${sat * 0.9}%, ${light * 0.85}%) 100%)`
      };
    }
    
    if (currentPhase === 'immersion') {
      // Start: azul claro (hsl 195, 85%, 60%)
      // End: azul quase preto (hsl 215, 50%, 5%)
      const startHue = 195;
      const endHue = 215;
      const startSat = 85;
      const endSat = 50;
      const startLight = 60;
      const endLight = 5;
      
      const hue = startHue + progress * (endHue - startHue);
      const sat = startSat + progress * (endSat - startSat);
      const light = startLight + progress * (endLight - startLight);
      
      return {
        background: `linear-gradient(180deg, hsl(${hue}, ${sat}%, ${light}%) 0%, hsl(${hue}, ${sat * 0.9}%, ${light * 0.8}%) 100%)`
      };
    }
    
    return {};
  };

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
        className="min-h-screen transition-all duration-1000 ease-in-out"
        style={getBackgroundStyle()}
      >
        <div className="relative min-h-screen flex items-center justify-between px-6 py-4 z-10">
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
            </div>

            {/* Timer with Polar Ring */}
            <div className="relative flex items-center justify-center mb-4">
              <PolarRing 
                progress={progress} 
                size={200}
                strokeWidth={6}
                color={isOvertime ? 'hsl(45, 100%, 55%)' : phaseColors[currentPhase]}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <TimerDisplay 
                  minutes={displayMinutes} 
                  seconds={displaySeconds}
                  phase={currentPhase}
                  onTimeChange={!isRunning && !isOvertime ? handleTimeChange : undefined}
                  editable={!isRunning && !isOvertime}
                  compact
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-2">
              <ControlButtons
                isRunning={isRunning}
                onPlayPause={handlePlayPause}
                onSkip={handleSkip}
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
            <div className="w-full animate-slide-up">
              {currentPhase === 'immersion' && (
                <TagSelector
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  compact
                />
              )}
              {currentPhase === 'dive' && (
                <DiveTagSelector
                  selectedTags={diveTags}
                  onTagsChange={setDiveTags}
                  notes={diveNotes}
                  onNotesChange={setDiveNotes}
                  compact
                />
              )}
              {currentPhase === 'breath' && (
                <div className="space-y-2">
                  <div className="text-center">
                    <span className="text-2xl">🌊</span>
                    <p className="text-sm text-foreground/80 font-medium">Descanso</p>
                  </div>
                  <BreathTagSelector
                    selectedTags={breathTags}
                    onTagsChange={setBreathTags}
                    compact
                  />
                </div>
              )}
            </div>

            {/* Missions widget */}
            <MissionsWidget onClick={() => setShowMissionsPopup(true)} compact />
          </div>

          {/* Top right buttons */}
          <div className="absolute top-3 right-4 flex gap-2">
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
      className="min-h-screen transition-all duration-1000 ease-in-out"
      style={getBackgroundStyle()}
    >
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 z-10">
        {/* Top bar buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={() => setShowPip(true)}
            className="w-12 h-12 rounded-full glass-button flex items-center justify-center"
            aria-label="Picture in Picture"
          >
            <Minimize2 className="w-5 h-5 text-foreground" />
          </button>
          <Link
            to="/summary"
            className="w-12 h-12 rounded-full glass-button flex items-center justify-center"
            aria-label="Resumo do Dia"
          >
            <Calendar className="w-5 h-5 text-foreground" />
          </Link>
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
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-full glass-button flex items-center justify-center"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Left side - Cycle counter and Missions widget */}
        <div className="absolute top-6 left-6 flex flex-col gap-3">
          <div className="glass px-4 py-2 rounded-full">
            <span className="text-sm text-muted-foreground">Ciclo </span>
            <span className="text-foreground font-semibold">{cycleCount}</span>
          </div>
          <MissionsWidget onClick={() => setShowMissionsPopup(true)} />
        </div>

        {/* Now Playing - Above timer */}
        <div className="mb-4">
          <NowPlaying />
        </div>

        {/* Phase indicator */}
        <div className="mb-4 animate-slide-up">
          <span className={cn(
            "text-lg font-medium tracking-wide uppercase",
            isOvertime ? 'text-yellow-400' : (currentPhase === 'breath' ? 'text-foreground/90' : 'text-foreground/80')
          )}>
            {isOvertime ? '🔥 Overfocus' : phaseNames[currentPhase]}
          </span>
        </div>

        {/* Timer with Polar Ring */}
        <div className="relative flex items-center justify-center mb-8">
          <PolarRing 
            progress={progress} 
            size={300}
            strokeWidth={8}
            color={isOvertime ? 'hsl(45, 100%, 55%)' : phaseColors[currentPhase]}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <TimerDisplay 
              minutes={displayMinutes} 
              seconds={displaySeconds}
              phase={currentPhase}
              onTimeChange={!isRunning && !isOvertime ? handleTimeChange : undefined}
              editable={!isRunning && !isOvertime}
            />
          </div>
        </div>

        {/* Phase-specific inputs */}
        <div className="w-full max-w-sm mb-8 animate-slide-up">
          {currentPhase === 'immersion' && (
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />
          )}
          {currentPhase === 'dive' && (
            <DiveTagSelector
              selectedTags={diveTags}
              onTagsChange={setDiveTags}
              notes={diveNotes}
              onNotesChange={setDiveNotes}
            />
          )}
          {currentPhase === 'breath' && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-3xl">🌊</span>
                <p className="mt-2 text-foreground/80 font-medium">Momento de descanso</p>
              </div>
              <BreathTagSelector
                selectedTags={breathTags}
                onTagsChange={setBreathTags}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <ControlButtons
            isRunning={isRunning}
            onPlayPause={handlePlayPause}
            onSkip={handleSkip}
          />
          
          {/* Complete Cycle Button */}
          {isRunning && !isOvertime && (
            <button
              onClick={handleCompleteCycle}
              className="flex items-center gap-2 px-6 py-3 rounded-xl glass-button text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Concluir fase
            </button>
          )}
        </div>

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
    </div>
  );
}
