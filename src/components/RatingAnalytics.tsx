import { Star } from 'lucide-react';
import { RatingStats } from '@/lib/database';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface RatingAnalyticsProps {
  stats: RatingStats;
}

const ratingColors = [
  'hsl(0, 70%, 50%)',    // 1 star - red
  'hsl(25, 80%, 50%)',   // 2 stars - orange
  'hsl(45, 90%, 50%)',   // 3 stars - yellow
  'hsl(100, 60%, 45%)',  // 4 stars - light green
  'hsl(160, 70%, 40%)',  // 5 stars - green
];

export function RatingAnalytics({ stats }: RatingAnalyticsProps) {
  if (stats.totalRated === 0) {
    return (
      <div className="glass-card text-center py-8">
        <Star className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Nenhuma avaliação registrada ainda.</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Avalie seus ciclos para ver estatísticas aqui.
        </p>
      </div>
    );
  }

  const chartData = stats.distribution.map(d => ({
    rating: `${d.rating}★`,
    count: d.count,
    color: ratingColors[d.rating - 1],
  }));

  return (
    <div className="space-y-4">
      {/* Average rating */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Média de avaliação</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold text-foreground">
                {stats.averageRating.toFixed(1)}
              </span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(stats.averageRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{stats.totalRated}</p>
            <p className="text-xs text-muted-foreground">ciclos avaliados</p>
          </div>
        </div>
      </div>

      {/* Distribution chart */}
      <div className="glass-card" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" stroke="hsl(200, 15%, 60%)" fontSize={10} />
            <YAxis 
              type="category" 
              dataKey="rating" 
              stroke="hsl(200, 15%, 60%)" 
              fontSize={12}
              width={40}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'hsla(210, 40%, 15%, 0.95)', 
                border: '1px solid hsla(0,0%,100%,0.1)',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`${value} ciclos`, 'Quantidade']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
