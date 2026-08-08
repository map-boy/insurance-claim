import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const t = TRANSLATIONS[language];

  return (
    <footer className="bg-[#f0f2f5] border-t border-gray-200 text-gray-500 text-[11px] py-2 px-4 text-center z-10">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
        <p className="font-semibold text-gray-700 flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-[#075e54] inline" />
          <span>{t.footerCredits}</span>
        </p>
        <p className="text-[10px] text-gray-400">
          Powered by <strong>InsureRw</strong> • Fintech Innovation Hackathon 2026
        </p>
      </div>
    </footer>
  );
};
