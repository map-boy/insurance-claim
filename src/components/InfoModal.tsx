import React from 'react';
import { X, Shield, Award, Sparkles, AlertCircle, FileCode } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface InfoModalProps {
  language: Language;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ language, onClose }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="bg-[#075e54] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base">{t.appName}</h3>
              <p className="text-xs text-emerald-100">Fintech Innovation Hackathon 2026</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900">
            <Award className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-semibold">
              {language === 'rw'
                ? 'InsureRw Assistant ni umufasha wa AI wo kwakira no kugenzura ibyifuzo by’ubwishingizi mu Rwanda.'
                : 'InsureRw Assistant is an AI insurance claims intake assistant tailored for the Rwandan market.'}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#075e54]" />
              <span>{language === 'rw' ? 'Ibyo Ikora:' : 'Key Capabilities:'}</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>{language === 'rw' ? 'Gukoresha Ikinyarwanda cy’umwimerere hamwe n’Icyongereza (Auto-Language Detection)' : 'Bilingual Kinyarwanda & English natural conversation'}</li>
              <li>{language === 'rw' ? 'Kwakira no gupima ubwishingizi bw’ibinyabiziga (Motor), ubuzima/kwivuza (Health), inzu (Property), n’ubuzima (Life)' : 'Branching intake for Motor, Health, Property/Fire, and Life claims'}</li>
              <li>{language === 'rw' ? 'Gushyiraho amafoto no kurema numero y’ikirango (CLM-2026-XXXXX)' : 'Photo/document attachment simulation & unique claim reference generation'}</li>
              <li>{language === 'rw' ? 'Gusuzuma aho claim igeze mu buryo bwihuse (Instant Status Lookup)' : 'Instant claim status check with sample datasets'}</li>
              <li>{language === 'rw' ? 'Gusaba kuvugana n’umukozi kuri telefoni y’u Rwanda (07XX XXX XXX)' : 'Human agent callback requests with Rwanda phone validation'}</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5">NBR Sandbox & Intake Notice</span>
              <p className="text-[11px] leading-relaxed text-amber-800">{t.disclaimerText}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="bg-[#075e54] hover:bg-[#128c7e] text-white font-semibold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
          >
            {language === 'rw' ? 'Komeza Koresha Assistant' : 'Continue to Assistant'}
          </button>
        </div>
      </div>
    </div>
  );
};
