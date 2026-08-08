import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { SAMPLE_CLAIMS } from "./src/data/sampleClaims";
import { Language, ClaimData, StatusCardData, HumanHandoffRequest } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

// Store human handoffs in memory for demo
const handoffRequests: HumanHandoffRequest[] = [];

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const SYSTEM_INSTRUCTION = `
You are "InsureRw Assistant", an AI-powered insurance claims intake chatbot for the Rwandan market, created for Fintech Innovation Hackathon 2026 in an NBR Sandbox context.

Core Identity & Persona:
- Warm, empathetic, patient, clear, and reassuring tone. Many users filing claims are stressed (accidents, illness, property loss). Avoid complicated legal/insurance jargon.
- Bilingual in Kinyarwanda and English. Detect language automatically from user input.
- Kinyarwanda phrasing must be natural Rwandan language as spoken locally (e.g., use common terms like "assurance", "ubwishingizi", "guhomba", "indishyi", "polisi", "raporo", "imodoka", "kwivuza").
- IMPORTANT DISCLAIMER: Never promise guaranteed financial payout amounts or claim approval. Frame yourself as an intake assistant that speeds up intake and prepares claims for human underwriters and insurance providers.

Workflow States:
1. GREETING / LANGUAGE SELECTION:
   - Greet in Kinyarwanda first ("Muraho! Murakaza neza kuri InsureRw Assistant..."), followed by English.
   - Offer quick options: File a new claim, Check claim status, Ask coverage questions, Talk to human agent.

2. FILE A CLAIM FLOW (Branching by type: Motor, Health, Property, Life):
   - Ask for policy number (accept any format like RW-MOT-1234; simulate lookup, don't block on validation).
   - Ask for incident date, location, and brief description.
   - Specific questions:
     * Motor: Ask if other vehicles/people were involved, and police report number if available.
     * Health: Ask hospital/clinic name and treatment type (inpatient/outpatient).
     * Property/Fire: Ask extent of damage and property location.
     * Life: Ask relationship to policyholder and details.
   - Ask if user has supporting photos or document report to attach ("Ese hamwe muri iyi claim harimo amafoto cyangwa raporo? / Do you have photos or a report to attach?").
   - Summarize claim back to user for confirmation before submission.
   - Upon confirmation, generate a reference number like CLM-2026-XXXXX and give 5-7 business days review timeline.

3. CHECK CLAIM STATUS FLOW:
   - Ask for claim reference number (e.g. CLM-2026-88102).
   - Look up or simulate status: Received, Under Review, Awaiting Documents, Approved, or Paid with clear explanation in user's language.

4. COVERAGE QUESTIONS (FAQs):
   - Answer generically about motor third-party vs comprehensive, health inpatient vs outpatient, property fire/flood, life insurance.
   - Always include a short disclaimer that binding answers depend on their specific contract and encourage agent handoff if needed.

5. HUMAN HANDOFF:
   - Collect user's full name and Rwanda phone number (07XX XXX XXX).
   - Confirm callback within 24 hours.

Output Structure:
When responding, output a clean JSON response adhering to this format:
{
  "replyText": "The conversational text to display in the chat bubble",
  "detectedLanguage": "rw" | "en",
  "nextFlowState": "GREETING" | "SELECT_FLOW" | "COLLECTING_CLAIM_INFO" | "AWAITING_FILES" | "CONFIRMING_CLAIM" | "CHECKING_STATUS" | "COVERAGE_QA" | "HUMAN_HANDOFF" | "IDLE",
  "triggerAction": "SHOW_FILE_PICKER" | "SHOW_CLAIM_SUMMARY" | "SHOW_STATUS_CARD" | "SHOW_HANDOFF_FORM" | "SUBMIT_CLAIM_SUCCESS" | "NONE",
  "suggestedOptions": [
    { "label": "Option text", "value": "option_value", "icon": "icon_name" }
  ],
  "extractedClaimData": {
    "policyNumber": "...",
    "claimType": "motor" | "health" | "property" | "life",
    "incidentDate": "...",
    "location": "...",
    "description": "...",
    "otherPartiesInvolved": "...",
    "policeReportNumber": "...",
    "hospitalName": "...",
    "treatmentType": "..."
  }
}
Always ensure the replyText is friendly and accurately phrased in the active language.
`;

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "InsureRw Assistant API", version: "1.0.0" });
});

// Endpoint to list sample claim reference numbers for testing
app.get("/api/claims/sample", (req, res) => {
  res.json({ sampleClaims: SAMPLE_CLAIMS });
});

// Endpoint to check status directly
app.get("/api/claims/status/:refNum", (req, res) => {
  const refNum = req.params.refNum.trim().toUpperCase();
  if (SAMPLE_CLAIMS[refNum]) {
    res.json({ found: true, statusInfo: SAMPLE_CLAIMS[refNum].statusInfo, claim: SAMPLE_CLAIMS[refNum].claim });
  } else if (refNum.startsWith("CLM-")) {
    // Generate simulated dynamic claim status for generated refs
    const simulatedStatus: StatusCardData = {
      referenceNumber: refNum,
      status: "Under Review",
      title: "Irimo Kwiguswa / Claim Under Review",
      description: `Claim ${refNum} yarakiriwe neza kandi irimo gusuzumwa n’ishami ry’ubwishingizi. / Claim ${refNum} was received successfully and is under active review.`,
      lastUpdated: new Date().toISOString().replace("T", " ").substring(0, 16),
      claimType: "Insurance Claim",
    };
    res.json({ found: true, statusInfo: simulatedStatus });
  } else {
    res.status(404).json({ found: false, message: "Claim reference number not found." });
  }
});

// Endpoint for submitting callback requests
app.post("/api/handoff", (req, res) => {
  const { name, phone, reason } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Name and valid phone number are required." });
  }
  const newHandoff: HumanHandoffRequest = {
    id: `HND-${Date.now().toString().slice(-6)}`,
    name,
    phone,
    reason: reason || "General Claims Inquiry",
    timestamp: new Date().toISOString(),
    status: "Pending Call",
  };
  handoffRequests.push(newHandoff);
  res.json({ success: true, handoff: newHandoff, totalRequests: handoffRequests.length });
});

// Main Chat Endpoint using Gemini 3.6 Flash
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [], currentLanguage = "rw", claimData = {}, flowState = "IDLE" } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Graceful fallback response if API key is not yet set
      return res.json({
        replyText: currentLanguage === "rw"
          ? "Muraho! Twakiriye ubutumwa bwanyu. InsureRw Assistant iriteguye kugufasha."
          : "Hello! We received your message. InsureRw Assistant is ready to help.",
        detectedLanguage: currentLanguage,
        nextFlowState: "SELECT_FLOW",
        triggerAction: "NONE",
        suggestedOptions: [
          { label: "Gukora claim (File Claim)", value: "file_claim", icon: "file-plus" },
          { label: "Aho claim igeze (Check Status)", value: "check_status", icon: "search" },
          { label: "Ibibazo (Coverage FAQs)", value: "ask_coverage", icon: "help-circle" },
          { label: "Uvugane n'umukozi (Talk to Agent)", value: "human_agent", icon: "phone-call" }
        ]
      });
    }

    const userPrompt = `
User Input: "${message}"
Current Preferred Language: ${currentLanguage}
Current Flow State: ${flowState}
Current Extracted Claim Data JSON: ${JSON.stringify(claimData)}

Conversation History So Far:
${JSON.stringify(conversationHistory.slice(-6))}

Task: Process user input, maintain conversational claim filing state or status check or coverage QA, detect if language switched (e.g. Kinyarwanda vs English), update extracted claim data fields, and respond in the required JSON structure.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = response.text || "{}";
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      parsedResult = {
        replyText: responseText,
        detectedLanguage: currentLanguage,
        nextFlowState: flowState,
        triggerAction: "NONE",
      };
    }

    return res.json(parsedResult);
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error?.message || "Gemini processing issue",
    });
  }
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`InsureRw Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
