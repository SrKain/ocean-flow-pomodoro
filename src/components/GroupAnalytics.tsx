import { Folder, Clock, Target } from 'lucide-react';
import { TagGroupStats } from '@/lib/database';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

interface GroupAnalyticsProps {
  stats: TagGroupStats[];
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function GroupAnalytics({ stats }: GroupAnalyticsProps) {
  if (stats.length === 0) {
    return (
      <div className="glass-card text-center py-8">
        <Folder className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-muted-foreground">Nenhum grupo com dados ainda.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Organize suas tags em grupos para ver estatísticas agregadas.
        </p>
      </div>
    );
  }

  const chartData = stats.map(s => ({
    name: s.groupName,
    minutes: s.totalTimeMinutes,
    color: s.groupColor,
  }));

  const totalMinutes = stats.reduce((acc, s) => acc + s.totalTimeMinutes, 0);
  const totalCycles = stats.reduce((acc, s) => acc + s.cycleCount, 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Target className="w-4 h-4" />
            <span>Total em grupos</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalCycles} ciclos</p>
        </div>
        <div className="glass-card">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            <span>Tempo agrupado</span>
          </div>
          <p className="text-xl font-bold text-foreground">{formatDuration(totalMinutes)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" stroke="hsl(200, 15%, 60%)" fontSize={10} />
            <YAxis 
              type="category" 
              dataKey="name" 
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
              formatter={(value: number) => [formatDuration(value), 'Tempo']}
            />
            <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Group cards */}
      <div className="space-y-3">
        {stats.map((group) => (
          <div key={group.groupId} className="glass-card">
            <div className="flex items-center gap-3 mb-2">
              <span 
                className="w-4 h-4 rounded-md flex-shrink-0"
                style={{ backgroundColor: group.groupColor }}
              />
              <span className="font-medium text-foreground flex-1">{group.groupName}</span>
              <span className="text-sm text-muted-foreground">
                {formatDuration(group.totalTimeMinutes)}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{group.cycleCount} ciclos</span>
              <span>{group.tags.length} tags</span>
            </div>

            {/* Tags in group */}
            <div className="flex flex-wrap gap-1.5">
              {group.tags.slice(0, 5).map((tag) => (
                <span 
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-foreground/80"
                >
                  {tag}
                </span>
              ))}
              {group.tags.length > 5 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-muted-foreground">
                  +{group.tags.length - 5}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
