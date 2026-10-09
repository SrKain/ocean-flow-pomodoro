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
    return user?.id || null;
  } catch {
    return 'guest-user';
  }
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

  if (!isSupabaseConfigured || userId.startsWith('local-')) {
    return id;
  }

  try {
    const { data, error } = await supabase
      .from('cycle_records')
      .insert({
        id,
        user_id: userId,
        phase: record.phase,
        start_time: record.startTime,
        end_time: record.endTime,
        tag: record.tag || null,
        actions: record.actions || null,
        completed: record.completed,
        spotify_track_name: record.spotifyTrackName || null,
        spotify_artist: record.spotifyArtist || null,
        spotify_album: record.spotifyAlbum || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving cycle to remote:', error);
      return id;
    }

    return data?.id || id;
  } catch (e) {
    console.error('Error saving cycle to remote:', e);
    return id;
  }
}

// Update cycle rating
export async function updateCycleRatingAsync(cycleId: string, rating: number): Promise<boolean> {
  updateStorageRating(cycleId, rating);
  if (!isSupabaseConfigured) return true;

  try {
    await supabase
      .from('cycle_records')
      .update({ rating })
      .eq('id', cycleId);

    return true;
  } catch (e) {
    console.error('Error updating cycle rating in remote:', e);
    return true;
  }
}

export async function getCyclesAsync(startDate?: Date, endDate?: Date): Promise<CycleRecord[]> {
  const getFilteredLocalCycles = (): CycleRecord[] => {
    let cycles = getCycles();
    if (startDate) {
      cycles = cycles.filter(c => new Date(c.startTime).getTime() >= startDate.getTime());
    }
    if (endDate) {
      cycles = cycles.filter(c => new Date(c.startTime).getTime() <= endDate.getTime());
    }
    return cycles;
  };

  if (!isSupabaseConfigured) {
    return getFilteredLocalCycles();
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return getFilteredLocalCycles();

    let query = supabase
      .from('cycle_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return getFilteredLocalCycles();
    }

    return data.map(row => ({
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
  } catch (e) {
    return getFilteredLocalCycles();
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
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    let query = supabase
      .from('cycle_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

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
      userId: row.user_id || undefined,
      rating: row.rating || undefined,
      spotifyTrackName: row.spotify_track_name || undefined,
      spotifyArtist: row.spotify_artist || undefined,
      spotifyAlbum: row.spotify_album || undefined,
    }));
  } catch (e) {
    console.error('Error reading recent cycles:', e);
    return [];
  }
}

// Get total completed cycles - counts breath phases (full cycle completion)
export async function getTotalCompletedCyclesAsync(startDate?: Date, endDate?: Date): Promise<number> {
  const getLocalCount = async () => {
    const cycles = await getCyclesAsync(startDate, endDate);
    return cycles.filter(c => c.phase === 'breath' && c.completed).length;
  };

  if (!isSupabaseConfigured) {
    return getLocalCount();
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return getLocalCount();

    let query = supabase
      .from('cycle_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('phase', 'breath')
      .eq('completed', true);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { count, error } = await query;

    if (error || count === null || count === 0) {
      return getLocalCount();
    }

    return count;
  } catch (e) {
    return getLocalCount();
  }
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
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get rating statistics
export async function getRatingStatsAsync(startDate?: Date, endDate?: Date): Promise<RatingStats> {
  const getLocalRatingStats = async () => {
    const cycles = await getCyclesAsync(startDate, endDate);
    const ratings = cycles.filter(c => c.phase === 'breath' && c.completed && c.rating != null).map(c => c.rating as number);
    const totalRated = ratings.length;
    if (totalRated === 0) return { averageRating: 0, totalRated: 0, distribution: [] };
    const averageRating = ratings.reduce((a, b) => a + b, 0) / totalRated;
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratings.filter(r => r === rating).length,
    }));
    return { averageRating, totalRated, distribution };
  };

  if (!isSupabaseConfigured) {
    return getLocalRatingStats();
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return getLocalRatingStats();

    let query = supabase
      .from('cycle_records')
      .select('rating')
      .eq('user_id', userId)
      .eq('phase', 'breath')
      .eq('completed', true)
      .not('rating', 'is', null);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return getLocalRatingStats();
    }

    const ratings = data.map(d => d.rating as number);
    const totalRated = ratings.length;
    
    if (totalRated === 0) {
      return getLocalRatingStats();
    }

    const averageRating = ratings.reduce((a, b) => a + b, 0) / totalRated;
    
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: ratings.filter(r => r === rating).length,
    }));

    return { averageRating, totalRated, distribution };
  } catch (e) {
    return getLocalRatingStats();
  }
}

// Get daily rating averages
export async function getDailyRatingStatsAsync(startDate: Date, endDate: Date): Promise<{ date: string; avgRating: number; count: number }[]> {
  const getLocalDailyRatings = async () => {
    const cycles = await getCyclesAsync(startDate, endDate);
    const breathCycles = cycles.filter(c => c.phase === 'breath' && c.completed && c.rating != null);
    const dailyMap = new Map<string, { sum: number; count: number }>();
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateStr, { sum: 0, count: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    for (const c of breathCycles) {
      const dateStr = new Date(c.startTime).toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr) || { sum: 0, count: 0 };
      dailyMap.set(dateStr, {
        sum: existing.sum + (c.rating as number),
        count: existing.count + 1
      });
    }
    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({
        date,
        avgRating: stats.count > 0 ? stats.sum / stats.count : 0,
        count: stats.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  if (!isSupabaseConfigured) {
    return getLocalDailyRatings();
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return getLocalDailyRatings();

    const { data, error } = await supabase
      .from('cycle_records')
      .select('created_at, rating')
      .eq('user_id', userId)
      .eq('phase', 'breath')
      .eq('completed', true)
      .not('rating', 'is', null)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error || !data || data.length === 0) {
      return getLocalDailyRatings();
    }

    const dailyMap = new Map<string, { sum: number; count: number }>();
    
    // Initialize all days
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateStr, { sum: 0, count: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (const row of data || []) {
      const dateStr = new Date(row.created_at).toISOString().split('T')[0];
      const existing = dailyMap.get(dateStr) || { sum: 0, count: 0 };
      dailyMap.set(dateStr, { 
        sum: existing.sum + (row.rating as number), 
        count: existing.count + 1 
      });
    }

    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ 
        date, 
        avgRating: stats.count > 0 ? stats.sum / stats.count : 0,
        count: stats.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch (e) {
    return getLocalDailyRatings();
  }
}

// Get music × focus correlation stats
export async function getMusicFocusStatsAsync(startDate?: Date, endDate?: Date): Promise<MusicFocusStats[]> {
  const getLocalMusicStats = async () => {
    const cycles = await getCyclesAsync(startDate, endDate);
    const diveCycles = cycles.filter(c => c.phase === 'dive' && c.completed);
    const artistMap = new Map<string, { 
      cycleCount: number; 
      ratingSum: number; 
      ratingCount: number; 
      totalMinutes: number;
    }>();

    for (const c of diveCycles) {
      const artist = c.spotifyArtist || 'Sem música';
      if (!artistMap.has(artist)) {
        artistMap.set(artist, { 
          cycleCount: 0, 
          ratingSum: 0, 
          ratingCount: 0, 
          totalMinutes: 0,
        });
      }
      const stats = artistMap.get(artist)!;
      stats.cycleCount += 1;
      if (c.rating) {
        stats.ratingSum += c.rating;
        stats.ratingCount += 1;
      }
      const startTime = new Date(c.startTime).getTime();
      const endTime = new Date(c.endTime).getTime();
      stats.totalMinutes += Math.round((endTime - startTime) / 60000);
    }

    return Array.from(artistMap.entries())
      .map(([artist, stats]) => ({
        artist,
        cycleCount: stats.cycleCount,
        averageRating: stats.ratingCount > 0 ? stats.ratingSum / stats.ratingCount : 0,
        totalMinutes: stats.totalMinutes,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  };

  if (!isSupabaseConfigured) {
    return getLocalMusicStats();
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return getLocalMusicStats();

    let query = supabase
      .from('cycle_records')
      .select('spotify_artist, spotify_track_name, rating, start_time, end_time')
      .eq('user_id', userId)
      .eq('phase', 'dive')
      .eq('completed', true);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return getLocalMusicStats();
    }

    const artistMap = new Map<string, { 
      cycleCount: number; 
      ratingSum: number; 
      ratingCount: number; 
      totalMinutes: number;
      tracks: Set<string>;
    }>();

    for (const row of data) {
      const artist = row.spotify_artist || 'Sem música';
      const trackName = row.spotify_track_name || undefined;
      
      if (!artistMap.has(artist)) {
        artistMap.set(artist, { 
          cycleCount: 0, 
          ratingSum: 0, 
          ratingCount: 0, 
          totalMinutes: 0,
          tracks: new Set()
        });
      }
      
      const stats = artistMap.get(artist)!;
      stats.cycleCount += 1;
      
      if (row.rating) {
        stats.ratingSum += row.rating;
        stats.ratingCount += 1;
      }
      
      const startTime = new Date(row.start_time).getTime();
      const endTime = new Date(row.end_time).getTime();
      stats.totalMinutes += Math.round((endTime - startTime) / 60000);
      
      if (trackName) {
        stats.tracks.add(trackName);
      }
    }

    return Array.from(artistMap.entries())
      .map(([artist, stats]) => ({
        artist,
        cycleCount: stats.cycleCount,
        averageRating: stats.ratingCount > 0 ? stats.ratingSum / stats.ratingCount : 0,
        totalMinutes: stats.totalMinutes,
      }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  } catch (e) {
    return getLocalMusicStats();
  }
}

// Get top tracks by rating
export async function getTopTracksByRatingAsync(startDate?: Date, endDate?: Date): Promise<{ track: string; artist: string; avgRating: number; cycleCount: number }[]> {
  const getLocalTopTracks = async () => {
    const cycles = await getCyclesAsync(startDate, endDate);
    const ratedTracks = cycles.filter(c => c.phase === 'breath' && c.completed && c.rating != null && c.spotifyTrackName != null);
    const trackMap = new Map<string, { artist: string; ratingSum: number; count: number }>();

    for (const c of ratedTracks) {
      const key = `${c.spotifyTrackName}|${c.spotifyArtist || 'Desconhecido'}`;
      if (!trackMap.has(key)) {
        trackMap.set(key, { 
          artist: c.spotifyArtist || 'Desconhecido', 
          ratingSum: 0, 
          count: 0 
        });
      }
      const stats = trackMap.get(key)!;
      stats.ratingSum += c.rating as number;
      stats.count += 1;
    }

    return Array.from(trackMap.entries())
      .map(([key, stats]) => {
        const [track] = key.split('|');
        return {
          track,
          artist: stats.artist,
          avgRating: stats.ratingSum / stats.count,
          cycleCount: stats.count,
        };
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);
  };

  if (!isSupabaseConfigured) {
    return getLocalTopTracks();
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId.startsWith('local-')) return getLocalTopTracks();

    let query = supabase
      .from('cycle_records')
      .select('spotify_artist, spotify_track_name, rating')
      .eq('user_id', userId)
      .eq('phase', 'breath')
      .eq('completed', true)
      .not('rating', 'is', null)
      .not('spotify_track_name', 'is', null);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return getLocalTopTracks();
    }

    const trackMap = new Map<string, { artist: string; ratingSum: number; count: number }>();

    for (const row of data) {
      const key = `${row.spotify_track_name}|${row.spotify_artist}`;
      
      if (!trackMap.has(key)) {
        trackMap.set(key, { 
          artist: row.spotify_artist || 'Desconhecido', 
          ratingSum: 0, 
          count: 0 
        });
      }
      
      const stats = trackMap.get(key)!;
      stats.ratingSum += row.rating as number;
      stats.count += 1;
    }

    return Array.from(trackMap.entries())
      .map(([key, stats]) => {
        const [track] = key.split('|');
        return {
          track,
          artist: stats.artist,
          avgRating: stats.ratingSum / stats.count,
          cycleCount: stats.count,
        };
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);
  } catch (e) {
    return getLocalTopTracks();
  }
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
