import React, { useState } from 'react';
import { RacerEntity, Track, WeaponType, CameraMode } from '../types';
import { Zap, Shield, Flame, Target, Disc, Volume2, VolumeX, Pause, Play, Camera, ChevronDown, ZoomIn, ZoomOut, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface GameHUDProps {
  player: RacerEntity;
  racers: RacerEntity[];
  track: Track;
  countdown: number;
  skillWindowTime: number;
  raceTime: number;
  isPaused: boolean;
  cameraMode?: CameraMode;
  onToggleCamera?: () => void;
  onSelectCameraMode?: (mode: CameraMode) => void;
  onAdjustZoom?: (delta: number) => void;
  onResetZoom?: () => void;
  onAdjustOffset?: (delta: number) => void;
  onTogglePause: () => void;
  onRestart: () => void;
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

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  racers,
  track,
  countdown,
  skillWindowTime,
  raceTime,
  isPaused,
  cameraMode = 'chase_3d',
  onToggleCamera,
  onSelectCameraMode,
  onAdjustZoom,
  onResetZoom,
  onAdjustOffset,
  onTogglePause,
  onRestart,
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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs * 100) % 100);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms < 10 ? '0' : ''}${ms}`;
  };

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'ST';
    if (rank === 2) return 'ND';
    if (rank === 3) return 'RD';
    return 'TH';
  };

  const speedKmh = Math.floor(Math.abs(player.speed) * 0.9);
  const rpmPercent = Math.min(100, (Math.abs(player.speed) / player.maxSpeed) * 100);
  const skillActive = skillWindowTime > 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1 sm:p-4 md:p-6 select-none font-sans box-border">
      {/* TOP BAR: Position, Laps, Time, Control Buttons */}
      <div className="flex items-start justify-between w-full z-10 gap-1.5">
        {/* LEFT: Position & Lap Badge */}
        <div className="flex items-center gap-1 scale-[0.75] origin-top-left sm:scale-100 sm:gap-3">
          {/* Position Emblem */}
          <div className="bg-[#161616] border-2 border-[#cc3333] px-1.5 py-1 sm:px-4 sm:py-2 flex items-baseline gap-1 shadow-[3px_3px_0px_0px_#cc3333] sm:shadow-[4px_4px_0px_0px_#cc3333]">
            <span className="text-lg sm:text-5xl font-black italic text-white font-arcade">
              {player.rank}
            </span>
            <span className="text-[7px] sm:text-sm font-mono font-bold text-[#cc3333]">
              {getRankSuffix(player.rank)}
            </span>
          </div>

          {/* Lap Counter */}
          <div className="bg-[#161616] border border-white/20 px-1 sm:px-4 py-0.5 sm:py-2 shadow-md">
            <div className="text-[5px] sm:text-[9px] text-[#cc3333] font-mono font-bold tracking-widest uppercase">LAP</div>
            <div className="text-xs sm:text-2xl font-black text-white flex items-center gap-1 font-arcade">
              <span className={player.lap >= track.laps ? 'text-[#cc3333] animate-pulse' : 'text-white'}>
                {Math.min(player.lap, track.laps)}
              </span>
              <span className="text-zinc-500 text-[8px] sm:text-sm">/ {track.laps}</span>
            </div>
          </div>
        </div>

        {/* CENTER: Track Title & Timer */}
        <div className="hidden sm:flex flex-col items-center bg-[#161616] border border-white/20 px-6 py-2">
          <span className="text-[10px] font-mono font-bold text-[#cc3333] tracking-widest uppercase">{track.name}</span>
          <span className="text-xl font-mono font-bold text-white tracking-widest">{formatTime(raceTime)}</span>
        </div>

        {/* RIGHT: Weapon Slot & Settings buttons */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto scale-[0.8] origin-top-right sm:scale-100">
          {/* Active Weapon Inventory Card */}
          <div className="relative bg-[#161616] border-2 border-[#cc3333] px-1 py-0.5 sm:px-3 sm:py-1.5 flex items-center gap-1 sm:gap-2.5 shadow-[2px_2px_0px_0px_#cc3333] sm:shadow-[3px_3px_0px_0px_#cc3333]">
            <div className="flex flex-col items-end">
              <span className="text-[5px] sm:text-[9px] text-[#cc3333] font-mono font-bold tracking-wider uppercase">ORD</span>
              <span className="text-[7px] sm:text-xs font-bold text-white uppercase font-mono">
                {player.currentWeapon ? player.currentWeapon.replace('_', ' ') : 'Blaster'}
              </span>
            </div>

            <div className="w-6 h-6 sm:w-10 sm:h-10 bg-[#0c0c0c] border border-white/20 flex items-center justify-center text-[#cc3333]">
              {player.currentWeapon === 'homing_missile' && <Target className="w-6 h-6 text-[#cc3333] animate-pulse" />}
              {player.currentWeapon === 'turbo_nitro' && <Flame className="w-6 h-6 text-white" />}
              {player.currentWeapon === 'shield' && <Shield className="w-6 h-6 text-[#cc3333]" />}
              {player.currentWeapon === 'oil_slick' && <Disc className="w-6 h-6 text-zinc-300" />}
              {player.currentWeapon === 'earthquake' && <Zap className="w-6 h-6 text-white" />}
              {(!player.currentWeapon || player.currentWeapon === 'blaster') && <Zap className="w-5 h-5 text-[#cc3333]" />}
            </div>

            {player.weaponAmmo > 0 && player.currentWeapon && (
              <span className="absolute -top-2 -right-2 bg-[#cc3333] text-black text-xs font-mono font-bold w-5 h-5 flex items-center justify-center border border-white">
                {player.weaponAmmo}
              </span>
            )}
          </div>

          {/* Camera View Mode Selector / Toggle Button */}
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
                className="h-8 sm:h-10 px-2 sm:px-3 bg-[#161616] hover:bg-[#cc3333] hover:text-black border border-white/20 flex items-center gap-1 sm:gap-1.5 text-white transition-all cursor-pointer group"
                title="Click: Cycle View (C/V) | Keys: 1-5"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#cc3333] group-hover:text-black" />
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

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-[#161616] hover:bg-[#cc3333] hover:text-black border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-[#cc3333]" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onTogglePause}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-[#161616] hover:bg-[#cc3333] hover:text-black border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            title="Pause Game"
          >
            {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* COUNTDOWN OVERLAY */}
      {countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center">
            <span className="text-8xl sm:text-[140px] font-black italic tracking-tighter text-[#cc3333] font-arcade drop-shadow-[0_10px_30px_rgba(204,51,51,0.9)] animate-pulse">
              {Math.ceil(countdown) > 0 ? Math.ceil(countdown) : 'GO!'}
            </span>
            <span className="text-xl sm:text-2xl text-white font-mono font-bold tracking-widest mt-2 uppercase">
              {Math.ceil(countdown) === 1 ? 'REV THOSE ENGINES!' : 'STAND BY FOR GREEN'}
            </span>
          </div>
        </div>
      )}

      {skillActive && (
        <div className="absolute inset-x-0 top-20 flex justify-center pointer-events-none z-20">
          <div className="bg-[#161616]/90 border border-[#cc3333] px-4 py-2 shadow-[4px_4px_0px_0px_rgba(204,51,51,0.35)]">
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.32em] text-[#cc3333]">Skill Window</div>
            <div className="text-lg font-arcade text-white">{skillWindowTime.toFixed(1)}s</div>
          </div>
        </div>
      )}

      {/* BOTTOM BAR: Speedometer, Mini-map, and Mobile Touch Controls */}
      <div className="flex items-end justify-between w-full z-10 gap-2">
        <div className="flex items-end gap-1.5 sm:gap-3 pointer-events-auto">
          {/* LEFT: Speedometer & Tachometer */}
          <div className="bg-[#161616] border-2 border-white/20 p-1 sm:p-4 flex flex-col gap-1 w-20 sm:w-44 md:w-56 shadow-2xl">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base sm:text-4xl font-black text-white italic tracking-tight font-arcade">
                {speedKmh}
              </span>
              <span className="text-[7px] sm:text-xs text-[#cc3333] font-bold tracking-wider">KM/H</span>
            </div>

            <div className="w-full h-1.5 sm:h-2 bg-[#0c0c0c] overflow-hidden border border-white/10">
              <div
                className={`h-full transition-all duration-75 ${
                  rpmPercent > 85 ? 'bg-[#cc3333]' : 'bg-white'
                }`}
                style={{ width: `${rpmPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[6px] sm:text-[10px] font-mono text-zinc-400">
              <span>DRIFT: {player.isDrifting ? 'ENGAGED' : 'OFF'}</span>
              <span className={player.boostTimer > 0 ? 'text-[#cc3333] font-bold animate-pulse' : 'text-zinc-500'}>
                {player.boostTimer > 0 ? 'TURBO' : 'NOMINAL'}
              </span>
            </div>
          </div>

          {/* RIGHT: Mobile Touch Buttons placed beside speed readout */}
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
        </div>

        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto">
          <button
            onMouseDown={() => onDriftChange(true)}
            onMouseUp={() => onDriftChange(false)}
            onTouchStart={() => onDriftChange(true)}
            onTouchEnd={() => onDriftChange(false)}
            className="w-11 h-11 sm:w-16 sm:h-16 bg-[#161616] hover:bg-[#cc3333] hover:text-black active:bg-[#cc3333] active:text-black text-white font-mono font-bold text-[8px] sm:text-[10px] flex flex-col items-center justify-center border-2 border-white/40 select-none cursor-pointer touch-manipulation"
          >
            <span>DRIFT</span>
          </button>

          <button
            onClick={() => onFireWeapon(player.currentWeapon || 'blaster')}
            className="w-11 h-11 sm:w-16 sm:h-16 bg-[#cc3333] hover:bg-white hover:text-black active:bg-white active:text-black text-black font-mono font-black text-[8px] sm:text-[10px] flex flex-col items-center justify-center border-2 border-white shadow-[2px_2px_0px_0px_#ffffff] sm:shadow-[3px_3px_0px_0px_#ffffff] select-none cursor-pointer touch-manipulation"
          >
            <span>FIRE</span>
          </button>

          <div className="flex flex-col gap-1">
            <button
              onMouseDown={() => onGasChange(true)}
              onMouseUp={() => onGasChange(false)}
              onTouchStart={() => onGasChange(true)}
              onTouchEnd={() => onGasChange(false)}
              className="w-12 h-8 sm:w-18 sm:h-14 bg-white hover:bg-[#cc3333] hover:text-white active:bg-[#cc3333] text-black font-mono font-black text-[9px] sm:text-sm flex items-center justify-center border-2 border-black select-none cursor-pointer touch-manipulation"
            >
              GAS
            </button>
            <button
              onMouseDown={() => onBrakeChange(true)}
              onMouseUp={() => onBrakeChange(false)}
              onTouchStart={() => onBrakeChange(true)}
              onTouchEnd={() => onBrakeChange(false)}
              className="w-12 h-7 sm:w-18 sm:h-12 bg-[#161616] hover:bg-[#cc3333] hover:text-black active:bg-[#cc3333] text-zinc-300 font-mono font-bold text-[7px] sm:text-[10px] flex items-center justify-center border border-white/20 select-none cursor-pointer touch-manipulation"
            >
              BRAKE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
