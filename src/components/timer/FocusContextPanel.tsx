import React from "react";
import { Phase } from "@/lib/database";
import { TagSelector, Tag } from "../TagSelector";
import { DiveTagSelector } from "../DiveTagSelector";
import { BreathTagSelector, BreathTag } from "../BreathTagSelector";
import { NowPlaying } from "../NowPlaying";
import { MissionsWidget } from "../MissionsWidget";

interface FocusContextPanelProps {
  currentPhase: Phase;
  cycleCount: number;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  diveTags: Tag[];
  onDiveTagsChange: (tags: Tag[]) => void;
  diveNotes: string;
  onDiveNotesChange: (notes: string) => void;
  breathTags: BreathTag[];
  onBreathTagsChange: (tags: BreathTag[]) => void;
  onOpenMissions: () => void;
  compact?: boolean;
}

export function FocusContextPanel({
  currentPhase,
  cycleCount,
  selectedTags,
  onTagsChange,
  diveTags,
  onDiveTagsChange,
  diveNotes,
  onDiveNotesChange,
  breathTags,
  onBreathTagsChange,
  onOpenMissions,
  compact = false,
}: FocusContextPanelProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Header com Contador de Ciclos e Missões */}
      <div className="flex w-full items-center justify-between gap-3">
        <div className="glass rounded-full px-3.5 py-1.5 text-xs text-slate-200/90 font-medium border border-white/10">
          Ciclo <span className="ml-1 font-semibold text-white">{cycleCount}</span>
        </div>
        <MissionsWidget onClick={onOpenMissions} compact={compact} />
      </div>

      {/* Spotify Player */}
      <div className="w-full">
        <NowPlaying compact={compact} />
      </div>

      {/* Seletor Específico da Fase Atual */}
      <div className="w-full animate-slide-up">
        {currentPhase === 'immersion' && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300 block">
              Tags de Imersão e Planejamento:
            </span>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={onTagsChange}
              compact={compact}
            />
          </div>
        )}

        {currentPhase === 'dive' && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300 block">
              Mergulho Profundo de Foco:
            </span>
            <DiveTagSelector
              selectedTags={diveTags}
              onTagsChange={onDiveTagsChange}
              notes={diveNotes}
              onNotesChange={onDiveNotesChange}
              compact={compact}
            />
          </div>
        )}

        {currentPhase === 'breath' && (
          <div className="space-y-3">
            <div className="text-center rounded-xl glass p-3 border border-white/10">
              <span className="text-2xl block mb-1">🌊</span>
              <p className="text-sm font-medium text-sky-200">Momento de Descanso Consciente</p>
              <p className="text-xs text-slate-300/80">Recupere suas energias antes do próximo ciclo</p>
            </div>
            <BreathTagSelector
              selectedTags={breathTags}
              onTagsChange={onBreathTagsChange}
              compact={compact}
            />
          </div>
        )}
      </div>
    </div>
  );
}
