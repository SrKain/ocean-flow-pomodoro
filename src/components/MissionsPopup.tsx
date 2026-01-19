import { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
  due_date: string;
}

interface MissionsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MissionsPopup({ isOpen, onClose }: MissionsPopupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Use local date to ensure tasks match user's timezone
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (user && isOpen) {
      loadTasks();
    }
  }, [user, isOpen]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user?.id)
        .eq('due_date', today)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Erro ao carregar tarefas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTaskTitle.trim(),
          due_date: today,
        })
        .select()
        .single();

      if (error) throw error;
      setTasks([...tasks, data]);
      setNewTaskTitle('');
      toast({ title: 'Missão adicionada!' });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Erro ao adicionar missão',
        variant: 'destructive',
      });
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const newCompleted = !task.completed;
      const { error } = await supabase
        .from('tasks')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) throw error;
      setTasks(tasks.map(t => 
        t.id === task.id 
          ? { ...t, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
          : t
      ));
    } catch (error) {
      console.error('Error toggling task:', error);
      toast({
        title: 'Erro ao atualizar missão',
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: 'Missão removida' });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Erro ao remover missão',
        variant: 'destructive',
      });
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col glass-popup animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Missões do Dia</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {completedCount} / {totalCount}
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              Missões cumpridas ({progressPercent}%)
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Add Task */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Nova missão..."
              className="bg-white/5 border-white/10 focus:border-primary/50"
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              maxLength={200}
            />
            <Button
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
              className="bg-primary/90 hover:bg-primary shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Carregando...
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-muted-foreground">
                Nenhuma missão para hoje.
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Adicione suas tarefas acima!
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-xl glass-button transition-all duration-300 ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task)}
                    className="flex-shrink-0 text-primary hover:scale-110 transition-transform"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
