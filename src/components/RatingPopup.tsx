import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RatingPopupProps {
  isOpen: boolean;
  onSubmit: (rating: number) => void;
  onSkip: () => void;
}

export function RatingPopup({ isOpen, onSubmit, onSkip }: RatingPopupProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onSubmit(selectedRating);
      setSelectedRating(0);
      setHoveredStar(0);
    }
  };

  const handleSkip = () => {
    setSelectedRating(0);
    setHoveredStar(0);
    onSkip();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md glass border-white/20">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            🎉 Ciclo Completo!
          </DialogTitle>
          <DialogDescription className="text-center text-foreground/70">
            Como foi sua produtividade neste ciclo?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setSelectedRating(star)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
              aria-label={`${star} estrelas`}
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= (hoveredStar || selectedRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Pular
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedRating === 0}
            className="bg-primary/80 hover:bg-primary"
          >
            Salvar Avaliação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
