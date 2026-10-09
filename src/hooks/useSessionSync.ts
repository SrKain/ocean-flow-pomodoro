import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Phase, getSettingsAsync, PomodoroSettings } from '@/lib/database';
import { TimerStatus } from '@/lib/timerEngine';

export interface ActiveSession {
  id: string;
  user_id: string;
  current_phase: Phase;
  time_left: number;
  total_time: number;
  is_running: boolean;
  cycle_count: number;
  started_at: string | null;
  updated_at: string;
  extra_time_seconds: number;
  is_overtime: boolean;
  end_at: string | null;
  paused_at: string | null;
  remaining_when_paused: number | null;
  overtime_started_at: string | null;
  timer_status: TimerStatus;
}

function normalizeSession(session: ActiveSession): ActiveSession {
  const now = Date.now();
  const status = session.timer_status || (
    session.is_overtime ? 'overtime' : session.is_running ? 'running' :
      session.started_at || session.time_left < session.total_time ? 'paused' : 'idle'
  );
  const startedAt = session.started_at ? new Date(session.started_at).getTime() : null;
  const legacyEndAt = status === 'running' && startedAt !== null
    ? new Date(session.updated_at).getTime() + session.time_left * 1000
    : null;
  const overtimeStartedAt = session.overtime_started_at || (
    status === 'overtime'
      ? new Date(new Date(session.updated_at).getTime() - (session.extra_time_seconds || 0) * 1000).toISOString()
      : null
  );

  return {
    ...session,
    end_at: session.end_at || (legacyEndAt === null ? null : new Date(legacyEndAt).toISOString()),
    paused_at: session.paused_at || null,
    remaining_when_paused: session.remaining_when_paused ?? session.time_left,
    overtime_started_at: overtimeStartedAt,
    timer_status: status,
    extra_time_seconds: status === 'overtime' && overtimeStartedAt
      ? Math.max(0, Math.floor((now - new Date(overtimeStartedAt).getTime()) / 1000))
      : session.extra_time_seconds || 0,
  };
}

function migrateLegacyIdleSession(session: ActiveSession, settings: PomodoroSettings): ActiveSession {
  const legacyDurations = [25 * 60, 5 * 60];
  const isInitialIdleImmersion = session.current_phase === 'immersion' &&
    session.timer_status === 'idle' &&
    session.cycle_count === 0 &&
    !session.started_at &&
    session.time_left === session.total_time &&
    legacyDurations.includes(session.total_time);

  if (!isInitialIdleImmersion) return session;

  const duration = settings.immersionMinutes * 60;
  if (session.total_time === duration) return session;

  return {
    ...session,
    time_left: duration,
    total_time: duration,
    remaining_when_paused: duration,
    end_at: null,
    paused_at: null,
  };
}

export function useSessionSync() {
  const { user } = useAuth();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Load settings
  useEffect(() => {
    getSettingsAsync().then(setSettings);
  }, []);

  const createDefaultSession = useCallback((): ActiveSession => {
    const defaultTimeSeconds = (settings?.immersionMinutes || 5) * 60;
    return {
      id: 'local-session',
      user_id: user?.id || 'guest',
      current_phase: 'immersion',
      time_left: defaultTimeSeconds,
      total_time: defaultTimeSeconds,
      is_running: false,
      cycle_count: 0,
      started_at: null,
      updated_at: new Date().toISOString(),
      extra_time_seconds: 0,
      is_overtime: false,
      end_at: null,
      paused_at: null,
      remaining_when_paused: defaultTimeSeconds,
      overtime_started_at: null,
      timer_status: 'idle',
    };
  }, [settings, user]);

  const loadLocalSession = useCallback((): ActiveSession => {
    const saved = localStorage.getItem('ocean_flow_active_session');
    if (saved) {
      try {
        const normalized = normalizeSession(JSON.parse(saved) as ActiveSession);
        const migrated = settings ? migrateLegacyIdleSession(normalized, settings) : normalized;
        if (migrated !== normalized) {
          localStorage.setItem('ocean_flow_active_session', JSON.stringify(migrated));
        }
        return migrated;
      } catch {
        // ignore parse error
      }
    }
    return createDefaultSession();
  }, [createDefaultSession]);

  // Fetch or create session
  useEffect(() => {
    if (!user) {
      setSession(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || user.id.startsWith('local-')) {
      const local = loadLocalSession();
      setSession(local);
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const normalized = normalizeSession(data as unknown as ActiveSession);
          const migrated = settings ? migrateLegacyIdleSession(normalized, settings) : normalized;
          setSession(migrated);
          if (migrated !== normalized) {
            await supabase.from('active_sessions').update({
              time_left: migrated.time_left,
              total_time: migrated.total_time,
              remaining_when_paused: migrated.remaining_when_paused,
              end_at: null,
              paused_at: null,
              updated_at: new Date().toISOString(),
            }).eq('user_id', user.id);
          }
        } else {
          // Create new session
          const defaultTimeSeconds = (settings?.immersionMinutes || 5) * 60;
          const { data: created, error: createError } = await supabase
            .from('active_sessions')
            .insert({
              user_id: user.id,
              current_phase: 'immersion',
              time_left: defaultTimeSeconds,
              total_time: defaultTimeSeconds,
              is_running: false,
              cycle_count: 0,
              extra_time_seconds: 0,
              is_overtime: false,
              timer_status: 'idle',
              remaining_when_paused: defaultTimeSeconds,
            })
            .select()
            .single();

          if (createError) throw createError;
          setSession(normalizeSession(created as unknown as ActiveSession));
        }
      } catch (e) {
        console.error('Error fetching session, falling back to local:', e);
        setSession(loadLocalSession());
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('active_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newData = normalizeSession(payload.new as unknown as ActiveSession);
            // Only update if this is from another device (compare timestamps)
            const updateTime = new Date(newData.updated_at).getTime();
            if (updateTime > lastUpdateRef.current + 500) { // 500ms buffer
              setSession(newData);
            }
          } else if (payload.eventType === 'DELETE') {
            setSession(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, settings, isSupabaseConfigured, loadLocalSession]);

  // Debounced update to server
  const updateSession = useCallback(async (updates: Partial<ActiveSession>) => {
    if (!user || !session) return;

    // Update local state immediately
    const updatedSession = { ...session, ...updates, updated_at: new Date().toISOString() };
    setSession(updatedSession);
    localStorage.setItem('ocean_flow_active_session', JSON.stringify(updatedSession));
    lastUpdateRef.current = Date.now();

    if (!isSupabaseConfigured || user.id.startsWith('local-')) {
      return;
    }

    // Debounce server updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('active_sessions')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (e) {
        console.error('Error updating session:', e);
      }
    }, 300); // 300ms debounce
  }, [user, session]);

  // Reset session
  const resetSession = useCallback(async () => {
    if (!user || !settings) return;

    const defaultTimeSeconds = settings.immersionMinutes * 60;
    await updateSession({
      current_phase: 'immersion',
      time_left: defaultTimeSeconds,
      total_time: defaultTimeSeconds,
      is_running: false,
      cycle_count: 0,
      started_at: null,
      extra_time_seconds: 0,
      is_overtime: false,
          end_at: null,
          paused_at: null,
          remaining_when_paused: defaultTimeSeconds,
          overtime_started_at: null,
          timer_status: 'idle',
    });
  }, [user, settings, updateSession]);

  return {
    session,
    settings,
    loading,
    updateSession,
    resetSession,
  };
}
