import React from 'react';
import { Code, Zap, X, Copy, Check, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { ClaimData, Language } from '../types';
import { SAMPLE_CLAIMS } from '../data/sampleClaims';

interface DemoPanelProps {
  claimData: ClaimData;
  language: Language;
  onClose: () => void;
  onRunDemoScenario: (scenarioType: 'file_motor' | 'file_health' | 'check_approved' | 'check_review' | 'human_agent') => void;
  onResetChat: () => void;
}

export const DemoPanel: React.FC<DemoPanelProps> = ({
  claimData,
  language,
  onClose,
  onRunDemoScenario,
  onResetChat,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(claimData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-slate-100 border-l border-slate-700 w-full md:w-80 lg:w-96 p-4 overflow-y-auto flex flex-col h-full z-40 shadow-xl transition-all">
      {/* Drawer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-white">Hackathon Demo & JSON Inspector</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
        This side panel provides 1-click test scenarios for the 3-minute hackathon video demo and displays real-time structured JSON state output.
      </p>

      {/* 1-Click Fast Scenarios */}
      <div className="mt-4 space-y-2">
        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          <span>1-Click Hackathon Scenarios</span>
        </span>

        <button
          onClick={() => onRunDemoScenario('file_motor')}
          className="w-full text-left bg-slate-800 hover:bg-slate-700 active:scale-98 border border-slate-700 hover:border-emerald-500 p-2.5 rounded-xl text-xs transition font-medium flex items-center justify-between"
        >
          <div>
            <span className="block font-bold text-emerald-400">🚗 File Motor Claim (End-to-End)</span>
            <span className="text-[10px] text-slate-400">Autofills policy, location, description & photo</span>
          </div>
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
        </button>

        <button
          onClick={() => onRunDemoScenario('check_approved')}
          className="w-full text-left bg-slate-800 hover:bg-slate-700 active:scale-98 border border-slate-700 hover:border-sky-500 p-2.5 rounded-xl text-xs transition font-medium flex items-center justify-between"
        >
          <div>
            <span className="block font-bold text-sky-400">🔍 Check Status (Approved: CLM-2026-88102)</span>
            <span className="text-[10px] text-slate-400">RWF 450,000 payout approved</span>
          </div>
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
        </button>

        <button
          onClick={() => onRunDemoScenario('check_review')}
          className="w-full text-left bg-slate-800 hover:bg-slate-700 active:scale-98 border border-slate-700 hover:border-amber-500 p-2.5 rounded-xl text-xs transition font-medium flex items-center justify-between"
        >
          <div>
            <span className="block font-bold text-amber-400">⏳ Check Status (Review: CLM-2026-94210)</span>
            <span className="text-[10px] text-slate-400">King Faisal Hospital health claim</span>
          </div>
          <Database className="w-4 h-4 text-amber-400 shrink-0" />
        </button>

        <button
          onClick={() => onRunDemoScenario('human_agent')}
          className="w-full text-left bg-slate-800 hover:bg-slate-700 active:scale-98 border border-slate-700 hover:border-indigo-500 p-2.5 rounded-xl text-xs transition font-medium flex items-center justify-between"
        >
          <div>
            <span className="block font-bold text-indigo-400">📞 Request Agent Callback</span>
            <span className="text-[10px] text-slate-400">Rwanda format phone intake</span>
          </div>
        </button>
      </div>

      {/* Real-time JSON Viewer */}
      <div className="mt-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Claim JSON State</span>
          </span>
          <button
            onClick={handleCopyJson}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 text-emerald-400 p-3 rounded-xl border border-slate-800 text-[11px] font-mono overflow-auto flex-1 max-h-60 leading-relaxed shadow-inner">
          {JSON.stringify(claimData, null, 2)}
        </pre>
      </div>

      {/* Pre-loaded Sample Reference Numbers */}
      <div className="mt-4 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
          Test Reference Numbers:
        </span>
        <div className="space-y-1 text-[11px] font-mono text-slate-300">
          <p className="flex justify-between">
            <span className="text-emerald-400">CLM-2026-88102</span>
            <span className="text-slate-400 text-[10px]">Approved</span>
          </p>
          <p className="flex justify-between">
            <span className="text-sky-400">CLM-2026-94210</span>
            <span className="text-slate-400 text-[10px]">Under Review</span>
          </p>
          <p className="flex justify-between">
            <span className="text-amber-400">CLM-2026-30192</span>
            <span className="text-slate-400 text-[10px]">Awaiting Docs</span>
          </p>
        </div>
      </div>

      {/* Reset Conversation Button */}
      <button
        onClick={onResetChat}
        className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 border border-slate-700"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Reset Conversation</span>
      </button>
    </div>
  );
};
