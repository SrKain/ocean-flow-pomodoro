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

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
