import React from 'react';
import { Character } from '../types';
import { CHARACTERS } from '../data/characters';
import { CharacterPortrait } from './CharacterPortraits';
import { ArrowLeft, ArrowRight, Swords, Trophy } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface MultiplayerLobbyProps {
  playerOne: Character;
  playerTwo: Character;
  onSelectPlayerOne: (char: Character) => void;
  onSelectPlayerTwo: (char: Character) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  playerOne,
  playerTwo,
  onSelectPlayerOne,
  onSelectPlayerTwo,
  onConfirm,
  onBack,
}) => {
  const renderRoster = (selected: Character, onSelect: (char: Character) => void, label: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#cc3333]">
        <Swords className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CHARACTERS.map((char) => {
          const selectedChar = selected.id === char.id;
          return (
            <button
              key={char.id}
              onClick={() => {
                soundEngine.playItemPickup();
                onSelect(char);
              }}
              className={`p-3 text-left border transition-all ${
                selectedChar
                  ? 'border-[#cc3333] bg-[#161616] shadow-[4px_4px_0px_0px_#cc3333]'
                  : 'border-white/10 bg-[#161616]/70 hover:border-white/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <CharacterPortrait id={char.id} size={48} className={selectedChar ? 'ring-2 ring-[#cc3333]' : ''} />
                <div>
                  <div className="text-xs font-mono text-zinc-400 uppercase">{char.nickname}</div>
                  <div className="text-base font-black italic text-white uppercase font-arcade">{char.name}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col bg-[#0c0c0c] text-[#f0f0f0] overflow-y-auto p-6 sm:p-10 font-sans select-none box-border">
      <div className="absolute inset-0 bg-artistic-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 -right-8 text-[220px] font-black text-white/5 select-none leading-none pointer-events-none font-arcade">
        VS
      </div>

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
              LOCAL SHOWDOWN
            </div>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase font-arcade">
              MULTI<span className="text-[#cc3333]">PLAYER</span>
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-right font-mono text-xs uppercase text-zinc-400">
          <Trophy className="w-4 h-4 text-[#cc3333]" />
          <span>2-player race</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 z-10">
        <div className="bg-[#161616] border border-white/10 p-4">
          {renderRoster(playerOne, onSelectPlayerOne, 'Player 1')}
        </div>
        <div className="bg-[#161616] border border-white/10 p-4">
          {renderRoster(playerTwo, onSelectPlayerTwo, 'Player 2')}
        </div>
      </div>

      <div className="mt-8 flex justify-end z-10">
        <button
          onClick={onConfirm}
          className="w-full sm:w-auto py-4 px-10 bg-white text-black font-black uppercase text-base skew-x-[-15deg] shadow-[6px_6px_0px_0px_#cc3333] hover:bg-[#cc3333] hover:text-white transition-all cursor-pointer font-arcade flex items-center justify-center gap-3"
        >
          <span className="inline-block skew-x-[15deg]">READY TO RACE</span>
          <ArrowRight className="w-5 h-5 inline-block skew-x-[15deg]" />
        </button>
      </div>
    </div>
  );
};
