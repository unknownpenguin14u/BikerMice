/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  GameMode, 
  GameScreen, 
  Character, 
  Track, 
  UpgradeState, 
  RacerEntity, 
  WeaponType 
} from './types';
import { CHARACTERS } from './data/characters';
import { TRACKS } from './data/tracks';
import { STORY_CHAPTERS } from './data/campaign';
import { soundEngine } from './audio/soundEngine';
import { RacingEngine, CameraMode } from './game/racingEngine';

import { TitleScreen } from './components/TitleScreen';
import { Dashboard } from './components/Dashboard';
import { CharacterSelect } from './components/CharacterSelect';
import { TrackSelect } from './components/TrackSelect';
import { GarageView } from './components/GarageView';
import { GameHUD } from './components/GameHUD';
import { BattleArenaHUD } from './components/BattleArenaHUD';
import { StoryCutscene } from './components/StoryCutscene';
import { PodiumView } from './components/PodiumView';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerRoom } from './components/MultiplayerRoom';
import { io, Socket } from 'socket.io-client';

export default function App() {
  // Game Navigation & Mode
  const [screen, setScreen] = useState<GameScreen>('title');
  const [gameMode, setGameMode] = useState<GameMode>('grand_prix');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [cutsceneType, setCutsceneType] = useState<'intro' | 'outro'>('intro');

  // Selected Character & Track
  const [selectedChar, setSelectedChar] = useState<Character>(CHARACTERS[0]);
  const [selectedTrack, setSelectedTrack] = useState<Track>(TRACKS[0]);
  const [multiplayerP1, setMultiplayerP1] = useState<Character>(CHARACTERS[0]);
  const [multiplayerP2, setMultiplayerP2] = useState<Character>(CHARACTERS[1] || CHARACTERS[0]);
  const [roomCode, setRoomCode] = useState('MARS');
  const [playerName, setPlayerName] = useState('Player 1');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [multiplayerConnected, setMultiplayerConnected] = useState(false);
  const [multiplayerRoomUsers, setMultiplayerRoomUsers] = useState<{ id: string; name: string; color: string }[]>([]);

  // Persistent Player Profile & Upgrades (Saved to localStorage)
  const [marsBucks, setMarsBucks] = useState<number>(() => {
    const saved = localStorage.getItem('bmfm_mars_bucks');
    return saved ? parseInt(saved, 10) : 1500;
  });

  const [upgrades, setUpgrades] = useState<UpgradeState>(() => {
    const saved = localStorage.getItem('bmfm_upgrades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      engine: 1,
      tires: 1,
      armor: 1,
      nitro: 1,
      weapons: 1,
      bikeSkin: '#ef4444',
    };
  });

  const [roster, setRoster] = useState<Character[]>(() => {
    const saved = localStorage.getItem('bmfm_roster');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return CHARACTERS;
  });

  // Racing State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<RacingEngine | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playerEntity, setPlayerEntity] = useState<RacerEntity | null>(null);
  const [allRacers, setAllRacers] = useState<RacerEntity[]>([]);
  const [countdown, setCountdown] = useState(3.5);
  const [skillWindowTime, setSkillWindowTime] = useState(0);
  const [raceTime, setRaceTime] = useState(0);
  const [battleTimeLeft, setBattleTimeLeft] = useState(120); // 2 min arena battle
  const [standings, setStandings] = useState<RacerEntity[]>([]);
  const [earnedPrize, setEarnedPrize] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return 'close_action';
    }
    return 'side_view';
  });
  const [graphicsQuality, setGraphicsQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [videoBrightness, setVideoBrightness] = useState(100);
  const [motionBlurEnabled, setMotionBlurEnabled] = useState(true);
  const [crtFilterEnabled, setCrtFilterEnabled] = useState(true);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('bmfm_mars_bucks', marsBucks.toString());
  }, [marsBucks]);

  useEffect(() => {
    localStorage.setItem('bmfm_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    localStorage.setItem('bmfm_roster', JSON.stringify(roster));
  }, [roster]);

  useEffect(() => {
    if (screen === 'title') {
      soundEngine.startMusic('title');
    }
  }, [screen]);

  useEffect(() => {
    if (!gameMode || (gameMode !== 'multiplayer' && gameMode !== 'multiplayer_server')) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const socketUrl = import.meta.env.VITE_SOCKET_URL || origin;
    const client = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true,
    });
    setSocket(client);

    client.on('connect', () => setMultiplayerConnected(true));
    client.on('disconnect', () => setMultiplayerConnected(false));
    client.on('room-state', (payload) => {
      setMultiplayerRoomUsers(payload.players || []);
      if (payload?.config?.trackId) {
        const track = TRACKS.find((t) => t.id === payload.config.trackId);
        if (track) setSelectedTrack(track);
      }
    });
    client.on('room-config', ({ trackId }) => {
      const track = TRACKS.find((t) => t.id === trackId);
      if (track) setSelectedTrack(track);
    });
    client.on('race-state', ({ racers }) => {
      const engine = engineRef.current;
      if (!engine || !Array.isArray(racers)) return;
      const localPlayer = engine.getPlayerEntity();
      const remote = racers.find((racer) => racer.socketId !== client.id && racer.id !== localPlayer?.id);
      if (!remote) return;
      engine.applyRemoteRacerState(remote);
    });
    client.on('remote-input', ({ socketId, input }) => {
      if (!input || socketId === client.id) return;
      const engine = engineRef.current;
      if (!engine) return;
      engine.keysP2.up = !!input.up;
      engine.keysP2.down = !!input.down;
      engine.keysP2.left = !!input.left;
      engine.keysP2.right = !!input.right;
      engine.keysP2.drift = !!input.drift;
      engine.keysP2.firePrimary = !!input.firePrimary;
      engine.keysP2.fireSpecial = !!input.fireSpecial;
    });
    client.on('race-start', (payload) => {
      if (payload?.roomCode && payload.roomCode !== roomCode) return;
      if (payload?.trackId) {
        const track = TRACKS.find((t) => t.id === payload.trackId);
        if (track) setSelectedTrack(track);
      }
      setScreen('race');
    });

    return () => {
      client.disconnect();
      setSocket(null);
    };
  }, [gameMode]);

  const handleCreateOrJoinRoom = (mode: 'create' | 'join') => {
    if (!socket || !socket.connected) return;
    const nextCode = roomCode.trim().toUpperCase() || 'MARS';
    const payload = {
      roomCode: nextCode,
      playerName: playerName || (mode === 'create' ? 'Player 1' : 'Player 2'),
      color: mode === 'create' ? '#cc3333' : '#2dd4bf',
    };
    if (mode === 'create') socket.emit('create-room', payload);
    else socket.emit('join-room', payload);
    socket.emit('room-config', {
      roomCode: nextCode,
      trackId: selectedTrack.id,
      playerCharId: selectedChar.id,
    });
    setRoomCode(nextCode);
    setScreen('multiplayer_room');
  };

  // Start Racing / Battle Game Loop
  useEffect(() => {
    if (screen === 'race' && gameMode === 'multiplayer_server' && socket && socket.connected && roomCode) {
      const syncRaceState = () => {
        const engine = engineRef.current;
        if (!engine) return;
        const player = engine.getPlayerEntity();
        if (player) {
          socket.emit('client-race-state', {
            roomCode,
            racerState: {
              ...player,
              socketId: socket.id,
            },
          });
        }
        socket.emit('input-state', {
          roomCode,
          input: {
            up: engine.keys.up,
            down: engine.keys.down,
            left: engine.keys.left,
            right: engine.keys.right,
            drift: engine.keys.drift,
            firePrimary: engine.keys.firePrimary,
            fireSpecial: engine.keys.fireSpecial,
          },
        });
      };
      const interval = window.setInterval(syncRaceState, 50);
      return () => window.clearInterval(interval);
    }

    if (screen !== 'race' && screen !== 'battle') {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      return;
    }

    if (!canvasRef.current) return;

    // Apply Upgrades to Character Stats
    const upgradedChar: Character = {
      ...selectedChar,
      bikeColor: upgrades.bikeSkin || selectedChar.bikeColor,
      stats: {
        ...selectedChar.stats,
        topSpeed: selectedChar.stats.topSpeed + (upgrades.engine - 1) * 15,
        acceleration: selectedChar.stats.acceleration + (upgrades.nitro - 1) * 15,
        handling: selectedChar.stats.handling + (upgrades.tires - 1) * 15,
        armor: selectedChar.stats.armor + (upgrades.armor - 1) * 20,
      }
    };

    const isBattle = screen === 'battle';
    const localMultiplayer = gameMode === 'multiplayer';
    soundEngine.startMusic(isBattle ? 'boss' : 'race');

    const engine = new RacingEngine(canvasRef.current, {
      track: selectedTrack,
      playerChar: upgradedChar,
      allRacers: roster,
      isBattleMode: isBattle,
      localMultiplayer,
      stopOpponentsAtFinish: true,
      onLapComplete: (racerId, lap, totalLaps) => {
        // Optional lap audio or banter
      },
      onRaceFinish: (finalStandings) => {
        setStandings(finalStandings);
        const playerRank = finalStandings.find(s => s.isPlayer)?.rank || 6;
        let reward = 500;
        if (playerRank === 1) reward = 2500;
        else if (playerRank === 2) reward = 1500;
        else if (playerRank === 3) reward = 1000;

        setEarnedPrize(reward);
        setMarsBucks(prev => prev + reward);

        // If story mode and won, unlock character
        if (gameMode === 'story' && playerRank === 1) {
          const ch = STORY_CHAPTERS[currentChapterIndex];
          if (ch?.unlockCharacterId) {
            setRoster(prev => prev.map(c => c.id === ch.unlockCharacterId ? { ...c, unlocked: true } : c));
          }
        }

        setTimeout(() => {
          if (gameMode === 'story' && playerRank === 1) {
            setCutsceneType('outro');
            setScreen('story_cutscene');
          } else {
            setScreen('podium');
          }
        }, 1200);
      }
    });

    engineRef.current = engine;

    const isPhone = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (isPhone) {
      engine.setCameraMode('close_action');
      engine.adjustPositionOffset(30);
      setCameraMode('close_action');
    }

    engine.start();

    // UI Tick interval for HUD synchronization
    const syncInterval = window.setInterval(() => {
      if (!engineRef.current) return;
      const p = engineRef.current.getPlayerEntity();
      if (p) setPlayerEntity({ ...p });
      setAllRacers([...engineRef.current.getRacers()]);
      setCountdown(engineRef.current.getCountdown());
      setSkillWindowTime(engineRef.current.getSkillWindowTime());
      setRaceTime(engineRef.current.getRaceTime());

      if (isBattle) {
        setBattleTimeLeft(prev => {
          if (prev <= 1) {
            // Arena finished
            const sorted = [...engineRef.current!.getRacers()].sort((a, b) => b.kills - a.kills);
            setStandings(sorted);
            const playerKills = p?.kills || 0;
            const reward = 1000 + playerKills * 500;
            setEarnedPrize(reward);
            setMarsBucks(b => b + reward);
            setScreen('podium');
            return 0;
          }
          return prev - 0.1;
        });
      }
    }, 50);

    // Keyboard Event Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      if (e.repeat) return;

      const key = e.key.toLowerCase();
      const engine = engineRef.current;

      if (gameMode === 'multiplayer') {
        if (key === 'w') engine.keys.up = true;
        if (key === 's') engine.keys.down = true;
        if (key === 'a') engine.keys.left = true;
        if (key === 'd') engine.keys.right = true;
        if (key === 'shift') engine.keys.drift = true;
        if (key === ' ') engine.keys.firePrimary = true;
        if (key === 'e' || key === 'x') engine.keys.fireSpecial = true;

        if (key === 'i') engine.keysP2.up = true;
        if (key === 'k') engine.keysP2.down = true;
        if (key === 'j') engine.keysP2.left = true;
        if (key === 'l') engine.keysP2.right = true;
        if (key === 'm') engine.keysP2.drift = true;
        if (key === 'o') engine.keysP2.firePrimary = true;
        if (key === 'p') engine.keysP2.fireSpecial = true;
      } else {
        if (key === 'w' || key === 'arrowup') engine.keys.up = true;
        if (key === 's' || key === 'arrowdown') engine.keys.down = true;
        if (key === 'a' || key === 'arrowleft') engine.keys.left = true;
        if (key === 'd' || key === 'arrowright') engine.keys.right = true;
        if (key === 'shift') engine.keys.drift = true;
        if (key === ' ') engine.keys.firePrimary = true;
        if (key === 'e' || key === 'x') engine.keys.fireSpecial = true;
      }
      
      // Camera perspective shortcuts
      if (key === 'c' || key === 'v') {
        const nextMode = engine.cycleCameraMode();
        setCameraMode(nextMode);
      }
      if (key === '1') {
        engineRef.current.setCameraMode('side_view');
        setCameraMode('side_view');
      }
      if (key === '2') {
        engineRef.current.setCameraMode('chase_3d');
        setCameraMode('chase_3d');
      }
      if (key === '3') {
        engineRef.current.setCameraMode('snes_classic');
        setCameraMode('snes_classic');
      }
      if (key === '4') {
        engineRef.current.setCameraMode('top_down');
        setCameraMode('top_down');
      }
      if (key === '5') {
        engineRef.current.setCameraMode('close_action');
        setCameraMode('close_action');
      }
      if (key === '6') {
        engineRef.current.setCameraMode('wide_tactical');
        setCameraMode('wide_tactical');
      }
      if (key === '=' || key === '+' || key === ']') {
        engineRef.current.adjustZoom(0.1);
      }
      if (key === '-' || key === '_' || key === '[') {
        engineRef.current.adjustZoom(-0.1);
      }
      if (key === '0') {
        engineRef.current.resetZoom();
      }
      if (key === '8') {
        engineRef.current.adjustPositionOffset(25);
      }
      if (key === '9') {
        engineRef.current.adjustPositionOffset(-25);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const key = e.key.toLowerCase();
      const engine = engineRef.current;

      if (gameMode === 'multiplayer') {
        if (key === 'w') engine.keys.up = false;
        if (key === 's') engine.keys.down = false;
        if (key === 'a') engine.keys.left = false;
        if (key === 'd') engine.keys.right = false;
        if (key === 'shift') engine.keys.drift = false;
        if (key === ' ') engine.keys.firePrimary = false;
        if (key === 'e' || key === 'x') engine.keys.fireSpecial = false;

        if (key === 'i') engine.keysP2.up = false;
        if (key === 'k') engine.keysP2.down = false;
        if (key === 'j') engine.keysP2.left = false;
        if (key === 'l') engine.keysP2.right = false;
        if (key === 'm') engine.keysP2.drift = false;
        if (key === 'o') engine.keysP2.firePrimary = false;
        if (key === 'p') engine.keysP2.fireSpecial = false;
      } else {
        if (key === 'w' || key === 'arrowup') engine.keys.up = false;
        if (key === 's' || key === 'arrowdown') engine.keys.down = false;
        if (key === 'a' || key === 'arrowleft') engine.keys.left = false;
        if (key === 'd' || key === 'arrowright') engine.keys.right = false;
        if (key === 'shift') engine.keys.drift = false;
        if (key === ' ') engine.keys.firePrimary = false;
        if (key === 'e' || key === 'x') engine.keys.fireSpecial = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
    };
  }, [screen, selectedTrack, selectedChar, upgrades, roster, gameMode, currentChapterIndex]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current) {
        engineRef.current.resizeCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handlers for HUD controls
  const handleFireWeapon = (type: WeaponType) => {
    if (engineRef.current) {
      const p = engineRef.current.getPlayerEntity();
      if (p) engineRef.current.fireWeapon(p, type);
    }
  };

  const handleDriftChange = (isDrifting: boolean) => {
    if (engineRef.current) engineRef.current.keys.drift = isDrifting;
  };

  const handleGasChange = (isGas: boolean) => {
    if (engineRef.current) engineRef.current.keys.up = isGas;
  };

  const handleBrakeChange = (isBrake: boolean) => {
    if (engineRef.current) engineRef.current.keys.down = isBrake;
  };

  const handleSteerChange = (dir: 'left' | 'right' | 'none') => {
    if (engineRef.current) {
      engineRef.current.keys.left = dir === 'left';
      engineRef.current.keys.right = dir === 'right';
    }
  };

  const handleTogglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handlePauseResume = () => {
    setIsPaused(false);
  };

  const handlePauseQuit = () => {
    setIsPaused(false);
    setScreen('title');
  };

  const [pauseSubmenu, setPauseSubmenu] = useState<'none' | 'settings' | 'graphics' | 'video'>('none');

  const handlePauseOpenSettings = () => setPauseSubmenu('settings');
  const handlePauseOpenGraphics = () => setPauseSubmenu('graphics');
  const handlePauseOpenVideo = () => setPauseSubmenu('video');
  const handlePauseCloseSubmenu = () => setPauseSubmenu('none');

  const cycleGraphicsQuality = () => {
    setGraphicsQuality(prev => prev === 'low' ? 'medium' : prev === 'medium' ? 'high' : 'low');
  };

  const cycleBrightness = () => {
    setVideoBrightness(prev => (prev === 80 ? 100 : prev === 100 ? 120 : 80));
  };

  const toggleMotionBlur = () => setMotionBlurEnabled(prev => !prev);
  const toggleCrtFilter = () => setCrtFilterEnabled(prev => !prev);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch (error) {
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPaused(isPaused);
    }
  }, [isPaused]);

  const handleToggleCamera = () => {
    if (engineRef.current) {
      const next = engineRef.current.cycleCameraMode();
      setCameraMode(next);
    }
  };

  const handleSelectCameraMode = (mode: CameraMode) => {
    if (engineRef.current) {
      engineRef.current.setCameraMode(mode);
      setCameraMode(mode);
    }
  };

  const handleAdjustZoom = (delta: number) => {
    if (engineRef.current) {
      engineRef.current.adjustZoom(delta);
    }
  };

  const handleResetZoom = () => {
    if (engineRef.current) {
      engineRef.current.resetZoom();
    }
  };

  const handleAdjustOffset = (deltaY: number) => {
    if (engineRef.current) {
      engineRef.current.adjustPositionOffset(deltaY);
    }
  };

  // Upgrades
  const handleUpgrade = (type: keyof Omit<UpgradeState, 'bikeSkin'>, cost: number) => {
    setMarsBucks(prev => prev - cost);
    setUpgrades(prev => ({
      ...prev,
      [type]: Math.min(5, prev[type] + 1),
    }));
  };

  const handleChangeSkin = (skinColor: string) => {
    setUpgrades(prev => ({ ...prev, bikeSkin: skinColor }));
  };

  return (
    <div id="biker-mice-app" className="relative w-screen h-[100dvh] overflow-hidden bg-[#0c0c0c] text-[#f0f0f0] select-none">
      {/* ARTISTIC FLAIR AMBIENT RED GLOW & RADIAL MARS GRID */}
      <div className="absolute inset-0 bg-artistic-grid opacity-15 pointer-events-none z-0" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#cc3333] rounded-full blur-[160px] opacity-20 pointer-events-none z-0" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#cc3333] rounded-full blur-[160px] opacity-15 pointer-events-none z-0" />

      {/* SCANLINE / CRT ARCADE FILTER OVERLAY */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none z-40 opacity-30" />

      {/* 1. TITLE SCREEN */}
      {screen === 'title' && (
        <TitleScreen
          onStartMode={(mode) => {
            setGameMode(mode);
            if (mode === 'story') {
              setCurrentChapterIndex(0);
              setCutsceneType('intro');
              setScreen('story_cutscene');
            } else {
              setScreen('character_select');
            }
          }}
          onOpenDashboard={() => setScreen('dashboard')}
          onOpenGarage={() => setScreen('garage')}
          marsBucks={marsBucks}
        />
      )}

      {/* 2. DASHBOARD */}
      {screen === 'dashboard' && (
        <Dashboard
          selectedChar={selectedChar}
          selectedTrack={selectedTrack}
          marsBucks={marsBucks}
          upgrades={upgrades}
          roster={roster}
          onBack={() => setScreen('title')}
          onLaunchMission={() => setScreen(gameMode === 'battle_arena' ? 'battle' : 'track_select')}
          onOpenGarage={() => setScreen('garage')}
        />
      )}

      {/* 3. STORY CUTSCENE */}
      {screen === 'story_cutscene' && (
        <StoryCutscene
          chapter={STORY_CHAPTERS[currentChapterIndex]}
          type={cutsceneType}
          onComplete={() => {
            if (cutsceneType === 'intro') {
              const ch = STORY_CHAPTERS[currentChapterIndex];
              const trk = TRACKS.find(t => t.id === ch.trackId) || TRACKS[0];
              setSelectedTrack(trk);
              setScreen('race');
            } else {
              // Outro finished -> Next chapter or podium
              if (currentChapterIndex < STORY_CHAPTERS.length - 1) {
                setCurrentChapterIndex(prev => prev + 1);
                setCutsceneType('intro');
                setScreen('story_cutscene');
              } else {
                setScreen('podium');
              }
            }
          }}
        />
      )}

      {/* 3. CHARACTER SELECT */}
      {screen === 'character_select' && (
        <CharacterSelect
          selectedChar={selectedChar}
          onSelectChar={(char) => setSelectedChar(char)}
          onConfirm={() => {
            if (gameMode === 'battle_arena') {
              // Pick arena track
              setSelectedTrack(TRACKS[1]); // Martian Canyons Arena
              setBattleTimeLeft(120);
              setScreen('battle');
            } else if (gameMode === 'multiplayer') {
              setScreen('multiplayer_lobby');
            } else if (gameMode === 'multiplayer_server') {
              setScreen('multiplayer_room');
            } else {
              setScreen('track_select');
            }
          }}
          onBack={() => setScreen('title')}
        />
      )}

      {screen === 'multiplayer_lobby' && (
        <MultiplayerLobby
          playerOne={multiplayerP1}
          playerTwo={multiplayerP2}
          onSelectPlayerOne={(char) => setMultiplayerP1(char)}
          onSelectPlayerTwo={(char) => setMultiplayerP2(char)}
          onConfirm={() => {
            setSelectedChar(multiplayerP1);
            setScreen('multiplayer_room');
          }}
          onBack={() => setScreen('character_select')}
        />
      )}

      {screen === 'multiplayer_room' && (
        <MultiplayerRoom
          roomCode={roomCode}
          playerName={playerName}
          users={multiplayerRoomUsers}
          socketConnected={multiplayerConnected}
          onBack={() => setScreen('multiplayer_lobby')}
          onChangeRoomCode={setRoomCode}
          onChangePlayerName={setPlayerName}
          onCreate={() => handleCreateOrJoinRoom('create')}
          onJoin={() => handleCreateOrJoinRoom('join')}
          onStart={() => {
            if (socket) {
              socket.emit('room-config', {
                roomCode,
                trackId: selectedTrack.id,
                playerCharId: selectedChar.id,
              });
              socket.emit('start-race', { roomCode });
            }
          }}
        />
      )}

      {/* 4. TRACK SELECT */}
      {screen === 'track_select' && (
        <TrackSelect
          selectedTrack={selectedTrack}
          onSelectTrack={(trk) => setSelectedTrack(trk)}
          onConfirm={() => setScreen('race')}
          onBack={() => setScreen('character_select')}
          gameMode={gameMode}
        />
      )}

      {/* 5. CHARLEY'S LAST CHANCE GARAGE */}
      {screen === 'garage' && (
        <GarageView
          playerChar={selectedChar}
          upgrades={upgrades}
          marsBucks={marsBucks}
          onUpgrade={handleUpgrade}
          onChangeSkin={handleChangeSkin}
          onExitGarage={() => setScreen('title')}
        />
      )}

      {/* 6. COMBAT RACE SCREEN */}
      {screen === 'race' && (
        <div
          className="relative w-full h-full"
          style={{
            filter: `brightness(${videoBrightness / 100}) saturate(${graphicsQuality === 'low' ? 0.8 : graphicsQuality === 'medium' ? 1 : 1.25})`,
            imageRendering: graphicsQuality === 'low' ? 'pixelated' : 'auto',
          }}
        >
          <canvas ref={canvasRef} className="w-full h-full block bg-zinc-950 cursor-crosshair" />
          {isPaused && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0c0c0c]/75 backdrop-blur-sm">
              <div className="w-[min(92vw,420px)] rounded-2xl border-2 border-[#cc3333] bg-[#111827]/90 p-5 shadow-[0_0_30px_rgba(204,51,51,0.45)]">
                <div className="mb-4 text-center">
                  <div className="text-[10px] font-mono font-bold tracking-[0.4em] text-[#cc3333] uppercase">Paused</div>
                  <div className="mt-2 text-3xl font-black uppercase text-white">
                    {pauseSubmenu === 'none' ? 'Mission Control' : pauseSubmenu === 'settings' ? 'Settings' : pauseSubmenu === 'graphics' ? 'Graphics' : 'Video'}
                  </div>
                </div>

                {pauseSubmenu === 'none' && (
                  <div className="space-y-3">
                    <button onClick={handlePauseResume} className="w-full rounded-xl border border-[#cc3333] bg-[#cc3333] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110">Resume</button>
                    <button onClick={handlePauseOpenSettings} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Settings</button>
                    <button onClick={handlePauseOpenGraphics} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Graphics</button>
                    <button onClick={handlePauseOpenVideo} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Video</button>
                    <button onClick={handlePauseQuit} className="w-full rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-red-200 transition hover:bg-red-500/20">Quit</button>
                  </div>
                )}

                {pauseSubmenu !== 'none' && (
                  <div className="space-y-3">
                    {pauseSubmenu === 'settings' && (
                      <>
                        <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Sound: On</button>
                        <button onClick={toggleFullscreen} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Fullscreen: {isFullscreen ? 'On' : 'Off'}</button>
                        <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Controls: Keyboard</button>
                        <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Camera: Auto</button>
                      </>
                    )}
                    {pauseSubmenu === 'graphics' && (
                      <>
                        <button onClick={() => { cycleGraphicsQuality(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Quality: {graphicsQuality}</button>
                        <button onClick={() => { toggleCrtFilter(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">CRT Filter: {crtFilterEnabled ? 'On' : 'Off'}</button>
                        <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">V-Sync: On</button>
                      </>
                    )}
                    {pauseSubmenu === 'video' && (
                      <>
                        <button onClick={() => { cycleBrightness(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Brightness: {videoBrightness}%</button>
                        <button onClick={() => { toggleMotionBlur(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Motion Blur: {motionBlurEnabled ? 'On' : 'Off'}</button>
                        <button onClick={() => { toggleCrtFilter(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">CRT Filter: {crtFilterEnabled ? 'On' : 'Off'}</button>
                      </>
                    )}
                    <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-[#cc3333] bg-[#cc3333] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110">Back</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {playerEntity && (
            <GameHUD
              player={playerEntity}
              racers={allRacers}
              track={selectedTrack}
              countdown={countdown}
              skillWindowTime={skillWindowTime}
              raceTime={raceTime}
              isPaused={isPaused}
              cameraMode={cameraMode}
              onToggleCamera={handleToggleCamera}
              onSelectCameraMode={handleSelectCameraMode}
              onAdjustZoom={handleAdjustZoom}
              onResetZoom={handleResetZoom}
              onAdjustOffset={handleAdjustOffset}
              onTogglePause={handleTogglePause}
              onRestart={() => {
                setScreen('title');
                setTimeout(() => setScreen('race'), 100);
              }}
              onFireWeapon={handleFireWeapon}
              onDriftChange={handleDriftChange}
              onGasChange={handleGasChange}
              onBrakeChange={handleBrakeChange}
              onSteerChange={handleSteerChange}
            />
          )}
        </div>
      )}

      {/* 7. BATTLE ARENA DEMOLITION DERBY */}
      {screen === 'battle' && (
        <div
          className="relative w-full h-full"
          style={{
            filter: `brightness(${videoBrightness / 100}) saturate(${graphicsQuality === 'low' ? 0.8 : graphicsQuality === 'medium' ? 1 : 1.25})`,
            imageRendering: graphicsQuality === 'low' ? 'pixelated' : 'auto',
          }}
        >
          <canvas ref={canvasRef} className="w-full h-full block bg-zinc-950 cursor-crosshair" />
          {isPaused && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0c0c0c]/75 backdrop-blur-sm">
              <div className="w-[min(92vw,420px)] rounded-2xl border-2 border-[#cc3333] bg-[#111827]/90 p-5 shadow-[0_0_30px_rgba(204,51,51,0.45)]">
                <div className="mb-4 text-center">
                  <div className="text-[10px] font-mono font-bold tracking-[0.4em] text-[#cc3333] uppercase">Paused</div>
                  <div className="mt-2 text-3xl font-black uppercase text-white">
                    {pauseSubmenu === 'none' ? 'Arena Menu' : pauseSubmenu === 'settings' ? 'Settings' : pauseSubmenu === 'graphics' ? 'Graphics' : 'Video'}
                  </div>
                </div>

                {pauseSubmenu === 'none' && (
                  <div className="space-y-3">
                    <button onClick={handlePauseResume} className="w-full rounded-xl border border-[#cc3333] bg-[#cc3333] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110">Resume</button>
                    <button onClick={handlePauseOpenSettings} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Settings</button>
                    <button onClick={handlePauseOpenGraphics} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Graphics</button>
                    <button onClick={handlePauseOpenVideo} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Video</button>
                    <button onClick={handlePauseQuit} className="w-full rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-red-200 transition hover:bg-red-500/20">Quit</button>
                  </div>
                )}

                {pauseSubmenu !== 'none' && (
                  <div className="space-y-3">
                    {pauseSubmenu === 'settings' && (
                      <>
                        <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Sound: On</button>
                        <button onClick={toggleFullscreen} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Fullscreen: {isFullscreen ? 'On' : 'Off'}</button>
                        <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Controls: Keyboard</button>
                        <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Camera: Auto</button>
                      </>
                    )}
                    {pauseSubmenu === 'graphics' && (
                      <>
                        <button onClick={() => { cycleGraphicsQuality(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Quality: {graphicsQuality}</button>
                        <button onClick={() => { toggleCrtFilter(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">CRT Filter: {crtFilterEnabled ? 'On' : 'Off'}</button>
                        <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">V-Sync: On</button>
                      </>
                    )}
                    {pauseSubmenu === 'video' && (
                      <>
                        <button onClick={() => { cycleBrightness(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Brightness: {videoBrightness}%</button>
                        <button onClick={() => { toggleMotionBlur(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">Motion Blur: {motionBlurEnabled ? 'On' : 'Off'}</button>
                        <button onClick={() => { toggleCrtFilter(); handlePauseCloseSubmenu(); }} className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:bg-white/10">CRT Filter: {crtFilterEnabled ? 'On' : 'Off'}</button>
                      </>
                    )}
                    <button onClick={handlePauseCloseSubmenu} className="w-full rounded-xl border border-[#cc3333] bg-[#cc3333] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition hover:brightness-110">Back</button>
                  </div>
                )}
              </div>
            </div>
          )}
          {playerEntity && (
            <BattleArenaHUD
              player={playerEntity}
              racers={allRacers}
              battleTimeLeft={battleTimeLeft}
              isPaused={isPaused}
              cameraMode={cameraMode}
              onToggleCamera={handleToggleCamera}
              onSelectCameraMode={handleSelectCameraMode}
              onAdjustZoom={handleAdjustZoom}
              onResetZoom={handleResetZoom}
              onAdjustOffset={handleAdjustOffset}
              onTogglePause={handleTogglePause}
              onFireWeapon={handleFireWeapon}
              onDriftChange={handleDriftChange}
              onGasChange={handleGasChange}
              onBrakeChange={handleBrakeChange}
              onSteerChange={handleSteerChange}
            />
          )}
        </div>
      )}

      {/* 8. PODIUM VICTORY & RESULTS */}
      {screen === 'podium' && (
        <PodiumView
          standings={standings.length > 0 ? standings : allRacers}
          playerChar={selectedChar}
          earnedCash={earnedPrize}
          totalCash={marsBucks}
          onGoToGarage={() => setScreen('garage')}
          onPlayAgain={() => setScreen(gameMode === 'battle_arena' ? 'battle' : 'race')}
          onMainMenu={() => setScreen('title')}
        />
      )}
    </div>
  );
}
