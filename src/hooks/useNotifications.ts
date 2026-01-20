import { useCallback, useEffect, useState } from 'react';
import { Phase } from '@/lib/database';

const phaseNames: Record<Phase, string> = {
  immersion: 'Imersão',
  dive: 'Mergulho',
  breath: 'Respiração',
};

const phaseEmojis: Record<Phase, string> = {
  immersion: '🌊',
  dive: '🐋',
  breath: '🌬️',
};

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const notifyPhaseComplete = useCallback((completedPhase: Phase, nextPhase: Phase) => {
    if (permission !== 'granted') return;

    const emoji = phaseEmojis[completedPhase];
    const nextEmoji = phaseEmojis[nextPhase];
    
    new Notification(`${emoji} ${phaseNames[completedPhase]} concluída!`, {
      body: `${nextEmoji} Próxima fase: ${phaseNames[nextPhase]}`,
      icon: '/favicon.ico',
      tag: 'phase-complete',
      requireInteraction: false,
    });
  }, [permission]);

  const notifyOverfocus = useCallback(() => {
    if (permission !== 'granted') return;

    new Notification('🔥 Tempo excedido!', {
      body: 'Você está em modo overfocus. Deseja continuar?',
      icon: '/favicon.ico',
      tag: 'overfocus',
      requireInteraction: true,
    });
  }, [permission]);

  const notifyCycleComplete = useCallback((cycleNumber: number) => {
    if (permission !== 'granted') return;

    new Notification('✨ Ciclo completo!', {
      body: `Você completou o ciclo ${cycleNumber}. Parabéns!`,
      icon: '/favicon.ico',
      tag: 'cycle-complete',
      requireInteraction: false,
    });
  }, [permission]);

  return {
    permission,
    isSupported: 'Notification' in window,
    requestPermission,
    notifyPhaseComplete,
    notifyOverfocus,
    notifyCycleComplete,
  };
}
