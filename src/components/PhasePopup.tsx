import { Phase } from "@/lib/storage";

interface PhasePopupProps {
  isOpen: boolean;
  nextPhase: Phase;
  onContinue: () => void;
  onWait: () => void;
}

const phaseNames: Record<Phase, string> = {
  immersion: 'Imersão',
  dive: 'Mergulho',
  breath: 'Respiração',
};

const phaseDescriptions: Record<Phase, string> = {
  immersion: 'Hora de focar e mergulhar na tarefa',
  dive: 'Registre suas ações e insights',
  breath: 'Momento de descanso e recuperação',
};

export function PhasePopup({ isOpen, nextPhase, onContinue, onWait }: PhasePopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
      <div className="glass-popup p-8 max-w-sm w-full text-center animate-slide-up">
        {/* Wave decoration */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center animate-float"
            style={{
              background: 'linear-gradient(135deg, hsl(195, 85%, 65%) 0%, hsl(205, 75%, 45%) 100%)',
              boxShadow: '0 8px 24px hsla(200, 80%, 55%, 0.4), inset 0 1px 0 hsla(0, 0%, 100%, 0.3)'
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 12c1.5-2.5 4-4 6.5-4s5 1.5 6.5 4c1.5-2.5 4-4 6.5-4" />
              <path d="M2 18c1.5-2.5 4-4 6.5-4s5 1.5 6.5 4c1.5-2.5 4-4 6.5-4" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Pronto para a próxima etapa?
        </h2>
        
        <div className="mb-6">
          <span 
            className="inline-block px-5 py-2.5 rounded-full font-medium text-lg"
            style={{
              background: 'linear-gradient(135deg, hsla(200, 80%, 55%, 0.25) 0%, hsla(200, 80%, 45%, 0.15) 100%)',
              border: '1px solid hsla(200, 80%, 55%, 0.3)',
              color: 'hsl(200, 80%, 65%)',
              boxShadow: '0 0 20px hsla(200, 80%, 55%, 0.15)'
            }}
          >
            {phaseNames[nextPhase]}
          </span>
          <p className="text-muted-foreground mt-3 text-sm">
            {phaseDescriptions[nextPhase]}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onWait}
            className="flex-1 ios-button-secondary"
          >
            Aguarde
          </button>
          <button
            onClick={onContinue}
            className="flex-1 ios-button-primary"
          >
            Sim, continuar
          </button>
        </div>
      </div>
    </div>
  );
}