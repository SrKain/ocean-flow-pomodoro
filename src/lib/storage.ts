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

export interface PomodoroState {
  settings: PomodoroSettings;
  cycles: CycleRecord[];
  totalCompletedCycles: number;
}

export interface TagStats {
  tag: string;
  cycleCount: number;
  totalTimeMinutes: number;
  actions: string[];
}

const STORAGE_KEY = 'pomodoro-ocean';

const defaultSettings: PomodoroSettings = {
  immersionMinutes: 25,
  diveMinutes: 5,
  breathMinutes: 5,
};

export function getSettings(): PomodoroSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state: PomodoroState = JSON.parse(stored);
      return state.settings || defaultSettings;
    }
  } catch (e) {
    console.error('Error reading settings:', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: PomodoroSettings): void {
  try {
    const state = getState();
    state.settings = settings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function getState(): PomodoroState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading state:', e);
  }
  return {
    settings: defaultSettings,
    cycles: [],
    totalCompletedCycles: 0,
  };
}

export function saveCycleRecord(record: CycleRecord): void {
  try {
    const state = getState();
    state.cycles.push(record);
    if (record.completed && record.phase === 'breath') {
      state.totalCompletedCycles += 1;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving cycle:', e);
  }
}

export function getCycles(): CycleRecord[] {
  return getState().cycles;
}

export function getTagStats(): TagStats[] {
  const cycles = getCycles();
  const tagMap = new Map<string, TagStats>();

  // Get all immersion cycles with tags
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

  // Associate dive actions with the most recent immersion tag
  const diveCycles = cycles.filter(c => c.phase === 'dive' && c.actions);
  
  for (const diveCycle of diveCycles) {
    // Find the immersion cycle that came right before this dive
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

export function getRecentCycles(limit: number = 20): CycleRecord[] {
  const cycles = getCycles();
  return cycles.slice(-limit).reverse();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}