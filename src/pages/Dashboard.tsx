import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  getTagStatsAsync, 
  getRecentCyclesAsync, 
  getTotalCompletedCyclesAsync,
  CycleRecord,
  TagStats 
} from "@/lib/database";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTagStatsAsync(),
      getRecentCyclesAsync(15),
      getTotalCompletedCyclesAsync()
    ]).then(([stats, cycles, total]) => {
      setTagStats(stats);
      setRecentCycles(cycles);
      setTotalCycles(total);
      setTotalMinutes(stats.reduce((acc, t) => acc + t.totalTimeMinutes, 0));
      setLoading(false);
    });
  }, []);

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
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="w-12 h-12 rounded-full glass-button flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-2 gap-4 mb-8">
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
                <p className="text-xs text-muted-foreground">Tempo total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tags section */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Por Tag de Foco
          </h2>
          
          {tagStats.length === 0 ? (
            <div className="glass-card text-center py-8">
              <p className="text-muted-foreground">Nenhuma tag registrada ainda.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete ciclos de imersão com tags para ver estatísticas aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tagStats.map((stat) => (
                <div key={stat.tag} className="glass-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{stat.tag}</span>
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
