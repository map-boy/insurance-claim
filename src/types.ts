export type Language = 'rw' | 'en';

export type ClaimType = 'motor' | 'health' | 'property' | 'life';

export type ClaimStatus = 'Received' | 'Under Review' | 'Awaiting Documents' | 'Approved' | 'Paid' | 'Rejected';

export interface DocumentFile {
  id: string;
  name: string;
  size: string;
  type: string;
  dataUrl?: string;
}

export interface ClaimData {
  policyNumber?: string;
  claimType?: ClaimType;
  incidentDate?: string;
  location?: string;
  description?: string;
  otherPartiesInvolved?: string;
  policeReportNumber?: string;
  hospitalName?: string;
  treatmentType?: string;
  documentsAttached?: DocumentFile[];
  referenceNumber?: string;
  status?: ClaimStatus;
  submittedAt?: string;
  estimatedTimeline?: string;
}

export interface ChatOption {
  label: string;
  value: string;
  icon?: string;
  category?: 'flow' | 'claim_type' | 'quick_reply';
}

export interface StatusCardData {
  referenceNumber: string;
  status: ClaimStatus;
  title: string;
  description: string;
  lastUpdated: string;
  claimType?: string;
  policyNumber?: string;
  estimatedPayoutDate?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'system';
  text: string;
  timestamp: string;
  type?: 'text' | 'options' | 'claim_summary' | 'status_card' | 'handoff_card' | 'file_picker';
  options?: ChatOption[];
  claimSummary?: ClaimData;
  statusCard?: StatusCardData;
  attachedFiles?: DocumentFile[];
  language?: Language;
}

export interface HumanHandoffRequest {
  id: string;
  name: string;
  phone: string;
  reason?: string;
  timestamp: string;
  status: 'Pending Call' | 'Contacted';
}

export interface ServerChatRequest {
  message: string;
  conversationHistory: { role: 'user' | 'model'; parts: [{ text: string }] }[];
  currentLanguage: Language;
  claimData: ClaimData;
  flowState: 'GREETING' | 'SELECT_FLOW' | 'COLLECTING_CLAIM_INFO' | 'AWAITING_FILES' | 'CONFIRMING_CLAIM' | 'CHECKING_STATUS' | 'COVERAGE_QA' | 'HUMAN_HANDOFF' | 'IDLE';
}

export interface ServerChatResponse {
  replyText: string;
  detectedLanguage?: Language;
  updatedClaimData?: ClaimData;
  nextFlowState?: string;
  suggestedOptions?: ChatOption[];
  triggerAction?: 'SHOW_FILE_PICKER' | 'SHOW_CLAIM_SUMMARY' | 'SHOW_STATUS_CARD' | 'SHOW_HANDOFF_FORM' | 'SUBMIT_CLAIM_SUCCESS';
  statusCardData?: StatusCardData;
}
