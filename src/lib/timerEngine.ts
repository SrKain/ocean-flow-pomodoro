export type TimerStatus = 'idle' | 'running' | 'paused' | 'transition' | 'overtime' | 'completed';

export interface TimerClock {
  duration: number;
  startedAt: number | null;
  endAt: number | null;
  pausedAt: number | null;
  remainingWhenPaused: number;
  status: TimerStatus;
  overtimeStartedAt: number | null;
}

export interface PersistedTimerClock {
  total_time: number;
  time_left: number;
  started_at: string | null;
  end_at: string | null;
  paused_at: string | null;
  remaining_when_paused: number | null;
  overtime_started_at: string | null;
  extra_time_seconds: number | null;
  timer_status?: TimerStatus;
  is_running?: boolean;
  is_overtime?: boolean;
}

const toMillis = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function timerClockFromSession(session: PersistedTimerClock): TimerClock {
  const status = session.timer_status || (
    session.is_overtime ? 'overtime' : session.is_running ? 'running' :
      session.started_at || session.time_left < session.total_time ? 'paused' : 'idle'
  );
  return {
    duration: Math.max(1, session.total_time || 1),
    startedAt: toMillis(session.started_at),
    endAt: toMillis(session.end_at),
    pausedAt: toMillis(session.paused_at),
    remainingWhenPaused: Math.max(0, session.remaining_when_paused ?? session.time_left),
    status,
    overtimeStartedAt: toMillis(session.overtime_started_at),
  };
}

export function timerClockToSession(clock: TimerClock, now = Date.now()) {
  const remaining = clock.status === 'running' ? getRemainingSeconds(clock, now) : clock.remainingWhenPaused;
  return {
    total_time: clock.duration,
    time_left: remaining,
    started_at: clock.startedAt === null ? null : new Date(clock.startedAt).toISOString(),
    end_at: clock.endAt === null ? null : new Date(clock.endAt).toISOString(),
    paused_at: clock.pausedAt === null ? null : new Date(clock.pausedAt).toISOString(),
    remaining_when_paused: remaining,
    overtime_started_at: clock.overtimeStartedAt === null ? null : new Date(clock.overtimeStartedAt).toISOString(),
    extra_time_seconds: getOvertimeSeconds(clock, now),
    timer_status: clock.status,
    is_running: clock.status === 'running' || clock.status === 'overtime',
    is_overtime: clock.status === 'overtime',
  };
}

export function reconcilePersistedTimer(session: PersistedTimerClock, now = Date.now(), allowOvertime = true) {
  const clock = reconcileTimer(timerClockFromSession(session), now, allowOvertime);
  const reconciled = timerClockToSession(clock, now);
  const pausedOvertime = clock.status === 'paused' && session.is_overtime;
  return {
    ...session,
    ...reconciled,
    is_overtime: Boolean(pausedOvertime || reconciled.is_overtime),
    extra_time_seconds: pausedOvertime
      ? Math.max(0, session.extra_time_seconds || 0)
      : reconciled.extra_time_seconds,
  };
}

export function createTimerClock(duration: number): TimerClock {
  const safeDuration = Math.max(1, Math.floor(duration));

  return {
    duration: safeDuration,
    startedAt: null,
    endAt: null,
    pausedAt: null,
    remainingWhenPaused: safeDuration,
    status: 'idle',
    overtimeStartedAt: null,
  };
}

export function getRemainingSeconds(clock: TimerClock, now = Date.now()): number {
  if (clock.status === 'running' && clock.endAt !== null) {
    return Math.max(0, Math.ceil((clock.endAt - now) / 1000));
  }

  if (clock.status === 'paused') {
    return Math.max(0, clock.remainingWhenPaused);
  }

  return Math.max(0, clock.remainingWhenPaused);
}

export function getOvertimeSeconds(clock: TimerClock, now = Date.now()): number {
  if (clock.status !== 'overtime' || clock.overtimeStartedAt === null) return 0;
  return Math.max(0, Math.floor((now - clock.overtimeStartedAt) / 1000));
}

export function startTimer(clock: TimerClock, now = Date.now()): TimerClock {
  if (clock.status === 'running' || clock.status === 'transition') return clock;

  if (clock.status === 'overtime' && clock.overtimeStartedAt !== null) {
    return {
      ...clock,
      overtimeStartedAt: now - getOvertimeSeconds(clock, now) * 1000,
    };
  }

  const remaining = clock.status === 'paused'
    ? getRemainingSeconds(clock, now)
    : clock.remainingWhenPaused;

  return {
    ...clock,
    startedAt: clock.startedAt ?? now,
    endAt: now + remaining * 1000,
    pausedAt: null,
    remainingWhenPaused: remaining,
    overtimeStartedAt: null,
    status: 'running',
  };
}

export function pauseTimer(clock: TimerClock, now = Date.now()): TimerClock {
  if (clock.status !== 'running') return clock;

  const remaining = getRemainingSeconds(clock, now);
  return {
    ...clock,
    endAt: null,
    pausedAt: now,
    remainingWhenPaused: remaining,
    status: 'paused',
  };
}

export function setTimerDuration(clock: TimerClock, duration: number): TimerClock {
  if (clock.status === 'running' || clock.status === 'overtime') return clock;
  const safeDuration = Math.max(1, Math.floor(duration));

  return {
    ...createTimerClock(safeDuration),
    status: clock.status === 'transition' ? 'transition' : 'idle',
  };
}

export function enterOvertime(clock: TimerClock, now = Date.now()): TimerClock {
  const overtimeStartedAt = clock.endAt ?? now;
  return {
    ...clock,
    endAt: null,
    pausedAt: null,
    remainingWhenPaused: 0,
    overtimeStartedAt,
    status: 'overtime',
  };
}

export function completeTimer(clock: TimerClock): TimerClock {
  return {
    ...clock,
    endAt: null,
    pausedAt: null,
    remainingWhenPaused: 0,
    overtimeStartedAt: null,
    status: 'completed',
  };
}

export function resetTimer(clock: TimerClock): TimerClock {
  return createTimerClock(clock.duration);
}

export function reconcileTimer(clock: TimerClock, now = Date.now(), allowOvertime = false): TimerClock {
  if (clock.status !== 'running' || clock.endAt === null || clock.endAt > now) return clock;

  return allowOvertime
    ? enterOvertime(clock, now)
    : completeTimer(clock);
}
