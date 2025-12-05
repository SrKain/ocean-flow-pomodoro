import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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

const Tasks = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

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
          <h1 className="text-2xl font-semibold text-foreground">Missões do Dia</h1>
        </div>

        {/* Progress Card */}
        <Card className="p-6 mb-6 bg-card/40 backdrop-blur-xl border-border/30">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {completedCount} / {totalCount}
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Missões cumpridas ({progressPercent}%)
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Add Task */}
        <div className="flex gap-2 mb-6">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Nova missão..."
            className="bg-card/40 backdrop-blur-md border-border/30"
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            maxLength={200}
          />
          <Button
            onClick={addTask}
            disabled={!newTaskTitle.trim()}
            className="bg-primary/90 hover:bg-primary"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Carregando...
            </div>
          ) : tasks.length === 0 ? (
            <Card className="p-8 bg-card/30 backdrop-blur-md border-border/20 text-center">
              <p className="text-muted-foreground">
                Nenhuma missão para hoje.
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Adicione suas tarefas acima!
              </p>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card
                key={task.id}
                className={`p-4 bg-card/40 backdrop-blur-md border-border/30 transition-all duration-300 ${
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
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;