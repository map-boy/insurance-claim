import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Mic, Globe, Code, Shield, Sparkles, RefreshCw, PhoneCall, FileText, Search, HelpCircle } from 'lucide-react';
import { ChatMessage, Language, ClaimData, DocumentFile, ChatOption, StatusCardData } from './types';
import { TRANSLATIONS, detectLanguage } from './data/translations';
import { SAMPLE_CLAIMS } from './data/sampleClaims';
import { Header } from './components/Header';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { DemoPanel } from './components/DemoPanel';
import { InfoModal } from './components/InfoModal';
import { Footer } from './components/Footer';

export default function App() {
  const [language, setLanguage] = useState<Language>('rw');
  const [showDemoPanel, setShowDemoPanel] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Active Claim Data State
  const [claimData, setClaimData] = useState<ClaimData>({
    documentsAttached: [],
  });

  // Active Flow State
  const [flowState, setFlowState] = useState<string>('GREETING');

  // Messages List State
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initial welcome greeting on load
  useEffect(() => {
    const initialGreeting = getInitialGreetingMessage('rw');
    setMessages([initialGreeting]);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  function getInitialGreetingMessage(lang: Language): ChatMessage {
    const t = TRANSLATIONS[lang];
    return {
      id: 'msg-welcome',
      sender: 'bot',
      text: t.welcomeGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'options',
      options: [
        { label: lang === 'rw' ? '🚗 Gukora Claim Nshya' : '🚗 File a New Claim', value: 'file_claim', icon: 'file-plus' },
        { label: lang === 'rw' ? '🔍 Check Claim Status' : '🔍 Check Claim Status', value: 'check_status', icon: 'search' },
        { label: lang === 'rw' ? '❓ Coverage FAQs' : '❓ Coverage FAQs', value: 'ask_coverage', icon: 'help-circle' },
        { label: lang === 'rw' ? '📞 Talk to Agent' : '📞 Talk to Agent', value: 'human_agent', icon: 'phone-call' },
      ],
      language: lang,
    };
  }

  const handleToggleLanguage = () => {
    const nextLang: Language = language === 'rw' ? 'en' : 'rw';
    setLanguage(nextLang);

    // Add system notification message
    const sysMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'system',
      text: nextLang === 'rw' ? 'Ururimi rwahinduwe mu Kinyarwanda 🇷🇼' : 'Language switched to English 🇬🇧',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, sysMsg]);
  };

  // Main User Send Message Function
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setInputText('');

    // Detect language from user input
    const detected = detectLanguage(query);
    if (detected !== language) {
      setLanguage(detected);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr,
      language: detected,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Call server endpoint /api/chat
    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: historyPayload,
          currentLanguage: detected,
          claimData,
          flowState,
        }),
      });

      const data = await res.json();

      setIsTyping(false);

      const extracted = data.extractedClaimData;
      let mergedClaimData = claimData;
      if (extracted) {
        mergedClaimData = { ...claimData, ...extracted };
        setClaimData(mergedClaimData);
      }
      if (data.nextFlowState) {
        setFlowState(data.nextFlowState);
      }

      // Process trigger actions
      let msgType: ChatMessage['type'] = 'text';
      let summaryData: ClaimData | undefined;
      let statusCard: StatusCardData | undefined;

      if (data.triggerAction === 'SHOW_FILE_PICKER') {
        msgType = 'file_picker';
      } else if (data.triggerAction === 'SHOW_CLAIM_SUMMARY') {
        msgType = 'claim_summary';
        summaryData = mergedClaimData;
      } else if (data.triggerAction === 'SHOW_STATUS_CARD') {
        msgType = 'status_card';
        if (data.statusCardData) {
          statusCard = data.statusCardData;
        } else {
          const match = query.match(/CLM-\d{4}-\d+/i);
          if (match) {
            try {
              const statusRes = await fetch(`/api/claims/status/${match[0].toUpperCase()}`);
              const statusJson = await statusRes.json();
              if (statusJson.found) statusCard = statusJson.statusInfo;
            } catch (e) {
              console.warn('Status lookup failed:', e);
            }
          }
        }
      } else if (data.triggerAction === 'SHOW_HANDOFF_FORM') {
        msgType = 'handoff_card';
      } else if (data.suggestedOptions && data.suggestedOptions.length > 0) {
        msgType = 'options';
      }

      const botReply: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.replyText || (detected === 'rw' ? 'Mbwira uko nagufasha.' : 'How can I assist you?'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: msgType,
        options: data.suggestedOptions,
        claimSummary: summaryData,
        statusCard: statusCard,
        language: data.detectedLanguage || detected,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      console.error('Error calling /api/chat:', err);
      setIsTyping(false);

      // Local fallback handler for quick offline or error recovery
      handleLocalFallbackResponse(query, detected);
    }
  };

  // Quick fallback handler if network or Gemini key is delayed
  const handleLocalFallbackResponse = (query: string, lang: Language) => {
    const q = query.toLowerCase();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let replyText = '';
    let msgType: ChatMessage['type'] = 'text';
    let options: ChatOption[] | undefined;
    let summaryData: ClaimData | undefined;
    let statusCardData: StatusCardData | undefined;

    if (q.includes('claim') || q.includes('gukora') || q.includes('file')) {
      replyText =
        lang === 'rw'
          ? 'Gukora Claim Nshya:\nNyamuneka hitamo ubwoko bw\u2019ubwishingizi bwawe:'
          : 'Filing a New Claim:\nPlease select your claim category below:';
      msgType = 'options';
      options = [
        { label: lang === 'rw' ? '🚗 Ibinyabiziga (Motor)' : '🚗 Motor Insurance', value: 'claim_motor', icon: 'motor' },
        { label: lang === 'rw' ? '🏥 Kwivuza (Health)' : '🏥 Health Insurance', value: 'claim_health', icon: 'health' },
        { label: lang === 'rw' ? '🏠 Inzu / Umuriro (Property)' : '🏠 Property & Fire', value: 'claim_property', icon: 'property' },
        { label: lang === 'rw' ? '👤 Ubuzima (Life)' : '👤 Life Insurance', value: 'claim_life', icon: 'life' },
      ];
    } else if (q.includes('status') || q.includes('clm-') || q.includes('aho igeze')) {
      const match = query.match(/CLM-2026-\d+/i);
      const refNum = match ? match[0].toUpperCase() : 'CLM-2026-88102';
      statusCardData = SAMPLE_CLAIMS[refNum]?.statusInfo || SAMPLE_CLAIMS['CLM-2026-88102'].statusInfo;
      replyText =
        lang === 'rw'
          ? `Aho claim ${refNum} igeze:`
          : `Status update for claim reference ${refNum}:`;
      msgType = 'status_card';
    } else if (q.includes('agent') || q.includes('umukozi') || q.includes('human')) {
      replyText =
        lang === 'rw'
          ? 'Kuvugana n\u2019umukozi w\u2019ubwishingizi:\nNyamuneka uzuza izina na numero ya telefoni:'
          : 'Talk to an Authorized Insurance Representative:\nPlease enter your details below:';
      msgType = 'handoff_card';
    } else {
      replyText =
        lang === 'rw'
          ? 'Muraho! Ngufeze nte uyu munsi? Nshobora kugufasha gukora claim nshya, gusuzuma aho claim igeze, cyangwa kuvugana n\u2019umukozi.'
          : 'Hello! How can I assist you today? I can help you file a claim, check status, answer coverage FAQs, or request an agent callback.';
      msgType = 'options';
      options = [
        { label: lang === 'rw' ? '🚗 Gukora Claim' : '🚗 File Claim', value: 'file_claim', icon: 'file-plus' },
        { label: lang === 'rw' ? '🔍 Check Status' : '🔍 Check Status', value: 'check_status', icon: 'search' },
      ];
    }

    const botMsg: ChatMessage = {
      id: `bot-fallback-${Date.now()}`,
      sender: 'bot',
      text: replyText,
      timestamp: timeStr,
      type: msgType,
      options,
      claimSummary: summaryData,
      statusCard: statusCardData,
      language: lang,
    };

    setMessages((prev) => [...prev, botMsg]);
  };

  // Option Chip Selected
  const handleSelectOption = (optionValue: string, label: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (optionValue === 'file_claim') {
      setFlowState('COLLECTING_CLAIM_INFO');
      handleSendMessage('Ndifuza gukora claim nshya / I want to file a new claim');
    } else if (optionValue === 'check_status') {
      setFlowState('CHECKING_STATUS');
      handleSendMessage(
        language === 'rw'
          ? 'Ndashaka kureba aho claim yanjye igeze.'
          : 'I want to check my claim status.'
      );
    } else if (optionValue === 'ask_coverage') {
      handleSendMessage('Ese ubwishingizi bw\'ibinyabiziga (motor insurance) bukubiyemo ibiki?');
    } else if (optionValue === 'human_agent') {
      handleSendMessage('Ndifuza kuvugana n\'umukozi (Talk to human agent)');
    } else if (optionValue.startsWith('claim_')) {
      const type = optionValue.replace('claim_', '') as ClaimData['claimType'];
      setClaimData((prev) => ({
        ...prev,
        claimType: type,
      }));
      setFlowState('COLLECTING_CLAIM_INFO');
      handleSendMessage(
        language === 'rw'
          ? `Nahisemo ubwishingizi bwa ${type}. Ndifuza gutangira gutanga amakuru y'iki kirego.`
          : `I selected ${type} insurance. I'd like to start providing the claim details.`
      );
    } else {
      handleSendMessage(label);
    }
  };

  // User confirmed files attached in FilePickerWidget
  const handleFilesAttached = (files: DocumentFile[]) => {
    setClaimData((prev) => ({
      ...prev,
      documentsAttached: files,
    }));

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `usr-files-${Date.now()}`,
      sender: 'user',
      text: language === 'rw' ? `Nishyizeho amafoto/inyandiko (${files.length})` : `Attached ${files.length} photo/document file(s)`,
      timestamp: timeStr,
      attachedFiles: files,
    };

    // Bot generates claim summary card from whatever real data has been collected so far
    const updatedClaim: ClaimData = {
      ...claimData,
      documentsAttached: files,
    };

    setClaimData(updatedClaim);

    const botSummaryMsg: ChatMessage = {
      id: `bot-sum-${Date.now()}`,
      sender: 'bot',
      text:
        language === 'rw'
          ? 'Murakoze! Mbere yo koherereza dosiye, nyamuneka suzuma amakuru ya claim yanyu hano munsi hanyuma ukande "Emeza & Oherereza":'
          : 'Thank you! Before final submission, please review your claim summary below and click "Confirm & Submit":',
      timestamp: timeStr,
      type: 'claim_summary',
      claimSummary: updatedClaim,
    };

    setMessages((prev) => [...prev, userMsg, botSummaryMsg]);
  };

  // User skipped file attachment
  const handleSkipFiles = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedClaim: ClaimData = { ...claimData };
    setClaimData(updatedClaim);

    const botSummaryMsg: ChatMessage = {
      id: `bot-sum-skip-${Date.now()}`,
      sender: 'bot',
      text:
        language === 'rw'
          ? 'Nta kibazo! Nyamuneka suzuma amakuru ya claim yanyu hano munsi hanyuma ukande "Emeza & Oherereza":'
          : 'No problem! Please review your claim summary below and click "Confirm & Submit":',
      timestamp: timeStr,
      type: 'claim_summary',
      claimSummary: updatedClaim,
    };

    setMessages((prev) => [...prev, botSummaryMsg]);
  };

  // User clicked "Confirm & Submit Claim" on summary card
  const handleConfirmClaim = () => {
    const randomRef = `CLM-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const finalClaim: ClaimData = {
      ...claimData,
      referenceNumber: randomRef,
      status: 'Received',
      submittedAt: new Date().toISOString().substring(0, 10),
      estimatedTimeline: '5-7 business days',
    };

    setClaimData(finalClaim);

    const confirmationMsg: ChatMessage = {
      id: `bot-confirmed-${Date.now()}`,
      sender: 'bot',
      text:
        language === 'rw'
          ? `🎉 Claim Yanyu Yahererejwe Neza!\n\n📌 Numero Y'ikirango (Reference Number): ${randomRef}\n⏱️ Igihe cyo gusuzuma: Iminsi 5–7 y'akazi.\n\nTwakiriye dosiye yanyu kandi abagenzuzi bacu batangiye kuyisuzuma.`
          : `🎉 Claim Submitted Successfully!\n\n📌 Reference Number: ${randomRef}\n⏱️ Estimated Review: 5–7 business days.\n\nYour intake has been logged into our system and passed to underwriters.`,
      timestamp: timeStr,
      type: 'options',
      options: [
        { label: language === 'rw' ? '🔍 Reba Aho Igeze Now' : '🔍 Check Status Now', value: 'check_status', icon: 'search' },
        { label: language === 'rw' ? '📞 Vugana n\u2019Umukozi' : '📞 Request Agent Call', value: 'human_agent', icon: 'phone-call' },
      ],
    };

    setMessages((prev) => [...prev, confirmationMsg]);
  };

  // User submitted human handoff form
  const handleSubmitHandoff = async (name: string, phone: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      await fetch('/api/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, reason: 'Claims Assistance Callback' }),
      });
    } catch (e) {
      console.warn('Handoff submission saved locally:', e);
    }

    const ackMsg: ChatMessage = {
      id: `bot-handoff-ack-${Date.now()}`,
      sender: 'bot',
      text:
        language === 'rw'
          ? `Murakoze ${name}! Ubusabe bwanyu bwakiriwe. Umukozi w\u2019ubwishingizi arakuhamagara kuri ${phone} mu masaha 24.`
          : `Thank you ${name}! Your callback request is confirmed. An authorized representative will call ${phone} within 24 hours.`,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, ackMsg]);
  };

  // Run Demo Scenario from Hackathon Side Panel
  const handleRunDemoScenario = (
    scenario: 'file_motor' | 'file_health' | 'check_approved' | 'check_review' | 'human_agent'
  ) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (scenario === 'file_motor') {
      const demoClaim: ClaimData = {
        policyNumber: 'RW-MOT-88392',
        claimType: 'motor',
        incidentDate: '2026-08-07',
        location: 'Kigali, Remera Roundabout',
        description: 'Rear bumper collision with taxi during heavy evening traffic. Police report obtained.',
        policeReportNumber: 'PR-KGL-2026-442',
        otherPartiesInvolved: 'RAA 412 C (Toyota HiAce)',
        documentsAttached: [
          { id: 'demo-img-1', name: 'car_damage_photo.jpg', size: '2.1 MB', type: 'image/jpeg' },
        ],
      };
      setClaimData(demoClaim);

      const sysMsg: ChatMessage = {
        id: `sys-demo-${Date.now()}`,
        sender: 'system',
        text: '⚡ Running Hackathon Demo: Motor Claim Intake Flow',
        timestamp: timeStr,
      };

      const summaryMsg: ChatMessage = {
        id: `bot-demo-sum-${Date.now()}`,
        sender: 'bot',
        text:
          language === 'rw'
            ? 'Amakuru ya claim y\u2019ibinyabiziga (Motor Claim) yazuwe. Nyamuneka suzuma kandi ukande "Emeza & Oherereza":'
            : 'Automated Motor Claim intake prepared. Please review details below and click "Confirm & Submit":',
        timestamp: timeStr,
        type: 'claim_summary',
        claimSummary: demoClaim,
      };

      setMessages((prev) => [...prev, sysMsg, summaryMsg]);
    } else if (scenario === 'check_approved') {
      const statusData = SAMPLE_CLAIMS['CLM-2026-88102'].statusInfo;
      const statusMsg: ChatMessage = {
        id: `bot-status-app-${Date.now()}`,
        sender: 'bot',
        text: 'Status lookup result for CLM-2026-88102:',
        timestamp: timeStr,
        type: 'status_card',
        statusCard: statusData,
      };
      setMessages((prev) => [...prev, statusMsg]);
    } else if (scenario === 'check_review') {
      const statusData = SAMPLE_CLAIMS['CLM-2026-94210'].statusInfo;
      const statusMsg: ChatMessage = {
        id: `bot-status-rev-${Date.now()}`,
        sender: 'bot',
        text: 'Status lookup result for CLM-2026-94210:',
        timestamp: timeStr,
        type: 'status_card',
        statusCard: statusData,
      };
      setMessages((prev) => [...prev, statusMsg]);
    } else if (scenario === 'human_agent') {
      const handoffMsg: ChatMessage = {
        id: `bot-handoff-${Date.now()}`,
        sender: 'bot',
        text:
          language === 'rw'
            ? 'Uzuza numero ya telefoni n\u2019izina ryawe uheze guhamagarwa n\u2019umukozi:'
            : 'Request a human agent callback:',
        timestamp: timeStr,
        type: 'handoff_card',
      };
      setMessages((prev) => [...prev, handoffMsg]);
    }
  };

  const handleResetChat = () => {
    setClaimData({ documentsAttached: [] });
    setFlowState('GREETING');
    setMessages([getInitialGreetingMessage(language)]);
  };

  const t = TRANSLATIONS[language];

  return (
    <div className="flex flex-col h-screen bg-[#dadbd3] font-sans antialiased text-gray-900 overflow-hidden">
      {/* App Top Header */}
      <Header
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenInfo={() => setShowInfoModal(true)}
        onToggleDemoPanel={() => setShowDemoPanel(!showDemoPanel)}
        showDemoPanel={showDemoPanel}
        onQuickAction={(act) => handleSelectOption(act, 'Talk to Agent')}
      />

      {/* Main Container: Chat Screen + Optional Hackathon JSON Inspector Side Panel */}
      <div className="flex-1 flex overflow-hidden max-w-6xl w-full mx-auto relative">
        {/* WhatsApp Chat Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#e5ddd5] relative border-x border-gray-300 shadow-sm">
          {/* WhatsApp Pattern Background overlay */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none bg-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30c2 0 3-1 3-3s-1-3-3-3-3 1-3 3 1 3 3 3zm0-20c2 0 3-1 3-3s-1-3-3-3-3 1-3 3 1 3 3 3zm0 40c2 0 3-1 3-3s-1-3-3-3-3 1-3 3 1 3 3 3z' fill='%23075e54' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Messages Scroll Area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 z-10">
            {/* Date Stamp */}
            <div className="flex justify-center my-2">
              <span className="bg-white/90 backdrop-blur-xs text-gray-500 font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow-2xs border border-gray-200 tracking-wider">
                {language === 'rw' ? 'Uyu munsi' : 'Today'}
              </span>
            </div>

            {/* Chat Bubbles */}
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                language={language}
                onSelectOption={handleSelectOption}
                onConfirmClaim={handleConfirmClaim}
                onEditClaim={() => handleSendMessage('Hindura ibisobanuro bya claim')}
                onFilesAttached={handleFilesAttached}
                onSkipFiles={handleSkipFiles}
                onSubmitHandoff={handleSubmitHandoff}
              />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl rounded-tl-xs shadow-xs w-fit border border-gray-200 text-gray-500 text-xs my-1">
                <span className="w-2 h-2 bg-[#075e54] rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-[#075e54] rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-[#075e54] rounded-full animate-bounce delay-200" />
                <span className="text-[11px] font-semibold text-[#075e54] ml-1">InsureRw is typing...</span>
              </div>
            )}
          </div>

          {/* Quick Shortcuts Bar above input */}
          <div className="bg-[#f0f2f5]/90 border-t border-gray-200 px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-xs z-10 no-scrollbar">
            <span className="text-[10px] font-bold uppercase text-gray-400 shrink-0 tracking-wider">
              ⚡ Quick Actions:
            </span>
            <button
              onClick={() => handleSelectOption('file_claim', 'File Claim')}
              className="shrink-0 bg-white hover:bg-[#075e54] hover:text-white text-[#075e54] border border-gray-300 font-semibold px-3 py-1 rounded-full text-[11px] transition-all flex items-center gap-1 shadow-2xs"
            >
              <span>🚗 File Motor Claim</span>
            </button>
            <button
              onClick={() => handleSelectOption('check_status', 'Check Status')}
              className="shrink-0 bg-white hover:bg-[#075e54] hover:text-white text-[#075e54] border border-gray-300 font-semibold px-3 py-1 rounded-full text-[11px] transition-all flex items-center gap-1 shadow-2xs"
            >
              <span>🔍 Check Status</span>
            </button>
            <button
              onClick={() => handleSelectOption('human_agent', 'Talk to Agent')}
              className="shrink-0 bg-white hover:bg-[#075e54] hover:text-white text-[#075e54] border border-gray-300 font-semibold px-3 py-1 rounded-full text-[11px] transition-all flex items-center gap-1 shadow-2xs"
            >
              <span>📞 Agent Callback</span>
            </button>
          </div>

          {/* WhatsApp Bottom Input Bar - Clean Utility Style */}
          <div className="bg-[#f0f2f5] p-3 flex items-center gap-2 sm:gap-3 border-t border-gray-200 z-10">
            <button
              onClick={() => {
                const botMsg: ChatMessage = {
                  id: `bot-picker-${Date.now()}`,
                  sender: 'bot',
                  text: language === 'rw' ? 'Shyiraho amafoto cyangwa raporo:' : 'Attach incident photos or medical report:',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: 'file_picker',
                };
                setMessages((prev) => [...prev, botMsg]);
              }}
              className="p-2 text-gray-500 hover:text-[#075e54] rounded-full hover:bg-gray-200/80 transition"
              title={t.attachDoc}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-inner border-none focus-within:ring-2 focus-within:ring-[#075e54]"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.typeMessagePlaceholder}
                className="w-full bg-transparent focus:outline-none text-xs sm:text-sm text-gray-800 placeholder-gray-400"
              />
            </form>

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="w-10 h-10 bg-[#075e54] disabled:bg-gray-300 hover:bg-[#128c7e] active:scale-95 text-white rounded-full shadow-md transition flex items-center justify-center shrink-0 cursor-pointer"
              title={t.send}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </main>

        {/* Side Panel: Hackathon JSON Live State Drawer */}
        {showDemoPanel && (
          <DemoPanel
            claimData={claimData}
            language={language}
            onClose={() => setShowDemoPanel(false)}
            onRunDemoScenario={handleRunDemoScenario}
            onResetChat={handleResetChat}
          />
        )}
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <InfoModal language={language} onClose={() => setShowInfoModal(false)} />
      )}

      {/* App Footer */}
      <Footer language={language} />
    </div>
  );
}
