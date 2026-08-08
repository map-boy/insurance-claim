import React, { useState } from 'react';
import { PhoneCall, User, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface HumanHandoffFormProps {
  language: Language;
  onSubmitHandoff: (name: string, phone: string) => void;
}

export const HumanHandoffForm: React.FC<HumanHandoffFormProps> = ({
  language,
  onSubmitHandoff,
}) => {
  const t = TRANSLATIONS[language];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(language === 'rw' ? 'Nyamuneka andika izina ryawe.' : 'Please enter your full name.');
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError(
        language === 'rw'
          ? 'Andika numero ya telefoni y’u Rwanda y’ukuri (ek. 0788123456).'
          : 'Please enter a valid Rwanda phone number (e.g. 0788123456).'
      );
      return;
    }

    setError('');
    setSubmitted(true);
    onSubmitHandoff(name, phone);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 my-2 text-slate-800 max-w-md w-full shadow-sm">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{language === 'rw' ? 'Sabe Ryarakiriwe!' : 'Callback Request Submitted!'}</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          {language === 'rw'
            ? `Murakoze ${name}. Umukozi w’ubwishingizi arakuhamagara kuri ${phone} mu masaha 24 ari imbere.`
            : `Thank you ${name}. An authorized insurance representative will call you at ${phone} within 24 hours.`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-4 my-2 text-slate-800 max-w-md w-full overflow-hidden">
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
          <PhoneCall className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-slate-900">{t.humanHandoffTitle}</h4>
          <p className="text-[10px] text-slate-500">{t.humanHandoffNotice}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3 text-xs">
        {error && (
          <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 text-[11px] p-2 rounded-lg border border-rose-200 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            {t.fullNameLabel}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jean Paul Nshimiyimana"
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#075e54] text-xs font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            {t.phoneLabel}
          </label>
          <div className="relative">
            <span className="text-slate-400 font-semibold absolute left-2.5 top-2 text-xs">🇷🇼</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0788 123 456"
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#075e54] text-xs font-mono font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#075e54] hover:bg-[#128c7e] text-white font-semibold py-2 px-3 rounded-lg text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{t.submitHandoff}</span>
        </button>
      </form>
    </div>
  );
};
