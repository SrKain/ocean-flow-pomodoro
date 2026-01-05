import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MissionsWidgetProps {
  onClick: () => void;
}

export function MissionsWidget({ onClick }: MissionsWidgetProps) {
  const { user } = useAuth();
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      loadTaskCounts();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('tasks-widget')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadTaskCounts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadTaskCounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('completed')
        .eq('user_id', user.id)
        .eq('due_date', today);

      if (error) throw error;
      
      const tasks = data || [];
      setTotalCount(tasks.length);
      setCompletedCount(tasks.filter(t => t.completed).length);
    } catch (error) {
      console.error('Error loading task counts:', error);
    }
  };

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 rounded-full glass-button hover:scale-105 transition-transform"
    >
      <Target className="w-4 h-4 text-primary" />
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {completedCount}/{totalCount}
        </span>
        {totalCount > 0 && (
          <>
            <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {progressPercent}%
            </span>
          </>
        )}
      </div>
    </button>
  );
}
