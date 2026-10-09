import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { 
  getSettings, 
  saveSettings, 
  getCycles, 
  saveCycleRecord, 
  updateCycleRating as updateStorageRating
} from "@/lib/storage";

export type Phase = 'immersion' | 'dive' | 'breath';

export interface PomodoroSettings {
  immersionMinutes: number;
  diveMinutes: number;
  breathMinutes: number;
  autoAdvance: boolean;
}

export interface CycleRecord {
  id: string;
  phase: Phase;
  startTime: string;
  endTime: string;
  tag?: string;
  actions?: string;
  completed: boolean;
  userId?: string;
  rating?: number;
  spotifyTrackName?: string;
  spotifyArtist?: string;
  spotifyAlbum?: string;
}

export interface TagStats {
  tag: string;
  cycleCount: number;
  totalTimeMinutes: number;
  actions: string[];
}

export interface RatingStats {
  averageRating: number;
  totalRated: number;
  distribution: { rating: number; count: number }[];
}

export interface MusicFocusStats {
  artist: string;
  trackName?: string;
  cycleCount: number;
  averageRating: number;
  totalMinutes: number;
}

const PENDING_CYCLE_RECORDS_KEY = 'ocean_flow_pending_cycle_records';

function getPendingCycleRecords(): CycleRecord[] {
  try {
    const value = localStorage.getItem(PENDING_CYCLE_RECORDS_KEY);
    return value ? JSON.parse(value) as CycleRecord[] : [];
  } catch {
    return [];
  }
}

function setPendingCycleRecords(records: CycleRecord[]): void {
  try {
    localStorage.setItem(PENDING_CYCLE_RECORDS_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Could not persist pending cycle records:', error);
  }
}

function cycleRecordToRow(record: CycleRecord) {
  return {
    id: record.id,
    user_id: record.userId,
    phase: record.phase,
    start_time: record.startTime,
    end_time: record.endTime,
    tag: record.tag || null,
    actions: record.actions || null,
    completed: record.completed,
    rating: record.rating ?? null,
    spotify_track_name: record.spotifyTrackName || null,
    spotify_artist: record.spotifyArtist || null,
    spotify_album: record.spotifyAlbum || null,
  };
}

export async function flushPendingCycleRecordsAsync(): Promise<void> {
  if (!isSupabaseConfigured) return;
  let userId: string | null;
  try {
    userId = await getCurrentUserId();
  } catch (error) {
    console.error('Could not identify the user for pending cycle synchronization:', error);
    return;
  }
  if (!userId || userId.startsWith('local-') || userId === 'guest-user') return;

  const retained: CycleRecord[] = [];
  for (const record of getPendingCycleRecords()) {
    if (record.userId !== userId) {
      retained.push(record);
      continue;
    }
    try {
      const { error } = await supabase.from('cycle_records')
        .upsert(cycleRecordToRow(record), { onConflict: 'id' });
      if (error) throw error;
    } catch (error) {
      console.error('Could not synchronize a pending cycle record:', error);
      retained.push(record);
    }
  }
  setPendingCycleRecords(retained);
}

const defaultSettings: PomodoroSettings = {
  immersionMinutes: 5,
  diveMinutes: 30,
  breathMinutes: 10,
  autoAdvance: false,
};

// Get current user ID
async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    const local = localStorage.getItem('ocean_flow_local_user');
    if (local) {
      try {
        const u = JSON.parse(local);
        return u.id || 'guest-user';
      } catch {
        return 'guest-user';
      }
    }
    return 'guest-user';
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // Continue to the local account fallback below.
  }
  const local = localStorage.getItem('ocean_flow_local_user');
  if (local) {
    try { return JSON.parse(local).id || null; } catch { return null; }
  }
  return null;
}

// Settings functions
export async function getSettingsAsync(): Promise<PomodoroSettings> {
  const localSettings = getSettings();
  if (!isSupabaseConfigured) {
    return localSettings;
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return localSettings;

    const { data, error } = await supabase
      .from('pomodoro_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return localSettings;
    }

    const remoteSettings: PomodoroSettings = {
      immersionMinutes: data.immersion_minutes,
      diveMinutes: data.dive_minutes,
      breathMinutes: data.breath_minutes,
      autoAdvance: data.auto_advance ?? false,
    };

    const legacyDefaults = [
      [25, 25, 5], // padrão remoto anterior
      [25, 5, 5],  // padrão local anterior
    ];
    const matchesLegacyDefault = legacyDefaults.some(([immersion, dive, breath]) =>
      remoteSettings.immersionMinutes === immersion &&
      remoteSettings.diveMinutes === dive &&
      remoteSettings.breathMinutes === breath
    );

    if (!matchesLegacyDefault) return remoteSettings;

    const migratedSettings = { ...defaultSettings, autoAdvance: remoteSettings.autoAdvance };
    saveSettings(migratedSettings);
    await supabase
      .from('pomodoro_settings')
      .update({
        immersion_minutes: migratedSettings.immersionMinutes,
        dive_minutes: migratedSettings.diveMinutes,
        breath_minutes: migratedSettings.breathMinutes,
      })
      .eq('user_id', userId);
    return migratedSettings;
  } catch (e) {
    return localSettings;
  }
}

export async function saveSettingsAsync(settings: PomodoroSettings): Promise<void> {
  saveSettings(settings);
  if (!isSupabaseConfigured) return;

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return;

    await supabase
      .from('pomodoro_settings')
      .update({
        immersion_minutes: settings.immersionMinutes,
        dive_minutes: settings.diveMinutes,
        breath_minutes: settings.breathMinutes,
        auto_advance: settings.autoAdvance,
      })
      .eq('user_id', userId);
  } catch (e) {
    console.error('Error saving settings to remote:', e);
  }
}

// Cycle record functions
export async function saveCycleRecordAsync(record: Omit<CycleRecord, 'id'>): Promise<string | null> {
  const id = generateId();
  const userId = (await getCurrentUserId()) || 'guest-user';
  
  const fullRecord: CycleRecord = {
    ...record,
    id,
    userId,
  };
  saveCycleRecord(fullRecord);

  if (!isSupabaseConfigured || userId.startsWith('local-') || userId === 'guest-user') {
    return id;
  }

  setPendingCycleRecords([...getPendingCycleRecords().filter(item => item.id !== id), fullRecord]);
  try {
    const { error } = await supabase.from('cycle_records')
      .upsert(cycleRecordToRow(fullRecord), { onConflict: 'id' });
    if (error) throw error;
    setPendingCycleRecords(getPendingCycleRecords().filter(item => item.id !== id));
    return id;
  } catch (e) {
    console.error('Error saving cycle to remote:', e);
    return id;
  }
}

// Update cycle rating
export async function updateCycleRatingAsync(cycleId: string, rating: number): Promise<boolean> {
  updateStorageRating(cycleId, rating);
  if (!isSupabaseConfigured) return true;

  const localRecord = getCycles().find(record => record.id === cycleId);
  if (localRecord) {
    const ratedRecord = { ...localRecord, rating };
    setPendingCycleRecords([...getPendingCycleRecords().filter(item => item.id !== cycleId), ratedRecord]);
  }

  try {
    const { error } = localRecord
      ? await supabase.from('cycle_records').upsert(
        { ...cycleRecordToRow({ ...localRecord, rating }), rating },
        { onConflict: 'id' },
      )
      : await supabase.from('cycle_records').update({ rating }).eq('id', cycleId);
    if (error) throw error;
    setPendingCycleRecords(getPendingCycleRecords().filter(item => item.id !== cycleId));

    return true;
  } catch (e) {
    console.error('Error updating cycle rating in remote:', e);
    return false;
  }
}

export async function getCyclesAsync(startDate?: Date, endDate?: Date): Promise<CycleRecord[]> {
  const getFilteredLocalCycles = (userId?: string | null): CycleRecord[] => {
    if (userId === null) return [];
    let cycles = getCycles();
    if (userId !== undefined) cycles = cycles.filter(cycle => cycle.userId === userId);
    if (startDate) {
      cycles = cycles.filter(c => new Date(c.startTime).getTime() >= startDate.getTime());
    }
    if (endDate) {
      cycles = cycles.filter(c => new Date(c.startTime).getTime() <= endDate.getTime());
    }
    return cycles;
  };

  if (!isSupabaseConfigured) {
    const userId = await getCurrentUserId();
    return getFilteredLocalCycles(userId);
  }

  let userId: string | null = null;
  try {
    userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return getFilteredLocalCycles(userId);

    let query = supabase
      .from('cycle_records')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cycles:', error);
      return getFilteredLocalCycles(userId);
    }

    const remoteCycles = (data || []).map(row => ({
      id: row.id,
      phase: row.phase as Phase,
      startTime: row.start_time,
      endTime: row.end_time,
      tag: row.tag || undefined,
      actions: row.actions || undefined,
      completed: row.completed,
      userId: row.user_id || undefined,
      rating: row.rating || undefined,
      spotifyTrackName: row.spotify_track_name || undefined,
      spotifyArtist: row.spotify_artist || undefined,
      spotifyAlbum: row.spotify_album || undefined,
    }));
    const merged = new Map<string, CycleRecord>();
    for (const cycle of getFilteredLocalCycles(userId)) merged.set(cycle.id, cycle);
    for (const cycle of remoteCycles) merged.set(cycle.id, cycle);
    const pendingIds = new Set(getPendingCycleRecords()
      .filter(cycle => cycle.userId === userId)
      .map(cycle => cycle.id));
    for (const cycle of getFilteredLocalCycles(userId)) {
      if (pendingIds.has(cycle.id)) merged.set(cycle.id, cycle);
    }
    return Array.from(merged.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
  } catch (e) {
    return getFilteredLocalCycles(userId);
  }
}

// Get tag stats - now using DIVE phase time instead of immersion
export async function getTagStatsAsync(startDate?: Date, endDate?: Date): Promise<TagStats[]> {
  const cycles = await getCyclesAsync(startDate, endDate);
  const tagMap = new Map<string, TagStats>();

  // Get immersion cycles for tags
  const immersionCycles = cycles.filter(c => c.phase === 'immersion' && c.tag);
  
  // Get dive cycles for time calculation
  const diveCycles = cycles.filter(c => c.phase === 'dive' && c.completed);
  
  // Build tag stats from immersion cycles (for tags)
  for (const cycle of immersionCycles) {
    const tag = cycle.tag || 'Sem tag';
    if (!tagMap.has(tag)) {
      tagMap.set(tag, {
        tag,
        cycleCount: 0,
        totalTimeMinutes: 0,
        actions: [],
      });
    }
    tagMap.get(tag)!.cycleCount += 1;
  }

  // Calculate time from dive cycles and associate with tags
  for (let i = 0; i < diveCycles.length; i++) {
    const diveCycle = diveCycles[i];
    const diveIndex = cycles.indexOf(diveCycle);
    
    // Find the associated immersion tag by looking at previous cycles
    let associatedTag = 'Sem tag';
    for (let j = diveIndex - 1; j >= 0; j--) {
      if (cycles[j].phase === 'immersion' && cycles[j].tag) {
        associatedTag = cycles[j].tag!;
        break;
      }
    }
    
    const startTime = new Date(diveCycle.startTime).getTime();
    const endTime = new Date(diveCycle.endTime).getTime();
    const durationMinutes = Math.round((endTime - startTime) / 60000);
    
    const tagStats = tagMap.get(associatedTag);
    if (tagStats) {
      tagStats.totalTimeMinutes += durationMinutes;
    } else {
      tagMap.set(associatedTag, {
        tag: associatedTag,
        cycleCount: 1,
        totalTimeMinutes: durationMinutes,
        actions: [],
      });
    }
    
    // Add actions
    if (diveCycle.actions && tagMap.get(associatedTag)) {
      tagMap.get(associatedTag)!.actions.push(diveCycle.actions);
    }
  }

  return Array.from(tagMap.values()).sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes);
}

export async function getRecentCyclesAsync(limit: number = 20, startDate?: Date, endDate?: Date): Promise<CycleRecord[]> {
  if (limit <= 0) return [];
  const cycles = await getCyclesAsync(startDate, endDate);
  return cycles.slice(-limit).reverse();
}
// Get total completed cycles - counts breath phases (full cycle completion)
export async function getTotalCompletedCyclesAsync(startDate?: Date, endDate?: Date): Promise<number> {
  const cycles = await getCyclesAsync(startDate, endDate);
  return cycles.filter(cycle => cycle.phase === 'breath' && cycle.completed).length;
}
// Get total focus time (dive phase only)
export async function getTotalFocusMinutesAsync(startDate?: Date, endDate?: Date): Promise<number> {
  try {
    const cycles = await getCyclesAsync(startDate, endDate);
    const diveCycles = cycles.filter(c => c.phase === 'dive' && c.completed);
    
    let totalMinutes = 0;
    for (const cycle of diveCycles) {
      const startTime = new Date(cycle.startTime).getTime();
      const endTime = new Date(cycle.endTime).getTime();
      totalMinutes += Math.round((endTime - startTime) / 60000);
    }
    
    return totalMinutes;
  } catch (e) {
    console.error('Error calculating focus time:', e);
    return 0;
  }
}

// Get daily stats for charts
export async function getDailyStatsAsync(startDate: Date, endDate: Date): Promise<{ date: string; minutes: number; cycles: number }[]> {
  try {
    const cycles = await getCyclesAsync(startDate, endDate);
    const diveCycles = cycles.filter(c => c.phase === 'dive' && c.completed);
    const breathCycles = cycles.filter(c => c.phase === 'breath' && c.completed);
    
    const dailyMap = new Map<string, { minutes: number; cycles: number }>();
    
    // Initialize all days in range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateStr, { minutes: 0, cycles: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate dive time per day
    for (const cycle of diveCycles) {
      const dateStr = new Date(cycle.startTime).toISOString().split('T')[0];
      const startTime = new Date(cycle.startTime).getTime();
      const endTime = new Date(cycle.endTime).getTime();
      const minutes = Math.round((endTime - startTime) / 60000);
      
      const existing = dailyMap.get(dateStr) || { minutes: 0, cycles: 0 };
      dailyMap.set(dateStr, { ...existing, minutes: existing.minutes + minutes });
    }
    
    // Count completed cycles per day
    for (const cycle of breathCycles) {
      const dateStr = new Date(cycle.startTime).toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr) || { minutes: 0, cycles: 0 };
      dailyMap.set(dateStr, { ...existing, cycles: existing.cycles + 1 });
    }
    
    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (e) {
    console.error('Error getting daily stats:', e);
    return [];
  }
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

// Get rating statistics
export async function getRatingStatsAsync(startDate?: Date, endDate?: Date): Promise<RatingStats> {
  const cycles = await getCyclesAsync(startDate, endDate);
  const ratings = cycles
    .filter(cycle => cycle.phase === 'breath' && cycle.completed && cycle.rating != null)
    .map(cycle => cycle.rating as number);
  const totalRated = ratings.length;
  return {
    averageRating: totalRated ? ratings.reduce((sum, rating) => sum + rating, 0) / totalRated : 0,
    totalRated,
    distribution: [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratings.filter(value => value === rating).length,
    })),
  };
}
// Get daily rating averages
export async function getDailyRatingStatsAsync(startDate: Date, endDate: Date): Promise<{ date: string; avgRating: number; count: number }[]> {
  const cycles = await getCyclesAsync(startDate, endDate);
  const daily = new Map<string, { sum: number; count: number }>();
  const day = new Date(startDate);
  while (day <= endDate) {
    daily.set(day.toISOString().slice(0, 10), { sum: 0, count: 0 });
    day.setDate(day.getDate() + 1);
  }
  for (const cycle of cycles) {
    if (cycle.phase !== 'breath' || !cycle.completed || cycle.rating == null) continue;
    const date = new Date(cycle.startTime).toISOString().slice(0, 10);
    const stats = daily.get(date) || { sum: 0, count: 0 };
    daily.set(date, { sum: stats.sum + cycle.rating, count: stats.count + 1 });
  }
  return Array.from(daily.entries()).map(([date, stats]) => ({
    date,
    avgRating: stats.count ? stats.sum / stats.count : 0,
    count: stats.count,
  })).sort((a, b) => a.date.localeCompare(b.date));
}
// Get music × focus correlation stats
export async function getMusicFocusStatsAsync(startDate?: Date, endDate?: Date): Promise<MusicFocusStats[]> {
  const cycles = await getCyclesAsync(startDate, endDate);
  const artists = new Map<string, { count: number; ratingSum: number; ratingCount: number; minutes: number }>();
  for (const cycle of cycles) {
    if (cycle.phase !== 'dive' || !cycle.completed) continue;
    const artist = cycle.spotifyArtist || 'Sem música';
    const stats = artists.get(artist) || { count: 0, ratingSum: 0, ratingCount: 0, minutes: 0 };
    stats.count += 1;
    if (cycle.rating != null) {
      stats.ratingSum += cycle.rating;
      stats.ratingCount += 1;
    }
    const duration = (Date.parse(cycle.endTime) - Date.parse(cycle.startTime)) / 60000;
    if (Number.isFinite(duration) && duration > 0) stats.minutes += Math.round(duration);
    artists.set(artist, stats);
  }
  return Array.from(artists.entries()).map(([artist, stats]) => ({
    artist,
    cycleCount: stats.count,
    averageRating: stats.ratingCount ? stats.ratingSum / stats.ratingCount : 0,
    totalMinutes: stats.minutes,
  })).sort((a, b) => b.totalMinutes - a.totalMinutes);
}
// Get top tracks by rating
export async function getTopTracksByRatingAsync(startDate?: Date, endDate?: Date): Promise<{ track: string; artist: string; avgRating: number; cycleCount: number }[]> {
  const cycles = await getCyclesAsync(startDate, endDate);
  const tracks = new Map<string, { track: string; artist: string; sum: number; count: number }>();
  for (const cycle of cycles) {
    if (cycle.phase !== 'breath' || !cycle.completed || cycle.rating == null || !cycle.spotifyTrackName) continue;
    const artist = cycle.spotifyArtist || 'Desconhecido';
    const key = JSON.stringify([cycle.spotifyTrackName, artist]);
    const stats = tracks.get(key) || { track: cycle.spotifyTrackName, artist, sum: 0, count: 0 };
    stats.sum += cycle.rating;
    stats.count += 1;
    tracks.set(key, stats);
  }
  return Array.from(tracks.values()).map(stats => ({
    track: stats.track,
    artist: stats.artist,
    avgRating: stats.sum / stats.count,
    cycleCount: stats.count,
  })).sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);
}
// Breath tag stats interface
export interface BreathTagStats {
  tag: string;
  count: number;
  percentage: number;
}

// Get breath tag statistics (for mental patterns/wellness analysis)
export async function getBreathTagStatsAsync(startDate?: Date, endDate?: Date): Promise<BreathTagStats[]> {
  try {
    const cycles = await getCyclesAsync(startDate, endDate);
    const breathCycles = cycles.filter(c => c.phase === 'breath' && c.completed && c.tag);
    
    const tagMap = new Map<string, number>();
    let total = 0;
    
    for (const cycle of breathCycles) {
      // Tags might be comma-separated
      const tags = (cycle.tag || '').split(',').map(t => t.trim()).filter(Boolean);
      for (const tag of tags) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        total += 1;
      }
    }
    
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  } catch (e) {
    console.error('Error getting breath tag stats:', e);
    return [];
  }
}

export interface TagGroupStats {
  groupId: string;
  groupName: string;
  groupColor: string;
  cycleCount: number;
  totalTimeMinutes: number;
  tags: string[];
}

// Get tag group statistics
export async function getTagGroupStatsAsync(startDate?: Date, endDate?: Date): Promise<TagGroupStats[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Fetch all tag groups
    const { data: groupsData, error: groupsError } = await supabase
      .from('tag_groups')
      .select('*')
      .eq('user_id', userId);

    if (groupsError) {
      console.error('Error fetching tag groups:', groupsError);
      return [];
    }

    // Fetch all tags with their groups
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .eq('tag_type', 'focus');

    if (tagsError) {
      console.error('Error fetching tags:', tagsError);
      return [];
    }

    // Build a map of tag name to group_id
    const tagToGroup = new Map<string, string>();
    const tagsByGroup = new Map<string, string[]>();
    
    for (const tag of tagsData || []) {
      if (tag.group_id) {
        tagToGroup.set(tag.name, tag.group_id);
        const existing = tagsByGroup.get(tag.group_id) || [];
        existing.push(tag.name);
        tagsByGroup.set(tag.group_id, existing);
      }
    }

    // Get cycle data
    const cycles = await getCyclesAsync(startDate, endDate);
    const immersionCycles = cycles.filter(c => c.phase === 'immersion' && c.tag);
    const diveCycles = cycles.filter(c => c.phase === 'dive' && c.completed);

    // Build group stats
    const groupStatsMap = new Map<string, { cycleCount: number; totalTimeMinutes: number }>();

    // Count cycles by group
    for (const cycle of immersionCycles) {
      const groupId = tagToGroup.get(cycle.tag || '');
      if (groupId) {
        const existing = groupStatsMap.get(groupId) || { cycleCount: 0, totalTimeMinutes: 0 };
        existing.cycleCount += 1;
        groupStatsMap.set(groupId, existing);
      }
    }

    // Calculate time from dive cycles
    for (let i = 0; i < diveCycles.length; i++) {
      const diveCycle = diveCycles[i];
      const diveIndex = cycles.indexOf(diveCycle);
      
      // Find the associated immersion tag
      let associatedTag = '';
      for (let j = diveIndex - 1; j >= 0; j--) {
        if (cycles[j].phase === 'immersion' && cycles[j].tag) {
          associatedTag = cycles[j].tag!;
          break;
        }
      }
      
      const groupId = tagToGroup.get(associatedTag);
      if (groupId) {
        const startTime = new Date(diveCycle.startTime).getTime();
        const endTime = new Date(diveCycle.endTime).getTime();
        const durationMinutes = Math.round((endTime - startTime) / 60000);
        
        const existing = groupStatsMap.get(groupId) || { cycleCount: 0, totalTimeMinutes: 0 };
        existing.totalTimeMinutes += durationMinutes;
        groupStatsMap.set(groupId, existing);
      }
    }

    // Build final result
    const result: TagGroupStats[] = [];
    for (const group of groupsData || []) {
      const stats = groupStatsMap.get(group.id);
      if (stats && (stats.cycleCount > 0 || stats.totalTimeMinutes > 0)) {
        result.push({
          groupId: group.id,
          groupName: group.name,
          groupColor: group.color || 'hsl(200, 80%, 55%)',
          cycleCount: stats.cycleCount,
          totalTimeMinutes: stats.totalTimeMinutes,
          tags: tagsByGroup.get(group.id) || [],
        });
      }
    }

    return result.sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes);
  } catch (e) {
    console.error('Error getting tag group stats:', e);
    return [];
  }
}
