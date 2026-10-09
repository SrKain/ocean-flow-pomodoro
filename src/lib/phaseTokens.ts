import { Phase } from './storage';

export const PHASE_ORDER: readonly Phase[] = ['immersion', 'dive', 'breath'] as const;

export const PHASE_NAMES: Record<Phase, string> = {
  immersion: 'Imersão',
  dive: 'Mergulho',
  breath: 'Respiração',
};

export const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  immersion: 'Hora de focar e mergulhar na tarefa',
  dive: 'Registre suas ações e insights',
  breath: 'Momento de descanso e recuperação',
};

// Cores base das fases em HSL canônico
export const PHASE_COLORS: Record<Phase, string> = {
  immersion: 'hsl(195, 85%, 65%)',
  dive: 'hsl(200, 80%, 55%)',
  breath: 'hsl(25, 90%, 55%)',
};

// Função de interpolação cúbica suave
export const easeInOutCubic = (t: number): number => {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Calcula valores dinâmicos de matiz, saturação e luminosidade por fase e progresso
export function getPhaseDynamicColors(phase: Phase, progress: number): { hue: number; sat: number; light: number } {
  const easedProgress = easeInOutCubic(Math.max(0, Math.min(1, progress)));

  if (phase === 'dive') {
    // Transição gradual durante mergulho profundo
    const hue = 215 - easedProgress * 15; // 215 -> 200
    const sat = 50 - easedProgress * 5;
    const light = 8 + easedProgress * 6;
    return { hue, sat, light };
  }

  if (phase === 'breath') {
    // Tom coral / amanhecer na respiração
    const hue = 25 - easedProgress * 5; // 25 -> 20
    const sat = 90 - easedProgress * 10;
    const light = 50 + Math.sin(progress * Math.PI) * 8; // leve pulso respiratório
    return { hue, sat, light };
  }

  // Immersion: azul ciano para azul profundo
  const hue = 200 + easedProgress * 15; // 200 -> 215
  const sat = 50;
  const light = 12 - easedProgress * 4; // 12% -> 8%
  return { hue, sat, light };
}

// Cor do texto do cronômetro para alto contraste
export function getTimerTextColor(phase: Phase, progress: number): string {
  const { hue, sat } = getPhaseDynamicColors(phase, progress);
  if (phase === 'breath') {
    return `hsl(25, 95%, 85%)`;
  }
  return `hsl(${hue}, ${Math.min(70, sat + 20)}%, 88%)`;
}

// Cor de brilho do anel polar
export function getRingGlowColor(phase: Phase, progress: number): string {
  const { hue, sat } = getPhaseDynamicColors(phase, progress);
  return `hsl(${hue}, ${Math.min(90, sat + 15)}%, 60%)`;
}
