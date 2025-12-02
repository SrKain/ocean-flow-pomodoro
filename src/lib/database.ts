import { supabase } from "@/integrations/supabase/client";

export type Phase = 'immersion' | 'dive' | 'breath';

export interface PomodoroSettings {
  immersionMinutes: number;
  diveMinutes: number;
  breathMinutes: number;
}

export interface CycleRecord {
  id: string;
  phase: Phase;
  startTime: string;
  endTime: string;
  tag?: string;
  actions?: string;
  completed: boolean;
}

export interface TagStats {
  tag: string;
  cycleCount: number;
  totalTimeMinutes: number;
  actions: string[];
}

const defaultSettings: PomodoroSettings = {
  immersionMinutes: 25,
  diveMinutes: 5,
  breathMinutes: 5,
};

// Settings functions
export async function getSettingsAsync(): Promise<PomodoroSettings> {
  try {
    const { data, error } = await supabase
      .from('pomodoro_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      return defaultSettings;
    }

    if (data) {
      return {
        immersionMinutes: data.immersion_minutes,
        diveMinutes: data.dive_minutes,
        breathMinutes: data.breath_minutes,
      };
    }

    return defaultSettings;
  } catch (e) {
    console.error('Error reading settings:', e);
    return defaultSettings;
  }
}

export async function saveSettingsAsync(settings: PomodoroSettings): Promise<void> {
  try {
    const { error } = await supabase
      .from('pomodoro_settings')
      .update({
        immersion_minutes: settings.immersionMinutes,
        dive_minutes: settings.diveMinutes,
        breath_minutes: settings.breathMinutes,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

    if (error) {
      console.error('Error saving settings:', error);
    }
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

// Cycle record functions
export async function saveCycleRecordAsync(record: Omit<CycleRecord, 'id'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('cycle_records')
      .insert({
        phase: record.phase,
        start_time: record.startTime,
        end_time: record.endTime,
        tag: record.tag || null,
        actions: record.actions || null,
        completed: record.completed,
      });

    if (error) {
      console.error('Error saving cycle:', error);
    }
  } catch (e) {
    console.error('Error saving cycle:', e);
  }
}

export async function getCyclesAsync(): Promise<CycleRecord[]> {
  try {
    const { data, error } = await supabase
      .from('cycle_records')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching cycles:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      phase: row.phase as Phase,
      startTime: row.start_time,
      endTime: row.end_time,
      tag: row.tag || undefined,
      actions: row.actions || undefined,
      completed: row.completed,
    }));
  } catch (e) {
    console.error('Error reading cycles:', e);
    return [];
  }
}

export async function getTagStatsAsync(): Promise<TagStats[]> {
  const cycles = await getCyclesAsync();
  const tagMap = new Map<string, TagStats>();

  const immersionCycles = cycles.filter(c => c.phase === 'immersion' && c.tag);
  
  for (const cycle of immersionCycles) {
    const tag = cycle.tag || 'Sem tag';
    const existing = tagMap.get(tag);
    
    const startTime = new Date(cycle.startTime).getTime();
    const endTime = new Date(cycle.endTime).getTime();
    const durationMinutes = Math.round((endTime - startTime) / 60000);
    
    if (existing) {
      existing.cycleCount += 1;
      existing.totalTimeMinutes += durationMinutes;
    } else {
      tagMap.set(tag, {
        tag,
        cycleCount: 1,
        totalTimeMinutes: durationMinutes,
        actions: [],
      });
    }
  }

  const diveCycles = cycles.filter(c => c.phase === 'dive' && c.actions);
  
  for (const diveCycle of diveCycles) {
    const diveIndex = cycles.indexOf(diveCycle);
    let associatedTag = 'Sem tag';
    
    for (let i = diveIndex - 1; i >= 0; i--) {
      if (cycles[i].phase === 'immersion' && cycles[i].tag) {
        associatedTag = cycles[i].tag!;
        break;
      }
    }
    
    const tagStats = tagMap.get(associatedTag);
    if (tagStats && diveCycle.actions) {
      tagStats.actions.push(diveCycle.actions);
    }
  }

  return Array.from(tagMap.values()).sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes);
}

export async function getRecentCyclesAsync(limit: number = 20): Promise<CycleRecord[]> {
  try {
    const { data, error } = await supabase
      .from('cycle_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent cycles:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      phase: row.phase as Phase,
      startTime: row.start_time,
      endTime: row.end_time,
      tag: row.tag || undefined,
      actions: row.actions || undefined,
      completed: row.completed,
    }));
  } catch (e) {
    console.error('Error reading recent cycles:', e);
    return [];
  }
}

export async function getTotalCompletedCyclesAsync(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('cycle_records')
      .select('*', { count: 'exact', head: true })
      .eq('phase', 'breath')
      .eq('completed', true);

    if (error) {
      console.error('Error counting cycles:', error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error('Error counting cycles:', e);
    return 0;
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
