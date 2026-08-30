import React from 'react';
import { GameMode } from '../types';
import { CharacterPortrait } from './CharacterPortraits';
import { Play, Trophy, Swords, Wrench, HelpCircle, Volume2, VolumeX, Flame } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface TitleScreenProps {
  onStartMode: (mode: GameMode) => void;
  onOpenDashboard: () => void;
  onOpenGarage: () => void;
  marsBucks: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartMode,
  onOpenDashboard,
  onOpenGarage,
  marsBucks,
}) => {
  const [showHowToPlay, setShowHowToPlay] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  const handleModeClick = (mode: GameMode) => {
    soundEngine.playItemPickup();
    soundEngine.announce("Let's Rock and Ride!");
    onStartMode(mode);
  };

  const handleToggleMute = () => {
    const m = soundEngine.toggleMute();
    setIsMuted(m);
  };

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col justify-between bg-[#0c0c0c] text-[#f0f0f0] overflow-y-auto p-6 sm:p-10 font-sans select-none box-border">
      {/* BACKGROUND GRAPHIC DOT GRID & WATERMARK */}
      <div className="absolute inset-0 bg-artistic-grid opacity-10 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#cc3333] rounded-full blur-[150px] opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 -right-12 text-[260px] font-black text-white/5 select-none leading-none pointer-events-none font-arcade">
        09
      </div>

      {/* TOP HEADER: Martian Liberation Front & Network Encryption */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-8 border-[#cc3333] pb-5 mb-6 z-10 gap-4">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-[#cc3333] mb-1 font-mono">
            Martian Liberation Front &bull; 1993 SNES Remake
          </span>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tighter leading-[0.85] uppercase font-arcade">
            Biker<span className="text-[#cc3333]">Mice</span>
          </h1>
          <span className="text-lg sm:text-xl font-bold tracking-widest text-zinc-400 mt-1 uppercase">
            FROM MARS
          </span>
        </div>

        {/* Top Right: Mars Bucks & Network Encryption Status */}
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHowToPlay(true)}
              className="px-3 py-1.5 bg-[#161616] border border-white/10 hover:border-[#cc3333] text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#cc3333]" />
              <span>CONTROLS</span>
            </button>

            <button
              onClick={handleToggleMute}
              className="p-1.5 bg-[#161616] border border-white/10 hover:border-[#cc3333] text-zinc-300 transition-all"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#cc3333]" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>

          <div className="text-left sm:text-right mt-1">
            <div className="text-[10px] uppercase tracking-widest text-[#cc3333] font-mono font-bold opacity-90">
              RESERVE BALANCE &bull; NETWORK ENCRYPTED
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
              ${marsBucks.toLocaleString()} <span className="text-xs font-mono text-[#cc3333]">BUCKS</span>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: SQUAD HIGHLIGHT + DNA AUTH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto z-10">
        {/* LEFT: The Squad Skewed Banner & Squad Portraits */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="p-3 bg-[#cc3333] text-black font-black uppercase skew-x-[-15deg] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] w-fit mb-1">
            <span className="inline-block skew-x-[15deg] text-base sm:text-lg tracking-wider font-arcade">
              The Martian Squad
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="border-l-8 border-[#cc3333] p-3.5 bg-[#161616] flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-tight">Field Commander</div>
                <div className="text-xl font-black italic text-white font-arcade">THROTTLE</div>
              </div>
              <CharacterPortrait id="throttle" size={44} className="ring-2 ring-[#cc3333]" />
            </div>

            <div className="border-l-8 border-white/20 p-3 bg-[#161616] flex items-center justify-between opacity-80 hover:opacity-100 hover:border-[#cc3333] transition-all">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-tight">Heavy Ordnance</div>
                <div className="text-xl font-black italic text-zinc-300 font-arcade">MODO</div>
              </div>
              <CharacterPortrait id="modo" size={40} />
            </div>

            <div className="border-l-8 border-white/20 p-3 bg-[#161616] flex items-center justify-between opacity-80 hover:opacity-100 hover:border-[#cc3333] transition-all">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-tight">Infiltration Lead</div>
                <div className="text-xl font-black italic text-zinc-300 font-arcade">VINNIE</div>
              </div>
              <CharacterPortrait id="vinnie" size={40} />
            </div>
          </div>
        </div>

        {/* CENTER/RIGHT: Mission Modes & Launch Controls */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-block border border-[#cc3333] p-1">
              <div className="bg-[#cc3333] text-black px-3 py-1 text-xs font-black uppercase tracking-tighter font-mono">
                AUTHENTICATION VERIFIED &bull; READY TO ROCK
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              TARGET: LAWRENCE LIMBURGER
            </span>
          </div>

          {/* 4 MODE CARDS with Artistic Flair Skewed Brutalist Styling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mode 1: Story Campaign */}
            <button
              onClick={() => handleModeClick('story')}
              className="group p-5 bg-[#161616] border border-white/10 hover:border-[#cc3333] hover:shadow-[6px_6px_0px_0px_#cc3333] flex flex-col justify-between text-left transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#cc3333] font-bold uppercase tracking-widest">
                  ACT 01 - 05 &bull; BOSS MISSIONS
                </span>
                <Play className="w-5 h-5 text-[#cc3333] group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-black italic text-white uppercase font-arcade group-hover:text-[#cc3333]">
                STORY CAMPAIGN
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Liberate Mars, thwart Plutarkian plunder, and defeat Limburger's syndicate.
              </p>
            </button>

            {/* Mode 2: Grand Prix */}
            <button
              onClick={() => handleModeClick('grand_prix')}
              className="group p-5 bg-[#161616] border border-white/10 hover:border-[#cc3333] hover:shadow-[6px_6px_0px_0px_#cc3333] flex flex-col justify-between text-left transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#cc3333] font-bold uppercase tracking-widest">
                  CIRCUIT CHAMPIONSHIP
                </span>
                <Trophy className="w-5 h-5 text-[#cc3333] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-black italic text-white uppercase font-arcade group-hover:text-[#cc3333]">
                GRAND PRIX
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                High-speed isometric cup across 5 hazardous circuits for the Martian Trophy.
              </p>
            </button>

            {/* Mode 3: Battle Arena */}
            <button
              onClick={() => handleModeClick('battle_arena')}
              className="group p-5 bg-[#161616] border border-white/10 hover:border-[#cc3333] hover:shadow-[6px_6px_0px_0px_#cc3333] flex flex-col justify-between text-left transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#cc3333] font-bold uppercase tracking-widest">
                  DEMOLITION DERBY
                </span>
                <Swords className="w-5 h-5 text-[#cc3333] group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-xl font-black italic text-white uppercase font-arcade group-hover:text-[#cc3333]">
                BATTLE ARENA
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Missiles, crude oil traps, and brutal ramming combat in a locked deathmatch.
              </p>
            </button>

            {/* Mode 4: Local Multiplayer */}
            <button
              onClick={() => handleModeClick('multiplayer')}
              className="group p-5 bg-[#161616] border border-white/10 hover:border-[#cc3333] hover:shadow-[6px_6px_0px_0px_#cc3333] flex flex-col justify-between text-left transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#cc3333] font-bold uppercase tracking-widest">
                  2-PLAYER SPLIT CONTROLS
                </span>
                <Flame className="w-5 h-5 text-[#cc3333] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-black italic text-white uppercase font-arcade group-hover:text-[#cc3333]">
                LOCAL MULTIPLAYER
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Race head-to-head on one device with keyboard control for both bikes.
              </p>
            </button>

            {/* Mode 5: Real Server Match */}
            <button
              onClick={() => handleModeClick('multiplayer_server')}
              className="group p-5 bg-[#161616] border border-white/10 hover:border-[#cc3333] hover:shadow-[6px_6px_0px_0px_#cc3333] flex flex-col justify-between text-left transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#cc3333] font-bold uppercase tracking-widest">
                  SERVER LOBBY
                </span>
                <Flame className="w-5 h-5 text-[#cc3333] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-black italic text-white uppercase font-arcade group-hover:text-[#cc3333]">
                SERVER MULTIPLAYER
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Create or join a room on the network server and race against another rider.
              </p>
            </button>

            {/* Mode 6: Last Chance Garage */}
            <button
              onClick={() => {
                soundEngine.playCash();
                onOpenGarage();
              }}
              className="group p-5 bg-[#161616] border border-white/10 hover:border-[#cc3333] hover:shadow-[6px_6px_0px_0px_#cc3333] flex flex-col justify-between text-left transition-all relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-[#cc3333] font-bold uppercase tracking-widest">
                  CHARLEY'S WORKSHOP
                </span>
                <Wrench className="w-5 h-5 text-[#cc3333] group-hover:-rotate-12 transition-transform" />
              </div>
              <h3 className="text-xl font-black italic text-white uppercase font-arcade group-hover:text-[#cc3333]">
                LAST CHANCE GARAGE
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Upgrade engine bores, nitro injectors, titanium ram plates, and paint finishes.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER & TELEMETRY */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 border-t border-white/10 pt-4">
        <div className="flex gap-6 text-[9px] uppercase font-mono font-bold tracking-[0.3em] opacity-50">
          <span>BUILD 1.9.9.3-REV</span>
          <span>CHICAGO SECTOR 4</span>
          <span>ENCRYPTED LINE 04</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleModeClick('grand_prix')}
            className="bg-white text-black px-8 py-3.5 font-black uppercase text-sm skew-x-[-15deg] shadow-[6px_6px_0px_0px_#cc3333] hover:bg-[#cc3333] hover:text-white hover:shadow-[6px_6px_0px_0px_#ffffff] transition-all cursor-pointer font-arcade"
          >
            <span className="inline-block skew-x-[15deg]">LAUNCH MISSION</span>
          </button>
          <button
            onClick={onOpenDashboard}
            className="border-2 border-white/20 hover:border-white px-6 py-3 font-black uppercase text-sm skew-x-[-15deg] text-white/70 hover:text-white transition-all cursor-pointer font-arcade"
          >
            <span className="inline-block skew-x-[15deg]">DASHBOARD</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playCash();
              onOpenGarage();
            }}
            className="border-2 border-white/20 hover:border-white px-6 py-3 font-black uppercase text-sm skew-x-[-15deg] text-white/70 hover:text-white transition-all cursor-pointer font-arcade"
          >
            <span className="inline-block skew-x-[15deg]">GARAGE</span>
          </button>
        </div>
      </div>

      {/* CONTROLS MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-[#0c0c0c]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161616] border-2 border-[#cc3333] p-6 max-w-lg w-full shadow-[10px_10px_0px_0px_rgba(204,51,51,0.3)] space-y-4">
            <div className="flex items-center justify-between border-b-4 border-[#cc3333] pb-3">
              <h3 className="text-xl font-black text-white italic uppercase font-arcade">PILOT MANUAL & CONTROLS</h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-zinc-400 hover:text-white font-mono text-sm uppercase"
              >
                [ CLOSE ]
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 font-sans">
              <div className="grid grid-cols-2 gap-2 bg-[#0c0c0c] p-3 border border-white/10">
                <div>
                  <span className="font-bold text-[#cc3333] block font-mono">W / UP ARROW</span>
                  <span>Accelerate Gas</span>
                </div>
                <div>
                  <span className="font-bold text-[#cc3333] block font-mono">S / DOWN ARROW</span>
                  <span>Brake / Reverse</span>
                </div>
                <div>
                  <span className="font-bold text-[#cc3333] block font-mono">A / D or LEFT / RIGHT</span>
                  <span>Steer Left / Right</span>
                </div>
                <div>
                  <span className="font-bold text-white block font-mono">SHIFT / DRIFT BUTTON</span>
                  <span>Drift & Charge Mini-Turbo</span>
                </div>
                <div>
                  <span className="font-bold text-[#cc3333] block font-mono">SPACEBAR</span>
                  <span>Fire Primary Blaster</span>
                </div>
                <div>
                  <span className="font-bold text-white block font-mono">E / X / SPECIAL BUTTON</span>
                  <span>Fire Special Weapon</span>
                </div>
                <div>
                  <span className="font-bold text-[#cc3333] block font-mono">C / V or KEYS 1-5</span>
                  <span>Switch Camera Perspective</span>
                </div>
              </div>

              <div className="p-3 bg-[#cc3333]/10 border border-[#cc3333] font-mono text-xs">
                <span className="font-bold text-[#cc3333] block">PRO TIP FROM CHARLEY:</span>
                <span>Hold Drift around sharp turns to charge your mini-turbo sparks (Yellow ➔ Blue), then release for a massive speed surge!</span>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 bg-[#cc3333] text-black font-black uppercase tracking-wider font-arcade skew-x-[-15deg] shadow-[4px_4px_0px_0px_#ffffff]"
            >
              <span className="inline-block skew-x-[15deg]">AUTHENTICATED &bull; LET'S RIDE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
