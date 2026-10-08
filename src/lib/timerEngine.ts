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