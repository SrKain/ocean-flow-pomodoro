import { Clock, Check, X } from 'lucide-react';

interface OverfocusPopupProps {
  isOpen: boolean;
  extraTimeSeconds: number;
  onInclude: () => void;
  onDiscard: () => void;
}

function formatExtraTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  }
  return `${secs}s`;
}

export function OverfocusPopup({ isOpen, extraTimeSeconds, onInclude, onDiscard }: OverfocusPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-popup w-full max-w-sm p-6 text-center animate-scale-in">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <span className="text-3xl">🔥</span>
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2">
          Overfocus Detectado!
        </h3>
        
        <p className="text-muted-foreground mb-2">
          Você continuou focado por mais
        </p>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-yellow-400" />
          <span className="text-2xl font-bold text-yellow-400">
            +{formatExtraTime(extraTimeSeconds)}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Deseja adicionar este tempo extra aos seus relatórios?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onDiscard}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all font-medium"
          >
            <X className="w-4 h-4" />
            Ignorar
          </button>
          <button
            onClick={onInclude}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30 transition-all font-medium"
          >
            <Check className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
