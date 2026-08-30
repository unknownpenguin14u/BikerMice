import React from 'react';

interface PortraitProps {
  id: string;
  className?: string;
  size?: number;
}

export const CharacterPortrait: React.FC<PortraitProps> = ({ id, className = '', size = 80 }) => {
  if (id === 'throttle') {
    return (
      <div 
        className={`relative flex items-center justify-center rounded-xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-950/80 to-zinc-900 overflow-hidden shadow-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          {/* Tan Fur */}
          <circle cx="50" cy="55" r="30" fill="#d97706" stroke="#78350f" strokeWidth="3" />
          {/* Mouse Ears */}
          <circle cx="28" cy="28" r="15" fill="#d97706" stroke="#78350f" strokeWidth="3" />
          <circle cx="28" cy="28" r="9" fill="#fcd34d" />
          <circle cx="72" cy="28" r="15" fill="#d97706" stroke="#78350f" strokeWidth="3" />
          <circle cx="72" cy="28" r="9" fill="#fcd34d" />
          {/* Snout & Whiskers */}
          <ellipse cx="50" cy="65" rx="14" ry="10" fill="#fde68a" />
          <circle cx="50" cy="60" r="4" fill="#18181b" />
          {/* Iconic Green Sunglasses */}
          <rect x="26" y="42" width="22" height="12" rx="4" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
          <rect x="52" y="42" width="22" height="12" rx="4" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
          <line x1="48" y1="48" x2="52" y2="48" stroke="#15803d" strokeWidth="3" />
          {/* Grin */}
          <path d="M 42 70 Q 50 76 58 70" stroke="#78350f" strokeWidth="2.5" fill="none" />
        </svg>
      </div>
    );
  }

  if (id === 'modo') {
    return (
      <div 
        className={`relative flex items-center justify-center rounded-xl border-2 border-slate-400/80 bg-gradient-to-b from-slate-900 to-zinc-900 overflow-hidden shadow-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          {/* Gray Fur */}
          <circle cx="50" cy="55" r="33" fill="#64748b" stroke="#334155" strokeWidth="3" />
          {/* Big Ears */}
          <circle cx="24" cy="26" r="16" fill="#64748b" stroke="#334155" strokeWidth="3" />
          <circle cx="24" cy="26" r="9" fill="#cbd5e1" />
          <circle cx="76" cy="26" r="16" fill="#64748b" stroke="#334155" strokeWidth="3" />
          <circle cx="76" cy="26" r="9" fill="#cbd5e1" />
          {/* Snout */}
          <ellipse cx="50" cy="66" rx="16" ry="12" fill="#94a3b8" />
          <circle cx="50" cy="60" r="5" fill="#0f172a" />
          {/* Right Eye (Normal) */}
          <circle cx="37" cy="46" r="5" fill="#f8fafc" />
          <circle cx="37" cy="46" r="2.5" fill="#0f172a" />
          {/* Left Eye (Bionic Cyber Eye) */}
          <circle cx="63" cy="46" r="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="63" cy="46" r="3.5" fill="#e0f2fe" />
          {/* Eyepatch strap */}
          <line x1="50" y1="46" x2="80" y2="35" stroke="#0f172a" strokeWidth="2.5" />
          {/* Tough Smirk */}
          <path d="M 40 73 Q 50 78 60 72" stroke="#334155" strokeWidth="3" fill="none" />
        </svg>
      </div>
    );
  }

  if (id === 'vinnie') {
    return (
      <div 
        className={`relative flex items-center justify-center rounded-xl border-2 border-pink-500/80 bg-gradient-to-b from-zinc-800 to-zinc-900 overflow-hidden shadow-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          {/* White Fur */}
          <circle cx="50" cy="55" r="30" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
          {/* Ears */}
          <circle cx="26" cy="26" r="14" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="26" cy="26" r="8" fill="#fda4af" />
          <circle cx="74" cy="26" r="14" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="74" cy="26" r="8" fill="#fda4af" />
          {/* Snout */}
          <ellipse cx="50" cy="65" rx="14" ry="10" fill="#e2e8f0" />
          <circle cx="50" cy="60" r="4" fill="#f43f5e" />
          {/* Right Eye (Normal) */}
          <circle cx="36" cy="45" r="5" fill="#0f172a" />
          {/* Left Half Metal Faceplate */}
          <path d="M 48 35 L 75 35 L 75 70 L 48 65 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <circle cx="63" cy="46" r="3" fill="#f43f5e" />
          {/* Cocky Smile */}
          <path d="M 42 71 Q 52 79 62 68" stroke="#475569" strokeWidth="3" fill="none" />
        </svg>
      </div>
    );
  }

  if (id === 'charley') {
    return (
      <div 
        className={`relative flex items-center justify-center rounded-xl border-2 border-cyan-500/80 bg-gradient-to-b from-cyan-950/80 to-zinc-900 overflow-hidden shadow-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          {/* Human Face & Mechanic Bandana */}
          <circle cx="50" cy="55" r="28" fill="#fed7aa" />
          {/* Red Bandana with White Dots */}
          <path d="M 22 45 Q 50 25 78 45 L 78 35 Q 50 18 22 35 Z" fill="#dc2626" />
          <circle cx="35" cy="35" r="2" fill="#ffffff" />
          <circle cx="50" cy="30" r="2" fill="#ffffff" />
          <circle cx="65" cy="35" r="2" fill="#ffffff" />
          {/* Brunette Hair */}
          <path d="M 22 45 Q 18 65 24 75" stroke="#78350f" strokeWidth="6" fill="none" />
          <path d="M 78 45 Q 82 65 76 75" stroke="#78350f" strokeWidth="6" fill="none" />
          {/* Eyes */}
          <circle cx="38" cy="52" r="4" fill="#0369a1" />
          <circle cx="62" cy="52" r="4" fill="#0369a1" />
          {/* Grease Smudge */}
          <ellipse cx="68" cy="62" rx="4" ry="2" fill="#3f3f46" opacity="0.6" />
          {/* Cheerful Smile */}
          <path d="M 42 68 Q 50 75 58 68" stroke="#ea580c" strokeWidth="2.5" fill="none" />
        </svg>
      </div>
    );
  }

  if (id === 'limburger') {
    return (
      <div 
        className={`relative flex items-center justify-center rounded-xl border-2 border-lime-500/80 bg-gradient-to-b from-lime-950 to-zinc-900 overflow-hidden shadow-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          {/* Plutarkian Disguise - Pale fat face */}
          <circle cx="50" cy="52" r="32" fill="#ecfccb" stroke="#65a30d" strokeWidth="3" />
          {/* Slicked-back thinning purple hair */}
          <path d="M 25 35 Q 50 18 75 35" stroke="#581c87" strokeWidth="8" fill="none" />
          {/* Beady Greedy Eyes */}
          <circle cx="37" cy="46" r="3.5" fill="#ef4444" />
          <circle cx="63" cy="46" r="3.5" fill="#ef4444" />
          {/* Round Red Nose */}
          <circle cx="50" cy="54" r="6" fill="#f87171" />
          {/* Stink fumes */}
          <path d="M 20 20 Q 25 10 30 20" stroke="#84cc16" strokeWidth="2" fill="none" />
          <path d="M 70 20 Q 75 10 80 20" stroke="#84cc16" strokeWidth="2" fill="none" />
          {/* Evil Sneer */}
          <path d="M 38 68 Q 50 78 62 66" stroke="#4d7c0f" strokeWidth="3" fill="none" />
        </svg>
      </div>
    );
  }

  if (id === 'karbunkle') {
    return (
      <div 
        className={`relative flex items-center justify-center rounded-xl border-2 border-purple-500/80 bg-gradient-to-b from-purple-950 to-zinc-900 overflow-hidden shadow-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-1">
          {/* Mad Scientist Face */}
          <ellipse cx="50" cy="55" rx="26" ry="32" fill="#e9d5ff" stroke="#7e22ce" strokeWidth="3" />
          {/* Thick Mad Goggles */}
          <circle cx="36" cy="48" r="11" fill="#38bdf8" stroke="#1e293b" strokeWidth="3" />
          <circle cx="64" cy="48" r="11" fill="#38bdf8" stroke="#1e293b" strokeWidth="3" />
          <line x1="47" y1="48" x2="53" y2="48" stroke="#1e293b" strokeWidth="4" />
          {/* Maniacal open mouth with crooked teeth */}
          <ellipse cx="50" cy="72" rx="10" ry="6" fill="#581c87" />
          <rect x="46" y="66" width="3" height="4" fill="#ffffff" />
          <rect x="51" y="66" width="3" height="4" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  // Greasepit default
  return (
    <div 
      className={`relative flex items-center justify-center rounded-xl border-2 border-amber-600/80 bg-gradient-to-b from-amber-950 to-zinc-900 overflow-hidden shadow-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full p-1">
        {/* Oily Cyborg Face */}
        <circle cx="50" cy="55" r="30" fill="#78350f" stroke="#451a03" strokeWidth="3" />
        {/* Oil Drips */}
        <path d="M 30 30 Q 35 45 35 55" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
        <path d="M 68 25 Q 70 42 70 58" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
        {/* Dopey Eyes */}
        <circle cx="38" cy="48" r="5" fill="#facc15" />
        <circle cx="62" cy="48" r="7" fill="#facc15" />
        {/* Big Clumsy Jaw */}
        <rect x="35" y="66" width="30" height="12" rx="4" fill="#d97706" />
      </svg>
    </div>
  );
};
