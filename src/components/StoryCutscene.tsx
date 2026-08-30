import React, { useState } from 'react';
import { StoryChapter } from '../types';
import { CharacterPortrait } from './CharacterPortraits';
import { FastForward, ArrowRight } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface StoryCutsceneProps {
  chapter: StoryChapter;
  type: 'intro' | 'outro';
  onComplete: () => void;
}

export const StoryCutscene: React.FC<StoryCutsceneProps> = ({
  chapter,
  type,
  onComplete,
}) => {
  const dialogs = type === 'intro' ? chapter.storyIntro : chapter.storyOutro;
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentDialogue = dialogs[currentIndex];

  const handleNext = () => {
    soundEngine.playBeep(true);
    if (currentIndex < dialogs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div 
      onClick={handleNext}
      className="relative w-full h-full min-h-[600px] flex flex-col justify-between bg-[#0c0c0c] text-[#f0f0f0] p-6 sm:p-12 font-sans select-none cursor-pointer overflow-hidden box-border"
    >
      {/* Background Dots & Watermark */}
      <div className="absolute inset-0 bg-artistic-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/3 -right-8 text-[260px] font-black text-white/5 select-none leading-none pointer-events-none font-arcade">
        COMIC
      </div>

      {/* TOP HEADER: Chapter Title */}
      <div className="relative z-10 flex items-center justify-between border-b-8 border-[#cc3333] pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-[#cc3333] uppercase tracking-[0.25em] block">
            {type === 'intro' ? 'OPERATIONAL INTEL BRIEFING' : 'TACTICAL DEBRIEF & STATUS'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black italic text-white tracking-tighter uppercase font-arcade">
            {chapter.title}
          </h2>
          <span className="text-xs font-mono text-zinc-400 uppercase">{chapter.location}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="px-5 py-2.5 bg-[#161616] border border-white/20 hover:border-[#cc3333] hover:text-[#cc3333] text-xs font-mono font-bold uppercase text-zinc-300 flex items-center gap-2 transition-all cursor-pointer"
        >
          <FastForward className="w-4 h-4 text-[#cc3333]" />
          <span>FAST FORWARD</span>
        </button>
      </div>

      {/* CENTER: Comic Character Action Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-6">
        <div className="relative p-2 bg-[#161616] border-2 border-[#cc3333] shadow-[10px_10px_0px_0px_#cc3333]">
          <CharacterPortrait id={currentDialogue.avatar} size={150} />
        </div>

        <div className="mt-4 px-4 py-1 bg-[#161616] border border-white/10">
          <span className="text-base sm:text-lg font-black italic text-white tracking-wider uppercase font-arcade">
            {currentDialogue.speaker}
          </span>
        </div>
      </div>

      {/* BOTTOM: Animated Dialogue Box */}
      <div className="relative z-10 bg-[#161616] border-2 border-[#cc3333] p-6 sm:p-8 shadow-[8px_8px_0px_0px_#cc3333]">
        <div className="flex items-start justify-between gap-6">
          <p className="text-base sm:text-2xl font-sans font-medium text-white leading-relaxed italic">
            "{currentDialogue.text}"
          </p>

          <div className="flex flex-col items-center justify-center flex-shrink-0 text-[#cc3333] animate-pulse">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">TAP</span>
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>

        {/* Progress bars */}
        <div className="flex items-center gap-2 mt-5">
          {dialogs.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 transition-all ${
                idx === currentIndex ? 'w-10 bg-[#cc3333]' : 'w-3 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
