import React from 'react';
import { Track } from '../types';
import { TRACKS } from '../data/tracks';
import { ArrowLeft, ArrowRight, Flag, Compass, Flame } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface TrackSelectProps {
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  onConfirm: () => void;
  onBack: () => void;
  gameMode: string;
}

export const TrackSelect: React.FC<TrackSelectProps> = ({
  selectedTrack,
  onSelectTrack,
  onConfirm,
  onBack,
  gameMode,
}) => {
  const handleTrackClick = (track: Track) => {
    soundEngine.playItemPickup();
    onSelectTrack(track);
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'bg-white text-black font-mono font-bold';
      case 'MEDIUM':
        return 'bg-[#cc3333] text-black font-mono font-bold';
      case 'HARD':
        return 'bg-[#cc3333] text-white font-mono font-bold border border-white';
      case 'EXPERT':
        return 'bg-black text-[#cc3333] border-2 border-[#cc3333] font-mono font-bold';
      default:
        return 'bg-[#161616] text-white font-mono';
    }
  };

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col bg-[#0c0c0c] text-[#f0f0f0] overflow-y-auto p-6 sm:p-10 font-sans select-none box-border">
      {/* BACKGROUND DOTS & WATERMARK */}
      <div className="absolute inset-0 bg-artistic-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 -right-8 text-[240px] font-black text-white/5 select-none leading-none pointer-events-none font-arcade">
        CIRCUIT
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
              MISSION DEPLOYMENT ZONE &bull; {gameMode.replace('_', ' ')}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase font-arcade">
              CHOOSE <span className="text-[#cc3333]">CIRCUIT</span>
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right font-mono text-xs">
          <span className="text-zinc-500 font-bold uppercase tracking-widest">MAP SATELLITE</span>
          <span className="text-[#cc3333] font-bold uppercase">5 VENUES DETECTED</span>
        </div>
      </div>

      {/* TRACK GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 z-10">
        {TRACKS.map((track) => {
          const isSelected = selectedTrack.id === track.id;
          return (
            <div
              key={track.id}
              onClick={() => handleTrackClick(track)}
              className={`cursor-pointer p-5 flex flex-col justify-between transition-all relative ${
                isSelected
                  ? 'bg-[#161616] border-2 border-[#cc3333] shadow-[6px_6px_0px_0px_#cc3333]'
                  : 'bg-[#161616]/70 border border-white/10 hover:border-white/40'
              }`}
            >
              <div>
                {/* Track mini canvas preview */}
                <div 
                  className="relative w-full h-36 border border-white/10 flex items-center justify-center overflow-hidden mb-4"
                  style={{ backgroundColor: '#0c0c0c' }}
                >
                  <svg viewBox="0 0 1800 1000" className="w-full h-full p-2 opacity-90">
                    {/* Path stroke */}
                    <path
                      d={`M ${track.path.map(p => `${p.x} ${p.y}`).join(' L ')} Z`}
                      fill="none"
                      stroke="#333333"
                      strokeWidth="110"
                      strokeLinejoin="round"
                    />
                    <path
                      d={`M ${track.path.map(p => `${p.x} ${p.y}`).join(' L ')} Z`}
                      fill="none"
                      stroke={isSelected ? '#cc3333' : '#666666'}
                      strokeWidth="80"
                      strokeLinejoin="round"
                    />
                    {/* Obstacle dots */}
                    {track.obstacles.map((obs, i) => (
                      <circle
                        key={i}
                        cx={obs.x}
                        cy={obs.y}
                        r={obs.radius * 1.5}
                        fill={obs.type === 'boost_pad' ? '#ffffff' : obs.type === 'item_box' ? '#cc3333' : '#ff4444'}
                      />
                    ))}
                  </svg>

                  <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 text-[10px] uppercase ${getDifficultyBadge(track.difficulty)}`}>
                    {track.difficulty}
                  </span>
                </div>

                {/* Info */}
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#cc3333] font-bold mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span className="uppercase">{track.location}</span>
                </div>
                <h3 className="text-xl font-black italic text-white uppercase font-arcade mb-1">{track.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                  {track.description}
                </p>
              </div>

              {/* Bottom Specs */}
              <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono">
                <div className="flex items-center gap-4 text-xs text-zinc-300">
                  <div className="flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-[#cc3333]" />
                    <span>{track.laps} LAPS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-white" />
                    <span>{track.length}M</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-xs font-mono font-bold text-[#cc3333] uppercase">
                    [ SELECTED ]
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CONFIRM BUTTON */}
      <div className="mt-8 flex justify-end z-10">
        <button
          onClick={onConfirm}
          className="w-full sm:w-auto py-4 px-10 bg-white text-black font-black uppercase text-base skew-x-[-15deg] shadow-[6px_6px_0px_0px_#cc3333] hover:bg-[#cc3333] hover:text-white hover:shadow-[6px_6px_0px_0px_#ffffff] transition-all cursor-pointer font-arcade flex items-center justify-center gap-3"
        >
          <span className="inline-block skew-x-[15deg]">START ENGINES &bull; HIT THE TRACK</span>
          <ArrowRight className="w-5 h-5 inline-block skew-x-[15deg]" />
        </button>
      </div>
    </div>
  );
};
