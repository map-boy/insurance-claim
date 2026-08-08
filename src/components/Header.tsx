import React from 'react';
import { Shield, Globe, Info, Code, CheckCircle, Sparkles, PhoneCall } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  onOpenInfo: () => void;
  onToggleDemoPanel: () => void;
  showDemoPanel: boolean;
  onQuickAction: (action: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  onOpenInfo,
  onToggleDemoPanel,
  showDemoPanel,
  onQuickAction,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="bg-[#075e54] text-white shadow-md z-30 sticky top-0 transition-colors h-[64px] flex items-center">
      <div className="max-w-4xl mx-auto px-4 py-2 w-full flex items-center justify-between gap-2">
        {/* Left Avatar & App Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-[2px] shadow-sm">
              <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center text-[#075e54] font-bold text-sm">
                RW
              </div>
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075e54] rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-semibold text-base leading-none tracking-tight text-white">{t.appName}</h1>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Hackathon 2026
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] opacity-90 font-normal mt-1 text-emerald-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              <span>{t.statusOnline}</span>
              <span className="text-emerald-200/50">•</span>
              <span className="hidden sm:inline opacity-90 text-[11px]">{t.tagline}</span>
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Handshake Callback */}
          <button
            onClick={() => onQuickAction('human_agent')}
            title={t.humanAgent}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#128c7e] hover:bg-white hover:text-[#075e54] text-xs font-semibold transition text-white border border-white/20"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Agent</span>
          </button>

          {/* Language Toggle Pill - Clean Utility Style */}
          <div className="flex bg-[#128c7e] rounded-full p-1 text-[11px] font-bold shadow-inner">
            <button
              onClick={onToggleLanguage}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                language === 'rw' ? 'bg-white text-[#075e54] shadow-xs' : 'text-white hover:text-emerald-100'
              }`}
            >
              KIN
            </button>
            <button
              onClick={onToggleLanguage}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                language === 'en' ? 'bg-white text-[#075e54] shadow-xs' : 'text-white hover:text-emerald-100'
              }`}
            >
              ENG
            </button>
          </div>

          {/* Hackathon JSON State Inspector Toggle */}
          <button
            onClick={onToggleDemoPanel}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
              showDemoPanel
                ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-md'
                : 'bg-[#128c7e] text-white hover:bg-white hover:text-[#075e54] border-white/20'
            }`}
            title="Inspect Live Claim JSON State"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON Live</span>
          </button>

          {/* Info Modal Button */}
          <button
            onClick={onOpenInfo}
            className="p-1.5 rounded-full hover:bg-white/20 transition text-emerald-100"
            title="About InsureRw Assistant"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
