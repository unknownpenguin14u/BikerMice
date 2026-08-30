import React from 'react';
import { Character, UpgradeState } from '../types';
import { CharacterPortrait } from './CharacterPortraits';
import { Gauge, Flame, Disc, Shield, Zap, DollarSign, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface GarageViewProps {
  playerChar: Character;
  upgrades: UpgradeState;
  marsBucks: number;
  onUpgrade: (type: keyof Omit<UpgradeState, 'bikeSkin'>, cost: number) => void;
  onChangeSkin: (skinColor: string) => void;
  onExitGarage: () => void;
}

export const GarageView: React.FC<GarageViewProps> = ({
  playerChar,
  upgrades,
  marsBucks,
  onUpgrade,
  onChangeSkin,
  onExitGarage,
}) => {
  React.useEffect(() => {
    soundEngine.startMusic('garage');
    return () => {
      soundEngine.stopMusic();
    };
  }, []);

  const upgradeCosts = [400, 800, 1500, 3000, 5000];

  const handleBuy = (type: keyof Omit<UpgradeState, 'bikeSkin'>) => {
    const currentLevel = upgrades[type];
    if (currentLevel >= 5) return;
    const cost = upgradeCosts[currentLevel - 1];
    if (marsBucks >= cost) {
      soundEngine.playCash();
      onUpgrade(type, cost);
    } else {
      soundEngine.playBeep(false);
    }
  };

  const skins = [
    { id: '#cc3333', name: 'Martian Crimson', accent: '#cc3333' },
    { id: '#ffffff', name: 'Polar White', accent: '#ffffff' },
    { id: '#38bdf8', name: 'Cyber Blue', accent: '#0284c7' },
    { id: '#ec4899', name: 'Hot Pink Rocket', accent: '#f43f5e' },
    { id: '#64748b', name: 'Titanium Slate', accent: '#38bdf8' },
    { id: '#84cc16', name: 'Plutark Slime', accent: '#4d7c0f' },
  ];

  // Dynamic calculated stats
  const currentSpeed = playerChar.stats.topSpeed + (upgrades.engine - 1) * 15;
  const currentAccel = playerChar.stats.acceleration + (upgrades.nitro - 1) * 15;
  const currentHandling = playerChar.stats.handling + (upgrades.tires - 1) * 15;
  const currentArmor = playerChar.stats.armor + (upgrades.armor - 1) * 20;

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col bg-[#0c0c0c] text-[#f0f0f0] overflow-y-auto p-6 sm:p-10 font-sans select-none box-border">
      {/* BACKGROUND DOTS & WATERMARK */}
      <div className="absolute inset-0 bg-artistic-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 -right-8 text-[240px] font-black text-white/5 select-none leading-none pointer-events-none font-arcade">
        GARAGE
      </div>

      {/* HEADER: Title, Charley Greeting, Mars Bucks */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b-8 border-[#cc3333] pb-5 mb-6 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onExitGarage}
            className="p-3 bg-[#161616] border border-white/10 hover:border-[#cc3333] text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-[#cc3333]">
              CHARLEY'S MIL-SPEC WORKSHOP
            </div>
            <h1 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase font-arcade">
              LAST CHANCE <span className="text-[#cc3333]">GARAGE</span>
            </h1>
          </div>
        </div>

        {/* Mars Bucks Wallet */}
        <div className="bg-[#161616] border border-[#cc3333] p-3 sm:p-4 flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-[#cc3333]" />
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block font-bold">RESERVE FUNDS</span>
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-wider">
              ${marsBucks.toLocaleString()} <span className="text-xs font-mono text-[#cc3333]">BUCKS</span>
            </span>
          </div>
        </div>
      </div>

      {/* CHARLEY DIALOGUE BOX */}
      <div className="mb-6 bg-[#161616] border-l-8 border-[#cc3333] p-4 flex items-center gap-4 z-10">
        <CharacterPortrait id="charley" size={56} className="flex-shrink-0 ring-2 ring-[#cc3333]" />
        <div className="flex flex-col">
          <span className="text-xs font-mono text-[#cc3333] uppercase tracking-wider font-bold">
            Charley Davidson &bull; Chief Mechanic
          </span>
          <p className="text-sm font-sans text-zinc-200 italic mt-0.5">
            "Hey {playerChar.name}! Let's soup up your {playerChar.bikeName}. Drop some fresh titanium plates or turbo nitro injectors so Limburger won't even see you coming!"
          </p>
        </div>
      </div>

      {/* MAIN GARAGE GRID: Bike Preview on Left, Upgrade Benches on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 z-10">
        {/* LEFT: Bike Showcase & Live Stats */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-[#161616] border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CharacterPortrait id={playerChar.id} size={48} className="ring-2 ring-[#cc3333]" />
              <div>
                <span className="text-[10px] font-mono text-[#cc3333] uppercase font-bold block">ACTIVE PILOT</span>
                <h3 className="text-xl font-black italic text-white uppercase font-arcade">{playerChar.name}</h3>
                <p className="text-xs font-mono text-zinc-400">{playerChar.bikeName}</p>
              </div>
            </div>
          </div>

          {/* Isometric Bike Stage Preview */}
          <div className="relative w-full h-44 sm:h-52 bg-[#0c0c0c] border border-white/10 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-artistic-grid opacity-20" />
            <div className="absolute w-40 h-16 bg-[#cc3333]/15 rounded-full blur-xl" />

            {/* Custom SVG Bike Graphic with current skin */}
            <div className="relative z-10 scale-125 transition-transform duration-300">
              <svg viewBox="0 0 120 70" className="w-40 h-24">
                {/* Wheels */}
                <circle cx="25" cy="50" r="14" fill="#18181b" stroke="#71717a" strokeWidth="3" />
                <circle cx="25" cy="50" r="6" fill="#a1a1aa" />
                <circle cx="95" cy="50" r="14" fill="#18181b" stroke="#71717a" strokeWidth="3" />
                <circle cx="95" cy="50" r="6" fill="#a1a1aa" />
                {/* Frame & Engine */}
                <path d="M 25 50 L 50 35 L 75 35 L 95 50 Z" fill="#27272a" stroke="#52525b" strokeWidth="2" />
                {/* Body Fairing with selected skin color */}
                <path d="M 40 35 L 60 20 L 85 24 L 92 38 L 70 42 Z" fill={upgrades.bikeSkin || playerChar.bikeColor} stroke="#ffffff" strokeWidth="1.5" />
                {/* Chrome Exhaust */}
                <rect x="25" y="44" width="40" height="5" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
                {/* Handlebars & Headlight */}
                <line x1="82" y1="24" x2="88" y2="12" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <circle cx="94" cy="30" r="3" fill="#facc15" />
              </svg>
            </div>
          </div>

          {/* Paint Shop Color Swatches */}
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
              CHASSIS COATINGS
            </span>
            <div className="flex items-center gap-2">
              {skins.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => onChangeSkin(skin.id)}
                  style={{ backgroundColor: skin.id }}
                  className={`w-9 h-9 border-2 transition-all flex items-center justify-center cursor-pointer ${
                    upgrades.bikeSkin === skin.id ? 'border-[#cc3333] scale-110 shadow-[3px_3px_0px_0px_#ffffff]' : 'border-white/20 hover:scale-105'
                  }`}
                  title={skin.name}
                >
                  {upgrades.bikeSkin === skin.id && <Check className="w-4 h-4 text-black" />}
                </button>
              ))}
            </div>
          </div>

          {/* Live Performance Stats */}
          <div className="space-y-3 mt-auto font-mono">
            {/* Speed */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">MAX VELOCITY</span>
                <span className="text-white font-bold">{currentSpeed} KM/H</span>
              </div>
              <div className="h-2 bg-white/10 w-full overflow-hidden">
                <div className="h-full bg-[#cc3333]" style={{ width: `${(currentSpeed / 300) * 100}%` }} />
              </div>
            </div>

            {/* Acceleration */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">ACCELERATION</span>
                <span className="text-white font-bold">{currentAccel} PTS</span>
              </div>
              <div className="h-2 bg-white/10 w-full overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${(currentAccel / 300) * 100}%` }} />
              </div>
            </div>

            {/* Handling */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">DRIFT & TRACTION</span>
                <span className="text-white font-bold">{currentHandling} PTS</span>
              </div>
              <div className="h-2 bg-white/10 w-full overflow-hidden">
                <div className="h-full bg-[#cc3333]" style={{ width: `${(currentHandling / 300) * 100}%` }} />
              </div>
            </div>

            {/* Armor */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">CHASSIS ARMOR</span>
                <span className="text-white font-bold">{currentArmor} PTS</span>
              </div>
              <div className="h-2 bg-white/10 w-full overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${(currentArmor / 320) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Interactive Upgrade Modules */}
        <div className="lg:col-span-7 flex flex-col gap-3.5">
          {/* Module 1: Engine Tuning */}
          <UpgradeCard
            title="Super-Charged Engine Bore"
            category="Top Speed & Thrust Velocity"
            level={upgrades.engine}
            icon={<Gauge className="w-5 h-5 text-[#cc3333]" />}
            cost={upgrades.engine < 5 ? upgradeCosts[upgrades.engine - 1] : null}
            canAfford={upgrades.engine < 5 && marsBucks >= upgradeCosts[upgrades.engine - 1]}
            onBuy={() => handleBuy('engine')}
          />

          {/* Module 2: Nitrous Injector */}
          <UpgradeCard
            title="Martian Nitrous Injectors"
            category="Acceleration & Mini-Turbo Duration"
            level={upgrades.nitro}
            icon={<Flame className="w-5 h-5 text-[#cc3333]" />}
            cost={upgrades.nitro < 5 ? upgradeCosts[upgrades.nitro - 1] : null}
            canAfford={upgrades.nitro < 5 && marsBucks >= upgradeCosts[upgrades.nitro - 1]}
            onBuy={() => handleBuy('nitro')}
          />

          {/* Module 3: Radial Gripper Tires */}
          <UpgradeCard
            title="Radial Off-Road Tires"
            category="Handling & Drift Traction"
            level={upgrades.tires}
            icon={<Disc className="w-5 h-5 text-[#cc3333]" />}
            cost={upgrades.tires < 5 ? upgradeCosts[upgrades.tires - 1] : null}
            canAfford={upgrades.tires < 5 && marsBucks >= upgradeCosts[upgrades.tires - 1]}
            onBuy={() => handleBuy('tires')}
          />

          {/* Module 4: Titanium Chassis Armor */}
          <UpgradeCard
            title="Titanium Ram Plating"
            category="Armor & Collision Ramming Defense"
            level={upgrades.armor}
            icon={<Shield className="w-5 h-5 text-[#cc3333]" />}
            cost={upgrades.armor < 5 ? upgradeCosts[upgrades.armor - 1] : null}
            canAfford={upgrades.armor < 5 && marsBucks >= upgradeCosts[upgrades.armor - 1]}
            onBuy={() => handleBuy('armor')}
          />

          {/* Module 5: Weapon Bay Ammo */}
          <UpgradeCard
            title="Heavy Arsenal Hardpoints"
            category="Weapon Damage & Ammo Payload"
            level={upgrades.weapons}
            icon={<Zap className="w-5 h-5 text-[#cc3333]" />}
            cost={upgrades.weapons < 5 ? upgradeCosts[upgrades.weapons - 1] : null}
            canAfford={upgrades.weapons < 5 && marsBucks >= upgradeCosts[upgrades.weapons - 1]}
            onBuy={() => handleBuy('weapons')}
          />

          {/* Done / Race Ready Button */}
          <button
            onClick={onExitGarage}
            className="mt-2 py-4 px-8 bg-white text-black font-black uppercase text-base skew-x-[-15deg] shadow-[6px_6px_0px_0px_#cc3333] hover:bg-[#cc3333] hover:text-white hover:shadow-[6px_6px_0px_0px_#ffffff] transition-all cursor-pointer font-arcade flex items-center justify-center gap-3"
          >
            <span className="inline-block skew-x-[15deg]">RACE READY &bull; RETURN TO MISSIONS</span>
            <ArrowRight className="w-5 h-5 inline-block skew-x-[15deg]" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface UpgradeCardProps {
  title: string;
  category: string;
  level: number;
  icon: React.ReactNode;
  cost: number | null;
  canAfford: boolean;
  onBuy: () => void;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({
  title,
  category,
  level,
  icon,
  cost,
  canAfford,
  onBuy,
}) => {
  return (
    <div className="bg-[#161616] border border-white/10 p-4 flex items-center justify-between gap-4 hover:border-white/30 transition-colors">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 bg-[#0c0c0c] border border-[#cc3333] flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-black italic text-white uppercase font-arcade">{title}</h4>
          <span className="text-[10px] font-mono text-zinc-400 block">{category}</span>
          {/* Level pips */}
          <div className="flex items-center gap-1.5 mt-2 font-mono">
            {[1, 2, 3, 4, 5].map((pip) => (
              <div
                key={pip}
                className={`w-4 h-2 ${
                  pip <= level ? 'bg-[#cc3333]' : 'bg-white/10'
                }`}
              />
            ))}
            <span className="text-[10px] font-mono text-[#cc3333] font-bold ml-1">LVL {level}/5</span>
          </div>
        </div>
      </div>

      {level >= 5 ? (
        <span className="px-4 py-2 bg-[#0c0c0c] text-white text-xs font-bold font-mono uppercase border border-white/20">
          MAXED OUT
        </span>
      ) : (
        <button
          onClick={onBuy}
          disabled={!canAfford}
          className={`px-5 py-2.5 font-mono font-bold text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
            canAfford
              ? 'bg-[#cc3333] hover:bg-white hover:text-black text-black shadow-[3px_3px_0px_0px_#ffffff]'
              : 'bg-[#0c0c0c] text-[#cc3333] border border-[#cc3333]/40 opacity-60 cursor-not-allowed'
          }`}
        >
          <span>UPGRADE</span>
          <span className="font-bold">${cost?.toLocaleString()}</span>
        </button>
      )}
    </div>
  );
};
