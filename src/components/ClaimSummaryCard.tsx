import React from 'react';
import { ShieldCheck, FileText, MapPin, Calendar, Car, Stethoscope, Home, UserCheck, Paperclip, CheckCircle2 } from 'lucide-react';
import { ClaimData, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface ClaimSummaryCardProps {
  claim: ClaimData;
  language: Language;
  onConfirm: () => void;
  onEdit: () => void;
  isConfirmed?: boolean;
}

export const ClaimSummaryCard: React.FC<ClaimSummaryCardProps> = ({
  claim,
  language,
  onConfirm,
  onEdit,
  isConfirmed = false,
}) => {
  const t = TRANSLATIONS[language];

  const getClaimIcon = () => {
    switch (claim.claimType) {
      case 'motor':
        return <Car className="w-5 h-5 text-emerald-600" />;
      case 'health':
        return <Stethoscope className="w-5 h-5 text-emerald-600" />;
      case 'property':
        return <Home className="w-5 h-5 text-emerald-600" />;
      case 'life':
        return <UserCheck className="w-5 h-5 text-emerald-600" />;
      default:
        return <FileText className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getClaimTypeName = () => {
    switch (claim.claimType) {
      case 'motor':
        return language === 'rw' ? 'Ibinyabiziga (Motor)' : 'Motor / Vehicle';
      case 'health':
        return language === 'rw' ? 'Ubwishingizi bwo Kwivuza (Health)' : 'Health & Medical';
      case 'property':
        return language === 'rw' ? 'Inzu n’Ibyangiritse (Property)' : 'Property & Fire';
      case 'life':
        return language === 'rw' ? 'Ubwishingizi bw’Ubuzima (Life)' : 'Life Insurance';
      default:
        return claim.claimType || 'General Claim';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-emerald-200 shadow-md p-4 my-2 text-slate-800 max-w-md w-full overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
            {getClaimIcon()}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">{t.confirmClaimTitle}</h3>
            <p className="text-xs text-emerald-700 font-medium">{getClaimTypeName()}</p>
          </div>
        </div>
        {isConfirmed ? (
          <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'rw' ? 'Byaguzwe' : 'Confirmed'}</span>
          </span>
        ) : (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
            {language === 'rw' ? 'Ikarita Y’Incamake' : 'Draft Review'}
          </span>
        )}
      </div>

      {/* Structured Details Grid */}
      <div className="py-3 space-y-2.5 text-xs text-slate-700">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              {language === 'rw' ? 'Numero ya Policy' : 'Policy Number'}
            </span>
            <span className="font-semibold text-slate-800">{claim.policyNumber || 'RW-MOT-88392'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                {language === 'rw' ? 'Tariki y’ibyakorewe' : 'Incident Date'}
              </span>
              <span className="font-semibold text-slate-800">{claim.incidentDate || '2026-08-07'}</span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                {language === 'rw' ? 'Ahantu' : 'Location'}
              </span>
              <span className="font-semibold text-slate-800 truncate block max-w-[120px]">{claim.location || 'Kigali'}</span>
            </div>
          </div>
        </div>

        {/* Claim Specific Fields */}
        {claim.claimType === 'motor' && (
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
            {claim.policeReportNumber && (
              <p>
                <strong className="text-slate-600">{language === 'rw' ? 'Raporo ya Polisi:' : 'Police Report #:'}</strong>{' '}
                {claim.policeReportNumber}
              </p>
            )}
            {claim.otherPartiesInvolved && (
              <p>
                <strong className="text-slate-600">{language === 'rw' ? 'Abandi babyitwayemo:' : 'Other Vehicles:'}</strong>{' '}
                {claim.otherPartiesInvolved}
              </p>
            )}
          </div>
        )}

        {claim.claimType === 'health' && (
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
            {claim.hospitalName && (
              <p>
                <strong className="text-slate-600">{language === 'rw' ? 'Ibitaro / Ivuriro:' : 'Hospital/Clinic:'}</strong>{' '}
                {claim.hospitalName}
              </p>
            )}
            {claim.treatmentType && (
              <p>
                <strong className="text-slate-600">{language === 'rw' ? 'Ubwoko bw’amavuriro:' : 'Treatment:'}</strong>{' '}
                {claim.treatmentType}
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
          <span className="text-emerald-800 text-[10px] uppercase font-bold block mb-0.5">
            {language === 'rw' ? 'Incamake y’ibyakorewe' : 'Incident Description'}
          </span>
          <p className="text-slate-700 italic leading-relaxed">"{claim.description || 'N/A'}"</p>
        </div>

        {/* Attached Files List */}
        {claim.documentsAttached && claim.documentsAttached.length > 0 && (
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
              {language === 'rw' ? 'Inyandiko & Amafoto Yometse' : 'Attached Photos & Reports'} ({claim.documentsAttached.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {claim.documentsAttached.map((file) => (
                <div key={file.id} className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded text-[11px] text-slate-700 font-medium">
                  <Paperclip className="w-3 h-3 text-emerald-600" />
                  <span className="max-w-[130px] truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Actions */}
      {!isConfirmed && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-[#075e54] hover:bg-[#128c7e] active:scale-98 text-white font-semibold py-2 px-3 rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t.confirmButton}</span>
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            {t.editButton}
          </button>
        </div>
      )}
    </div>
  );
};
