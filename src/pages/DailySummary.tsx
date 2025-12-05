import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Target, CheckCircle, SkipForward, RefreshCw, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getTotalFocusMinutesAsync, getTotalCompletedCyclesAsync, getTagStatsAsync } from '@/lib/database';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface DailyStats {
  totalFocusMinutes: number;
  completedCycles: number;
  skippedPhases: number;
  tasksCompleted: number;
  totalTasks: number;
  tagStats: { tag: string; totalTimeMinutes: number }[];
}

const COLORS = ['hsl(200, 80%, 55%)', 'hsl(280, 70%, 60%)', 'hsl(150, 60%, 50%)', 'hsl(30, 80%, 55%)', 'hsl(340, 70%, 55%)'];

const DailySummary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats>({
    totalFocusMinutes: 0,
    completedCycles: 0,
    skippedPhases: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    tagStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDailyStats();
    }
  }, [user]);

  const loadDailyStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      // Get focus time
      const focusMinutes = await getTotalFocusMinutesAsync(today, endOfDay);
      
      // Get completed cycles
      const completedCycles = await getTotalCompletedCyclesAsync(today, endOfDay);
      
      // Get tag stats
      const tagStats = await getTagStatsAsync(today, endOfDay);
      
      // Get skipped phases (not completed cycles)
      const { count: skippedCount } = await supabase
        .from('cycle_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('completed', false)
        .gte('created_at', today.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // Get tasks
      const todayStr = today.toISOString().split('T')[0];
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .eq('due_date', todayStr);

      const tasksCompleted = tasks?.filter(t => t.completed).length || 0;
      const totalTasks = tasks?.length || 0;

      setStats({
        totalFocusMinutes: focusMinutes,
        completedCycles,
        skippedPhases: skippedCount || 0,
        tasksCompleted,
        totalTasks,
        tagStats: tagStats.map(t => ({ tag: t.tag, totalTimeMinutes: t.totalTimeMinutes })),
      });
    } catch (error) {
      console.error('Error loading daily stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const taskProgress = stats.totalTasks > 0 
    ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) 
    : 0;

  const pieData = stats.tagStats.filter(t => t.totalTimeMinutes > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full bg-card/30 backdrop-blur-md border border-border/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Resumo do Dia</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-card/40 backdrop-blur-xl border-border/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tempo Focado</p>
                    <p className="text-xl font-bold text-foreground">{formatTime(stats.totalFocusMinutes)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/40 backdrop-blur-xl border-border/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <RefreshCw className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ciclos</p>
                    <p className="text-xl font-bold text-foreground">{stats.completedCycles}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/40 backdrop-blur-xl border-border/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-500/20">
                    <SkipForward className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Skips</p>
                    <p className="text-xl font-bold text-foreground">{stats.skippedPhases}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/40 backdrop-blur-xl border-border/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-500/20">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Missões</p>
                    <p className="text-xl font-bold text-foreground">
                      {stats.tasksCompleted}/{stats.totalTasks}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tasks Progress */}
            {stats.totalTasks > 0 && (
              <Card className="p-4 bg-card/40 backdrop-blur-xl border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Missões Cumpridas</span>
                  <span className="text-sm text-muted-foreground">{taskProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 rounded-full"
                    style={{ width: `${taskProgress}%` }}
                  />
                </div>
              </Card>
            )}

            {/* Time by Tag - Pie Chart */}
            {pieData.length > 0 && (
              <Card className="p-4 bg-card/40 backdrop-blur-xl border-border/30">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Tempo por Tag</h3>
                </div>
                
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="totalTimeMinutes"
                        nameKey="tag"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatTime(value)}
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {pieData.map((entry, index) => (
                    <div key={entry.tag} className="flex items-center gap-1.5">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs text-muted-foreground">{entry.tag}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Time by Tag - Bar Chart */}
            {pieData.length > 0 && (
              <Card className="p-4 bg-card/40 backdrop-blur-xl border-border/30">
                <h3 className="font-medium text-foreground mb-4">Minutagem por Tag</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pieData} layout="vertical">
                      <XAxis type="number" tickFormatter={(v) => `${v}min`} />
                      <YAxis 
                        type="category" 
                        dataKey="tag" 
                        width={80}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatTime(value)}
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="totalTimeMinutes" fill="hsl(200, 80%, 55%)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Empty State */}
            {stats.totalFocusMinutes === 0 && stats.totalTasks === 0 && (
              <Card className="p-8 bg-card/30 backdrop-blur-md border-border/20 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma atividade registrada hoje.
                </p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  Comece um ciclo ou adicione missões!
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailySummary;