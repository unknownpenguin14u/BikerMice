import React from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Gauge,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Wrench,
  Zap,
} from 'lucide-react';
import { Character, Track, UpgradeState } from '../types';

interface DashboardProps {
  selectedChar: Character;
  selectedTrack: Track;
  marsBucks: number;
  upgrades: UpgradeState;
  roster: Character[];
  onBack: () => void;
  onLaunchMission: () => void;
  onOpenGarage: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedChar,
  selectedTrack,
  marsBucks,
  upgrades,
  roster,
  onBack,
  onLaunchMission,
  onOpenGarage,
}) => {
  const upgradeTotal = Object.entries(upgrades).reduce((sum, [key, value]) => {
    if (key === 'bikeSkin') return sum;
    return sum + Number(value || 0);
  }, 0);

  const readinessScore = Math.min(
    100,
    Math.round(
      ((selectedChar.stats.topSpeed + selectedChar.stats.acceleration + selectedChar.stats.handling + selectedChar.stats.armor) /
        18) *
        10,
    ),
  );

  const statCards = [
    { label: 'Mars Bucks', value: `$${marsBucks.toLocaleString()}`, icon: Trophy },
    { label: 'Readiness', value: `${readinessScore}%`, icon: Gauge },
    { label: 'Track', value: selectedTrack.name, icon: Target },
    { label: 'Upgrades', value: `${upgradeTotal}/20`, icon: Wrench },
  ];

  return (
    <div className="relative h-full w-full overflow-y-auto bg-[#0c0c0c] text-[#f5f5f5]">
      <div className="absolute inset-0 bg-artistic-grid opacity-10" />
      <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-[#cc3333]/20 blur-[120px]" />
      <div className="absolute -right-16 top-20 h-72 w-72 rounded-full bg-[#cc3333]/15 blur-[120px]" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 p-6 md:p-10">
        <header className="flex flex-col gap-4 border-b-4 border-[#cc3333] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#cc3333] font-mono">
              COMMAND HUB // 04
            </div>
            <h1 className="font-arcade text-4xl uppercase italic text-white md:text-6xl">
              Pilot <span className="text-[#cc3333]">Dashboard</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 border border-white/15 bg-[#161616] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-200 transition hover:border-[#cc3333]"
            >
              <ArrowLeft className="h-4 w-4 text-[#cc3333]" />
              Back
            </button>
            <button
              onClick={onLaunchMission}
              className="bg-[#cc3333] px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#d14d4d]"
            >
              Launch Mission
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="border border-white/10 bg-[#121212] p-4 shadow-[6px_6px_0px_0px_rgba(204,51,51,0.12)]">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.28em] text-zinc-500">{label}</span>
                <Icon className="h-4 w-4 text-[#cc3333]" />
              </div>
              <div className="font-arcade text-2xl uppercase tracking-wide text-white">{value}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-white/10 bg-[#121212] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.35em] text-[#cc3333]">Pilot profile</div>
                <h2 className="mt-2 font-arcade text-3xl uppercase italic text-white">{selectedChar.name}</h2>
              </div>
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/10 text-xl font-black text-white"
                style={{ backgroundColor: selectedChar.bikeColor }}
              >
                {selectedChar.name.slice(0, 1)}
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between rounded border border-[#cc3333]/50 bg-[#1a1a1a] p-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">Role</div>
                <div className="font-arcade text-xl uppercase italic text-[#cc3333]">{selectedChar.role}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">Bike</div>
                <div className="font-arcade text-lg uppercase text-white">{selectedChar.bikeName}</div>
              </div>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-zinc-300">{selectedChar.bio}</p>

            <div className="space-y-4">
              {[
                ['Top Speed', selectedChar.stats.topSpeed],
                ['Acceleration', selectedChar.stats.acceleration],
                ['Handling', selectedChar.stats.handling],
                ['Armor', selectedChar.stats.armor],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400">
                    <span>{label}</span>
                    <span>{Number(value)}</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#1f1f1f]">
                    <div
                      className="h-full bg-[#cc3333]"
                      style={{ width: `${Math.min(100, Number(value) * 2.8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-white/10 bg-[#121212] p-5">
              <div className="mb-4 flex items-center gap-2 text-[#cc3333]">
                <Sparkles className="h-4 w-4" />
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.35em]">Mission Control</div>
              </div>

              <div className="space-y-3 text-sm text-zinc-300">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono uppercase tracking-[0.2em] text-zinc-500">Current Track</span>
                  <span className="font-bold text-white">{selectedTrack.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono uppercase tracking-[0.2em] text-zinc-500">Weather</span>
                  <span className="font-bold text-white">Clear</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono uppercase tracking-[0.2em] text-zinc-500">Threat</span>
                  <span className="font-bold text-[#cc3333]">High</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono uppercase tracking-[0.2em] text-zinc-500">Status</span>
                  <span className="font-bold text-emerald-400">Ready</span>
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-[#121212] p-5">
              <div className="mb-4 flex items-center gap-2 text-[#cc3333]">
                <Shield className="h-4 w-4" />
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.35em]">Garage Status</div>
              </div>

              <div className="space-y-3">
                {Object.entries(upgrades).map(([key, value]) => {
                  if (key === 'bikeSkin') return null;
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-400">
                        <span>{key}</span>
                        <span>{Number(value)}/5</span>
                      </div>
                      <div className="h-2 w-full bg-[#1f1f1f]">
                        <div
                          className="h-full bg-[#cc3333]"
                          style={{ width: `${(Number(value) / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={onOpenGarage}
                className="mt-5 inline-flex items-center gap-2 border border-white/15 bg-[#161616] px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-white transition hover:border-[#cc3333]"
              >
                Upgrade Bay
                <ChevronRight className="h-3.5 w-3.5 text-[#cc3333]" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border border-white/10 bg-[#121212] p-5">
            <div className="mb-4 flex items-center gap-2 text-[#cc3333]">
              <Zap className="h-4 w-4" />
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.35em]">Squad roster</div>
            </div>

            <div className="space-y-3">
              {roster.map((racer) => (
                <div
                  key={racer.id}
                  className={`flex items-center justify-between border p-3 ${
                    racer.id === selectedChar.id ? 'border-[#cc3333] bg-[#1a1a1a]' : 'border-white/10 bg-[#151515]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xs font-black text-white"
                      style={{ backgroundColor: racer.bikeColor }}
                    >
                      {racer.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-arcade text-lg uppercase italic text-white">{racer.name}</div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">{racer.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">Status</div>
                    <div className="font-mono text-sm font-bold text-emerald-400">ready</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-white/10 bg-[#121212] p-5">
            <div className="mb-4 flex items-center gap-2 text-[#cc3333]">
              <Trophy className="h-4 w-4" />
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.35em]">Combat brief</div>
            </div>

            <div className="space-y-4 text-sm text-zinc-300">
              <div className="rounded border border-[#cc3333]/30 bg-[#171717] p-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#cc3333]">Objective</div>
                <div className="mt-2 font-arcade text-xl uppercase italic text-white">{selectedTrack.location}</div>
                <p className="mt-2 leading-relaxed text-zinc-300">{selectedTrack.description}</p>
              </div>

              <div className="rounded border border-white/10 bg-[#171717] p-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">Quote</div>
                <p className="mt-2 text-base italic text-white">“{selectedChar.quote}”</p>
              </div>

              <button
                onClick={onLaunchMission}
                className="mt-2 flex w-full items-center justify-between border border-[#cc3333] bg-[#cc3333] px-4 py-3 text-left text-xs font-black uppercase tracking-[0.25em] text-white transition hover:bg-[#d14d4d]"
              >
                <span>Begin run</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
