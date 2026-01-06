import { useState, useEffect, useCallback, useRef } from "react";
import { Settings, BarChart3, LogOut, CheckCircle, Calendar, Minimize2, Tags } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Phase, getSettingsAsync, saveCycleRecordAsync, PomodoroSettings, updateCycleRatingAsync } from "@/lib/database";
import { PolarRing } from "./PolarRing";
import { TimerDisplay } from "./TimerDisplay";
import { ControlButtons } from "./ControlButtons";
import { TagSelector, Tag } from "./TagSelector";
import { DiveTagSelector } from "./DiveTagSelector";
import { PhasePopup } from "./PhasePopup";
import { RatingPopup } from "./RatingPopup";
import { NowPlaying } from "./NowPlaying";
import { MissionsPopup } from "./MissionsPopup";
import { MissionsWidget } from "./MissionsWidget";
import { PictureInPicture } from "./PictureInPicture";
import { DocumentPictureInPicture, useDocumentPipSupport } from "./DocumentPictureInPicture";
import { OverfocusPopup } from "./OverfocusPopup";
import { TagManagement } from "./TagManagement";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useAuth } from "@/hooks/useAuth";
import { useSpotify } from "@/hooks/useSpotify";

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
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [showMissionsPopup, setShowMissionsPopup] = useState(false);
  const [showPip, setShowPip] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [diveTags, setDiveTags] = useState<Tag[]>([]);
  const [diveNotes, setDiveNotes] = useState('');
  const [cycleCount, setCycleCount] = useState(0);
  const [lastBreathCycleId, setLastBreathCycleId] = useState<string | null>(null);
  
  const startTimeRef = useRef<string | null>(null);
  const pendingPhaseRef = useRef<Phase | null>(null);
  
  const { signOut } = useAuth();
  const { currentTrack } = useSpotify();
  const navigate = useNavigate();

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

  const saveCycle = useCallback(async (completed: boolean): Promise<string | null> => {
    if (startTimeRef.current) {
      const immersionTagNames = selectedTags.map(t => t.name).join(', ');
      const diveTagNames = diveTags.map(t => t.name).join(', ');
      
      // For dive phase, combine tags and notes
      let tagValue: string | undefined;
      let actionsValue: string | undefined;
      
      if (currentPhase === 'immersion') {
        tagValue = immersionTagNames;
      } else if (currentPhase === 'dive') {
        tagValue = diveTagNames;
        actionsValue = diveNotes;
      }

      // Get current spotify track info
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
  }, [currentPhase, selectedTags, diveTags, diveNotes, currentTrack]);

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

  const handlePhaseComplete = useCallback(async () => {
    setIsRunning(false);
    const cycleId = await saveCycle(true);
    
    // If breath phase completed, show rating popup
    if (currentPhase === 'breath' && cycleId) {
      setLastBreathCycleId(cycleId);
      setShowRatingPopup(true);
    }
    
    const next = getNextPhase(currentPhase);
    pendingPhaseRef.current = next;
    setShowPopup(true);
  }, [currentPhase, saveCycle]);

  const handleSkip = useCallback(async () => {
    setIsRunning(false);
    await saveCycle(false);
    
    const next = getNextPhase(currentPhase);
    pendingPhaseRef.current = next;
    setShowPopup(true);
  }, [currentPhase, saveCycle]);

  // Complete cycle button - finishes current phase and shows popup
  const handleCompleteCycle = useCallback(async () => {
    setIsRunning(false);
    const cycleId = await saveCycle(true);
    
    // If breath phase completed, show rating popup
    if (currentPhase === 'breath' && cycleId) {
      setLastBreathCycleId(cycleId);
      setShowRatingPopup(true);
    }
    
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
      // Pure black for OLED, but lighten in the last 50%
      if (progress >= 0.5) {
        // Last 50%: gradually lighten from black to dark blue
        const lightenProgress = (progress - 0.5) / 0.5; // 0 to 1 in last half
        const lightness = lightenProgress * 15; // 0% to 15%
        return {
          background: `linear-gradient(180deg, hsl(210, 50%, ${lightness}%) 0%, hsl(215, 60%, ${lightness * 0.7}%) 100%)`
        };
      }
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
      let lightness;
      if (progress <= 0.5) {
        lightness = 35 + (progress * 2 * 30);
      } else {
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
            <div className="text-center py-4">
              <span className="text-3xl">🌊</span>
              <p className="mt-2 text-foreground/80 font-medium">Momento de descanso</p>
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
          {isRunning && (
            <button
              onClick={handleCompleteCycle}
              className="flex items-center gap-2 px-6 py-3 rounded-xl glass-button text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Concluir fase
            </button>
          )}
        </div>

        {/* Now Playing - Spotify */}
        <div className="mt-6">
          <NowPlaying />
        </div>

        {/* Phase Popup */}
        <PhasePopup
          isOpen={showPopup}
          nextPhase={pendingPhaseRef.current || getNextPhase(currentPhase)}
          onContinue={handleContinue}
          onWait={handleWait}
        />

        {/* Rating Popup - shows after completing breath phase */}
        <RatingPopup
          isOpen={showRatingPopup}
          onSubmit={handleRatingSubmit}
          onSkip={handleRatingSkip}
        />

        {/* Missions Popup */}
        <MissionsPopup
          isOpen={showMissionsPopup}
          onClose={() => setShowMissionsPopup(false)}
        />

        {/* Picture in Picture */}
        <PictureInPicture
          isOpen={showPip}
          onClose={() => setShowPip(false)}
          timeLeft={timeLeft}
          totalTime={totalTime}
          currentPhase={currentPhase}
          isRunning={isRunning}
          onPlayPause={handlePlayPause}
        />
      </div>
    </div>
  );
}
