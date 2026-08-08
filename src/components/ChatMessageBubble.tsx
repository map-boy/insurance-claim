import React from 'react';
import { CheckCheck, Shield, Sparkles, FileText, Search, HelpCircle, PhoneCall, Car, Stethoscope, Home, UserCheck } from 'lucide-react';
import { ChatMessage, Language, ClaimData, DocumentFile } from '../types';
import { ClaimSummaryCard } from './ClaimSummaryCard';
import { StatusCard } from './StatusCard';
import { FilePickerWidget } from './FilePickerWidget';
import { HumanHandoffForm } from './HumanHandoffForm';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  language: Language;
  onSelectOption: (optionValue: string, label: string) => void;
  onConfirmClaim: () => void;
  onEditClaim: () => void;
  onFilesAttached: (files: DocumentFile[]) => void;
  onSkipFiles: () => void;
  onSubmitHandoff: (name: string, phone: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  language,
  onSelectOption,
  onConfirmClaim,
  onEditClaim,
  onFilesAttached,
  onSkipFiles,
  onSubmitHandoff,
}) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  const getOptionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'file-plus':
      case 'motor':
        return <Car className="w-3.5 h-3.5 text-emerald-600" />;
      case 'health':
        return <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />;
      case 'property':
        return <Home className="w-3.5 h-3.5 text-emerald-600" />;
      case 'life':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'search':
        return <Search className="w-3.5 h-3.5 text-sky-600" />;
      case 'help-circle':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-600" />;
      case 'phone-call':
        return <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="bg-amber-100/90 border border-amber-200/80 text-amber-900 text-[11px] font-medium px-3 py-1 rounded-full shadow-xs text-center max-w-xs">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col my-1.5 ${isUser ? 'items-end' : 'items-start'} max-w-full`}>
      {/* Main WhatsApp Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 rounded-xl shadow-xs transition-all ${
          isUser
            ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-xs border border-emerald-200/60'
            : 'bg-white text-gray-900 rounded-tl-xs border border-gray-200/80'
        }`}
      >
        {/* Sender Name tag for bot */}
        {!isUser && (
          <div className="flex items-center gap-1 mb-1 text-[11px] font-bold text-[#075e54]">
            <Shield className="w-3 h-3 text-[#075e54]" />
            <span>InsureRw Assistant</span>
          </div>
        )}

        {/* Text Content */}
        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal break-words text-gray-800">
          {message.text}
        </p>

        {/* Attached Files inside user message bubble */}
        {message.attachedFiles && message.attachedFiles.length > 0 && (
          <div className="mt-2 space-y-1">
            <span className="text-[10px] font-bold uppercase text-[#075e54]">Attached Files:</span>
            {message.attachedFiles.map((file) => (
              <div key={file.id} className="bg-emerald-50 text-emerald-900 px-2 py-1 rounded text-xs flex items-center gap-1.5 border border-emerald-200">
                <FileText className="w-3.5 h-3.5 text-[#075e54]" />
                <span className="font-semibold truncate">{file.name}</span>
                <span className="text-[10px] text-emerald-700">({file.size})</span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp & Read Receipt */}
        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isUser ? 'text-gray-500' : 'text-gray-400'}`}>
          <span>{message.timestamp}</span>
          {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
        </div>
      </div>

      {/* Embedded Widgets / Interactive Cards attached to Bot message */}
      {!isUser && (
        <div className="w-full max-w-[85%] sm:max-w-[75%]">
          {/* Quick Option Buttons Chips - Clean Utility Style */}
          {message.type === 'options' && message.options && message.options.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {message.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSelectOption(opt.value, opt.label)}
                  className="bg-white border border-gray-300 text-[#075e54] px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-[#075e54] hover:text-white transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  {getOptionIcon(opt.icon || opt.value)}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Embedded File Picker Widget */}
          {message.type === 'file_picker' && (
            <FilePickerWidget
              language={language}
              onFilesAttached={onFilesAttached}
              onSkip={onSkipFiles}
            />
          )}

          {/* Embedded Claim Summary Card */}
          {message.type === 'claim_summary' && message.claimSummary && (
            <ClaimSummaryCard
              claim={message.claimSummary}
              language={language}
              onConfirm={onConfirmClaim}
              onEdit={onEditClaim}
            />
          )}

          {/* Embedded Status Card */}
          {message.type === 'status_card' && message.statusCard && (
            <StatusCard
              statusData={message.statusCard}
              language={language}
              onContactAgent={() => onSelectOption('human_agent', 'Talk to Agent')}
              onCheckAnother={() => onSelectOption('check_status', 'Check Status')}
            />
          )}

          {/* Embedded Human Handoff Form */}
          {message.type === 'handoff_card' && (
            <HumanHandoffForm
              language={language}
              onSubmitHandoff={onSubmitHandoff}
            />
          )}
        </div>
      )}
    </div>
  );
};
