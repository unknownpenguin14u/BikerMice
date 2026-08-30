import { Track, RacerEntity, Projectile, Particle, WeaponType, Character, TrackObstacle, CameraMode } from '../types';
import { soundEngine } from '../audio/soundEngine';

export type { CameraMode };

export interface GameEngineOptions {
  track: Track;
  playerChar: Character;
  allRacers: Character[];
  isBattleMode?: boolean;
  localMultiplayer?: boolean;
  stopOpponentsAtFinish?: boolean;
  onLapComplete?: (racerId: string, lap: number, totalLaps: number) => void;
  onRaceFinish?: (standings: RacerEntity[]) => void;
  onBanter?: (speaker: string, text: string) => void;
}

// --- SNES BIKER MICE FROM MARS 2:1 ISOMETRIC PROJECTION CONSTANTS ---
// Matches the classic Mode-7 / isometric oblique camera angle from the SNES title.
const ISO_ANGLE = Math.PI / 4; // 45 degrees
const ISO_COS = Math.cos(ISO_ANGLE);
const ISO_SIN = Math.sin(ISO_ANGLE);
const ISO_Y_SCALE = 0.5; // 2:1 vertical compression factor

/**
 * Transforms world coordinates (x, y, z) to 2.5D isometric screen coordinates.
 */
export function toIso(x: number, y: number, z: number = 0): { x: number; y: number } {
  const rx = x * ISO_COS - y * ISO_SIN;
  const ry = x * ISO_SIN + y * ISO_COS;
  return {
    x: rx,
    y: ry * ISO_Y_SCALE - z,
  };
}

/**
 * Converts a 2D world orientation angle into screen-projected isometric angle.
 */
export function toIsoAngle(angle: number): number {
  const vx = Math.cos(angle) * ISO_COS - Math.sin(angle) * ISO_SIN;
  const vy = (Math.sin(angle) * ISO_COS + Math.cos(angle) * ISO_SIN) * ISO_Y_SCALE;
  return Math.atan2(vy, vx);
}

interface TrackSceneryItem {
  type: 'building' | 'fence_post' | 'wooden_fence' | 'streetlight' | 'rock' | 'pipe' | 'billboard';
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  color?: string;
  subColor?: string;
  text?: string;
  angle?: number;
}

export class RacingEngine {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private track: Track;
  private playerChar: Character;
  private racers: RacerEntity[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private isBattleMode: boolean = false;
  private stopOpponentsAtFinish: boolean = true;

  private camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    zoom: 1.25,
    userZoomMultiplier: 1.0,
    vertOffset: 0,
    shake: 0,
    mode: 'side_view' as CameraMode,
    rotation: 0,
    targetRotation: 0,
  };
  private cameraNotificationTimer: number = 0;
  private cameraNotificationText: string = '';
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Track scenery props generated based on track layout and theme
  private scenery: TrackSceneryItem[] = [];

  // Input states
  public keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
    firePrimary: false,
    fireSpecial: false,
  };

  public keysP2 = {
    up: false,
    down: false,
    left: false,
    right: false,
    drift: false,
    firePrimary: false,
    fireSpecial: false,
  };

  private callbacks: {
    onLapComplete?: (racerId: string, lap: number, totalLaps: number) => void;
    onRaceFinish?: (standings: RacerEntity[]) => void;
    onBanter?: (speaker: string, text: string) => void;
  };

  private isFinished: boolean = false;
  private raceTimer: number = 0;
  private countdownTimer: number = 3.5; // 3, 2, 1, GO!
  private skillWindowTimer: number = 0;
  private skidMarks: { x: number; y: number; alpha: number; angle: number }[] = [];

  // Nitro boost visual FX and motion blur states
  private playerPrevBoostTimer: number = 0;
  private nitroFlashTimer: number = 0;

  constructor(canvas: HTMLCanvasElement, options: GameEngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.track = options.track;
    this.playerChar = options.playerChar;
    this.isBattleMode = !!options.isBattleMode;
    this.stopOpponentsAtFinish = options.stopOpponentsAtFinish ?? true;
    this.callbacks = {
      onLapComplete: options.onLapComplete,
      onRaceFinish: options.onRaceFinish,
      onBanter: options.onBanter,
    };

    this.initRacers(options.allRacers);
    this.generateTrackScenery();
    this.resizeCanvas();
  }

  public resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width || this.canvas.clientWidth || 1));
    const height = Math.max(1, Math.round(rect.height || this.canvas.clientHeight || 1));
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.scale(dpr, dpr);
  }

  private initRacers(allRoster: Character[]) {
    this.racers = [];
    const path = this.track.path;
    const startPoint = path[0];
    const nextPoint = path[1] || path[0];
    const initialAngle = Math.atan2(nextPoint.y - startPoint.y, nextPoint.x - startPoint.x);

    const secondPlayerChar = allRoster.find(c => c.id !== this.playerChar.id) || this.playerChar;
    const pool = allRoster.filter(c => c.id !== this.playerChar.id && c.id !== secondPlayerChar.id);
    const opponents = pool.slice(0, 4);
    const chosen = this.isBattleMode ? [...opponents, secondPlayerChar, this.playerChar] : [...opponents, secondPlayerChar, this.playerChar];

    chosen.forEach((char, index) => {
      const isPlayer = char.id === this.playerChar.id;
      const isPlayerTwo = char.id === secondPlayerChar.id;
      const gridRow = Math.floor(index / 2);
      const gridCol = index % 2;
      const offsetX = -Math.cos(initialAngle) * (gridRow * 60) - Math.sin(initialAngle) * ((gridCol - 0.5) * 50);
      const offsetY = -Math.sin(initialAngle) * (gridRow * 60) + Math.cos(initialAngle) * ((gridCol - 0.5) * 50);

      this.racers.push({
        id: `racer_${char.id}_${index}`,
        charId: char.id,
        name: char.name,
        isPlayer: isPlayer || isPlayerTwo,
        isPlayerTwo,
        x: startPoint.x + offsetX,
        y: startPoint.y + offsetY,
        z: 0,
        vz: 0,
        angle: initialAngle,
        targetAngle: initialAngle,
        speed: 0,
        maxSpeed: char.stats.topSpeed,
        accel: char.stats.acceleration,
        handling: char.stats.handling,
        armor: char.stats.armor,
        health: 100,
        maxHealth: 100,
        lap: 1,
        checkpointIndex: 0,
        distToNextCheckpoint: 0,
        totalDistance: 0,
        rank: index + 1,
        spinoutTimer: 0,
        boostTimer: 0,
        shieldTimer: 0,
        currentWeapon: isPlayer || isPlayerTwo ? char.stats.specialWeaponId : (Math.random() > 0.4 ? char.stats.specialWeaponId : null),
        weaponAmmo: 3,
        isDrifting: false,
        driftPower: 0,
        color: char.bikeColor,
        accentColor: char.accentColor,
        score: 0,
        kills: 0,
        impactCooldown: 0,
        collisionLockTimer: 0,
      });
    });

    this.racers = [...this.racers].sort((a, b) => {
      if (a.isPlayer && !b.isPlayer) return 1;
      if (!a.isPlayer && b.isPlayer) return -1;
      return 0;
    });
    this.updateRaceRankings();

    // Initialize camera on player's starting isometric position with SNES framing
    const player = this.getPlayer();
    if (player) {
      const initIso = toIso(player.x, player.y, 0);
      const initAngle = toIsoAngle(player.angle);
      // In SNES Biker Mice from Mars, the camera frames the player in the lower third/half
      // of the screen with a forward lead offset
      const leadX = Math.cos(initAngle) * 60;
      const leadY = Math.sin(initAngle) * 60;
      const vertOffset = -85; // Shift camera up in screen space so player is at ~65% Y

      this.camera.x = initIso.x + leadX;
      this.camera.y = initIso.y + leadY + vertOffset;
      this.camera.targetX = this.camera.x;
      this.camera.targetY = this.camera.y;
    }
  }

  /**
   * Generates isometric roadside scenery (brick buildings, storefronts, fences, streetlamps, rock spires)
   * matching the SNES Biker Mice from Mars screenshot exactly.
   */
  private generateTrackScenery() {
    this.scenery = [];
  }

  public setCameraMode(mode: CameraMode): CameraMode {
    this.camera.mode = mode;
    this.showCameraNotification(mode);
    return this.camera.mode;
  }

  public getCameraMode(): CameraMode {
    return this.camera.mode;
  }

  public adjustZoom(delta: number): number {
    this.camera.userZoomMultiplier = Math.max(0.65, Math.min(2.0, this.camera.userZoomMultiplier + delta));
    this.cameraNotificationText = `ZOOM: ${(this.camera.userZoomMultiplier * 100).toFixed(0)}%`;
    this.cameraNotificationTimer = 1.5;
    return this.camera.userZoomMultiplier;
  }

  public resetZoom(): number {
    this.camera.userZoomMultiplier = 1.0;
    this.camera.vertOffset = 0;
    this.cameraNotificationText = 'CAMERA POSITION RESET';
    this.cameraNotificationTimer = 1.5;
    return 1.0;
  }

  public adjustPositionOffset(deltaY: number): number {
    this.camera.vertOffset = Math.max(-150, Math.min(150, this.camera.vertOffset + deltaY));
    this.cameraNotificationText = `VIEW OFFSET: ${this.camera.vertOffset > 0 ? '+' : ''}${this.camera.vertOffset}px`;
    this.cameraNotificationTimer = 1.5;
    return this.camera.vertOffset;
  }

  public getZoomMultiplier(): number {
    return this.camera.userZoomMultiplier;
  }

  public cycleCameraMode(): CameraMode {
    const modes: CameraMode[] = ['side_view', 'chase_3d', 'snes_classic', 'top_down', 'close_action', 'wide_tactical'];
    const nextIdx = (modes.indexOf(this.camera.mode) + 1) % modes.length;
    this.camera.mode = modes[nextIdx];
    this.showCameraNotification(this.camera.mode);
    return this.camera.mode;
  }

  private showCameraNotification(mode: CameraMode) {
    const names: Record<CameraMode, string> = {
      side_view: 'SIDE-VIEW PROFILE (TRACKING)',
      chase_3d: '3D CHASE CAM (BEHIND BIKE)',
      snes_classic: 'SNES 2.5D ISOMETRIC (CLASSIC)',
      top_down: 'TOP-DOWN TACTICAL CAM',
      close_action: 'CLOSE ACTION BUMPER CAM',
      wide_tactical: 'AERIAL BROADCAST OVERVIEW',
    };
    this.cameraNotificationText = names[mode] || mode.toUpperCase();
    this.cameraNotificationTimer = 2.0;
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    soundEngine.stopEngine();
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      soundEngine.stopEngine();
    }
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.isPaused) {
      return;
    }

    if (this.isFinished) {
      this.racers.forEach((racer) => {
        racer.speed *= 0.8;
        racer.spinoutTimer = 0;
      });
      return;
    }

    if (this.countdownTimer > 0) {
      const prev = Math.ceil(this.countdownTimer);
      this.countdownTimer -= dt;
      const curr = Math.ceil(this.countdownTimer);
      if (curr !== prev && curr >= 1) {
        soundEngine.playBeep(false);
      } else if (curr === 0 && prev === 1) {
        soundEngine.playBeep(true);
        soundEngine.announce("Let's Rock!");
        this.skillWindowTimer = 10;
      }
      return;
    }

    this.skillWindowTimer = Math.max(0, this.skillWindowTimer - dt);
    this.raceTimer += dt;

    // Decay screen shake
    if (this.camera.shake > 0) {
      this.camera.shake = Math.max(0, this.camera.shake - dt * 15);
    }

    // Update Projectiles
    this.updateProjectiles(dt);

    // Update Particles
    this.updateParticles(dt);

    // Update Racers
    this.racers.forEach((racer) => {
      this.updateRacer(racer, dt);
    });

    // Check if player just activated nitro boost
    const player = this.getPlayer();
    if (player) {
      if (player.boostTimer > 0 && this.playerPrevBoostTimer <= 0) {
        this.nitroFlashTimer = 0.6;
        this.camera.shake = Math.max(this.camera.shake, 10);
        this.spawnNitroExhaust(player, dt, true);
      }
      this.playerPrevBoostTimer = player.boostTimer;
    }
    if (this.nitroFlashTimer > 0) {
      this.nitroFlashTimer -= dt;
    }

    // Handle Racer Collisions
    this.handleRacerCollisions(dt);

    // Handle Track Obstacles & Pickups
    this.handleObstacles(dt);

    // Update Ranks / Standings
    if (!this.isBattleMode) {
      this.updateRaceRankings();
    }

    // Decay camera notification banner
    if (this.cameraNotificationTimer > 0) {
      this.cameraNotificationTimer -= dt;
    }

    // Update Camera Target (Authentic SNES Framing & 3D Rotating Chase Views)
    if (player) {
      const targetIso = toIso(player.x, player.y, player.z);
      const forwardAngle = toIsoAngle(player.angle);
      const speedRatio = Math.min(1.5, Math.abs(player.speed) / player.maxSpeed);

      let baseZoom = 1.22;
      let targetRotation = 0;
      let targetX = targetIso.x;
      let targetY = targetIso.y;

      if (this.camera.mode === 'side_view') {
        // Keep the bike centered while still giving a small forward look; do not drift far away from the player.
        targetRotation = -forwardAngle;
        baseZoom = 1.30 - speedRatio * 0.10;
        const leadDist = 25 + speedRatio * 35;
        targetX = targetIso.x + Math.cos(forwardAngle) * leadDist;
        targetY = targetIso.y + Math.sin(forwardAngle) * leadDist * 0.5;
      } else if (this.camera.mode === 'chase_3d') {
        // Tight follow camera: keep the bike in frame and smoothly chase behind it.
        targetRotation = -forwardAngle - Math.PI / 2;
        baseZoom = 1.35 - speedRatio * 0.12;
        const lookDist = 20 + speedRatio * 40;
        targetX = targetIso.x + Math.cos(forwardAngle) * lookDist;
        targetY = targetIso.y + Math.sin(forwardAngle) * lookDist * 0.45;
      } else if (this.camera.mode === 'snes_classic') {
        // Classic isometric framing: retain the player's position in the middle of the screen.
        targetRotation = 0;
        baseZoom = 1.22;
        const vertBias = -85;
        const leadDist = 18 + speedRatio * 30;
        targetX = targetIso.x + Math.cos(forwardAngle) * leadDist;
        targetY = targetIso.y + vertBias + Math.sin(forwardAngle) * leadDist * 0.3;
      } else if (this.camera.mode === 'top_down') {
        // Centered tactical camera with a subtle forward bias.
        targetRotation = 0;
        baseZoom = 1.05;
        const leadDist = 12 + speedRatio * 18;
        targetX = targetIso.x + Math.cos(forwardAngle) * leadDist;
        targetY = targetIso.y - 30 + Math.sin(forwardAngle) * leadDist * 0.25;
      } else if (this.camera.mode === 'close_action') {
        // Action view stays attached to the rider instead of pulling off-screen.
        targetRotation = 0;
        baseZoom = 1.62;
        const vertBias = -65;
        const leadDist = 14 + speedRatio * 22;
        targetX = targetIso.x + Math.cos(forwardAngle) * leadDist;
        targetY = targetIso.y + vertBias + Math.sin(forwardAngle) * leadDist * 0.3;
      } else if (this.camera.mode === 'wide_tactical') {
        // Wide overview keeps the player centered while still revealing the course.
        targetRotation = 0;
        baseZoom = 0.78;
        const vertBias = -25;
        const leadDist = 8;
        targetX = targetIso.x + Math.cos(forwardAngle) * leadDist;
        targetY = targetIso.y + vertBias + Math.sin(forwardAngle) * leadDist * 0.2;
      }

      // Apply user adjustments
      const targetZoom = baseZoom * this.camera.userZoomMultiplier;
      targetY += this.camera.vertOffset;

      this.camera.targetX = targetX;
      this.camera.targetY = targetY;
      this.camera.targetRotation = targetRotation;

      // Smooth camera position interpolation
      const followSpeed = (this.camera.mode === 'chase_3d' || this.camera.mode === 'side_view') ? 9.5 : 8.5;
      this.camera.x += (this.camera.targetX - this.camera.x) * Math.min(1, dt * followSpeed);
      this.camera.y += (this.camera.targetY - this.camera.y) * Math.min(1, dt * followSpeed);
      this.camera.zoom += (targetZoom - this.camera.zoom) * Math.min(1, dt * 5.0);

      // Smooth rotation angle interpolation with circular shortest-path wrap-around
      let rotDiff = this.camera.targetRotation - this.camera.rotation;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      const rotSpeed = (this.camera.mode === 'chase_3d' || this.camera.mode === 'side_view') ? 7.5 : 9.0;
      this.camera.rotation += rotDiff * Math.min(1, dt * rotSpeed);

      soundEngine.playEngine(Math.abs(player.speed) / player.maxSpeed);
    }

    // Decay skid marks
    if (this.skidMarks.length > 250) {
      this.skidMarks.splice(0, 20);
    }
  }

  private getPlayer(): RacerEntity | undefined {
    return this.racers.find((r) => r.isPlayer);
  }

  public getPlayerEntity(): RacerEntity | undefined {
    return this.getPlayer();
  }

  public getPlayerTwoEntity(): RacerEntity | undefined {
    return this.racers.find((r) => r.isPlayerTwo);
  }

  public applyRemoteRacerState(remote: Partial<RacerEntity> & { socketId?: string; id?: string }) {
    const target = this.racers.find((r) => r.isPlayerTwo) ?? this.racers.find((r) => !r.isPlayer) ?? this.racers[1];
    if (!target || !remote) return;
    const keys = ['x', 'y', 'angle', 'speed', 'lap', 'health', 'boostTimer', 'shieldTimer', 'driftPower', 'isDrifting', 'currentWeapon', 'checkpointIndex', 'totalDistance'] as const;
    keys.forEach((key) => {
      if (remote[key] !== undefined) {
        (target as Record<string, unknown>)[key] = remote[key] as never;
      }
    });
    if (remote.name) target.name = remote.name;
    if (remote.charId) target.charId = remote.charId;
    if (remote.maxSpeed) target.maxSpeed = remote.maxSpeed;
    if (remote.accel) target.accel = remote.accel;
    if (remote.handling) target.handling = remote.handling;
  }

  public getRacers(): RacerEntity[] {
    return this.racers;
  }

  public getCountdown(): number {
    return this.countdownTimer;
  }

  public getRaceTime(): number {
    return this.raceTimer;
  }

  public getSkillWindowTime(): number {
    return this.skillWindowTimer;
  }

  private updateRacer(racer: RacerEntity, dt: number) {
    if (racer.impactCooldown > 0) {
      racer.impactCooldown -= dt;
    }

    // Spinout recovery
    if (racer.spinoutTimer > 0) {
      racer.spinoutTimer -= dt;
      racer.angle += dt * 12;
      racer.speed *= Math.pow(0.2, dt);
      return;
    }

    // Boost timer with authentic SNES dual-exhaust nitro flame plumes & particle bursts
    if (racer.boostTimer > 0) {
      racer.boostTimer -= dt;
      this.spawnNitroExhaust(racer, dt, false);
    }

    // Shield timer
    if (racer.shieldTimer > 0) {
      racer.shieldTimer -= dt;
    }

    // Airborne physics (Jumping)
    if (racer.z > 0 || racer.vz !== 0) {
      racer.vz -= 380 * dt; // Gravity
      racer.z += racer.vz * dt;
      if (racer.z <= 0) {
        racer.z = 0;
        racer.vz = 0;
        // Landing dust
        for (let i = 0; i < 6; i++) {
          this.addParticle({
            x: racer.x + (Math.random() - 0.5) * 15,
            y: racer.y + (Math.random() - 0.5) * 15,
            vx: (Math.random() - 0.5) * 60,
            vy: (Math.random() - 0.5) * 60,
            color: '#a1a1aa',
            size: 3 + Math.random() * 4,
            life: 0.3,
            maxLife: 0.3,
            alpha: 0.6,
            type: 'smoke',
          });
        }
      }
    }

    if (racer.isPlayer) {
      this.handlePlayerInput(racer, dt);
    } else {
      this.handleAIBehavior(racer, dt);
    }

    // Check drift status
    if (racer.isDrifting && Math.abs(racer.speed) > 40) {
      racer.driftPower = Math.min(100, racer.driftPower + dt * 50);
      if (racer.isPlayer && Math.random() < 0.4) {
        soundEngine.playDriftScreech();
      }
      const sparkColor = racer.driftPower > 70 ? '#38bdf8' : racer.driftPower > 35 ? '#f59e0b' : '#ef4444';
      this.addParticle({
        x: racer.x - Math.cos(racer.angle) * 18 + (Math.random() - 0.5) * 10,
        y: racer.y - Math.sin(racer.angle) * 18 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80,
        color: sparkColor,
        size: 3 + Math.random() * 3,
        life: 0.2,
        maxLife: 0.2,
        alpha: 1,
        type: 'spark',
      });
      if (Math.random() < 0.3) {
        this.skidMarks.push({
          x: racer.x,
          y: racer.y,
          alpha: 0.5,
          angle: racer.angle,
        });
      }
    } else if (racer.driftPower > 0) {
      if (racer.driftPower > 35) {
        const boostDuration = racer.driftPower > 70 ? 1.2 : 0.6;
        racer.boostTimer = Math.max(racer.boostTimer, boostDuration);
        soundEngine.playBoost();
      }
      racer.driftPower = 0;
    }

    // Move racer in world space
    racer.x += Math.cos(racer.angle) * racer.speed * dt;
    racer.y += Math.sin(racer.angle) * racer.speed * dt;

    // Billowing Exhaust Smoke Puffs (Authentic SNES exhaust clouds)
    if (Math.abs(racer.speed) > 40 && Math.random() < 0.45) {
      this.addParticle({
        x: racer.x - Math.cos(racer.angle) * 22 + (Math.random() - 0.5) * 6,
        y: racer.y - Math.sin(racer.angle) * 22 + (Math.random() - 0.5) * 6,
        vx: -Math.cos(racer.angle) * 25 + (Math.random() - 0.5) * 20,
        vy: -Math.sin(racer.angle) * 25 + (Math.random() - 0.5) * 20,
        color: racer.boostTimer > 0 ? '#60a5fa' : '#e2e8f0',
        size: racer.boostTimer > 0 ? 6 + Math.random() * 6 : 4 + Math.random() * 5,
        life: 0.35,
        maxLife: 0.35,
        alpha: 0.65,
        type: 'smoke',
      });
    }

    // Check track boundaries & surface resistance
    this.checkTrackSurface(racer, dt);

    // Update Checkpoint & Lap progression
    if (!this.isBattleMode) {
      this.checkCheckpointProgression(racer);
    }
  }

  private handlePlayerInput(racer: RacerEntity, dt: number) {
    const playerKeys = racer.isPlayerTwo ? this.keysP2 : this.keys;
    const isGas = playerKeys.up;
    const isBrake = playerKeys.down;
    const isLeft = playerKeys.left;
    const isRight = playerKeys.right;
    racer.isDrifting = playerKeys.drift;

    const currentMaxSpeed = racer.boostTimer > 0 ? racer.maxSpeed * 1.55 : racer.maxSpeed;

    if (isGas) {
      racer.speed = Math.min(currentMaxSpeed, racer.speed + racer.accel * dt * (racer.boostTimer > 0 ? 1.8 : 1.0));
    } else if (isBrake) {
      racer.speed = Math.max(-racer.maxSpeed * 0.3, racer.speed - racer.accel * 1.6 * dt);
    } else {
      racer.speed *= Math.pow(0.75, dt);
    }

    // Steering
    if (Math.abs(racer.speed) > 10) {
      const turnRate = (racer.handling / 100) * (racer.isDrifting ? 3.4 : 2.4);
      const dir = racer.speed >= 0 ? 1 : -1;
      if (isLeft) racer.angle -= turnRate * dt * dir;
      if (isRight) racer.angle += turnRate * dt * dir;
    }

    // Weapon trigger
    if (playerKeys.firePrimary) {
      this.fireWeapon(racer, 'blaster');
      playerKeys.firePrimary = false;
    }
    if (playerKeys.fireSpecial && racer.currentWeapon) {
      this.fireWeapon(racer, racer.currentWeapon);
      playerKeys.fireSpecial = false;
    }
  }

  private handleAIBehavior(racer: RacerEntity, dt: number) {
    if (this.isBattleMode) {
      const target = this.racers.find(r => r.id !== racer.id && r.health > 0);
      if (target) {
        const dx = target.x - racer.x;
        const dy = target.y - racer.y;
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - racer.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        racer.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), (racer.handling / 100) * 2.2 * dt);
        racer.speed = Math.min(racer.maxSpeed * 0.9, racer.speed + racer.accel * dt);

        if (Math.abs(angleDiff) < 0.3 && Math.random() < 0.05 && racer.currentWeapon) {
          this.fireWeapon(racer, racer.currentWeapon);
        }
      }
      return;
    }

    const path = this.track.path;
    const targetNode = path[racer.checkpointIndex % path.length];
    if (targetNode) {
      const dx = targetNode.x - racer.x;
      const dy = targetNode.y - racer.y;
      const dist = Math.hypot(dx, dy);

      const targetAngle = Math.atan2(dy, dx);
      let angleDiff = targetAngle - racer.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      if (Math.abs(angleDiff) > 0.7 && dist > 150) {
        racer.isDrifting = true;
      } else {
        racer.isDrifting = false;
      }

      const turnSpeed = (racer.handling / 100) * (racer.isDrifting ? 3.0 : 2.5);
      racer.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed * dt);

      const targetSpeed = Math.abs(angleDiff) > 1.2 ? racer.maxSpeed * 0.65 : racer.maxSpeed * 0.95;
      if (racer.speed < targetSpeed) {
        racer.speed = Math.min(targetSpeed, racer.speed + racer.accel * dt * 0.9);
      } else {
        racer.speed *= Math.pow(0.85, dt);
      }

      const player = this.getPlayer();
      if (player && racer.currentWeapon && Math.random() < 0.015) {
        const distToPlayer = Math.hypot(player.x - racer.x, player.y - racer.y);
        if (distToPlayer < 350) {
          this.fireWeapon(racer, racer.currentWeapon);
        }
      }

      // Intentionally left empty: all racers use checkCheckpointProgression() so lap and
      // total-distance tracking stay consistent for the live ranking order.
    }
  }

  public fireWeapon(racer: RacerEntity, type: WeaponType) {
    const ordnanceLocked = type !== 'blaster' && this.skillWindowTimer > 0;
    if (ordnanceLocked) return;
    if (racer.weaponAmmo <= 0 && type !== 'blaster') return;

    if (type === 'blaster') {
      soundEngine.playLaser();
      this.projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        type: 'blaster',
        x: racer.x + Math.cos(racer.angle) * 25,
        y: racer.y + Math.sin(racer.angle) * 25,
        vx: Math.cos(racer.angle) * (racer.speed + 450),
        vy: Math.sin(racer.angle) * (racer.speed + 450),
        ownerId: racer.id,
        life: 0.9,
        maxLife: 0.9,
        damage: 15,
        angle: racer.angle,
      });
    } else if (type === 'homing_missile') {
      soundEngine.playMissileLaunch();
      racer.weaponAmmo--;
      const targets = this.racers.filter(r => r.id !== racer.id);
      let closestTarget = targets[0]?.id;
      let minAngleDist = 9999;
      targets.forEach(t => {
        const d = Math.hypot(t.x - racer.x, t.y - racer.y);
        if (d < minAngleDist) {
          minAngleDist = d;
          closestTarget = t.id;
        }
      });

      this.projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        type: 'homing_missile',
        x: racer.x + Math.cos(racer.angle) * 25,
        y: racer.y + Math.sin(racer.angle) * 25,
        vx: Math.cos(racer.angle) * (racer.speed + 380),
        vy: Math.sin(racer.angle) * (racer.speed + 380),
        ownerId: racer.id,
        targetId: closestTarget,
        life: 2.5,
        maxLife: 2.5,
        damage: 35,
        angle: racer.angle,
      });
      if (racer.weaponAmmo <= 0) racer.currentWeapon = null;
    } else if (type === 'turbo_nitro') {
      soundEngine.playBoost();
      racer.boostTimer = 3.0;
      racer.weaponAmmo--;
      if (racer.weaponAmmo <= 0) racer.currentWeapon = null;
    } else if (type === 'oil_slick') {
      soundEngine.playSpinout();
      racer.weaponAmmo--;

      const behindDistance = 90;
      const slickX = racer.x - Math.cos(racer.angle) * behindDistance;
      const slickY = racer.y - Math.sin(racer.angle) * behindDistance;

      this.track.obstacles.push({
        x: slickX,
        y: slickY,
        radius: 28,
        type: 'oil',
        active: true,
        duration: 3,
      });
      if (racer.weaponAmmo <= 0) racer.currentWeapon = null;
    } else if (type === 'earthquake') {
      soundEngine.playEarthquake();
      this.camera.shake = 20;

      const ammoUsed = 1;
      racer.weaponAmmo = Math.max(0, racer.weaponAmmo - ammoUsed);
      this.racers.forEach(r => {
        if (r.id !== racer.id && r.shieldTimer <= 0) {
          r.spinoutTimer = Math.max(r.spinoutTimer, 0.45);
          r.z = 15;
          r.vz = 80;
          r.health = Math.max(10, r.health - 14);
        }
      });
      if (racer.weaponAmmo <= 0) racer.currentWeapon = null;
    } else if (type === 'shield') {
      soundEngine.playItemPickup();
      racer.shieldTimer = 5.0;
      racer.weaponAmmo--;
      if (racer.weaponAmmo <= 0) racer.currentWeapon = null;
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.type === 'homing_missile' && p.targetId) {
        const target = this.racers.find(r => r.id === p.targetId);
        if (target) {
          const dx = target.x - p.x;
          const dy = target.y - p.y;
          const targetAngle = Math.atan2(dy, dx);
          let diff = targetAngle - p.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;

          p.angle += Math.sign(diff) * Math.min(Math.abs(diff), 4.5 * dt);
          const spd = 450;
          p.vx = Math.cos(p.angle) * spd;
          p.vy = Math.sin(p.angle) * spd;
        }

        if (Math.random() < 0.6) {
          this.addParticle({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            color: '#cbd5e1',
            size: 3 + Math.random() * 3,
            life: 0.35,
            maxLife: 0.35,
            alpha: 0.8,
            type: 'smoke',
          });
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      for (const racer of this.racers) {
        if (racer.id === p.ownerId) continue;
        const dist = Math.hypot(racer.x - p.x, racer.y - p.y);
        if (dist < 34) {
          if (racer.shieldTimer <= 0) {
            const minHealth = 5;
            racer.health = Math.max(minHealth, racer.health - p.damage);
            soundEngine.playExplosion();
            this.camera.shake = p.type === 'homing_missile' ? 12 : 5;

            if (racer.health <= minHealth && this.isBattleMode && racer.health <= 5) {
              const shooter = this.racers.find(r => r.id === p.ownerId);
              if (shooter) shooter.kills++;
              racer.health = 100;
              racer.shieldTimer = 3.0;
            }
          }
          for (let k = 0; k < 12; k++) {
            this.addParticle({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 160,
              vy: (Math.random() - 0.5) * 160,
              color: k % 2 === 0 ? '#f59e0b' : '#ef4444',
              size: 4 + Math.random() * 6,
              life: 0.4,
              maxLife: 0.4,
              alpha: 1,
              type: 'fire',
            });
          }

          this.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * Spawns multi-stage dual exhaust nitro flames, sparks, and sonic shockwave plumes.
   */
  private spawnNitroExhaust(racer: RacerEntity, dt: number, isInitialBurst: boolean = false) {
    const isHovercraft = racer.charId === 'limburger' || racer.charId === 'karbunkle' || racer.charId === 'greasepit';
    const backDist = isHovercraft ? 24 : 22;
    const pipeOffset = isHovercraft ? 8.5 : 7.5;
    const perpAngle = racer.angle + Math.PI / 2;

    // Dual exhaust nozzle coordinates in world space
    const nozzleLeft = {
      x: racer.x - Math.cos(racer.angle) * backDist + Math.cos(perpAngle) * pipeOffset,
      y: racer.y - Math.sin(racer.angle) * backDist + Math.sin(perpAngle) * pipeOffset,
    };
    const nozzleRight = {
      x: racer.x - Math.cos(racer.angle) * backDist - Math.cos(perpAngle) * pipeOffset,
      y: racer.y - Math.sin(racer.angle) * backDist - Math.sin(perpAngle) * pipeOffset,
    };

    const nozzles = [nozzleLeft, nozzleRight];

    // 1. Initial Nitro Activation Sonic Burst Wave & Explosive Sparks
    if (isInitialBurst) {
      // Sonic Shockwave Ring
      this.addParticle({
        x: racer.x - Math.cos(racer.angle) * (backDist * 0.8),
        y: racer.y - Math.sin(racer.angle) * (backDist * 0.8),
        vx: -Math.cos(racer.angle) * 40,
        vy: -Math.sin(racer.angle) * 40,
        color: racer.isPlayer ? '#38bdf8' : '#f97316',
        size: 16,
        life: 0.35,
        maxLife: 0.35,
        alpha: 1,
        type: 'shockwave',
      });

      // High-Velocity Burst Sparks from each nozzle
      nozzles.forEach((nz) => {
        for (let i = 0; i < 8; i++) {
          const spread = (Math.random() - 0.5) * 0.6;
          const burstSpd = 320 + Math.random() * 180;
          this.addParticle({
            x: nz.x + (Math.random() - 0.5) * 4,
            y: nz.y + (Math.random() - 0.5) * 4,
            vx: -Math.cos(racer.angle + spread) * burstSpd,
            vy: -Math.sin(racer.angle + spread) * burstSpd,
            color: racer.isPlayer ? (i % 2 === 0 ? '#ffffff' : '#67e8f9') : (i % 2 === 0 ? '#fef08a' : '#ef4444'),
            size: 3 + Math.random() * 3,
            life: 0.2 + Math.random() * 0.15,
            maxLife: 0.35,
            alpha: 1,
            type: 'spark',
          });
        }
      });
    }

    // 2. Continuous Jet Flame Plumes & High-Energy Exhaust Streaming
    nozzles.forEach((nz, idx) => {
      // Core Intense Plasma Flame (White-hot core to electric cyan / fire red)
      const flameSpeed = 260 + Math.random() * 120;
      const flameColors = racer.isPlayer
        ? ['#ffffff', '#67e8f9', '#38bdf8', '#0284c7', '#818cf8']
        : ['#ffffff', '#fef08a', '#f97316', '#ef4444', '#b91c1c'];
      const chosenColor = flameColors[Math.floor(Math.random() * flameColors.length)];

      this.addParticle({
        x: nz.x + (Math.random() - 0.5) * 3,
        y: nz.y + (Math.random() - 0.5) * 3,
        vx: -Math.cos(racer.angle) * flameSpeed + (Math.random() - 0.5) * 40,
        vy: -Math.sin(racer.angle) * flameSpeed + (Math.random() - 0.5) * 40,
        color: chosenColor,
        size: 5 + Math.random() * 6,
        life: 0.22 + Math.random() * 0.08,
        maxLife: 0.3,
        alpha: 1,
        type: 'fire',
      });

      // High-Velocity Nitro Embers / Sparks
      if (Math.random() < 0.7) {
        this.addParticle({
          x: nz.x + (Math.random() - 0.5) * 2,
          y: nz.y + (Math.random() - 0.5) * 2,
          vx: -Math.cos(racer.angle) * (340 + Math.random() * 160) + (Math.random() - 0.5) * 70,
          vy: -Math.sin(racer.angle) * (340 + Math.random() * 160) + (Math.random() - 0.5) * 70,
          color: racer.isPlayer ? '#e0f2fe' : '#fef08a',
          size: 2.5 + Math.random() * 2.5,
          life: 0.16 + Math.random() * 0.08,
          maxLife: 0.24,
          alpha: 1,
          type: 'spark',
        });
      }

      // Outer Expanding Thermal Smoke Cloud
      if (Math.random() < 0.45) {
        this.addParticle({
          x: nz.x - Math.cos(racer.angle) * 8 + (Math.random() - 0.5) * 4,
          y: nz.y - Math.sin(racer.angle) * 8 + (Math.random() - 0.5) * 4,
          vx: -Math.cos(racer.angle) * 70 + (Math.random() - 0.5) * 35,
          vy: -Math.sin(racer.angle) * 70 + (Math.random() - 0.5) * 35,
          color: racer.isPlayer ? '#60a5fa' : '#fb923c',
          size: 7 + Math.random() * 7,
          life: 0.32 + Math.random() * 0.12,
          maxLife: 0.44,
          alpha: 0.6,
          type: 'smoke',
        });
      }
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha = pt.life / pt.maxLife;
    }
  }

  private addParticle(p: Particle) {
    if (this.particles.length < 450) {
      this.particles.push(p);
    }
  }

  private handleRacerCollisions(dt: number) {
    this.racers.forEach((racer) => {
      racer.collisionLockTimer = Math.max(0, racer.collisionLockTimer - dt);
    });

    for (let i = 0; i < this.racers.length; i++) {
      for (let j = i + 1; j < this.racers.length; j++) {
        const r1 = this.racers[i];
        const r2 = this.racers[j];
        const dx = r2.x - r1.x;
        const dy = r2.y - r1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = 34;

        if (r1.impactCooldown > 0 || r2.impactCooldown > 0) continue;

        if (dist < minDist && dist > 0.001) {
          const safeDist = Math.max(dist, 0.25);
          const overlap = Math.min((minDist - safeDist) / 2, 12);
          const nx = dx / safeDist;
          const ny = dy / safeDist;

          r1.x -= nx * overlap;
          r1.y -= ny * overlap;
          r2.x += nx * overlap;
          r2.y += ny * overlap;

          const armorDiff = (r1.armor - r2.armor) / 200;
          const impactPush = 0.55;

          r1.speed *= Math.max(0.2, 0.84 + armorDiff * 0.08) * impactPush;
          r2.speed *= Math.max(0.2, 0.84 - armorDiff * 0.08) * impactPush;

          r1.impactCooldown = Math.max(r1.impactCooldown, 0.1);
          r2.impactCooldown = Math.max(r2.impactCooldown, 0.1);
          r1.collisionLockTimer = 3;
          r2.collisionLockTimer = 3;

          for (let k = 0; k < 2; k++) {
            this.addParticle({
              x: (r1.x + r2.x) / 2,
              y: (r1.y + r2.y) / 2,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
              color: '#facc15',
              size: 2.5,
              life: 0.15,
              maxLife: 0.15,
              alpha: 1,
              type: 'spark',
            });
          }
        } else if (dist < minDist + 10) {
          if (r1.collisionLockTimer <= 0 || r2.collisionLockTimer <= 0) {
            const safeDist = Math.max(dist, 0.25);
            const nx = dx / safeDist;
            const ny = dy / safeDist;
            const push = 18;

            r1.x -= nx * push;
            r1.y -= ny * push;
            r2.x += nx * push;
            r2.y += ny * push;

            r1.speed *= 0.72;
            r2.speed *= 0.72;

            r1.collisionLockTimer = 3;
            r2.collisionLockTimer = 3;
          }
        }
      }
    }
  }

  private handleObstacles(dt: number) {
    this.track.obstacles.forEach((obs) => {
      if (obs.respawnTime && obs.respawnTime > 0) {
        obs.respawnTime -= dt;
        if (obs.respawnTime <= 0) {
          obs.active = true;
        }
        return;
      }
      if (obs.active === false) return;

      if (obs.type === 'oil') {
        if (typeof obs.duration !== 'number') {
          obs.duration = 3;
        }

        obs.duration -= dt;
        if (obs.duration <= 0) {
          obs.active = false;
          return;
        }
      }

      this.racers.forEach((racer) => {
        const dist = Math.hypot(racer.x - obs.x, racer.y - obs.y);
        if (dist < obs.radius + 16) {
          if (obs.type === 'boost_pad') {
            racer.boostTimer = 1.8;
            if (racer.isPlayer) soundEngine.playBoost();
          } else if (obs.type === 'jump_ramp') {
            if (racer.z === 0) {
              racer.vz = 200;
              racer.z = 6;
              if (racer.isPlayer) soundEngine.playBoost();
            }
          } else if (obs.type === 'oil') {
            if (racer.shieldTimer <= 0) {
              racer.spinoutTimer = 1.2;
              if (racer.isPlayer) soundEngine.playSpinout();
            }
          } else if (obs.type === 'item_box') {
            obs.active = false;
            obs.respawnTime = 5.0;
            const weaponPool: WeaponType[] = ['homing_missile', 'turbo_nitro', 'oil_slick', 'earthquake', 'shield'];
            racer.currentWeapon = weaponPool[Math.floor(Math.random() * weaponPool.length)];
            racer.weaponAmmo = 3;
            if (racer.isPlayer) {
              soundEngine.playItemPickup();
            }
          }
        }
      });
    });
  }

  private checkTrackSurface(racer: RacerEntity, dt: number) {
    let minDist = 99999;
    let closestPoint = { x: racer.x, y: racer.y };
    const path = this.track.path;

    for (let i = 0; i < path.length; i++) {
      const p1 = path[i];
      const p2 = path[(i + 1) % path.length];
      const d = this.distToSegment({ x: racer.x, y: racer.y }, p1, p2);

      if (d < minDist) {
        minDist = d;
        const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2 || 1;
        let t = ((racer.x - p1.x) * (p2.x - p1.x) + (racer.y - p1.y) * (p2.y - p1.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        closestPoint = {
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
        };
      }
    }

    const averageTrackWidth = path.reduce((sum, pt) => sum + (pt.width || 140), 0) / path.length;
    const wallRadius = Math.max(90, averageTrackWidth * 0.5 + 28);

    if (minDist > wallRadius && racer.z === 0) {
      const dx = racer.x - closestPoint.x;
      const dy = racer.y - closestPoint.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len;
      const ny = dy / len;

      const maxInsideDist = wallRadius - 2;
      const desiredX = closestPoint.x + nx * maxInsideDist;
      const desiredY = closestPoint.y + ny * maxInsideDist;

      racer.x = desiredX;
      racer.y = desiredY;
      racer.speed *= Math.pow(0.2, dt);
      racer.speed = Math.max(0, racer.speed);

      if (Math.random() < 0.8) {
        this.addParticle({
          x: racer.x,
          y: racer.y,
          vx: (Math.random() - 0.5) * 50,
          vy: (Math.random() - 0.5) * 50,
          color: '#f8fafc',
          size: 4,
          life: 0.18,
          maxLife: 0.18,
          alpha: 0.7,
          type: 'spark',
        });
      }

      if (racer.isPlayer) {
        soundEngine.playImpact();
      }
    }
  }

  private distToSegment(p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }): number {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  private checkCheckpointProgression(racer: RacerEntity) {
    const path = this.track.path;
    const nextPt = path[racer.checkpointIndex];
    const dist = Math.hypot(racer.x - nextPt.x, racer.y - nextPt.y);

    if (dist < 160) {
      racer.checkpointIndex = (racer.checkpointIndex + 1) % path.length;
      racer.totalDistance += 300;

      if (racer.checkpointIndex === 0) {
        racer.lap++;
        if (racer.isPlayer) {
          if (racer.lap <= this.track.laps) {
            soundEngine.announce(racer.lap === this.track.laps ? "FINAL LAP!" : `LAP ${racer.lap}`);
          }
        }
        if (this.callbacks.onLapComplete) {
          this.callbacks.onLapComplete(racer.id, racer.lap, this.track.laps);
        }

        if (racer.lap > this.track.laps && !this.isFinished) {
          this.isFinished = true;

          if (racer.isPlayer) {
            soundEngine.announce("FINISH!");
          } else if (this.stopOpponentsAtFinish) {
            soundEngine.announce(`${racer.name.toUpperCase()} WINS!`);
          }

          if (this.callbacks.onRaceFinish) {
            this.callbacks.onRaceFinish(this.racers);
          }
        }
      }
    }
  }

  private getRacerProgressScore(racer: RacerEntity): number {
    const path = this.track.path;
    const nextPoint = path[racer.checkpointIndex % path.length];
    const distToNext = Math.hypot(racer.x - nextPoint.x, racer.y - nextPoint.y);
    const progressIntoSegment = 1 - Math.min(1, Math.max(0, distToNext / 180));

    return racer.totalDistance + (racer.lap * 100000) + (racer.checkpointIndex * 1000) + progressIntoSegment;
  }

  private updateRaceRankings() {
    const sorted = [...this.racers].sort((a, b) => {
      const scoreA = this.getRacerProgressScore(a);
      const scoreB = this.getRacerProgressScore(b);

      if (scoreA !== scoreB) return scoreB - scoreA;

      if (a.isPlayer && !b.isPlayer) return 1;
      if (!a.isPlayer && b.isPlayer) return -1;
      return 0;
    });

    sorted.forEach((racer, index) => {
      racer.rank = index + 1;
    });

    this.racers = sorted;
  }

  // =========================================================================
  // --- RENDERING PIPELINE: TRUE 2.5D ISOMETRIC (SNES BIKER MICE STYLE) ---
  // =========================================================================

  private render() {
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Apply Camera Transform & Screen Shake in 2.5D space
    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake;

    ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    if (this.camera.rotation) {
      ctx.rotate(this.camera.rotation);
    }
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw Background Terrain & Isometric City Grid
    this.drawIsometricEnvironment(ctx);

    // 2. Draw Isometric Track Ribbon (Asphalt, Curbs, Lines, Start Finish)
    this.drawIsometricTrack(ctx);

    // 3. Draw Flat Ground Elements (Skid marks, Flat Boost Pads, Oil Slicks)
    this.drawIsometricGroundOverlays(ctx);

    // 4. Depth-Sorted Rendering of All 2.5D Elements (Scenery, Obstacles, Racers, Projectiles)
    this.drawIsometricDepthPass(ctx);

    // 5. Draw Particle FX in Isometric Space
    this.drawIsometricParticles(ctx);

    ctx.restore();

    // 6. Draw Screen-Space Motion Blur & Speed Warp FX (Active during Player Nitro Boost)
    const player = this.getPlayer();
    if (player) {
      this.drawScreenSpaceMotionBlur(ctx, width, height, player);
    }

    // 7. Draw Screen Overlays (Comic "GO!" Banner & Camera Mode Switch Badge)
    this.drawScreenOverlays(ctx, width, height);
  }

  /**
   * Draws the ambient ground plane & isometric tile patterns matching the track theme.
   */
  private drawIsometricEnvironment(ctx: CanvasRenderingContext2D) {
    // Fill full visible area (larger expanse for rotated / wide aerial views)
    ctx.fillStyle = this.track.bgColor;
    ctx.fillRect(this.camera.x - 2800, this.camera.y - 2800, 5600, 5600);

    // Draw isometric grid lines
    ctx.strokeStyle = this.track.theme === 'chicago' ? 'rgba(56, 189, 248, 0.08)' :
                      this.track.theme === 'mars' ? 'rgba(245, 158, 11, 0.1)' :
                      this.track.theme === 'sewers' ? 'rgba(132, 204, 22, 0.1)' : 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;

    const gridSize = 140;
    const minGridX = Math.floor((this.camera.x - 2400) / gridSize) * gridSize;
    const maxGridX = minGridX + 4800;
    const minGridY = Math.floor((this.camera.y - 2400) / gridSize) * gridSize;
    const maxGridY = minGridY + 4800;

    ctx.beginPath();
    for (let gx = minGridX; gx <= maxGridX; gx += gridSize) {
      const p1 = toIso(gx, minGridY, 0);
      const p2 = toIso(gx, maxGridY, 0);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    for (let gy = minGridY; gy <= maxGridY; gy += gridSize) {
      const p1 = toIso(minGridX, gy, 0);
      const p2 = toIso(maxGridX, gy, 0);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();
  }

  /**
   * Constructs smooth isometric road ribbons with textured asphalt, curbs, and lane markings.
   */
  private drawIsometricTrack(ctx: CanvasRenderingContext2D) {
    const path = this.track.path;
    if (path.length < 3) return;

    // Subdivide path for buttery-smooth curved track mesh
    const subSegments: { left: { x: number; y: number }; right: { x: number; y: number }; curbL: { x: number; y: number }; curbR: { x: number; y: number }; center: { x: number; y: number } }[] = [];
    const stepCount = 8; // Interpolation steps per node

    for (let i = 0; i < path.length; i++) {
      const p0 = path[(i - 1 + path.length) % path.length];
      const p1 = path[i];
      const p2 = path[(i + 1) % path.length];
      const p3 = path[(i + 2) % path.length];

      for (let s = 0; s < stepCount; s++) {
        const t = s / stepCount;
        // Catmull-Rom spline interpolation
        const wx = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * (t * t) + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * (t * t * t));
        const wy = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * (t * t) + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * (t * t * t));

        // Tangent
        const tt = t + 0.01;
        const nxtX = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * tt + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * (tt * tt) + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * (tt * tt * tt));
        const nxtY = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * tt + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * (tt * tt) + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * (tt * tt * tt));

        const tdx = nxtX - wx;
        const tdy = nxtY - wy;
        const tlen = Math.hypot(tdx, tdy) || 1;
        const nx = -tdy / tlen;
        const ny = tdx / tlen;

        const halfW = (p1.width || 140) / 2;
        const curbW = halfW + 16;

        subSegments.push({
          center: toIso(wx, wy, 0),
          left: toIso(wx + nx * halfW, wy + ny * halfW, 0),
          right: toIso(wx - nx * halfW, wy - ny * halfW, 0),
          curbL: toIso(wx + nx * curbW, wy + ny * curbW, 0),
          curbR: toIso(wx - nx * curbW, wy - ny * curbW, 0),
        });
      }
    }

    const n = subSegments.length;

    // 1. Draw Outer Curbs with Alternating Retro Checkered Blocks (Red/White or Yellow/Black)
    for (let i = 0; i < n; i++) {
      const cur = subSegments[i];
      const nxt = subSegments[(i + 1) % n];
      const isAlt = Math.floor(i / 2) % 2 === 0;

      // Left Curb Quad
      ctx.fillStyle = isAlt ? this.track.curbColor : '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cur.left.x, cur.left.y);
      ctx.lineTo(nxt.left.x, nxt.left.y);
      ctx.lineTo(nxt.curbL.x, nxt.curbL.y);
      ctx.lineTo(cur.curbL.x, cur.curbL.y);
      ctx.closePath();
      ctx.fill();

      // Right Curb Quad
      ctx.fillStyle = isAlt ? this.track.curbColor : '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cur.right.x, cur.right.y);
      ctx.lineTo(nxt.right.x, nxt.right.y);
      ctx.lineTo(nxt.curbR.x, nxt.curbR.y);
      ctx.lineTo(cur.curbR.x, cur.curbR.y);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Draw Main Asphalt Surface with Road Depth and Texture
    for (let i = 0; i < n; i++) {
      const cur = subSegments[i];
      const nxt = subSegments[(i + 1) % n];

      // Low-opacity shadow under the road to create thickness and realism.
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.moveTo(cur.left.x + 8, cur.left.y + 8);
      ctx.lineTo(nxt.left.x + 8, nxt.left.y + 8);
      ctx.lineTo(nxt.right.x + 8, nxt.right.y + 8);
      ctx.lineTo(cur.right.x + 8, cur.right.y + 8);
      ctx.closePath();
      ctx.fill();

      const gradient = ctx.createLinearGradient(cur.left.x, cur.left.y, nxt.right.x, nxt.right.y);
      const shade = i % 3 === 0 ? '#3a3a40' : i % 3 === 1 ? '#2a2a30' : '#1f1f25';
      gradient.addColorStop(0, shade);
      gradient.addColorStop(0.5, this.track.trackColor);
      gradient.addColorStop(1, '#141418');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(cur.left.x, cur.left.y);
      ctx.lineTo(nxt.left.x, nxt.left.y);
      ctx.lineTo(nxt.right.x, nxt.right.y);
      ctx.lineTo(cur.right.x, cur.right.y);
      ctx.closePath();
      ctx.fill();

      // Subtle asphalt streaks to mimic real sealed road surfaces.
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.2;
      for (let stripe = 0; stripe < 4; stripe++) {
        const offset = (stripe / 4) * 0.75;
        const a = {
          x: cur.left.x + (nxt.left.x - cur.left.x) * offset,
          y: cur.left.y + (nxt.left.y - cur.left.y) * offset,
        };
        const b = {
          x: cur.right.x + (nxt.right.x - cur.right.x) * offset,
          y: cur.right.y + (nxt.right.y - cur.right.y) * offset,
        };
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // 3. Draw Center Dashed Line & Road Edge Lines
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i += 3) {
      if (Math.floor(i / 3) % 2 === 0) continue;
      const cur = subSegments[i];
      const nxt = subSegments[(i + 2) % n];

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 2;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cur.center.x, cur.center.y);
      ctx.lineTo(nxt.center.x, nxt.center.y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Road shoulder highlight for a more realistic edge profile.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < n; i += 2) {
      const cur = subSegments[i];
      const nxt = subSegments[(i + 1) % n];
      ctx.beginPath();
      ctx.moveTo(cur.left.x, cur.left.y);
      ctx.lineTo(nxt.left.x, nxt.left.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cur.right.x, cur.right.y);
      ctx.lineTo(nxt.right.x, nxt.right.y);
      ctx.stroke();
    }

    // 4. Draw Starting Grid Isometric Box [ ] and "x5" marker (Matches bottom left of OIP.webp)
    if (subSegments.length > 4) {
      const gridSeg0 = subSegments[1];
      const gridSeg1 = subSegments[3];
      
      ctx.save();
      // White starting box outline on the track
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const midL = { x: (gridSeg0.left.x + gridSeg0.center.x) / 2, y: (gridSeg0.left.y + gridSeg0.center.y) / 2 };
      const midR = { x: (gridSeg0.right.x + gridSeg0.center.x) / 2, y: (gridSeg0.right.y + gridSeg0.center.y) / 2 };
      const midL2 = { x: (gridSeg1.left.x + gridSeg1.center.x) / 2, y: (gridSeg1.left.y + gridSeg1.center.y) / 2 };
      const midR2 = { x: (gridSeg1.right.x + gridSeg1.center.x) / 2, y: (gridSeg1.right.y + gridSeg1.center.y) / 2 };
      
      ctx.moveTo(midL.x, midL.y);
      ctx.lineTo(midR.x, midR.y);
      ctx.lineTo(midR2.x, midR2.y);
      ctx.lineTo(midL2.x, midL2.y);
      ctx.closePath();
      ctx.stroke();

      // "x5" Text underneath starting box
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('x5', midL.x + 20, midL.y + 22);
      ctx.restore();
    }

    // 5. Draw Circular Manhole Covers on the Road (as seen in OIP.webp)
    if (subSegments.length > 8) {
      const mhSeg = subSegments[6];
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(mhSeg.center.x + 25, mhSeg.center.y - 10, 11, 6, ISO_ANGLE, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 6. Start / Finish Line Checkered Grid
    const start0 = subSegments[0];
    const start1 = subSegments[1];
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(start0.left.x, start0.left.y);
    ctx.lineTo(start0.right.x, start0.right.y);
    ctx.stroke();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(start1.left.x, start1.left.y);
    ctx.lineTo(start1.right.x, start1.right.y);
    ctx.stroke();
  }

  /**
   * Draws flat ground elements (skid marks, oil slicks, flat boost arrows).
   */
  private drawIsometricGroundOverlays(ctx: CanvasRenderingContext2D) {
    // Skid Marks
    ctx.fillStyle = 'rgba(10, 10, 15, 0.45)';
    this.skidMarks.forEach((s) => {
      const iso = toIso(s.x, s.y, 0);
      ctx.beginPath();
      ctx.ellipse(iso.x, iso.y, 6, 3, ISO_ANGLE, 0, Math.PI * 2);
      ctx.fill();
    });

    // Boost Pads & Oil Slicks
    this.track.obstacles.forEach((obs) => {
      if (obs.active === false) return;

      if (obs.type === 'boost_pad') {
        const iso = toIso(obs.x, obs.y, 0);
        ctx.save();
        ctx.translate(iso.x, iso.y);

        // Glowing Blue/Cyan Iso Ellipse
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.ellipse(0, 0, obs.radius * 1.2, obs.radius * 0.65, ISO_ANGLE, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Animated Chevrons
        const pulse = (performance.now() * 0.005) % 1;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -6 - pulse * 4);
        ctx.lineTo(-7, 3 - pulse * 4);
        ctx.lineTo(7, 3 - pulse * 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (obs.type === 'oil') {
        const iso = toIso(obs.x, obs.y, 0);
        const remaining = typeof obs.duration === 'number' ? obs.duration : 3;
        const alpha = Math.max(0.12, Math.min(1, remaining / 3));

        ctx.save();
        ctx.translate(iso.x, iso.y);
        ctx.globalAlpha = alpha;

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(0, 0, obs.radius * 1.1, obs.radius * 0.55, ISO_ANGLE + 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, obs.radius * 0.65, obs.radius * 0.34, ISO_ANGLE + 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  /**
   * Renders all 2.5D upright objects sorted from back to front by their screen Y base coordinate.
   * This guarantees authentic SNES 2.5D isometric depth and layering.
   */
  private drawIsometricDepthPass(ctx: CanvasRenderingContext2D) {
    interface Renderable {
      baseY: number;
      draw: () => void;
    }

    const renderables: Renderable[] = [];

    // 1. Obstacles (Jump ramps, Item boxes, Rocks)
    this.track.obstacles.forEach((obs) => {
      if (obs.active === false) return;
      if (obs.type === 'jump_ramp' || obs.type === 'item_box' || obs.type === 'rock') {
        const isoBase = toIso(obs.x, obs.y, 0);
        renderables.push({
          baseY: isoBase.y,
          draw: () => this.drawObstacleItem(ctx, obs, isoBase),
        });
      }
    });

    // 3. Racers (Vehicles + Shadows + Riders)
    this.racers.forEach((racer) => {
      const isoBase = toIso(racer.x, racer.y, 0);
      renderables.push({
        baseY: isoBase.y,
        draw: () => this.drawIsometricRacer(ctx, racer, isoBase),
      });
    });

    // 4. Projectiles
    this.projectiles.forEach((p) => {
      const isoBase = toIso(p.x, p.y, 10);
      renderables.push({
        baseY: isoBase.y,
        draw: () => this.drawIsometricProjectile(ctx, p, isoBase),
      });
    });

    // Sort by screen Y (lowest/furthest Y first, highest/closest Y last)
    renderables.sort((a, b) => a.baseY - b.baseY);

    // Execute drawing in depth order
    renderables.forEach((r) => r.draw());
  }

  /**
   * Draws a 2.5D scenery prop (matching the SNES screenshot's brick buildings, fences, etc.).
   */
  private drawSceneryItem(ctx: CanvasRenderingContext2D, sc: TrackSceneryItem, isoBase: { x: number; y: number }) {
    ctx.save();
    ctx.translate(isoBase.x, isoBase.y);

    if (sc.type === 'fence_post') {
      // Upright Green Fence Post & Chain-Link Mesh
      ctx.fillStyle = '#065f46';
      ctx.fillRect(-2, -sc.height, 4, sc.height);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-2, -sc.height, 4, sc.height);

      // Top and Middle Metal Rails
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-18, -sc.height + 2, 36, 3);
      ctx.fillRect(-18, -sc.height / 2, 36, 2);

      // Diamond Chain-Link Pattern
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-18, -sc.height + 4);
      ctx.lineTo(18, -2);
      ctx.moveTo(-18, -2);
      ctx.lineTo(18, -sc.height + 4);
      ctx.stroke();
    } else if (sc.type === 'wooden_fence') {
      // 3D Wooden Palisade / Fence Planks (Matching upper sidewalk in OIP.webp)
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(-sc.width / 2, -sc.height, sc.width, sc.height);
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-sc.width / 2, -sc.height, sc.width, sc.height);

      // Wood Grain & Highlight Planks
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-sc.width / 2 + 2, -sc.height + 2, sc.width - 4, sc.height - 4);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-sc.width / 2 + 3, -sc.height + 3, 2, sc.height - 6);
    } else if (sc.type === 'building') {
      // 2.5D Brick Industrial Building (Matching the screenshot's buildings)
      const w = sc.width;
      const h = sc.height;
      const d = sc.depth || 90;

      // Check if this is the foreground corner building (like in bottom-right of screenshot)
      const isForeground = sc.text === 'LAST CHANCE';

      if (isForeground) {
        // --- FOREGROUND CORNER BUILDING (Matches bottom-right of OIP.webp) ---
        // 1. Isometric Flat Rooftop
        ctx.fillStyle = '#64748b'; // roof tar/concrete
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h);
        ctx.lineTo(0, -h - 22);
        ctx.lineTo(w / 2, -h);
        ctx.lineTo(0, -h + 22);
        ctx.closePath();
        ctx.fill();

        // 2. Rooftop Ventilation AC Unit / Skylight Box
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(-18, -h - 6);
        ctx.lineTo(0, -h - 15);
        ctx.lineTo(18, -h - 6);
        ctx.lineTo(0, -h + 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -h - 6, 36, 8);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-18, -h - 6, 36, 8);

        // 3. Parapet Stone Coping Rim
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h);
        ctx.lineTo(0, -h + 22);
        ctx.lineTo(w / 2, -h);
        ctx.stroke();

        // 4. Brick Wall Facade
        ctx.fillStyle = '#9a3412';
        ctx.fillRect(-w / 2, -h + 22, w, h - 22);
        ctx.strokeStyle = '#431407';
        ctx.lineWidth = 2;
        ctx.strokeRect(-w / 2, -h + 22, w, h - 22);

        // Brick Courses Pattern
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        for (let y = -h + 32; y < 0; y += 10) {
          ctx.beginPath();
          ctx.moveTo(-w / 2, y);
          ctx.lineTo(w / 2, y);
          ctx.stroke();
        }

        // 5. Large Ground Floor Storefront Window (Cyan/Blue glass like screenshot)
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-w / 2 + 18, -h + 60, w - 36, h - 75);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.strokeRect(-w / 2 + 18, -h + 60, w - 36, h - 75);

        // Storefront Window Glare
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 25, -h + 60);
        ctx.lineTo(-w / 2 + 55, -h + 60);
        ctx.lineTo(-w / 2 + 25, -15);
        ctx.closePath();
        ctx.fill();

      } else {
        // --- BACKGROUND MULTI-STORY BRICK APARTMENTS (Matches top-left of OIP.webp) ---
        // Front Face (Warm Brick)
        ctx.fillStyle = sc.color || '#991b1b';
        ctx.fillRect(-w / 2, -h, w, h);
        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 2;
        ctx.strokeRect(-w / 2, -h, w, h);

        // Brick Texture Rows
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.lineWidth = 1;
        for (let y = -h + 10; y < 0; y += 12) {
          ctx.beginPath();
          ctx.moveTo(-w / 2, y);
          ctx.lineTo(w / 2, y);
          ctx.stroke();
        }

        // 2-Pane Glass Windows with Frames (Matches the blue windows in screenshot)
        const windowRows = Math.floor(h / 36);
        const windowCols = 3;
        for (let r = 0; r < windowRows; r++) {
          for (let c = 0; c < windowCols; c++) {
            const winX = -w / 2 + 16 + c * 42;
            const winY = -h + 16 + r * 34;

            // Blue Glass
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(winX, winY, 24, 22);

            // Grey Window Frame & Mullion
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(winX, winY, 24, 22);
            ctx.beginPath();
            ctx.moveTo(winX + 12, winY);
            ctx.lineTo(winX + 12, winY + 22);
            ctx.stroke();
          }
        }

        // Rooftop Stone Edge
        ctx.fillStyle = '#475569';
        ctx.fillRect(-w / 2 - 4, -h - 6, w + 8, 8);

        if (sc.text) {
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 11px Russo One, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(sc.text, 0, -h + 12);
        }
      }
    } else if (sc.type === 'streetlight') {
      // Tall Streetlamp Pole
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-2, -sc.height, 4, sc.height);
      // Lamp Head
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(-8, -sc.height);
      ctx.lineTo(8, -sc.height);
      ctx.lineTo(4, -sc.height + 6);
      ctx.lineTo(-4, -sc.height + 6);
      ctx.closePath();
      ctx.fill();

      // Yellow Lamp Glow
      ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, -sc.height + 6);
      ctx.lineTo(-25, 0);
      ctx.lineTo(25, 0);
      ctx.closePath();
      ctx.fill();
    } else if (sc.type === 'rock') {
      // Martian Rock Spire
      ctx.fillStyle = sc.color || '#9a3412';
      ctx.beginPath();
      ctx.moveTo(-sc.width / 2, 0);
      ctx.lineTo(-sc.width / 4, -sc.height);
      ctx.lineTo(sc.width / 3, -sc.height + 10);
      ctx.lineTo(sc.width / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (sc.type === 'pipe') {
      // Sludge Pipe
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-10, -sc.height, 20, sc.height);
      ctx.strokeStyle = '#84cc16';
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, -sc.height, 20, sc.height);
    }

    ctx.restore();
  }

  /**
   * Draws 2.5D obstacle items (item boxes, jump ramps, boulders).
   */
  private drawObstacleItem(ctx: CanvasRenderingContext2D, obs: TrackObstacle, isoBase: { x: number; y: number }) {
    ctx.save();
    ctx.translate(isoBase.x, isoBase.y);

    if (obs.type === 'item_box') {
      // Bobbing 3D Isometric Question Mark Box
      const t = performance.now() * 0.004;
      const bobY = -22 + Math.sin(t) * 4;

      // Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3D Yellow '?' Cube
      ctx.translate(0, bobY);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -12, 24, 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px Russo One, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 0);
    } else if (obs.type === 'jump_ramp') {
      // 3D Yellow Ramp Wedge with Hazard Stripes
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(22, 0);
      ctx.lineTo(16, -18);
      ctx.lineTo(-28, -18);
      ctx.closePath();
      ctx.fill();

      // Hazard Stripes
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-24, -18);
      ctx.moveTo(-4, 0);
      ctx.lineTo(-10, -18);
      ctx.moveTo(10, 0);
      ctx.lineTo(4, -18);
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JUMP', -3, -4);
    } else if (obs.type === 'rock') {
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.arc(0, -obs.radius * 0.6, obs.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draws a racer's vehicle, shadow, mouse rider, and effects in authentic 2.5D isometric perspective.
   */
  private drawIsometricRacer(ctx: CanvasRenderingContext2D, racer: RacerEntity, isoBase: { x: number; y: number }) {
    ctx.save();

    // 1. ISOMETRIC DROP SHADOW ON THE ROAD
    const shadowScale = Math.max(0.35, 1.0 - racer.z / 140);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(isoBase.x + 2, isoBase.y + 3, 26 * shadowScale, 12 * shadowScale, ISO_ANGLE, 0, Math.PI * 2);
    ctx.fill();

    // 2. ISOMETRIC VEHICLE POSITION (Offset upwards by jump altitude Z)
    const isoPos = toIso(racer.x, racer.y, racer.z);
    ctx.translate(isoPos.x, isoPos.y);

    // Calculate Screen-Projected Angle
    const screenAngle = toIsoAngle(racer.angle);

    // Shield Bubble Dome
    if (racer.shieldTimer > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -6, 32, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    const isHovercraft = racer.charId === 'limburger' || racer.charId === 'karbunkle' || racer.charId === 'greasepit';

    if (isHovercraft) {
      // --- 2.5D HOVER SAUCER / POD (Matches Lawrence / Karbunkle in OIP.webp) ---
      // Hover bobbing
      const hoverBob = Math.sin(performance.now() * 0.008 + racer.x) * 2;
      ctx.translate(0, -8 + hoverBob);

      ctx.save();
      ctx.rotate(screenAngle);

      // Glowing Thruster Ring underneath
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.ellipse(-14, 0, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main Pod Hull
      ctx.fillStyle = racer.color || '#7e22ce';
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = racer.accentColor || '#c084fc';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Rear Twin Jet Nozzles
      ctx.fillStyle = '#334155';
      ctx.fillRect(-24, -8, 8, 5);
      ctx.fillRect(-24, 3, 8, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-26, -7, 3, 3);
      ctx.fillRect(-26, 4, 3, 3);

      // Glass Cockpit Dome
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(4, 0, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      // Pilot Head
      ctx.fillStyle = '#22c55e'; // Green alien / Martian face
      ctx.beginPath();
      ctx.arc(0, -12, 6, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // --- 2.5D CHOPPER MOTORCYCLE (Matches Throttle, Modo, Vinnie in OIP.webp) ---
      ctx.save();
      ctx.rotate(screenAngle);

      // Rear Heavy Rubber Tire (3D Tread)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-22, -6, 12, 12);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-22, -6, 12, 12);
      // Wheel rim hub
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-18, -3, 4, 6);

      // Front Steering Wheel (3D Tire & Chrome Fork)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(14, -5, 10, 10);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(14, -5, 10, 10);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(17, -2, 4, 4);

      // Chrome Dual Exhaust Pipes
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-20, -11, 18, 3.5);
      ctx.fillRect(-20, 7.5, 18, 3.5);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(-20, -11, 18, 3.5);
      ctx.strokeRect(-20, 7.5, 18, 3.5);

      // Engine Block with Cooling Fins
      ctx.fillStyle = '#475569';
      ctx.fillRect(-8, -7, 14, 14);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.strokeRect(-8, -7, 14, 14);

      // Main Bike Chassis & Fuel Tank
      ctx.fillStyle = racer.color;
      ctx.beginPath();
      ctx.moveTo(-16, -8);
      ctx.lineTo(12, -5);
      ctx.lineTo(16, 0);
      ctx.lineTo(12, 5);
      ctx.lineTo(-16, 8);
      ctx.closePath();
      ctx.fill();

      // Body Highlight Strip
      ctx.strokeStyle = racer.accentColor || '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Chrome Handlebars
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, -10);
      ctx.lineTo(10, 0);
      ctx.lineTo(8, 10);
      ctx.stroke();

      // Headlight Beam
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(15, -2, 4, 4);

      // Mouse Rider Torso & Arms
      const furColor = racer.charId === 'throttle' ? '#b45309' :
                       racer.charId === 'modo' ? '#64748b' :
                       racer.charId === 'vinnie' ? '#f8fafc' : '#78716c';

      const shirtColor = racer.charId === 'throttle' ? '#dc2626' :
                         racer.charId === 'modo' ? '#1e293b' :
                         racer.charId === 'vinnie' ? '#f8fafc' : '#475569';

      // Vest / Jacket Torso
      ctx.fillStyle = shirtColor;
      ctx.beginPath();
      ctx.arc(-2, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rider Arms gripping handlebars
      ctx.fillStyle = furColor;
      ctx.fillRect(0, -9, 8, 4);
      ctx.fillRect(0, 5, 8, 4);

      // Head & Ears
      ctx.fillStyle = furColor;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ears (Perked Up)
      ctx.beginPath();
      ctx.arc(-4, -8, 3.5, 0, Math.PI * 2);
      ctx.arc(-4, 8, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Character Signatures (Sunglasses / Metal Mask / Bionic Eye)
      if (racer.charId === 'throttle') {
        ctx.fillStyle = '#22c55e'; // Iconic Green Sunglasses
        ctx.fillRect(2, -4, 3.5, 8);
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1;
        ctx.strokeRect(2, -4, 3.5, 8);
      } else if (racer.charId === 'vinnie') {
        ctx.fillStyle = '#e2e8f0'; // Silver Faceplate Mask
        ctx.fillRect(2, -4, 4, 8);
      } else if (racer.charId === 'modo') {
        ctx.fillStyle = '#0284c7'; // Glowing Cyan Bionic Eye
        ctx.fillRect(2, -3, 3.5, 6);
      }

      ctx.restore();
    }

    // 5. OVERHEAD RACER TAG (Player / Rival Name)
    ctx.save();
    ctx.translate(0, -32);
    ctx.font = 'bold 11px Russo One, sans-serif';
    ctx.textAlign = 'center';

    if (racer.isPlayer) {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText('YOU', 0, 0);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(racer.name, 0, 0);
    }

    // Health bar in Battle Mode
    if (this.isBattleMode) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(-18, 5, 36, 4);
      ctx.fillStyle = racer.health > 40 ? '#22c55e' : '#ef4444';
      ctx.fillRect(-18, 5, 36 * (racer.health / racer.maxHealth), 4);
    }

    ctx.restore();

    ctx.restore();
  }

  /**
   * Draws projectiles in isometric 2.5D flight.
   */
  private drawIsometricProjectile(ctx: CanvasRenderingContext2D, p: Projectile, isoBase: { x: number; y: number }) {
    ctx.save();
    ctx.translate(isoBase.x, isoBase.y);
    const screenAngle = toIsoAngle(p.angle);
    ctx.rotate(screenAngle);

    if (p.type === 'blaster') {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillRect(-10, -2, 20, 4);
    } else if (p.type === 'homing_missile') {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, -4, 24, 8);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(12, -4);
      ctx.lineTo(18, 0);
      ctx.lineTo(12, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Draws particle FX in isometric space with distinct styles for fire, sparks, shockwaves, smoke, and debris.
   */
  private drawIsometricParticles(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
      const iso = toIso(p.x, p.y, 0);
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.type === 'shockwave') {
        const progress = 1 - p.life / p.maxLife;
        const currentRadius = p.size * (1 + progress * 3.2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 4.5 * (1 - progress));
        ctx.beginPath();
        ctx.ellipse(iso.x, iso.y, currentRadius, currentRadius * 0.58, ISO_ANGLE, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'spark') {
        // High-velocity elongated streak in isometric space
        const tailIso = toIso(p.x - p.vx * 0.025, p.y - p.vy * 0.025, 0);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailIso.x, tailIso.y);
        ctx.lineTo(iso.x, iso.y);
        ctx.stroke();
      } else if (p.type === 'fire') {
        // Hot glowing plasma core with fiery perimeter
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(iso.x, iso.y, p.size, p.size * 0.58, ISO_ANGLE, 0, Math.PI * 2);
        ctx.fill();

        // White-hot high-energy center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(iso.x, iso.y, p.size * 0.42, p.size * 0.25, ISO_ANGLE, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'smoke') {
        // Soft expanding smoke puff
        const expand = p.size * (1 + (1 - p.life / p.maxLife) * 0.8);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(iso.x, iso.y, expand, expand * 0.58, ISO_ANGLE, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(iso.x, iso.y, p.size, p.size * 0.58, ISO_ANGLE, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  /**
   * Draws screen-space motion blur, radial hyper-speed warp streaks, edge chromatic vignette,
   * and nitro activation shockwave effects directly on the screen viewport.
   */
  private drawScreenSpaceMotionBlur(ctx: CanvasRenderingContext2D, width: number, height: number, player: RacerEntity) {
    if (player.boostTimer <= 0 && this.nitroFlashTimer <= 0) return;

    const boostIntensity = Math.min(1.0, Math.max(player.boostTimer / 1.2, this.nitroFlashTimer / 0.6));
    if (boostIntensity <= 0.01) return;

    // Calculate player screen position in viewport coordinates
    const isoPlayer = toIso(player.x, player.y, player.z);
    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake;

    let dx = isoPlayer.x - this.camera.x;
    let dy = isoPlayer.y - this.camera.y;

    if (this.camera.rotation) {
      const rot = this.camera.rotation;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);
      const rx = dx * cosR - dy * sinR;
      const ry = dx * sinR + dy * cosR;
      dx = rx;
      dy = ry;
    }

    const pScreenX = width / 2 + shakeX + dx * this.camera.zoom;
    const pScreenY = height / 2 + shakeY + dy * this.camera.zoom;

    const now = performance.now();

    ctx.save();

    // 1. SCREEN-EDGE CHROMATIC WARP VIGNETTE (Cyan/Electric Tunnel)
    const maxDim = Math.hypot(width, height) / 2;
    const tunnelGrad = ctx.createRadialGradient(
      pScreenX,
      pScreenY,
      Math.min(width, height) * 0.25,
      pScreenX,
      pScreenY,
      maxDim * 1.15
    );
    tunnelGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    tunnelGrad.addColorStop(0.55, `rgba(2, 132, 199, ${0.12 * boostIntensity})`);
    tunnelGrad.addColorStop(0.85, `rgba(14, 165, 233, ${0.28 * boostIntensity})`);
    tunnelGrad.addColorStop(1.0, `rgba(99, 102, 241, ${0.45 * boostIntensity})`);

    ctx.fillStyle = tunnelGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. RADIAL HYPER-SPEED WARP MOTION BLUR STREAKS
    ctx.globalCompositeOperation = 'lighter';
    const streakCount = 36;
    const innerRadius = 55;
    const outerRadius = maxDim * 1.35;

    for (let i = 0; i < streakCount; i++) {
      // Dynamic angle with animated velocity jitter
      const baseAngle = (i / streakCount) * Math.PI * 2;
      const timeOffset = Math.sin(now * 0.012 + i * 1.7) * 0.04;
      const streakAngle = baseAngle + timeOffset;

      const cosA = Math.cos(streakAngle);
      const sinA = Math.sin(streakAngle);

      // Random pulse length per ray
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.02 + i * 3.1);
      const streakStart = innerRadius + (i % 3 === 0 ? 15 : 35) + pulse * 25;
      const streakEnd = outerRadius * (0.75 + pulse * 0.35);

      const x1 = pScreenX + cosA * streakStart;
      const y1 = pScreenY + sinA * streakStart;
      const x2 = pScreenX + cosA * streakEnd;
      const y2 = pScreenY + sinA * streakEnd;

      const streakGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      streakGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      streakGrad.addColorStop(0.2, `rgba(56, 189, 248, ${0.4 * boostIntensity})`);
      streakGrad.addColorStop(0.65, `rgba(14, 165, 233, ${0.75 * boostIntensity})`);
      streakGrad.addColorStop(1.0, `rgba(255, 255, 255, ${0.9 * boostIntensity})`);

      ctx.strokeStyle = streakGrad;
      ctx.lineWidth = (i % 4 === 0 ? 3.5 : 1.8) * boostIntensity;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 3. HORIZONTAL & DIAGONAL PERIPHERAL SPEED WARP LINES
    const edgeLines = 14;
    for (let k = 0; k < edgeLines; k++) {
      const y = (k / edgeLines) * height;
      const lineSpeed = (now * 2.8 + k * 140) % (width + 300) - 150;
      const lineLength = 80 + Math.sin(k) * 40;

      ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 * boostIntensity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lineSpeed, y);
      ctx.lineTo(lineSpeed + lineLength, y);
      ctx.stroke();
    }

    // 4. NITRO ACTIVATION BURST SHOCKWAVE & ARCADE NOTIFICATION
    if (this.nitroFlashTimer > 0) {
      const burstProgress = 1 - this.nitroFlashTimer / 0.6;
      const ringRadius = burstProgress * maxDim * 1.2;

      // Expanding cyan shockwave ring
      ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - burstProgress) * 0.9})`;
      ctx.lineWidth = Math.max(1, 8 * (1 - burstProgress));
      ctx.beginPath();
      ctx.arc(pScreenX, pScreenY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Comic Arcade "NITRO BOOST!" flash text right above player
      const bannerAlpha = Math.min(1, this.nitroFlashTimer * 2.5);
      ctx.save();
      ctx.globalAlpha = bannerAlpha;
      ctx.translate(pScreenX, Math.max(60, pScreenY - 65));

      const popScale = 1.0 + (1 - burstProgress) * 0.35;
      ctx.scale(popScale, popScale);

      ctx.font = '900 24px Russo One, Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Thick black shadow
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.strokeText('⚡ NITRO BOOST ⚡', 2, 2);

      // Cyan outline glow
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 4;
      ctx.strokeText('⚡ NITRO BOOST ⚡', 0, 0);

      // Bright yellow fill
      ctx.fillStyle = '#facc15';
      ctx.fillText('⚡ NITRO BOOST ⚡', 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draws retro screen overlays (e.g. comic "GO!" graphic and camera perspective badge).
   */
  private drawScreenOverlays(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // When countdown is precisely 0 (in first 0.8s of race), draw the comic "GO!" banner
    if (this.countdownTimer <= 0 && this.raceTimer < 1.2) {
      ctx.save();
      const scale = Math.min(1.4, 1.0 + (1.2 - this.raceTimer) * 0.3);
      ctx.translate(width / 2, height / 2 - 30);
      ctx.scale(scale, scale);

      // Yellow Comic Text with Black Outline
      ctx.font = '900 86px Russo One, Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Thick Black Shadow/Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 14;
      ctx.strokeText('GO !', 4, 4);

      // Crimson Outline
      ctx.strokeStyle = '#cc3333';
      ctx.lineWidth = 8;
      ctx.strokeText('GO !', 0, 0);

      // Bright Yellow Fill
      ctx.fillStyle = '#facc15';
      ctx.fillText('GO !', 0, 0);

      ctx.restore();
    }

    // Camera Mode Switching Notification Banner
    if (this.cameraNotificationTimer > 0) {
      ctx.save();
      const alpha = Math.min(1, this.cameraNotificationTimer * 2.0);
      ctx.globalAlpha = alpha;
      ctx.translate(width / 2, height - 90);

      // Background pill
      ctx.fillStyle = 'rgba(12, 12, 12, 0.88)';
      ctx.strokeStyle = '#cc3333';
      ctx.lineWidth = 2;
      const boxW = 320;
      const boxH = 38;
      ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
      ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

      // Camera view icon & label
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#cc3333';
      ctx.textAlign = 'center';
      ctx.fillText('VIEW PERSPECTIVE [C / V / 1-5]', 0, -6);

      ctx.font = 'bold 12px Russo One, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.cameraNotificationText, 0, 10);

      ctx.restore();
    }
  }
}
