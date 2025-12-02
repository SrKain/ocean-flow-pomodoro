import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { getSettingsAsync, saveSettingsAsync, PomodoroSettings } from "@/lib/database";
import { toast } from "sonner";

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettingsAsync().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    await saveSettingsAsync(settings);
    toast.success("Configurações salvas!");
    navigate("/");
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="w-10 h-10 rounded-full glass-button flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Immersion */}
          <div className="glass rounded-2xl p-6">
            <label className="block mb-4">
              <span className="flex items-center gap-2 text-foreground font-medium mb-2">
                <span className="w-3 h-3 rounded-full bg-ocean-light" />
                Imersão
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.immersionMinutes}
                  onChange={(e) => setSettings(prev => prev ? ({
                    ...prev,
                    immersionMinutes: parseInt(e.target.value) || 25
                  }) : prev)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <span className="text-muted-foreground">minutos</span>
              </div>
            </label>
          </div>

          {/* Dive */}
          <div className="glass rounded-2xl p-6">
            <label className="block mb-4">
              <span className="flex items-center gap-2 text-foreground font-medium mb-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                Mergulho
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.diveMinutes}
                  onChange={(e) => setSettings(prev => prev ? ({
                    ...prev,
                    diveMinutes: parseInt(e.target.value) || 5
                  }) : prev)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <span className="text-muted-foreground">minutos</span>
              </div>
            </label>
          </div>

          {/* Breath */}
          <div className="glass rounded-2xl p-6">
            <label className="block mb-4">
              <span className="flex items-center gap-2 text-foreground font-medium mb-2">
                <span className="w-3 h-3 rounded-full bg-coral" />
                Respiração
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.breathMinutes}
                  onChange={(e) => setSettings(prev => prev ? ({
                    ...prev,
                    breathMinutes: parseInt(e.target.value) || 5
                  }) : prev)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <span className="text-muted-foreground">minutos</span>
              </div>
            </label>
          </div>

          {/* Info */}
          <div className="glass rounded-2xl p-6 border-dashed border-white/10">
            <h3 className="text-foreground font-medium mb-3">📌 Fluxo das Fases</h3>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="px-3 py-1 rounded-full bg-ocean-light/20 text-ocean-light">Imersão</span>
              <span>→</span>
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary">Mergulho</span>
              <span>→</span>
              <span className="px-3 py-1 rounded-full bg-coral/20 text-coral">Respiração</span>
              <span>→</span>
              <span className="text-xs">🔄</span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 transition-all hover:brightness-110 hover:shadow-lg hover:shadow-primary/30"
          >
            <Save className="w-5 h-5" />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
