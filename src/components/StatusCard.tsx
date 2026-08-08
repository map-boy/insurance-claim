import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, CheckCheck, RefreshCw, FileText, PhoneCall } from 'lucide-react';
import { StatusCardData, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface StatusCardProps {
  statusData: StatusCardData;
  language: Language;
  onContactAgent?: () => void;
  onCheckAnother?: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  statusData,
  language,
  onContactAgent,
  onCheckAnother,
}) => {
  const t = TRANSLATIONS[language];

  const getStatusBadge = () => {
    switch (statusData.status) {
      case 'Approved':
      case 'Paid':
        return (
          <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusData.status}</span>
          </div>
        );
      case 'Under Review':
      case 'Received':
        return (
          <div className="flex items-center gap-1.5 bg-sky-100 text-sky-800 border border-sky-300 font-bold px-3 py-1 rounded-full text-xs">
            <Clock className="w-4 h-4 text-sky-600 animate-spin" />
            <span>{statusData.status}</span>
          </div>
        );
      case 'Awaiting Documents':
        return (
          <div className="flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-300 font-bold px-3 py-1 rounded-full text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{statusData.status}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded-full text-xs">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>{statusData.status}</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-4 my-2 text-slate-800 max-w-md w-full overflow-hidden transition-all">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
            {language === 'rw' ? 'IKIRANGO CYA CLAIM' : 'CLAIM REFERENCE'}
          </span>
          <h3 className="font-mono font-bold text-base text-emerald-800 tracking-wider">
            {statusData.referenceNumber}
          </h3>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Status Information */}
      <div className="py-3 space-y-2">
        <h4 className="font-bold text-sm text-slate-900">{statusData.title}</h4>
        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          {statusData.description}
        </p>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          {statusData.policyNumber && (
            <div>
              <span className="text-slate-400 text-[10px] block font-semibold">
                {language === 'rw' ? 'Numero ya Policy' : 'Policy #'}
              </span>
              <span className="font-semibold text-slate-800">{statusData.policyNumber}</span>
            </div>
          )}

          {statusData.claimType && (
            <div>
              <span className="text-slate-400 text-[10px] block font-semibold">
                {language === 'rw' ? 'Ubwoko bw’Ubwishingizi' : 'Claim Category'}
              </span>
              <span className="font-semibold text-slate-800">{statusData.claimType}</span>
            </div>
          )}

          {statusData.lastUpdated && (
            <div className="col-span-2 text-[11px] text-slate-400 pt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>
                {language === 'rw' ? 'Iheruka kuvugururwa:' : 'Last Updated:'} {statusData.lastUpdated}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        {onContactAgent && (
          <button
            onClick={onContactAgent}
            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{language === 'rw' ? 'Vugana n’umukozi' : 'Contact Agent'}</span>
          </button>
        )}
        {onCheckAnother && (
          <button
            onClick={onCheckAnother}
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 transition flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{language === 'rw' ? 'Baza iyindi' : 'Check Another'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
