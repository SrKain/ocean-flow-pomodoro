ALTER TABLE public.active_sessions
  ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS remaining_when_paused INTEGER,
  ADD COLUMN IF NOT EXISTS overtime_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS timer_status TEXT NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 0;

ALTER TABLE public.pomodoro_settings
  ADD COLUMN IF NOT EXISTS auto_advance BOOLEAN NOT NULL DEFAULT false;

UPDATE public.active_sessions
SET
  timer_status = CASE
    WHEN timer_status = 'idle' AND is_overtime THEN 'overtime'
    WHEN timer_status = 'idle' AND is_running THEN 'running'
    WHEN timer_status = 'idle' AND time_left < total_time THEN 'paused'
    ELSE timer_status
  END,
  end_at = CASE
    WHEN end_at IS NULL AND is_running AND NOT is_overtime
      THEN updated_at + (time_left * INTERVAL '1 second')
    ELSE end_at
  END,
  remaining_when_paused = COALESCE(remaining_when_paused, time_left),
  overtime_started_at = CASE
    WHEN is_overtime AND overtime_started_at IS NULL
      THEN updated_at - (COALESCE(extra_time_seconds, 0) * INTERVAL '1 second')
    ELSE overtime_started_at
  END
WHERE timer_status = 'idle' OR remaining_when_paused IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'active_sessions_timer_status_check'
      AND conrelid = 'public.active_sessions'::regclass
  ) THEN
    ALTER TABLE public.active_sessions
      ADD CONSTRAINT active_sessions_timer_status_check
      CHECK (timer_status IN ('idle', 'running', 'paused', 'transition', 'overtime', 'completed'));
  END IF;
END $$;
