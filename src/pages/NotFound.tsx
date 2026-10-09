import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Waves, Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("404 - Rota inexistente acessada:", location.pathname);
  }, [location.pathname]);

  return (
    <AppShell className="flex items-center justify-center py-12" maxWidth="sm">
      <div className="glass-popup p-8 text-center w-full">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
          <Compass className="w-8 h-8 text-primary animate-pulse" />
        </div>

        <span className="text-xs uppercase tracking-widest text-primary/80 font-medium">
          Ocean Flow
        </span>
        <h1 className="mt-2 mb-2 text-4xl font-bold text-foreground">404</h1>
        <h2 className="text-lg font-medium text-foreground mb-2">
          Águas Desconhecidas
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          A rota que você tentou acessar não existe ou foi movida.
        </p>

        <Button asChild variant="primary" className="w-full">
          <Link to="/" className="inline-flex items-center justify-center gap-2">
            <Waves className="w-4 h-4" />
            Voltar ao Foco
          </Link>
        </Button>
      </div>
    </AppShell>
  );
};

export default NotFound;
