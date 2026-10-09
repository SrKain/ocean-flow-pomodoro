import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Phase, flushPendingCycleRecordsAsync, getSettingsAsync, PomodoroSettings } from '@/lib/database';
import { reconcilePersistedTimer, TimerStatus } from '@/lib/timerEngine';

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
  revision: number;
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

  return reconcilePersistedTimer({
    ...session,
    end_at: session.end_at || (legacyEndAt === null ? null : new Date(legacyEndAt).toISOString()),
    paused_at: session.paused_at || null,
    remaining_when_paused: session.remaining_when_paused ?? session.time_left,
    overtime_started_at: overtimeStartedAt,
    timer_status: status,
    revision: Number(session.revision || 0),
    extra_time_seconds: status === 'overtime' && overtimeStartedAt
      ? Math.max(0, Math.floor((now - new Date(overtimeStartedAt).getTime()) / 1000))
      : session.extra_time_seconds || 0,
  });
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

  return reconcilePersistedTimer({
    ...session,
    time_left: duration,
    total_time: duration,
    remaining_when_paused: duration,
    end_at: null,
    paused_at: null,
  }, now, true) as ActiveSession;
}

async function persistSessionRevision(session: ActiveSession, userId: string, expectedRevision: number) {
  const { data, error } = await supabase.from('active_sessions').update({
    current_phase: session.current_phase,
    time_left: session.time_left,
    total_time: session.total_time,
    is_running: session.is_running,
    cycle_count: session.cycle_count,
    started_at: session.started_at,
    updated_at: session.updated_at,
    extra_time_seconds: session.extra_time_seconds,
    is_overtime: session.is_overtime,
    end_at: session.end_at,
    paused_at: session.paused_at,
    remaining_when_paused: session.remaining_when_paused,
    overtime_started_at: session.overtime_started_at,
    timer_status: session.timer_status,
    revision: session.revision,
  }).eq('user_id', userId).eq('revision', expectedRevision).select('id').maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export function useSessionSync() {
  const { user } = useAuth();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const sessionRef = useRef<ActiveSession | null>(null);
  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const remoteWriteQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const flush = () => { void flushPendingCycleRecordsAsync(); };
    flush();
    window.addEventListener('online', flush);
    window.addEventListener('focus', flush);
    return () => {
      window.removeEventListener('online', flush);
      window.removeEventListener('focus', flush);
    };
  }, [user?.id]);

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
      revision: 0,
    };
  }, [settings, user]);

  const loadLocalSession = useCallback((): ActiveSession => {
    const key = `ocean_flow_active_session:${user?.id || 'guest'}`;
    let saved = localStorage.getItem(key);
    if (!saved) {
      const legacy = localStorage.getItem('ocean_flow_active_session');
      if (legacy) {
        try {
          const candidate = JSON.parse(legacy) as ActiveSession;
          if (!candidate.user_id || candidate.user_id === user?.id) {
            saved = legacy;
            localStorage.setItem(key, legacy);
            localStorage.removeItem('ocean_flow_active_session');
          }
        } catch {
          localStorage.removeItem('ocean_flow_active_session');
        }
      }
    }
    if (saved) {
      try {
        const normalized = normalizeSession(JSON.parse(saved) as ActiveSession);
        const migrated = settings ? migrateLegacyIdleSession(normalized, settings) : normalized;
        migrated.user_id = user?.id || migrated.user_id;
        if (migrated !== normalized) {
          localStorage.setItem(key, JSON.stringify(migrated));
        }
        return migrated;
      } catch {
        // ignore parse error
      }
    }
    return createDefaultSession();
  }, [createDefaultSession, user?.id, settings]);

  const commitSession = useCallback((next: ActiveSession | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  // Fetch or create session
  useEffect(() => {
    if (!user) {
      commitSession(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || user.id.startsWith('local-')) {
      const local = loadLocalSession();
      commitSession(local);
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
          const localKey = `ocean_flow_active_session:${user.id}`;
          let localCandidate: ActiveSession | null = null;
          const storedLocal = localStorage.getItem(localKey);
          if (storedLocal) {
            try { localCandidate = normalizeSession(JSON.parse(storedLocal) as ActiveSession); } catch { /* ignore invalid local snapshot */ }
          }
          const localIsNewer = Boolean(localCandidate && (
            localCandidate.revision > migrated.revision ||
            (localCandidate.revision === migrated.revision && Date.parse(localCandidate.updated_at) > Date.parse(migrated.updated_at))
          ));
          const latest = localIsNewer
            ? { ...localCandidate!, revision: Math.max(localCandidate!.revision, migrated.revision + 1) }
            : migrated;
          commitSession(latest);
          localStorage.setItem(localKey, JSON.stringify(latest));
          if (localIsNewer) {
            try {
              const saved = await persistSessionRevision(latest, user.id, migrated.revision);
              if (!saved) console.warn('A newer session revision already exists remotely; it will be reconciled by realtime.');
            } catch (syncError) {
              console.error('Could not synchronize the latest local timer snapshot:', syncError);
            }
          }
          if (!localIsNewer && migrated !== normalized) {
            const migrationUpdate = {
              ...migrated,
              revision: migrated.revision + 1,
              updated_at: new Date(Math.max(Date.now(), Date.parse(migrated.updated_at) + 1)).toISOString(),
            };
            try {
              const saved = await persistSessionRevision(migrationUpdate, user.id, normalized.revision);
              if (saved) {
                commitSession(migrationUpdate);
                localStorage.setItem(localKey, JSON.stringify(migrationUpdate));
              }
            } catch (migrationError) {
              console.error('Could not persist the legacy timer migration:', migrationError);
            }
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
          const normalized = normalizeSession(created as unknown as ActiveSession);
          commitSession(normalized);
          localStorage.setItem(`ocean_flow_active_session:${user.id}`, JSON.stringify(normalized));
        }
      } catch (e) {
        console.error('Error fetching session, falling back to local:', e);
        commitSession(loadLocalSession());
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
            const currentTime = sessionRef.current ? Date.parse(sessionRef.current.updated_at) : 0;
            const incomingTime = Date.parse(newData.updated_at);
            if (!sessionRef.current || newData.revision > sessionRef.current.revision ||
              (newData.revision === sessionRef.current.revision && incomingTime > currentTime)) {
              commitSession(newData);
              localStorage.setItem(`ocean_flow_active_session:${user.id}`, JSON.stringify(newData));
            }
          } else if (payload.eventType === 'DELETE') {
            commitSession(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, settings, loadLocalSession, commitSession]);

  // Persist state transitions locally first, then serialize remote writes.
  const updateSession = useCallback(async (updates: Partial<ActiveSession>) => {
    const current = sessionRef.current;
    if (!user || !current) return;

    const updatedAt = new Date(Math.max(Date.now(), Date.parse(current.updated_at) + 1)).toISOString();
    const updatedSession = { ...current, ...updates, revision: current.revision + 1, updated_at: updatedAt };
    commitSession(updatedSession);
    localStorage.setItem(`ocean_flow_active_session:${user.id}`, JSON.stringify(updatedSession));

    if (!isSupabaseConfigured || user.id.startsWith('local-')) {
      return;
    }

    // Serialize state-transition writes so a slower request cannot overwrite a newer transition.
    remoteWriteQueueRef.current = remoteWriteQueueRef.current.catch(() => undefined).then(async () => {
      try {
        const { data, error } = await supabase.from('active_sessions').update({
          ...updates,
          revision: updatedSession.revision,
          updated_at: updatedAt,
        }).eq('user_id', user.id).eq('revision', current.revision).select('id').maybeSingle();
        if (error) throw error;
        if (data) return;

        // Another device won the compare-and-set. Reapply this explicit transition once.
        const { data: latest, error: fetchError } = await supabase.from('active_sessions')
          .select('*').eq('user_id', user.id).maybeSingle();
        if (fetchError || !latest) throw fetchError || new Error('Active session disappeared during synchronization.');
        const latestRevision = Number(latest.revision || 0);
        const retrySession: ActiveSession = {
          ...(latest as unknown as ActiveSession),
          ...updates,
          revision: latestRevision + 1,
          updated_at: new Date(Math.max(Date.now(), Date.parse(latest.updated_at) + 1)).toISOString(),
        };
        commitSession(retrySession);
        localStorage.setItem(`ocean_flow_active_session:${user.id}`, JSON.stringify(retrySession));
        const { data: retried, error: retryError } = await supabase.from('active_sessions').update({
          ...updates,
          revision: retrySession.revision,
          updated_at: retrySession.updated_at,
        }).eq('user_id', user.id).eq('revision', latestRevision).select('id').maybeSingle();
        if (retryError || !retried) throw retryError || new Error('Could not reconcile concurrent timer updates.');
      } catch (e) {
        console.error('Error updating session:', e);
      }
    });
    await remoteWriteQueueRef.current;
  }, [user, commitSession]);

  const syncLocalSession = useCallback(async () => {
    if (!user || !isSupabaseConfigured || user.id.startsWith('local-')) return;
    const local = sessionRef.current;
    if (!local) return;

    try {
      const { data: remote, error } = await supabase.from('active_sessions')
        .select('*').eq('user_id', user.id).maybeSingle();
      if (error || !remote) throw error || new Error('Active session is not available for synchronization.');
      const remoteSession = normalizeSession(remote as unknown as ActiveSession);
      const localIsNewer = local.revision > remoteSession.revision ||
        (local.revision === remoteSession.revision && Date.parse(local.updated_at) > Date.parse(remoteSession.updated_at));

      if (!localIsNewer) {
        if (remoteSession.revision > local.revision || Date.parse(remoteSession.updated_at) > Date.parse(local.updated_at)) {
          commitSession(remoteSession);
          localStorage.setItem(`ocean_flow_active_session:${user.id}`, JSON.stringify(remoteSession));
        }
        return;
      }

      const snapshot = { ...local, revision: Math.max(local.revision, remoteSession.revision + 1) };
      const saved = await persistSessionRevision(snapshot, user.id, remoteSession.revision);
      if (saved && sessionRef.current === local) {
        commitSession(snapshot);
        localStorage.setItem(`ocean_flow_active_session:${user.id}`, JSON.stringify(snapshot));
      }
    } catch (error) {
      console.error('Could not retry timer synchronization:', error);
    }
  }, [user, commitSession]);

  useEffect(() => {
    const retry = () => { void syncLocalSession(); };
    retry();
    window.addEventListener('online', retry);
    window.addEventListener('focus', retry);
    return () => {
      window.removeEventListener('online', retry);
      window.removeEventListener('focus', retry);
    };
  }, [syncLocalSession]);

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
