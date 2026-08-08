import { Language } from '../types';

export const TRANSLATIONS = {
  rw: {
    appName: 'InsureRw Assistant',
    statusOnline: 'Abonetse / Online',
    welcomeGreeting: 'Muraho! Murakaza neza kuri InsureRw Assistant. 🇷🇼\n\nNdi umufasha wanyu mu by’ubwishingizi mu Rwanda. Nshobora kugufasha mu Kinyarwanda cyangwa mu Cyongereza.\n\nEse uyu munsi nagufasha nte?',
    tagline: 'Ubwishingizi Bwihuse & Bworoshye / Fast & Simple Claims Intake',
    toggleLang: 'Switch to English',
    fileClaim: 'Gukora claim nshya (File Claim)',
    checkStatus: 'Gusuzuma aho claim igeze (Check Status)',
    askCoverage: 'Kubaza ku bwishingizi (Coverage Q&A)',
    humanAgent: 'Kuvugana n’umukozi (Talk to Agent)',
    quickDemoTitle: '⚡ Test In 1-Click (Hackathon Demo):',
    quickDemoMotor: '🚗 File Motor Claim',
    quickDemoStatus: '🔍 Check Status (CLM-2026-88102)',
    typeMessagePlaceholder: 'Andika hano (Type a message)...',
    send: 'Oherereza',
    attachDoc: 'Shyiraho amafoto cyangwa dosiye',
    dropFilesHere: 'Kanda cyangwa ukurure amafoto/raporo hano',
    confirmClaimTitle: 'Resume & Emeza Claim Yanyu',
    confirmButton: 'Emeza & Oherereza (Submit Claim)',
    editButton: 'Hindura (Edit Details)',
    refNumberGenerated: 'Numero Yanyu Y’Ikirango (Reference Number):',
    estimatedReview: 'Igihe bizafata gusuzumwa: Iminsi 5-7 y’akazi.',
    humanHandoffTitle: 'Kuvugana n’Umukozi w’Ubwishingizi',
    humanHandoffNotice: 'Uzuza amakuru yawe hano, umukozi wacu ari kuguhamagara mu masaha 24 ari imbere.',
    fullNameLabel: 'Izina Ryose',
    phoneLabel: 'Numero ya Telefoni (Rwanda: 07XX XXX XXX)',
    submitHandoff: 'Saba Guhamagarwa',
    disclaimerText: '⚠️ InsureRw Assistant ni umufasha wo kwakira amakuru gusa (Intake Assistant) mu mushinga wa Fintech Innovation Hackathon 2026. Ntitutanga inama z’amategeko cyangwa ngo twemeze amafaranga ntakuka batabanje gusuzuma.',
    footerCredits: 'Powered by InsureRw · Fintech Innovation Hackathon 2026',
    sampleRefsTitle: 'Sample Ref Numbers for Testing:',
  },
  en: {
    appName: 'InsureRw Assistant',
    statusOnline: 'Online',
    welcomeGreeting: 'Hello! Welcome to InsureRw Assistant. 🇷🇼\n\nI am your AI insurance claims intake assistant for Rwanda. I can assist you in English or Kinyarwanda.\n\nHow can I help you today?',
    tagline: 'Fast & Simple Claims Intake for Rwanda',
    toggleLang: 'Hindura mu Kinyarwanda',
    fileClaim: 'File a new claim',
    checkStatus: 'Check claim status',
    askCoverage: 'Coverage & FAQs',
    humanAgent: 'Talk to a human agent',
    quickDemoTitle: '⚡ Test In 1-Click (Hackathon Demo):',
    quickDemoMotor: '🚗 File Motor Claim',
    quickDemoStatus: '🔍 Check Status (CLM-2026-88102)',
    typeMessagePlaceholder: 'Type your message here...',
    send: 'Send',
    attachDoc: 'Attach photos or document',
    dropFilesHere: 'Click or drop photos/report here',
    confirmClaimTitle: 'Review & Confirm Your Claim',
    confirmButton: 'Confirm & Submit Claim',
    editButton: 'Edit Details',
    refNumberGenerated: 'Your Claim Reference Number:',
    estimatedReview: 'Estimated review timeline: 5–7 business days.',
    humanHandoffTitle: 'Request a Callback from an Agent',
    humanHandoffNotice: 'Provide your name and Rwanda phone number. A human representative will call you within 24 hours.',
    fullNameLabel: 'Full Name',
    phoneLabel: 'Phone Number (Rwanda format: 07XX XXX XXX)',
    submitHandoff: 'Request Callback',
    disclaimerText: '⚠️ InsureRw Assistant is an intake automation tool created for Fintech Innovation Hackathon 2026 (NBR Sandbox context). It does not provide binding financial/legal advice or promise instant payouts.',
    footerCredits: 'Powered by InsureRw · Fintech Innovation Hackathon 2026',
    sampleRefsTitle: 'Sample Ref Numbers for Testing:',
  },
};

export const KINYARWANDA_KEYWORDS = [
  'muraho', 'bitagu', 'yego', 'oya', 'claim', 'ubwishingizi', 'ikinyabiziga', 'imodoka',
  'moto', 'impanuka', 'gusaba', 'indishyi', 'nomero', 'kwivuza', 'ibitaro', 'inzu',
  'umuriro', 'guhomba', 'amafaranga', 'polisi', 'raporo', 'amashusho', 'amafoto', 'kuri',
  'kigali', 'huye', 'musanze', 'rubavu', 'remera', 'nyarugenge', 'muryango', 'isambu'
];

export function detectLanguage(text: string): Language {
  const lower = text.toLowerCase();
  let rwHits = 0;
  for (const kw of KINYARWANDA_KEYWORDS) {
    if (lower.includes(kw)) {
      rwHits++;
    }
  }
  return rwHits > 0 ? 'rw' : 'en';
}
