import React from 'react';
import { ArrowLeft, ArrowRight, Wifi, Users, Play } from 'lucide-react';

interface MultiplayerRoomProps {
  roomCode: string;
  playerName: string;
  users: { id: string; name: string; color: string }[];
  socketConnected: boolean;
  onBack: () => void;
  onStart: () => void;
  onChangeRoomCode: (code: string) => void;
  onChangePlayerName: (name: string) => void;
  onJoin: () => void;
  onCreate: () => void;
}

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({
  roomCode,
  playerName,
  users,
  socketConnected,
  onBack,
  onStart,
  onChangeRoomCode,
  onChangePlayerName,
  onJoin,
  onCreate,
}) => {
  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col bg-[#0c0c0c] text-[#f0f0f0] overflow-y-auto p-6 sm:p-10 font-sans select-none box-border">
      <div className="absolute inset-0 bg-artistic-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 -right-8 text-[220px] font-black text-white/5 select-none leading-none pointer-events-none font-arcade">
        NET
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
              NETWORK LOBBY
            </div>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase font-arcade">
              SERVER <span className="text-[#cc3333]">MATCH</span>
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-right font-mono text-xs uppercase text-zinc-400">
          <Wifi className="w-4 h-4 text-[#cc3333]" />
          <span>online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 z-10">
        <div className="bg-[#161616] border border-white/10 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#cc3333]">
            <Users className="w-4 h-4" />
            <span>room setup</span>
          </div>

          <label className="block">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">player name</div>
            <input
              value={playerName}
              onChange={(e) => onChangePlayerName(e.target.value)}
              className="w-full bg-[#0c0c0c] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#cc3333]"
            />
          </label>

          <label className="block">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">room code</div>
            <input
              value={roomCode}
              maxLength={6}
              onChange={(e) => onChangeRoomCode(e.target.value.toUpperCase())}
              className="w-full bg-[#0c0c0c] border border-white/10 px-4 py-3 text-white uppercase outline-none focus:border-[#cc3333]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCreate}
              disabled={!socketConnected}
              className="py-3 bg-[#cc3333] text-white font-black uppercase text-xs tracking-[0.2em] hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              create room
            </button>
            <button
              onClick={onJoin}
              disabled={!socketConnected}
              className="py-3 border border-white/20 bg-white/5 text-white font-black uppercase text-xs tracking-[0.2em] hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              join room
            </button>
          </div>
        </div>

        <div className="bg-[#161616] border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#cc3333]">
              connected racers
            </div>
            <div className="text-xs font-mono text-zinc-400">{users.length}/2</div>
          </div>

          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-sm text-zinc-400 uppercase tracking-[0.2em] font-mono">waiting for players...</div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex items-center justify-between border border-white/10 bg-[#0c0c0c] px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
                    <span className="font-bold uppercase text-white">{user.name}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-zinc-500">ready</span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={onStart}
            disabled={users.length < 2}
            className="mt-6 w-full py-4 px-6 bg-white text-black font-black uppercase text-base skew-x-[-15deg] shadow-[6px_6px_0px_0px_#cc3333] hover:bg-[#cc3333] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="inline-block skew-x-[15deg] flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              start race
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
