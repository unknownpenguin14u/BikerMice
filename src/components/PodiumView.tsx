import React from 'react';
import { RacerEntity, Character } from '../types';
import { CharacterPortrait } from './CharacterPortraits';
import { Trophy, DollarSign, RotateCcw, Wrench, ChevronRight } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface PodiumViewProps {
  standings: RacerEntity[];
  playerChar: Character;
  earnedCash: number;
  totalCash: number;
  onGoToGarage: () => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const PodiumView: React.FC<PodiumViewProps> = ({
  standings,
  playerChar,
  earnedCash,
  totalCash,
  onGoToGarage,
  onPlayAgain,
  onMainMenu,
}) => {
  React.useEffect(() => {
    soundEngine.playItemPickup();
    const playerRank = standings.find(s => s.isPlayer)?.rank || 6;
    if (playerRank === 1) {
      soundEngine.announce("CHAMPION! YOU WIN!");
    } else {
      soundEngine.announce("RACE COMPLETED!");
    }
  }, [standings]);

  const sorted = [...standings].sort((a, b) => a.rank - b.rank);
  const playerStanding = sorted.find(s => s.isPlayer);
  const isWinner = playerStanding?.rank === 1;

  const firstPlace = sorted[0];
  const secondPlace = sorted[1];
  const thirdPlace = sorted[2];

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-between bg-[#0c0c0c] text-[#f0f0f0] overflow-y-auto p-6 sm:p-10 font-sans select-none box-border">
      {/* BACKGROUND DOTS & WATERMARK */}
      <div className="absolute inset-0 bg-artistic-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 -right-10 text-[260px] font-black text-white/5 select-none leading-none pointer-events-none font-arcade">
        VICTORY
      </div>

      {/* Dynamic Victory Banner */}
      <div className="text-center my-2 z-10">
        <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#cc3333]">
          OFFICIAL FIA MARTIAN MOTORSPORTS FEDERATION
        </div>
        <h1 className="text-3xl sm:text-6xl font-black italic tracking-tighter uppercase font-arcade mt-1">
          {isWinner ? 'CHAMPION OF MARS' : 'RACE DEBRIEF'}
        </h1>
      </div>

      {/* BRUTALIST PODIUM CEREMONY (2nd, 1st, 3rd) */}
      <div className="w-full max-w-2xl flex items-end justify-center gap-3 sm:gap-6 my-4 z-10">
        {/* 2nd Place */}
        {secondPlace && (
          <div className="flex flex-col items-center flex-1">
            <div className="mb-2 flex flex-col items-center">
              <CharacterPortrait id={secondPlace.charId} size={58} className="ring-2 ring-white/40" />
              <span className="text-xs font-black italic uppercase text-white mt-1.5 truncate max-w-[90px] font-arcade">{secondPlace.name}</span>
            </div>
            <div className="w-full h-24 sm:h-32 bg-[#161616] border-2 border-white/20 border-b-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white italic font-arcade">2</span>
              <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-widest">SILVER</span>
            </div>
          </div>
        )}

        {/* 1st Place (Gold Champion) */}
        {firstPlace && (
          <div className="flex flex-col items-center flex-1 -mt-6">
            <div className="mb-2 flex flex-col items-center">
              <Trophy className="w-8 h-8 text-[#cc3333] animate-bounce mb-1" />
              <CharacterPortrait id={firstPlace.charId} size={80} className="ring-4 ring-[#cc3333]" />
              <span className="text-sm font-black italic uppercase text-white mt-1.5 truncate max-w-[120px] font-arcade">{firstPlace.name}</span>
            </div>
            <div className="w-full h-36 sm:h-48 bg-[#cc3333] border-4 border-white border-b-0 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(204,51,51,0.4)]">
              <span className="text-5xl font-black text-black italic font-arcade">1</span>
              <span className="text-xs font-black text-black font-mono tracking-widest uppercase">CHAMPION</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {thirdPlace && (
          <div className="flex flex-col items-center flex-1">
            <div className="mb-2 flex flex-col items-center">
              <CharacterPortrait id={thirdPlace.charId} size={54} className="ring-2 ring-white/20" />
              <span className="text-xs font-black italic uppercase text-white mt-1.5 truncate max-w-[80px] font-arcade">{thirdPlace.name}</span>
            </div>
            <div className="w-full h-18 sm:h-24 bg-[#161616] border-2 border-[#cc3333]/40 border-b-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-[#cc3333] italic font-arcade">3</span>
              <span className="text-[10px] font-mono text-[#cc3333] uppercase font-bold tracking-widest">BRONZE</span>
            </div>
          </div>
        )}
      </div>

      {/* REWARD CARD & MARS BUCKS EARNED */}
      <div className="w-full max-w-xl bg-[#161616] border-2 border-[#cc3333] p-4 sm:p-5 flex items-center justify-between shadow-[6px_6px_0px_0px_#cc3333] my-2 z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-[#0c0c0c] border border-[#cc3333] flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-[#cc3333]" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">PRIZE PURSE</span>
            <span className="text-2xl font-black text-white font-mono">+${earnedCash.toLocaleString()} <span className="text-xs text-[#cc3333]">BUCKS</span></span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">ACCUMULATED BALANCE</span>
          <span className="text-xl font-bold font-mono text-white">${totalCash.toLocaleString()}</span>
        </div>
      </div>

      {/* FULL STANDINGS LIST */}
      <div className="w-full max-w-xl bg-[#161616] border border-white/10 p-3 space-y-1.5 my-2 z-10">
        {sorted.map((racer) => (
          <div
            key={racer.id}
            className={`flex items-center justify-between p-2.5 text-xs transition-all ${
              racer.isPlayer
                ? 'bg-[#0c0c0c] border-l-4 border-[#cc3333] text-white font-bold'
                : 'text-zinc-400 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-5 text-center font-mono font-bold text-white">{racer.rank}</span>
              <CharacterPortrait id={racer.charId} size={28} />
              <span className="font-arcade italic uppercase text-white">{racer.name}</span>
              {racer.isPlayer && (
                <span className="text-[9px] font-mono font-bold text-black uppercase px-2 py-0.5 bg-[#cc3333]">
                  YOU
                </span>
              )}
            </div>
            <span className="font-mono text-zinc-400">{racer.lap >= 3 ? 'FINISHED' : `LAP ${racer.lap}`}</span>
          </div>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 w-full max-w-xl z-10">
        <button
          onClick={onGoToGarage}
          className="flex-1 py-4 px-6 bg-white text-black font-black uppercase text-sm skew-x-[-15deg] shadow-[6px_6px_0px_0px_#cc3333] hover:bg-[#cc3333] hover:text-white transition-all cursor-pointer font-arcade flex items-center justify-center gap-2"
        >
          <Wrench className="w-5 h-5 skew-x-[15deg]" />
          <span className="inline-block skew-x-[15deg]">CHARLEY'S WORKSHOP</span>
        </button>

        <button
          onClick={onPlayAgain}
          className="py-4 px-6 bg-[#161616] border border-white/20 hover:border-[#cc3333] text-white text-sm font-black uppercase skew-x-[-15deg] transition-all cursor-pointer font-arcade flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4 text-[#cc3333] skew-x-[15deg]" />
          <span className="inline-block skew-x-[15deg]">REPLAY</span>
        </button>

        <button
          onClick={onMainMenu}
          className="py-4 px-6 bg-[#0c0c0c] border border-white/10 hover:border-white/40 text-zinc-400 hover:text-white text-sm font-black uppercase skew-x-[-15deg] transition-all cursor-pointer font-arcade"
        >
          <span className="inline-block skew-x-[15deg]">MAIN MENU</span>
        </button>
      </div>
    </div>
  );
};
