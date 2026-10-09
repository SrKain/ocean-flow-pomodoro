import React from "react";
import { Phase } from "@/lib/database";
import { PhasePopup } from "../PhasePopup";
import { RatingPopup } from "../RatingPopup";
import { MissionsPopup } from "../MissionsPopup";
import { DocumentPictureInPicture } from "../DocumentPictureInPicture";
import { PictureInPicture } from "../PictureInPicture";

interface TimerModalsProps {
  showPopup: boolean;
  nextPhase: Phase;
  onContinue: () => void;
  onWait: () => void;

  showRatingPopup: boolean;
  onRatingSubmit: (rating: number) => void;
  onRatingSkip: () => void;

  extraTime: number;

  showMissionsPopup: boolean;
  onCloseMissions: () => void;

  showPip: boolean;
  onClosePip: () => void;
  documentPipSupported: boolean;
  timeLeft: number;
  totalTime: number;
  currentPhase: Phase;
  isRunning: boolean;
  isOvertime: boolean;
  onPlayPause: () => void;
  onSkip: () => void;
  currentTrack?: {
    name: string;
    artist: string;
    albumArt?: string;
  } | null;
}

export function TimerModals({
  showPopup,
  nextPhase,
  onContinue,
  onWait,
  showRatingPopup,
  onRatingSubmit,
  onRatingSkip,
  extraTime,
  showMissionsPopup,
  onCloseMissions,
  showPip,
  onClosePip,
  documentPipSupported,
  timeLeft,
  totalTime,
  currentPhase,
  isRunning,
  isOvertime,
  onPlayPause,
  onSkip,
  currentTrack,
}: TimerModalsProps) {
  return (
    <>
      <PhasePopup
        isOpen={showPopup}
        nextPhase={nextPhase}
        onContinue={onContinue}
        onWait={onWait}
      />

      <RatingPopup
        isOpen={showRatingPopup}
        onSubmit={onRatingSubmit}
        onSkip={onRatingSkip}
      />

      <MissionsPopup
        isOpen={showMissionsPopup}
        onClose={onCloseMissions}
      />

      {documentPipSupported ? (
        <DocumentPictureInPicture
          isOpen={showPip}
          onClose={onClosePip}
          timeLeft={timeLeft}
          totalTime={totalTime}
          currentPhase={currentPhase}
          isRunning={isRunning}
          isOvertime={isOvertime}
          extraTime={extraTime}
          onPlayPause={onPlayPause}
          onSkip={onSkip}
          currentTrack={currentTrack}
        />
      ) : (
        <PictureInPicture
          isOpen={showPip}
          onClose={onClosePip}
          timeLeft={timeLeft}
          totalTime={totalTime}
          currentPhase={currentPhase}
          isRunning={isRunning}
          isOvertime={isOvertime}
          extraTime={extraTime}
          onPlayPause={onPlayPause}
          currentTrack={currentTrack}
        />
      )}
    </>
  );
}
