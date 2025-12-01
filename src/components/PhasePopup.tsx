import { Phase } from "@/lib/storage";
import { cn } from "@/lib/utils";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={cn(
          "glass rounded-3xl p-8 max-w-sm w-full text-center animate-slide-up",
          "border border-white/20"
        )}
      >
        {/* Wave decoration */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ocean-light to-ocean-medium flex items-center justify-center animate-float">
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
          <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary font-medium text-lg">
            {phaseNames[nextPhase]}
          </span>
          <p className="text-muted-foreground mt-3 text-sm">
            {phaseDescriptions[nextPhase]}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onWait}
            className="flex-1 py-3 px-4 rounded-xl glass-button text-foreground font-medium"
          >
            Aguarde
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/30"
          >
            Sim, continuar
          </button>
        </div>
      </div>
    </div>
  );
}
