import { Music, Pause, Play, X } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';
import { Button } from '@/components/ui/button';

interface NowPlayingProps {
  compact?: boolean;
}

export function NowPlaying({ compact = false }: NowPlayingProps) {
  const { isConnected, isLoading, currentTrack, connect, disconnect } = useSpotify();

  if (isLoading) return null;

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="flex items-center gap-2 px-4 py-2 rounded-full glass-button text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
      >
        <Music className="w-4 h-4" />
        <span>Conectar Spotify</span>
      </button>
    );
  }

  if (!currentTrack) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl glass">
        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
          <Music className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">Nada tocando</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const progress = currentTrack.durationMs > 0 
    ? (currentTrack.progressMs / currentTrack.durationMs) * 100 
    : 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl glass max-w-sm">
      {/* Album Art */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
        {currentTrack.albumArt ? (
          <img 
            src={currentTrack.albumArt} 
            alt={currentTrack.album}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Music className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        {/* Play/Pause indicator */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {currentTrack.isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {currentTrack.name}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {currentTrack.artist}
        </p>
        {/* Progress bar */}
        <div className="mt-1.5 h-1 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary/70 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Disconnect button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={disconnect}
        className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}