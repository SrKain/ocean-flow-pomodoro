import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MissionsWidgetProps {
  onClick: () => void;
  compact?: boolean;
}

export function MissionsWidget({ onClick, compact = false }: MissionsWidgetProps) {
  const { user } = useAuth();
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Use local date to ensure tasks match user's timezone
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
      className={cn(
        "flex items-center gap-2 rounded-full glass-button hover:scale-105 transition-transform",
        compact ? "px-3 py-1.5" : "px-4 py-2 gap-3"
      )}
    >
      <Target className={cn(compact ? "w-3 h-3" : "w-4 h-4", "text-primary")} />
      <div className="flex items-center gap-2">
        <span className={cn(compact ? "text-xs" : "text-sm", "font-medium text-foreground")}>
          {completedCount}/{totalCount}
        </span>
        {totalCount > 0 && !compact && (
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
