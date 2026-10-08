ALTER TABLE public.active_sessions
  ADD COLUMN end_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN paused_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN remaining_when_paused INTEGER,
  ADD COLUMN overtime_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN timer_status TEXT NOT NULL DEFAULT 'idle'
    CHECK (timer_status IN ('idle', 'running', 'paused', 'transition', 'overtime', 'completed'));

UPDATE public.active_sessions
SET
  timer_status = CASE
    WHEN is_overtime THEN 'overtime'
    WHEN is_running THEN 'running'
    WHEN time_left < total_time THEN 'paused'
    ELSE 'idle'
  END,
  end_at = CASE
    WHEN is_running AND NOT is_overtime
      THEN updated_at + (time_left * INTERVAL '1 second')
    ELSE NULL
  END,
  paused_at = CASE
    WHEN NOT is_running AND time_left < total_time THEN updated_at
    ELSE NULL
  END,
  remaining_when_paused = time_left,
  overtime_started_at = CASE
    WHEN is_overtime
      THEN updated_at - (COALESCE(extra_time_seconds, 0) * INTERVAL '1 second')
    ELSE NULL
  END;