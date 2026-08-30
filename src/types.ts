export type GameMode = 'story' | 'grand_prix' | 'battle_arena' | 'time_attack' | 'multiplayer' | 'multiplayer_server';

export type GameScreen = 
  | 'title' 
  | 'dashboard'
  | 'mode_select' 
  | 'character_select' 
  | 'multiplayer_lobby'
  | 'multiplayer_room'
  | 'track_select' 
  | 'story_cutscene' 
  | 'garage' 
  | 'race' 
  | 'battle' 
  | 'podium' 
  | 'settings';

export interface RacerStats {
  topSpeed: number;     // base top speed (pixels/sec or units)
  acceleration: number; // rate to reach top speed
  handling: number;     // turn sharpness & drift control
  armor: number;        // defense against ramming & weapons
  specialWeaponId: WeaponType;
}

export type WeaponType = 
  | 'blaster' 
  | 'homing_missile' 
  | 'oil_slick' 
  | 'turbo_nitro' 
  | 'earthquake' 
  | 'shield' 
  | 'mutagen_bomb';

export interface Character {
  id: string;
  name: string;
  nickname: string;
  role: 'protagonist' | 'villain' | 'ally';
  bio: string;
  quote: string;
  voiceLine: string;
  bikeName: string;
  bikeColor: string;
  accentColor: string;
  glowColor: string;
  stats: RacerStats;
  portrait: string; // SVG or procedural avatar
  unlocked: boolean;
}

export interface UpgradeState {
  engine: number;       // 1-5
  tires: number;        // 1-5
  armor: number;        // 1-5
  nitro: number;        // 1-5
  weapons: number;      // 1-5
  bikeSkin: string;     // color palette id
}

export interface TrackPoint {
  x: number;
  y: number;
  width?: number;
  isJump?: boolean;
  isBoost?: boolean;
  surface?: 'asphalt' | 'dirt' | 'metal' | 'slime';
}

export interface TrackObstacle {
  x: number;
  y: number;
  radius: number;
  type: 'oil' | 'rock' | 'barrier' | 'boost_pad' | 'item_box' | 'jump_ramp';
  active?: boolean;
  respawnTime?: number;
  duration?: number;
}

export interface Track {
  id: string;
  name: string;
  location: string;
  description: string;
  theme: 'chicago' | 'mars' | 'sewers' | 'speedway' | 'fortress';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  laps: number;
  length: number;
  bgColor: string;
  trackColor: string;
  curbColor: string;
  path: TrackPoint[];
  obstacles: TrackObstacle[];
  previewGradient: string[];
}

export interface Projectile {
  id: string;
  type: WeaponType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ownerId: string;
  targetId?: string;
  life: number;
  maxLife: number;
  damage: number;
  angle: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  type?: 'spark' | 'smoke' | 'fire' | 'debris' | 'shockwave';
}

export interface RacerEntity {
  id: string;
  charId: string;
  name: string;
  isPlayer: boolean;
  isPlayerTwo?: boolean;
  x: number;
  y: number;
  z: number;            // for jumping
  vz: number;
  angle: number;
  targetAngle: number;
  speed: number;
  maxSpeed: number;
  accel: number;
  handling: number;
  armor: number;
  health: number;
  maxHealth: number;
  lap: number;
  checkpointIndex: number;
  distToNextCheckpoint: number;
  totalDistance: number;
  rank: number;
  spinoutTimer: number;
  boostTimer: number;
  shieldTimer: number;
  currentWeapon: WeaponType | null;
  weaponAmmo: number;
  isDrifting: boolean;
  driftPower: number;
  color: string;
  accentColor: string;
  score: number;
  kills: number;
  impactCooldown: number;
  collisionLockTimer: number;
  activeBanters?: { text: string; timer: number };
}

export interface StoryChapter {
  id: number;
  title: string;
  location: string;
  trackId: string;
  bossCharId?: string;
  storyIntro: {
    speaker: string;
    avatar: string;
    text: string;
  }[];
  storyOutro: {
    speaker: string;
    avatar: string;
    text: string;
  }[];
  rewardCash: number;
  unlockCharacterId?: string;
}

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  touchControls: boolean;
  crtFilter: boolean;
  cameraSmoothing: number;
  autoGas: boolean;
}

export type CameraMode = 'side_view' | 'chase_3d' | 'snes_classic' | 'top_down' | 'close_action' | 'wide_tactical';

