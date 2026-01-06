import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Phase, getSettingsAsync, PomodoroSettings } from '@/lib/database';

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

  // Fetch or create session
  useEffect(() => {
    if (!user) {
      setSession(null);
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
          // Calculate adjusted time based on server state
          const serverSession = data as unknown as ActiveSession;
          
          // If timer was running, calculate elapsed time since last update
          if (serverSession.is_running && serverSession.started_at) {
            const now = Date.now();
            const lastUpdate = new Date(serverSession.updated_at).getTime();
            const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
            
            if (serverSession.is_overtime) {
              serverSession.extra_time_seconds = (serverSession.extra_time_seconds || 0) + elapsedSeconds;
            } else {
              serverSession.time_left = Math.max(0, serverSession.time_left - elapsedSeconds);
            }
          }
          
          setSession(serverSession);
        } else {
          // Create new session
          const defaultTimeSeconds = (settings?.immersionMinutes || 25) * 60;
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
            })
            .select()
            .single();

          if (createError) throw createError;
          setSession(created as unknown as ActiveSession);
        }
      } catch (e) {
        console.error('Error fetching session:', e);
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
            const newData = payload.new as unknown as ActiveSession;
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
  }, [user, settings]);

  // Debounced update to server
  const updateSession = useCallback(async (updates: Partial<ActiveSession>) => {
    if (!user || !session) return;

    // Update local state immediately
    setSession(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
    lastUpdateRef.current = Date.now();

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
