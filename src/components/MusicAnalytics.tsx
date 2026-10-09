import { Music, Headphones } from 'lucide-react';
import { MusicFocusStats } from '@/lib/database';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface MusicAnalyticsProps {
  stats: MusicFocusStats[];
  topTracks?: { track: string; artist: string; avgRating: number; cycleCount: number }[];
}

const chartColors = [
  'hsl(200, 80%, 55%)',
  'hsl(160, 70%, 45%)',
  'hsl(280, 65%, 55%)',
  'hsl(340, 75%, 55%)',
  'hsl(45, 85%, 55%)',
  'hsl(15, 80%, 55%)',
];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function MusicAnalytics({ stats, topTracks }: MusicAnalyticsProps) {
  if (stats.length === 0) {
    return (
      <div className="glass-card text-center py-8">
        <Headphones className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Nenhum dado de música registrado.</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Conecte o Spotify e complete ciclos para ver estatísticas.
        </p>
      </div>
    );
  }

  // Separate "Sem música" from artists for comparison
  const withMusic = stats.filter(s => s.artist !== 'Sem música');
  const withoutMusic = stats.find(s => s.artist === 'Sem música');

  // Top 6 artists by time
  const topArtists = withMusic.slice(0, 6);

  const chartData = topArtists.map(s => ({
    artist: s.artist.length > 12 ? s.artist.substring(0, 12) + '...' : s.artist,
    fullArtist: s.artist,
    minutes: s.totalMinutes,
    avgRating: s.averageRating,
    cycles: s.cycleCount,
  }));

  return (
    <div className="space-y-4">
      {/* Music vs Silence comparison */}
      {withoutMusic && withMusic.length > 0 && (
        <div className="glass-card">
          <h4 className="text-sm font-medium text-foreground mb-3">Música vs Silêncio</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <Music className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Com música</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {withMusic.reduce((a, b) => a + b.cycleCount, 0)} ciclos
              </p>
              {withMusic.some(s => s.averageRating > 0) && (
                <p className="text-xs text-primary">
                  ⭐ {(withMusic.filter(s => s.averageRating > 0).reduce((a, b) => a + b.averageRating, 0) / withMusic.filter(s => s.averageRating > 0).length).toFixed(1)} média
                </p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Headphones className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sem música</span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {withoutMusic.cycleCount} ciclos
              </p>
              {withoutMusic.averageRating > 0 && (
                <p className="text-xs text-muted-foreground">
                  ⭐ {withoutMusic.averageRating.toFixed(1)} média
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top artists chart */}
      {topArtists.length > 0 && (
        <div className="glass-card">
          <h4 className="text-sm font-medium text-foreground mb-3">Top Artistas</h4>
          <div className="w-full aspect-[2/1] min-h-[180px] max-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" stroke="hsl(200, 15%, 60%)" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="artist" 
                  stroke="hsl(200, 15%, 60%)" 
                  fontSize={12}
                  width={80}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsla(210, 40%, 15%, 0.95)', 
                    border: '1px solid hsla(0,0%,100%,0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'minutes') return [formatDuration(value), 'Tempo'];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `${data.fullArtist} (${data.cycles} ciclos${data.avgRating > 0 ? `, ⭐${data.avgRating.toFixed(1)}` : ''})`;
                    }
                    return label;
                  }}
                />
                <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top tracks by rating */}
      {topTracks && topTracks.length > 0 && (
        <div className="glass-card">
          <h4 className="text-sm font-medium text-foreground mb-3">
            🎵 Músicas com Melhor Foco
          </h4>
          <div className="space-y-2">
            {topTracks.slice(0, 5).map((track, i) => (
              <div 
                key={`${track.track}-${track.artist}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
              >
                <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{track.track}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-yellow-400">
                    ⭐ {track.avgRating.toFixed(1)}
                  </span>
                  <p className="text-xs text-muted-foreground">{track.cycleCount} ciclos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Artist list */}
      <div className="space-y-2">
        {stats.slice(0, 8).map((stat, index) => (
          <div key={stat.artist} className="glass-card flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: stat.artist === 'Sem música' ? 'hsl(200, 15%, 40%)' : chartColors[index % chartColors.length] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {stat.artist === 'Sem música' ? '🔇 Sem música' : stat.artist}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.cycleCount} {stat.cycleCount === 1 ? 'ciclo' : 'ciclos'}
                {stat.averageRating > 0 && ` • ⭐ ${stat.averageRating.toFixed(1)}`}
              </p>
            </div>
            <span className="text-sm text-primary font-medium">
              {formatDuration(stat.totalMinutes)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
