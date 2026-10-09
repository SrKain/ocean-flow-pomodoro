import React from "react";
import { Link } from "react-router-dom";
import { Settings, BarChart3, LogOut, Calendar, Minimize2 } from "lucide-react";

interface TimerHeaderProps {
  onOpenPip: () => void;
  onLogout: () => void;
  compact?: boolean;
}

export function TimerHeader({ onOpenPip, onLogout, compact = false }: TimerHeaderProps) {
  return (
    <header className="flex w-full items-center justify-between gap-3 py-1">
      <div className="glass flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-100/90">
          Ocean Flow
        </span>
      </div>

      <nav className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-slate-900/30 p-1 backdrop-blur-xl">
        <Link
          to="/summary"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Resumo do Dia"
          title="Resumo do Dia"
        >
          <Calendar className="h-4 w-4" />
        </Link>
        <Link
          to="/dashboard"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Dashboard"
          title="Dashboard"
        >
          <BarChart3 className="h-4 w-4" />
        </Link>
        <Link
          to="/settings"
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Configurações"
          title="Configurações"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={onOpenPip}
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Picture in Picture"
          title="Picture in Picture"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-200/80 transition hover:bg-white/10 hover:text-white"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </nav>
    </header>
  );
}
