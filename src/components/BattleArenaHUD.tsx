import React, { useState } from 'react';
import { RacerEntity, WeaponType, CameraMode } from '../types';
import { Shield, Flame, Target, Disc, Zap, Heart, Skull, Volume2, VolumeX, Pause, Play, Camera, ChevronDown, ZoomIn, ZoomOut, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface BattleArenaHUDProps {
  player: RacerEntity;
  racers: RacerEntity[];
  battleTimeLeft: number;
  isPaused: boolean;
  cameraMode?: CameraMode;
  onToggleCamera?: () => void;
  onSelectCameraMode?: (mode: CameraMode) => void;
  onAdjustZoom?: (delta: number) => void;
  onResetZoom?: () => void;
  onAdjustOffset?: (delta: number) => void;
  onTogglePause: () => void;
  onFireWeapon: (type: WeaponType) => void;
  onDriftChange: (isDrifting: boolean) => void;
  onGasChange: (isGas: boolean) => void;
  onBrakeChange: (isBrake: boolean) => void;
  onSteerChange: (dir: 'left' | 'right' | 'none') => void;
}

const CAMERA_MODES_LIST: { id: CameraMode; label: string; key: string }[] = [
  { id: 'side_view', label: 'SIDE-VIEW PROFILE', key: '1' },
  { id: 'chase_3d', label: '3D CHASE (BEHIND)', key: '2' },
  { id: 'snes_classic', label: 'SNES 2.5D ISOMETRIC', key: '3' },
  { id: 'top_down', label: 'TOP-DOWN TACTICAL', key: '4' },
  { id: 'close_action', label: 'ACTION BUMPER', key: '5' },
  { id: 'wide_tactical', label: 'AERIAL BROADCAST', key: '6' },
];

export const BattleArenaHUD: React.FC<BattleArenaHUDProps> = ({
  player,
  racers,
  battleTimeLeft,
  isPaused,
  cameraMode = 'chase_3d',
  onToggleCamera,
  onSelectCameraMode,
  onAdjustZoom,
  onResetZoom,
  onAdjustOffset,
  onTogglePause,
  onFireWeapon,
  onDriftChange,
  onGasChange,
  onBrakeChange,
  onSteerChange,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1 sm:p-4 md:p-6 select-none font-sans box-border">
      {/* TOP: Health, Kills, Time Left, Menu */}
      <div className="flex items-start justify-between w-full z-10 gap-1.5">
        {/* Player Health Bar */}
        <div className="bg-[#161616] border-2 border-[#cc3333] p-1 sm:p-3 shadow-[3px_3px_0px_0px_#cc3333] sm:shadow-[4px_4px_0px_0px_#cc3333] flex flex-col gap-1 w-28 sm:w-52 md:w-64 scale-[0.75] origin-top-left sm:scale-100">
          <div className="flex items-center justify-between text-[7px] sm:text-xs font-mono font-bold">
            <span className="flex items-center gap-1 text-[#cc3333]">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-[#cc3333] text-[#cc3333]" />
              HULL
            </span>
            <span className="text-white">{Math.round(player.health)}%</span>
          </div>

          <div className="w-full h-1.5 sm:h-3 bg-[#0c0c0c] overflow-hidden border border-white/20">
            <div
              className={`h-full transition-all duration-150 ${
                player.health > 50
                  ? 'bg-white'
                  : player.health > 25
                  ? 'bg-[#cc3333]'
                  : 'bg-[#cc3333] animate-pulse'
              }`}
              style={{ width: `${player.health}%` }}
            />
          </div>
        </div>

        {/* Center: Arena Timer & Mode */}
        <div className="flex flex-col items-center bg-[#161616] border-2 border-white/20 px-1.5 py-0.5 sm:px-6 sm:py-2 shadow-lg scale-[0.8] origin-top sm:scale-100">
          <span className="text-[6px] sm:text-[10px] font-mono font-bold text-[#cc3333] tracking-widest uppercase">ARENA</span>
          <span className="text-sm sm:text-3xl font-black text-white tracking-widest font-mono">
            {formatTimer(battleTimeLeft)}
          </span>
        </div>

        {/* Right: Kills & Settings */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto scale-[0.8] origin-top-right sm:scale-100">
          {/* Kill Counter */}
          <div className="bg-[#161616] border-2 border-[#cc3333] px-1 py-1 sm:px-4 sm:py-2 flex items-center gap-1 sm:gap-2 shadow-[2px_2px_0px_0px_#cc3333] sm:shadow-[3px_3px_0px_0px_#cc3333]">
            <Skull className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-[#cc3333]" />
            <div className="flex flex-col items-end">
              <span className="text-[6px] sm:text-[9px] font-mono font-bold text-zinc-400 uppercase">KILLS</span>
              <span className="text-xs sm:text-xl font-black text-white font-mono">{player.kills || 0}</span>
            </div>
          </div>

          {!window.matchMedia('(max-width: 768px)').matches && (
            <div className="relative">
              <button
                onClick={() => {
                  if (onToggleCamera) onToggleCamera();
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowCameraMenu(!showCameraMenu);
                }}
                className="h-10 px-3 bg-[#161616] hover:bg-[#cc3333] hover:text-black border border-white/20 flex items-center gap-1.5 text-white transition-all cursor-pointer group"
                title="Click: Cycle View (C/V) | Keys: 1-5"
              >
                <Camera className="w-4 h-4 text-[#cc3333] group-hover:text-black" />
                <span className="hidden sm:inline text-[10px] font-mono font-bold uppercase tracking-wider">
                  {cameraMode === 'chase_3d' ? '3D CHASE' :
                   cameraMode === 'snes_classic' ? 'SNES 2.5D' :
                   cameraMode === 'top_down' ? 'TOP-DOWN' :
                   cameraMode === 'close_action' ? 'CLOSE CAM' : 'WIDE CAM'}
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCameraMenu(!showCameraMenu);
                  }}
                  className="hover:bg-white/20 p-0.5 rounded ml-0.5 cursor-pointer"
                  title="Open Camera Menu"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black" />
                </span>
              </button>

              {/* Quick Camera Mode Dropdown Menu */}
              {showCameraMenu && (
                <div className="absolute right-0 top-12 w-64 bg-[#161616] border-2 border-[#cc3333] p-2 shadow-[4px_4px_0px_0px_#000] z-50 flex flex-col gap-2">
                  <div className="text-[10px] font-mono font-bold text-[#cc3333] uppercase px-1 pb-1 border-b border-white/10 flex justify-between">
                    <span>CAMERA PERSPECTIVE</span>
                    <span>KEYS 1-6</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {CAMERA_MODES_LIST.map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => {
                          if (onSelectCameraMode) {
                            onSelectCameraMode(mode.id);
                          } else if (onToggleCamera) {
                            onToggleCamera();
                          }
                          setShowCameraMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-xs font-mono font-bold flex items-center justify-between transition-colors ${
                          cameraMode === mode.id
                            ? 'bg-[#cc3333] text-black'
                            : 'text-zinc-200 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span>{mode.label}</span>
                        <span className="text-[10px] opacity-75">[{mode.key}]</span>
                      </button>
                    ))}
                  </div>

                  {/* Fine Zoom & View Position Tweaks */}
                  <div className="border-t border-white/10 pt-2 flex flex-col gap-1.5 font-mono">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase flex justify-between">
                      <span>ZOOM / POSITION ADJUST</span>
                      <span>KEYS +/- & 8/9</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => onAdjustZoom && onAdjustZoom(-0.15)}
                        className="px-2 py-1 bg-[#0c0c0c] hover:bg-[#cc3333] hover:text-black border border-white/20 text-xs flex items-center justify-center gap-1 text-zinc-200"
                        title="Zoom Out (Hotkey: - or [)"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                        <span>-</span>
                      </button>
                      <button
                        onClick={() => onResetZoom && onResetZoom()}
                        className="px-2 py-1 bg-[#0c0c0c] hover:bg-white hover:text-black border border-white/20 text-xs flex items-center justify-center gap-1 text-zinc-200"
                        title="Reset Camera (Hotkey: 0)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>100%</span>
                      </button>
                      <button
                        onClick={() => onAdjustZoom && onAdjustZoom(0.15)}
                        className="px-2 py-1 bg-[#0c0c0c] hover:bg-[#cc3333] hover:text-black border border-white/20 text-xs flex items-center justify-center gap-1 text-zinc-200"
                        title="Zoom In (Hotkey: + or ])"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>+</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        onClick={() => onAdjustOffset && onAdjustOffset(-30)}
                        className="px-2 py-1 bg-[#0c0c0c] hover:bg-[#cc3333] hover:text-black border border-white/20 text-[11px] flex items-center justify-center gap-1 text-zinc-200"
                        title="Shift View Forward / Up (Hotkey: 9)"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>VIEW AHEAD</span>
                      </button>
                      <button
                        onClick={() => onAdjustOffset && onAdjustOffset(30)}
                        className="px-2 py-1 bg-[#0c0c0c] hover:bg-[#cc3333] hover:text-black border border-white/20 text-[11px] flex items-center justify-center gap-1 text-zinc-200"
                        title="Shift View Closer / Down (Hotkey: 8)"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        <span>VIEW LOWER</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleToggleMute}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-[#161616] hover:bg-[#cc3333] hover:text-black border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-[#cc3333]" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={onTogglePause}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-[#161616] hover:bg-[#cc3333] hover:text-black border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* BOTTOM CONTROLS & WEAPON */}
      <div className="flex items-end justify-between w-full z-10 gap-2">
        {/* Active Weapon */}
        <div className="bg-[#161616] border-2 border-[#cc3333] p-2 sm:p-3 flex items-center gap-2 sm:gap-3 shadow-[4px_4px_0px_0px_#cc3333]">
          <div className="w-8 h-8 sm:w-11 sm:h-11 bg-[#0c0c0c] border border-white/20 flex items-center justify-center text-[#cc3333]">
            {player.currentWeapon === 'homing_missile' && <Target className="w-4 h-4 sm:w-6 sm:h-6 text-[#cc3333]" />}
            {player.currentWeapon === 'turbo_nitro' && <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
            {player.currentWeapon === 'shield' && <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-[#cc3333]" />}
            {player.currentWeapon === 'oil_slick' && <Disc className="w-4 h-4 sm:w-6 sm:h-6 text-zinc-300" />}
            {player.currentWeapon === 'earthquake' && <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}
            {(!player.currentWeapon || player.currentWeapon === 'blaster') && <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#cc3333]" />}
          </div>
          <div>
            <span className="text-[8px] sm:text-[10px] font-mono font-bold text-[#cc3333] uppercase tracking-widest block">ORDNANCE</span>
            <span className="text-[10px] sm:text-xs font-bold text-white uppercase font-mono">
              {player.currentWeapon ? player.currentWeapon.replace('_', ' ') : 'Blaster'}
            </span>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto">
          <div className="flex items-center gap-1 bg-[#161616] p-1 border border-white/20">
            <button
              onMouseDown={() => onSteerChange('left')}
              onMouseUp={() => onSteerChange('none')}
              onTouchStart={() => onSteerChange('left')}
              onTouchEnd={() => onSteerChange('none')}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0c0c0c] hover:bg-[#cc3333] active:bg-[#cc3333] text-white active:text-black font-bold text-base sm:text-lg flex items-center justify-center border border-white/20 select-none cursor-pointer touch-manipulation"
            >
              ◀
            </button>
            <button
              onMouseDown={() => onSteerChange('right')}
              onMouseUp={() => onSteerChange('none')}
              onTouchStart={() => onSteerChange('right')}
              onTouchEnd={() => onSteerChange('none')}
              className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0c0c0c] hover:bg-[#cc3333] active:bg-[#cc3333] text-white active:text-black font-bold text-base sm:text-lg flex items-center justify-center border border-white/20 select-none cursor-pointer touch-manipulation"
            >
              ▶
            </button>
          </div>

          <button
            onClick={() => onFireWeapon(player.currentWeapon || 'blaster')}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-[#cc3333] hover:bg-white hover:text-black active:bg-white active:text-black text-black font-mono font-black text-[9px] sm:text-[10px] flex flex-col items-center justify-center border-2 border-white shadow-[3px_3px_0px_0px_#ffffff] select-none cursor-pointer touch-manipulation"
          >
            FIRE
          </button>

          <div className="flex flex-col gap-1">
            <button
              onMouseDown={() => onGasChange(true)}
              onMouseUp={() => onGasChange(false)}
              onTouchStart={() => onGasChange(true)}
              onTouchEnd={() => onGasChange(false)}
              className="w-14 h-10 sm:w-16 sm:h-12 bg-white hover:bg-[#cc3333] hover:text-white active:bg-[#cc3333] text-black font-mono font-black text-xs sm:text-sm flex items-center justify-center border-2 border-black select-none cursor-pointer touch-manipulation"
            >
              GAS
            </button>
            <button
              onMouseDown={() => onBrakeChange(true)}
              onMouseUp={() => onBrakeChange(false)}
              onTouchStart={() => onBrakeChange(true)}
              onTouchEnd={() => onBrakeChange(false)}
              className="w-14 h-8 sm:w-16 sm:h-10 bg-[#161616] hover:bg-[#cc3333] hover:text-black active:bg-[#cc3333] text-zinc-300 font-mono font-bold text-[9px] sm:text-[10px] flex items-center justify-center border border-white/20 select-none cursor-pointer touch-manipulation"
            >
              REVERSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
