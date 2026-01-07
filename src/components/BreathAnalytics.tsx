import { Brain } from 'lucide-react';
import { BreathTagStats } from '@/lib/database';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface BreathAnalyticsProps {
  stats: BreathTagStats[];
}

const breathColors = [
  'hsl(25, 80%, 55%)',   // Warm orange
  'hsl(45, 85%, 55%)',   // Gold
  'hsl(340, 65%, 60%)',  // Soft pink
  'hsl(280, 55%, 55%)',  // Lavender
  'hsl(180, 50%, 50%)',  // Teal
  'hsl(120, 40%, 50%)',  // Sage green
];

export function BreathAnalytics({ stats }: BreathAnalyticsProps) {
  if (stats.length === 0) {
    return (
      <div className="glass-card text-center py-8">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Brain className="w-6 h-6 text-orange-400" />
        </div>
        <p className="text-muted-foreground">Nenhuma tag de respiração registrada.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Registre seu estado mental durante as pausas para acompanhar padrões.
        </p>
      </div>
    );
  }

  const pieData = stats.map((stat, index) => ({
    name: stat.tag,
    value: stat.count,
    color: breathColors[index % breathColors.length]
  }));

  return (
    <div className="space-y-4">
      {/* Pie Chart */}
      <div className="glass-card" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
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
                background: 'hsla(30, 40%, 15%, 0.95)', 
                border: '1px solid hsla(0,0%,100%,0.1)',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`${value} registros`, 'Contagem']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tag list */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, index) => (
          <div 
            key={stat.tag} 
            className="glass-card p-3 flex items-center gap-3"
            style={{ borderColor: `${breathColors[index % breathColors.length]}30` }}
          >
            <span 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: breathColors[index % breathColors.length] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{stat.tag}</p>
              <p className="text-xs text-muted-foreground">
                {stat.count}x • {stat.percentage.toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}