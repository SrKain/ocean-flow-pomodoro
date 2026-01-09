import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIInsightsCardProps {
  period: number;
}

export function AIInsightsCard({ period }: AIInsightsCardProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-insights", {
        body: { period },
      });

      if (fnError) {
        console.error("Function error:", fnError);
        setError("Erro ao carregar insights");
        return;
      }

      if (data?.error) {
        if (data.error === "Rate limit exceeded") {
          setError("Muitas requisições. Tente novamente em alguns minutos.");
        } else if (data.error === "Credits exhausted") {
          setError("Créditos de IA esgotados.");
        } else {
          setError(data.error);
        }
        return;
      }

      setInsight(data?.insight || null);
    } catch (err) {
      console.error("Error fetching insights:", err);
      setError("Erro ao conectar com o serviço de IA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [period]);

  return (
    <div className="glass-card relative overflow-hidden">
      {/* Gradient background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: "linear-gradient(135deg, hsl(280, 65%, 55%) 0%, hsl(200, 80%, 55%) 100%)"
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(280, 65%, 55%) 0%, hsl(200, 80%, 55%) 100%)" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-medium text-foreground">Insights IA</h3>
          </div>
          
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Atualizar insights"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded animate-pulse" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-4/6" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {insight}
          </p>
        )}
      </div>
    </div>
  );
}
