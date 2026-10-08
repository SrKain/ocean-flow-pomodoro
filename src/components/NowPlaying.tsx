import { ExternalLink, Music, Pause, Play, X } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';
import { Button } from '@/components/ui/button';

interface NowPlayingProps {
  compact?: boolean;
}

const formatTime = (ms: number): string => {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export function NowPlaying({ compact = false }: NowPlayingProps) {
  const { isConnected, isLoading, currentTrack, connect, disconnect } = useSpotify();

  if (isLoading) return null;

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="flex w-full max-w-sm items-center justify-center gap-2 rounded-full border border-white/10 bg-slate-950/20 px-4 py-3 text-sm font-medium text-foreground/75 transition hover:text-foreground"
        aria-label="Conectar Spotify"
      >
        <Music className="h-4 w-4" />
        <span>Conectar Spotify</span>
      </button>
    );
  }

  if (!currentTrack) {
    return (
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
          <Music className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">Nada tocando</p>
          <p className="text-[11px] text-muted-foreground/80">Conecte sua conta Spotify</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Desconectar Spotify"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const progress = currentTrack.durationMs > 0
    ? (currentTrack.progressMs / currentTrack.durationMs) * 100
    : 0;

  return (
    <div className="w-full max-w-sm rounded-[22px] border border-white/10 bg-slate-950/20 px-3 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-lg shadow-slate-950/40">
          {currentTrack.albumArt ? (
            <img src={currentTrack.albumArt} alt={currentTrack.album} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5">
              <Music className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            {currentTrack.isPlaying ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white" />
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{currentTrack.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">{currentTrack.artist}</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-700 ease-linear"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{formatTime(currentTrack.progressMs)}</span>
            <span>{formatTime(currentTrack.durationMs)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open('https://open.spotify.com', '_blank', 'noopener,noreferrer')}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Abrir Spotify"
            title="Abrir Spotify"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={disconnect}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Desconectar Spotify"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}