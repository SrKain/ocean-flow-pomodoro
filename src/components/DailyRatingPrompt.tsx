import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export function DailyRatingPrompt() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Check if it's 17:30 (5:30 PM)
      if (hours === 17 && minutes >= 30 && minutes < 35) {
        checkIfAlreadyRated();
      }
    };

    const checkIfAlreadyRated = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from("daily_ratings")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();
      
      if (!data) {
        setIsVisible(true);
      }
    };

    // Check immediately
    checkTime();
    
    // Check every minute
    const interval = setInterval(checkTime, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    
    setSubmitting(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from("daily_ratings")
        .upsert({
          user_id: user.id,
          date: today,
          rating,
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Avaliação salva!",
        description: "Obrigado por avaliar seu dia.",
      });
      
      setIsVisible(false);
      setRating(0);
      setNotes("");
    } catch (error) {
      console.error("Error saving daily rating:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a avaliação.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="glass-card mx-4 max-w-sm w-full animate-in fade-in zoom-in duration-300"
        style={{
          background: "linear-gradient(135deg, hsla(210, 40%, 15%, 0.95) 0%, hsla(210, 40%, 10%, 0.95) 100%)",
          border: "1px solid hsla(0, 0%, 100%, 0.1)"
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Como foi seu dia?</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Avalie a qualidade geral do seu dia de trabalho.
        </p>
        
        {/* Star rating */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
        
        {/* Notes input */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações sobre o dia (opcional)"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
          rows={2}
        />
        
        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="w-full py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: rating > 0 
              ? "linear-gradient(135deg, hsl(200, 80%, 55%) 0%, hsl(200, 80%, 45%) 100%)"
              : "hsla(0, 0%, 100%, 0.1)"
          }}
        >
          {submitting ? "Salvando..." : "Salvar avaliação"}
        </button>
      </div>
    </div>
  );
}
