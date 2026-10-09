import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
  due_date: string;
}

const localKey = (userId: string) => `ocean_flow_tasks_${userId}`;
const isLocalUser = (userId: string) => !isSupabaseConfigured || userId.startsWith('local-');

function readLocal(userId: string): Task[] {
  try { return JSON.parse(localStorage.getItem(localKey(userId)) || '[]') as Task[]; }
  catch { return []; }
}

function writeLocal(userId: string, tasks: Task[]) {
  localStorage.setItem(localKey(userId), JSON.stringify(tasks));
  window.dispatchEvent(new CustomEvent('ocean-flow-tasks-updated', { detail: { userId } }));
}

export async function getTasks(userId: string, dueDate?: string): Promise<Task[]> {
  if (isLocalUser(userId)) {
    const tasks = readLocal(userId);
    return dueDate ? tasks.filter(task => task.due_date === dueDate) : tasks;
  }
  const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const remoteTasks = (data || []) as Task[];
  const localTasks = readLocal(userId);
  const merged = new Map<string, Task>();
  for (const task of localTasks) merged.set(task.id, task);
  for (const task of remoteTasks) merged.set(task.id, task);
  const tasks = Array.from(merged.values());
  if (dueDate) return tasks.filter(task => task.due_date === dueDate);
  return tasks;
}

export async function addTask(userId: string, title: string, dueDate: string): Promise<Task> {
  const now = new Date().toISOString();
  if (isLocalUser(userId)) {
    const task: Task = { id: crypto.randomUUID(), user_id: userId, title, completed: false, created_at: now, completed_at: null, due_date: dueDate };
    writeLocal(userId, [...readLocal(userId), task]);
    return task;
  }
  const { data, error } = await supabase.from('tasks').insert({ user_id: userId, title, due_date: dueDate }).select().single();
  if (error) throw error;
  return data as Task;
}

export async function setTaskCompleted(userId: string, task: Task, completed: boolean): Promise<Task> {
  const updated = { ...task, completed, completed_at: completed ? new Date().toISOString() : null };
  if (isLocalUser(userId)) {
    writeLocal(userId, readLocal(userId).map(item => item.id === task.id ? updated : item));
    return updated;
  }
  const { data, error } = await supabase.from('tasks').update({ completed, completed_at: updated.completed_at })
    .eq('user_id', userId).eq('id', task.id).select().single();
  if (error) throw error;
  return data as Task;
}

export async function removeTask(userId: string, taskId: string): Promise<void> {
  if (isLocalUser(userId)) {
    writeLocal(userId, readLocal(userId).filter(task => task.id !== taskId));
    return;
  }
  const { error } = await supabase.from('tasks').delete().eq('user_id', userId).eq('id', taskId);
  if (error) throw error;
}
