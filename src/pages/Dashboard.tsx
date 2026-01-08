import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Clock, Target, Zap, Calendar, BarChart2, PieChart as PieChartIcon, TrendingUp, Star, Music, Brain, Settings2, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  getTagStatsAsync, 
  getRecentCyclesAsync, 
  getTotalCompletedCyclesAsync,
  getTotalFocusMinutesAsync,
  getDailyStatsAsync,
  getRatingStatsAsync,
  getMusicFocusStatsAsync,
  getTopTracksByRatingAsync,
  getBreathTagStatsAsync,
  getTagGroupStatsAsync,
  CycleRecord,
  TagStats,
  RatingStats,
  MusicFocusStats,
  BreathTagStats,
  TagGroupStats
} from "@/lib/database";
import { RatingAnalytics } from "@/components/RatingAnalytics";
import { MusicAnalytics } from "@/components/MusicAnalytics";
import { BreathAnalytics } from "@/components/BreathAnalytics";
import { GroupAnalytics } from "@/components/GroupAnalytics";
import { TagManagement } from "@/components/TagManagement";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from "recharts";

const phaseNames: Record<string, string> = {
  immersion: 'Imersão',
  dive: 'Mergulho',
  breath: 'Respiração',
};

const phaseColors: Record<string, string> = {
  immersion: 'hsl(195, 85%, 65%)',
  dive: 'hsl(200, 80%, 55%)',
  breath: 'hsl(25, 90%, 60%)',
};

const chartColors = [
  'hsl(200, 80%, 55%)',
  'hsl(160, 70%, 45%)',
  'hsl(280, 65%, 55%)',
  'hsl(340, 75%, 55%)',
  'hsl(45, 85%, 55%)',
  'hsl(15, 80%, 55%)',
];

type PeriodFilter = 7 | 15 | 30;
type ChartType = 'bar' | 'pie' | 'line';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function CycleItem({ cycle }: { cycle: CycleRecord }) {
  const startDate = new Date(cycle.startTime);
  
  return (
    <div className="glass-card flex items-center gap-4">
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: phaseColors[cycle.phase] }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground text-sm">
            {phaseNames[cycle.phase]}
          </span>
          {cycle.tag && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              {cycle.tag}
            </span>
          )}
          {!cycle.completed && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
              Pulado
            </span>
          )}
        </div>
        {cycle.actions && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {cycle.actions}
          </p>
        )}
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {format(startDate, "dd/MM HH:mm", { locale: ptBR })}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [recentCycles, setRecentCycles] = useState<CycleRecord[]>([]);
  const [totalCycles, setTotalCycles] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [dailyStats, setDailyStats] = useState<{ date: string; minutes: number; cycles: number }[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({ averageRating: 0, totalRated: 0, distribution: [] });
  const [musicStats, setMusicStats] = useState<MusicFocusStats[]>([]);
  const [topTracks, setTopTracks] = useState<{ track: string; artist: string; avgRating: number; cycleCount: number }[]>([]);
const [breathStats, setBreathStats] = useState<BreathTagStats[]>([]);
  const [groupStats, setGroupStats] = useState<TagGroupStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>(7);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [tagManagementOpen, setTagManagementOpen] = useState(false);

  const dateRange = useMemo(() => {
    const endDate = endOfDay(new Date());
    const startDate = startOfDay(subDays(new Date(), period - 1));
    return { startDate, endDate };
  }, [period]);

  useEffect(() => {
    const { startDate, endDate } = dateRange;
    
    setLoading(true);
    Promise.all([
      getTagStatsAsync(startDate, endDate),
      getRecentCyclesAsync(15, startDate, endDate),
      getTotalCompletedCyclesAsync(startDate, endDate),
      getTotalFocusMinutesAsync(startDate, endDate),
      getDailyStatsAsync(startDate, endDate),
      getRatingStatsAsync(startDate, endDate),
      getMusicFocusStatsAsync(startDate, endDate),
      getTopTracksByRatingAsync(startDate, endDate),
      getBreathTagStatsAsync(startDate, endDate),
      getTagGroupStatsAsync(startDate, endDate)
    ]).then(([stats, cycles, total, minutes, daily, ratings, music, tracks, breath, groups]) => {
      setTagStats(stats);
      setRecentCycles(cycles);
      setTotalCycles(total);
      setTotalMinutes(minutes);
      setDailyStats(daily);
      setRatingStats(ratings);
      setMusicStats(music);
      setTopTracks(tracks);
      setBreathStats(breath);
      setGroupStats(groups);
      setLoading(false);
    });
  }, [dateRange]);

  const pieData = useMemo(() => {
    return tagStats.map((stat, index) => ({
      name: stat.tag,
      value: stat.totalTimeMinutes,
      color: chartColors[index % chartColors.length]
    }));
  }, [tagStats]);

  const lineData = useMemo(() => {
    return dailyStats.map(d => ({
      ...d,
      date: format(new Date(d.date), 'dd/MM', { locale: ptBR })
    }));
  }, [dailyStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen p-4 sm:p-8 z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="w-12 h-12 rounded-full glass-button flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-2xl font-semibold text-foreground flex-1">Dashboard</h1>
          <button
            onClick={() => setTagManagementOpen(true)}
            className="w-12 h-12 rounded-full glass-button flex items-center justify-center"
            aria-label="Gerenciar Tags"
          >
            <Settings2 className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Tag Management Modal */}
        <TagManagement isOpen={tagManagementOpen} onClose={() => setTagManagementOpen(false)} />

        {/* Period Filter */}
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-2">
            {([7, 15, 30] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                {p} dias
              </button>
            ))}
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(200, 80%, 55%) 0%, hsl(200, 80%, 45%) 100%)' }}
              >
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCycles}</p>
                <p className="text-xs text-muted-foreground">Ciclos completos</p>
              </div>
            </div>
          </div>
          <div className="glass-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsl(195, 85%, 65%) 0%, hsl(195, 85%, 55%) 100%)' }}
              >
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatDuration(totalMinutes)}</p>
                <p className="text-xs text-muted-foreground">Tempo de foco</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Evolution Chart */}
        {dailyStats.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Evolução Diária
            </h2>
            <div className="glass-card" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(200, 15%, 60%)" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(200, 15%, 60%)" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsla(210, 40%, 15%, 0.95)', 
                      border: '1px solid hsla(0,0%,100%,0.1)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(200, 20%, 95%)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="minutes" 
                    name="Minutos"
                    stroke="hsl(200, 80%, 55%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(200, 80%, 55%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Rating Analytics Section */}
        <section className="mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Avaliações dos Ciclos
          </h2>
          <RatingAnalytics stats={ratingStats} />
        </section>

        {/* Music × Focus Correlation Section */}
        <section className="mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Música × Qualidade de Foco
          </h2>
          <MusicAnalytics stats={musicStats} topTracks={topTracks} />
        </section>

        {/* Group Analytics Section */}
        <section className="mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Por Grupo de Tags
          </h2>
          <GroupAnalytics stats={groupStats} />
        </section>

        {/* Breath/Wellness Analytics Section */}
        <section className="mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-orange-400" />
            Bem-estar nas Pausas
          </h2>
          <BreathAnalytics stats={breathStats} />
        </section>

        {/* Tags section with charts */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Por Tag de Foco
            </h2>
            
            {/* Chart type selector */}
            <div className="flex gap-1">
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-lg transition-all ${
                  chartType === 'bar' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('pie')}
                className={`p-2 rounded-lg transition-all ${
                  chartType === 'pie' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PieChartIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-lg transition-all ${
                  chartType === 'line' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {tagStats.length === 0 ? (
            <div className="glass-card text-center py-8">
              <p className="text-muted-foreground">Nenhuma tag registrada ainda.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete ciclos de imersão com tags para ver estatísticas aqui.
              </p>
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="glass-card mb-4" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={tagStats} layout="vertical">
                      <XAxis type="number" stroke="hsl(200, 15%, 60%)" fontSize={10} />
                      <YAxis 
                        type="category" 
                        dataKey="tag" 
                        stroke="hsl(200, 15%, 60%)" 
                        fontSize={10}
                        width={80}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsla(210, 40%, 15%, 0.95)', 
                          border: '1px solid hsla(0,0%,100%,0.1)',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`${formatDuration(value)}`, 'Tempo']}
                      />
                      <Bar dataKey="totalTimeMinutes" radius={[0, 4, 4, 0]}>
                        {tagStats.map((_, index) => (
                          <Cell key={index} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsla(210, 40%, 15%, 0.95)', 
                          border: '1px solid hsla(0,0%,100%,0.1)',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [formatDuration(value), 'Tempo']}
                      />
                    </PieChart>
                  ) : (
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.1)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(200, 15%, 60%)" 
                        fontSize={10}
                      />
                      <YAxis stroke="hsl(200, 15%, 60%)" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsla(210, 40%, 15%, 0.95)', 
                          border: '1px solid hsla(0,0%,100%,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="cycles" 
                        name="Ciclos"
                        stroke="hsl(160, 70%, 45%)" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="minutes" 
                        name="Minutos"
                        stroke="hsl(200, 80%, 55%)" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Tag list */}
              <div className="space-y-3">
                {tagStats.map((stat, index) => (
                  <div key={stat.tag} className="glass-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: chartColors[index % chartColors.length] }}
                        />
                        <span className="font-medium text-foreground">{stat.tag}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          {stat.cycleCount} {stat.cycleCount === 1 ? 'ciclo' : 'ciclos'}
                        </span>
                        <span className="text-primary font-medium">
                          {formatDuration(stat.totalTimeMinutes)}
                        </span>
                      </div>
                    </div>
                    
                    {stat.actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">Ações registradas:</p>
                        <ul className="space-y-1">
                          {stat.actions.slice(0, 3).map((action, i) => (
                            <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span className="line-clamp-2">{action}</span>
                            </li>
                          ))}
                          {stat.actions.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{stat.actions.length - 3} mais...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Recent cycles */}
        <section>
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico Recente
          </h2>
          
          {recentCycles.length === 0 ? (
            <div className="glass-card text-center py-8">
              <p className="text-muted-foreground">Nenhum ciclo registrado ainda.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Inicie um timer para começar a registrar seu progresso.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCycles.map((cycle) => (
                <CycleItem key={cycle.id} cycle={cycle} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
