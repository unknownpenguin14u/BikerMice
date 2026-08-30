import React from 'react';
import { Character } from '../types';
import { CHARACTERS } from '../data/characters';
import { CharacterPortrait } from './CharacterPortraits';
import { Volume2, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface CharacterSelectProps {
  selectedChar: Character;
  onSelectChar: (char: Character) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedChar,
  onSelectChar,
  onConfirm,
  onBack,
}) => {
  const handleCharClick = (char: Character) => {
    if (!char.unlocked) {
      soundEngine.playBeep(false);
      return;
    }
    soundEngine.playItemPickup();
    onSelectChar(char);
    if (char.voiceLine) {
      soundEngine.announce(char.voiceLine);
    }
  };

  const handlePlayVoice = (e: React.MouseEvent, voiceLine: string) => {
    e.stopPropagation();
    soundEngine.announce(voiceLine);
  };

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col bg-[#0c0c0c] text-[#f0f0f0] overflow-y-auto p-6 sm:p-10 font-sans select-none box-border">
      {/* BACKGROUND DOTS & WATERMARK */}
      <div className="absolute inset-0 bg-artistic-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 -right-10 text-[240px] font-black text-white/5 select-none leading-none pointer-events-none font-arcade">
        DNA
      </div>

      {/* HEADER */}
      <div className="flex items-center justify-between border-b-8 border-[#cc3333] pb-5 mb-6 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-[#161616] border border-white/10 hover:border-[#cc3333] text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#cc3333]">
              PILOT SELECTION PROTOCOL
            </div>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase font-arcade">
              CHOOSE YOUR <span className="text-[#cc3333]">RACER</span>
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right font-mono text-xs">
          <span className="text-zinc-500 font-bold uppercase tracking-widest">SQUAD RECON</span>
          <span className="text-[#cc3333] font-bold uppercase">6 OPERATIVES LOADED</span>
        </div>
      </div>

      {/* ROSTER & SHOWCASE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 z-10">
        {/* LEFT: Character Select Grid */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
              OPERATIVE ROSTER
            </span>
            <span className="text-[10px] font-mono text-[#cc3333] font-bold uppercase">
              SELECT TO INSPECT
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CHARACTERS.map((char) => {
              const isSelected = selectedChar.id === char.id;
              return (
                <div
                  key={char.id}
                  onClick={() => handleCharClick(char)}
                  className={`relative cursor-pointer p-4 flex flex-col items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-[#161616] border-2 border-[#cc3333] shadow-[6px_6px_0px_0px_#cc3333]'
                      : 'bg-[#161616]/70 border border-white/10 hover:border-white/40'
                  } ${!char.unlocked ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                >
                  <CharacterPortrait id={char.id} size={64} className={isSelected ? 'ring-2 ring-[#cc3333]' : ''} />

                  <div className="text-center w-full">
                    <h4 className="text-sm font-black italic text-white uppercase truncate font-arcade">{char.name}</h4>
                    <span className="text-[10px] font-mono text-zinc-400 block truncate">
                      {char.nickname}
                    </span>
                  </div>

                  {!char.unlocked && (
                    <div className="absolute inset-0 bg-[#0c0c0c]/85 flex flex-col items-center justify-center gap-1">
                      <Lock className="w-5 h-5 text-[#cc3333]" />
                      <span className="text-[9px] font-mono text-[#cc3333] font-bold uppercase tracking-tighter">LOCKED</span>
                    </div>
                  )}

                  {isSelected && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#cc3333]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Detailed Character Showcase */}
        <div className="lg:col-span-6 bg-[#161616] border border-white/10 p-6 sm:p-7 flex flex-col justify-between shadow-2xl relative">
          <div>
            {/* Top Identity & Audio Quote */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <CharacterPortrait id={selectedChar.id} size={72} className="ring-2 ring-[#cc3333]" />
                <div>
                  <span className="text-[10px] font-mono text-[#cc3333] uppercase tracking-wider font-bold block">
                    {selectedChar.role === 'protagonist' ? 'MARTIAN FREEDOM FIGHTER' : 'PLUTARKIAN SYNDICATE'}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-white italic uppercase font-arcade">
                    {selectedChar.name}
                  </h2>
                  <p className="text-xs font-mono text-zinc-400">{selectedChar.nickname}</p>
                </div>
              </div>

              {/* Voice button */}
              <button
                onClick={(e) => handlePlayVoice(e, selectedChar.voiceLine)}
                className="p-2.5 bg-[#0c0c0c] border border-[#cc3333] hover:bg-[#cc3333] hover:text-black text-[#cc3333] transition-all cursor-pointer flex items-center gap-1.5"
                title="Play Voice Line"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-[10px] font-mono font-bold uppercase">VOICE</span>
              </button>
            </div>

            {/* Quote Box */}
            <div className="mt-4 p-3 bg-[#0c0c0c] border-l-4 border-[#cc3333]">
              <p className="text-xs font-sans italic text-zinc-300">
                "{selectedChar.quote}"
              </p>
            </div>

            {/* Bio */}
            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
              {selectedChar.bio}
            </p>

            {/* Signature Bike & Weapon */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#0c0c0c] border border-white/10 p-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">SUPER-BIKE</span>
                <span className="text-xs font-bold text-white uppercase">{selectedChar.bikeName}</span>
              </div>
              <div className="bg-[#0c0c0c] border border-white/10 p-3">
                <span className="text-[10px] font-mono text-[#cc3333] uppercase tracking-wider block font-bold">WEAPON LOADOUT</span>
                <span className="text-xs font-bold text-[#cc3333] uppercase">{selectedChar.stats.specialWeaponId.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Stat Bars with Artistic Flair Clean Red Indicators */}
            <div className="space-y-3 mt-5 font-mono">
              {/* Top Speed */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">TOP VELOCITY</span>
                  <span className="text-white font-bold">{selectedChar.stats.topSpeed} KM/H</span>
                </div>
                <div className="h-2 bg-white/10 w-full overflow-hidden">
                  <div className="h-full bg-[#cc3333]" style={{ width: `${(selectedChar.stats.topSpeed / 250) * 100}%` }} />
                </div>
              </div>

              {/* Acceleration */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">ACCELERATION</span>
                  <span className="text-white font-bold">{selectedChar.stats.acceleration} PTS</span>
                </div>
                <div className="h-2 bg-white/10 w-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${(selectedChar.stats.acceleration / 250) * 100}%` }} />
                </div>
              </div>

              {/* Handling */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">DRIFT & TRACTION</span>
                  <span className="text-white font-bold">{selectedChar.stats.handling} PTS</span>
                </div>
                <div className="h-2 bg-white/10 w-full overflow-hidden">
                  <div className="h-full bg-[#cc3333]" style={{ width: `${(selectedChar.stats.handling / 250) * 100}%` }} />
                </div>
              </div>

              {/* Armor */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">ARMOR PLATING</span>
                  <span className="text-white font-bold">{selectedChar.stats.armor} PTS</span>
                </div>
                <div className="h-2 bg-white/10 w-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${(selectedChar.stats.armor / 280) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            onClick={onConfirm}
            className="mt-6 py-4 px-8 bg-white text-black font-black uppercase text-base skew-x-[-15deg] shadow-[6px_6px_0px_0px_#cc3333] hover:bg-[#cc3333] hover:text-white hover:shadow-[6px_6px_0px_0px_#ffffff] transition-all cursor-pointer font-arcade flex items-center justify-center gap-3"
          >
            <span className="inline-block skew-x-[15deg]">LOCK IN OPERATIVE &bull; PROCEED</span>
            <ArrowRight className="w-5 h-5 inline-block skew-x-[15deg]" />
          </button>
        </div>
      </div>
    </div>
  );
};
