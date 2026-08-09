import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { SAMPLE_CLAIMS } from "./src/data/sampleClaims";
import { StatusCardData, HumanHandoffRequest } from "./src/types";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

const handoffRequests: HumanHandoffRequest[] = [];

const REQUIRED_FIELDS_BY_TYPE: Record<string, string[]> = {
  motor: ["policyNumber", "incidentDate", "location", "description", "policeReportNumber"],
  health: ["policyNumber", "incidentDate", "location", "description", "hospitalName", "treatmentType"],
  property: ["policyNumber", "incidentDate", "location", "description"],
  life: ["policyNumber", "incidentDate", "location", "description"],
};

function getMissingFields(claimData: Record<string, any>): string[] {
  const type = claimData?.claimType;
  if (!type || !REQUIRED_FIELDS_BY_TYPE[type]) return [];
  return REQUIRED_FIELDS_BY_TYPE[type].filter((f) => !claimData[f] || String(claimData[f]).trim() === "");
}

interface LlmProvider {
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
  supportsJsonMode: boolean;
}

const PROVIDERS: LlmProvider[] = [
  {
    name: "groq",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    supportsJsonMode: true,
  },
  {
    name: "mistral",
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    apiKey: process.env.MISTRAL_API_KEY,
    model: "mistral-small-latest",
    supportsJsonMode: true,
  },
  {
    name: "huggingface",
    baseUrl: "https://router.huggingface.co/v1/chat/completions",
    apiKey: process.env.HF_TOKEN,
    model: "meta-llama/Llama-3.3-70B-Instruct",
    supportsJsonMode: false,
  },
];

async function callProvider(
  provider: LlmProvider,
  systemInstruction: string,
  userPrompt: string,
  timeoutMs = 15000
): Promise<string | null> {
  if (!provider.apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: Record<string, unknown> = {
      model: provider.model,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1024,
    };

    if (provider.supportsJsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(provider.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[llm:${provider.name}] HTTP ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : null;
  } catch (err: any) {
    console.warn(`[llm:${provider.name}] failed: ${err?.message || err}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callLLM(
  systemInstruction: string,
  userPrompt: string
): Promise<{ text: string; providerName: string } | null> {
  for (const provider of PROVIDERS) {
    const text = await callProvider(provider, systemInstruction, userPrompt);
    if (text) return { text, providerName: provider.name };
  }
  return null;
}

// Attempt to pull valid JSON out of a model reply even if it added stray
// text, markdown fences, or trailing commentary around the object.
function extractJson(raw: string): any | null {
  const cleaned = raw.replace(/```json\s*|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through
  }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      // fall through
    }
  }
  return null;
}

const VALID_CLAIM_TYPES = new Set(["motor", "health", "property", "life"]);
const VALID_FLOW_STATES = new Set([
  "GREETING", "SELECT_FLOW", "COLLECTING_CLAIM_INFO", "AWAITING_FILES",
  "CONFIRMING_CLAIM", "CHECKING_STATUS", "COVERAGE_QA", "HUMAN_HANDOFF", "IDLE",
]);

// Enforce the hard rules server-side so a model slip-up never reaches the user:
// never re-show the 4-option greeting menu once the flow has moved on, and
// never keep a claimType/flowState the model hallucinated outside the enum.
function sanitizeParsedResult(parsed: any, flowState: string, currentLanguage: string) {
  if (!parsed || typeof parsed !== "object") return null;

  const out: Record<string, any> = { ...parsed };

  if (!VALID_FLOW_STATES.has(out.nextFlowState)) {
    out.nextFlowState = flowState;
  }
  if (out.detectedLanguage !== "rw" && out.detectedLanguage !== "en") {
    out.detectedLanguage = currentLanguage;
  }
  if (typeof out.replyText !== "string" || !out.replyText.trim()) {
    out.replyText = currentLanguage === "rw" ? "Mbwira uko nagufasha." : "How can I assist you?";
  }

  const pastGreeting = flowState !== "GREETING" && flowState !== "SELECT_FLOW";
  if (pastGreeting && Array.isArray(out.suggestedOptions)) {
    const values = out.suggestedOptions.map((o: any) => o?.value).sort().join(",");
    if (values === "ask_coverage,check_status,file_claim,human_agent") {
      delete out.suggestedOptions;
    }
  }

  if (out.extractedClaimData && typeof out.extractedClaimData === "object") {
    if (out.extractedClaimData.claimType && !VALID_CLAIM_TYPES.has(out.extractedClaimData.claimType)) {
      delete out.extractedClaimData.claimType;
    }
  }

  return out;
}

const SYSTEM_INSTRUCTION = `
You are "InsureRw Assistant", an AI insurance claims intake chatbot for the Rwandan market.

PERSONA: Warm, empathetic, plain language, no jargon. Never promise a guaranteed payout amount or approval — you only do intake for human underwriters.

LANGUAGE: Reply in whichever language the user's LATEST message is written in (rw or en). Never mix broken grammar between the two languages in one reply. Kinyarwanda must be natural, correctly-conjugated Rwandan Kinyarwanda, not a literal word-for-word translation.

HARD RULES — READ CAREFULLY, THIS IS THE MOST IMPORTANT PART:
1. You are given "Fields Still Needed" for the active claim in the user prompt. If that list is non-empty, your ENTIRE job this turn is to ask for exactly the FIRST field in that list, in one short sentence. Do not ask for anything already filled in (see "Current Extracted Claim Data"). Do not repeat the greeting menu. Do not restate the whole list of missing fields — ask for only one.
2. Never return the generic 4-option greeting menu (file claim / check status / coverage / agent) after the FIRST bot message of the conversation. Once flowState has moved past GREETING/SELECT_FLOW, suggestedOptions must be omitted or contain only options relevant to the immediate next step (e.g. yes/no, skip attachment).
3. If the user's message doesn't clearly answer the field you just asked for (small talk, a greeting, an unrelated comment), respond warmly and naturally to what they said in one short clause, then steer back to asking for that SAME missing field. Vary your wording each time -- never repeat the exact same sentence twice in a row. Do not fall back to the menu.
4. "Fields Still Needed" is authoritative and computed by the server from real state. Trust it over your own read of the conversation.
5. Every field you can confidently extract from the user's latest message (and prior context) MUST be put in extractedClaimData, using the exact field names given. Only include fields you are confident about; never invent values.

WORKFLOW:
1. GREETING (first turn only): short bilingual-style greeting, then offer the 4 options as suggestedOptions.
2. SELECT_FLOW: user picks file claim / check status / coverage / agent.
3. COLLECTING_CLAIM_INFO: ask for missing fields one at a time per the Fields Still Needed list. Field meanings: policyNumber (any format e.g. RW-MOT-1234, don't validate strictly), incidentDate, location, description (what happened), and for motor also policeReportNumber, for health also hospitalName + treatmentType.
   - Once Fields Still Needed is EMPTY, set triggerAction "SHOW_FILE_PICKER" and nextFlowState "AWAITING_FILES", and ask if they have photos/documents to attach.
4. AWAITING_FILES: once the client tells you files were attached or skipped, set triggerAction "SHOW_CLAIM_SUMMARY" and nextFlowState "CONFIRMING_CLAIM".
5. CHECKING_STATUS: extract a claim reference number matching CLM-\\d{4}-\\d+ from the user's message. If found, set triggerAction "SHOW_STATUS_CARD" and put it in extractedClaimData.referenceNumber; the server will look up the real record — you do not know claim statuses yourself, never invent one. If no reference number is given, ask for it.
6. COVERAGE_QA: answer generically about motor (third-party vs comprehensive), health (inpatient vs outpatient), property (fire/flood), life insurance. Add a short note that binding answers depend on their specific contract, and offer agent handoff.
7. HUMAN_HANDOFF: set triggerAction "SHOW_HANDOFF_FORM"; the form itself collects name/phone, you don't need to ask for them in text.

OUTPUT: Respond with ONLY a raw JSON object, no markdown fences, no commentary, matching exactly:
{
  "replyText": "string, in the active language",
  "detectedLanguage": "rw" | "en",
  "nextFlowState": "GREETING" | "SELECT_FLOW" | "COLLECTING_CLAIM_INFO" | "AWAITING_FILES" | "CONFIRMING_CLAIM" | "CHECKING_STATUS" | "COVERAGE_QA" | "HUMAN_HANDOFF" | "IDLE",
  "triggerAction": "SHOW_FILE_PICKER" | "SHOW_CLAIM_SUMMARY" | "SHOW_STATUS_CARD" | "SHOW_HANDOFF_FORM" | "SUBMIT_CLAIM_SUCCESS" | "NONE",
  "suggestedOptions": [{ "label": "string", "value": "string", "icon": "string" }],
  "extractedClaimData": {
    "policyNumber": "...", "claimType": "motor|health|property|life", "incidentDate": "...",
    "location": "...", "description": "...", "otherPartiesInvolved": "...",
    "policeReportNumber": "...", "hospitalName": "...", "treatmentType": "...", "referenceNumber": "..."
  }
}
Omit any extractedClaimData key you have no confident value for. Omit suggestedOptions entirely (not an empty array) when there's nothing to offer.
`;

app.get("/api/health", (req, res) => {
  const configured = PROVIDERS.filter((p) => !!p.apiKey).map((p) => p.name);
  res.json({ status: "ok", service: "InsureRw Assistant API", version: "1.0.0", llmProvidersConfigured: configured });
});

app.get("/api/claims/sample", (req, res) => {
  res.json({ sampleClaims: SAMPLE_CLAIMS });
});

app.get("/api/claims/status/:refNum", (req, res) => {
  const refNum = req.params.refNum.trim().toUpperCase();
  if (SAMPLE_CLAIMS[refNum]) {
    res.json({ found: true, statusInfo: SAMPLE_CLAIMS[refNum].statusInfo, claim: SAMPLE_CLAIMS[refNum].claim });
  } else if (refNum.startsWith("CLM-")) {
    const simulatedStatus: StatusCardData = {
      referenceNumber: refNum,
      status: "Under Review",
      title: "Irimo Kwiguswa / Claim Under Review",
      description: `Claim ${refNum} yarakiriwe neza kandi irimo gusuzumwa n'ishami ry'ubwishingizi. / Claim ${refNum} was received successfully and is under active review.`,
      lastUpdated: new Date().toISOString().replace("T", " ").substring(0, 16),
      claimType: "Insurance Claim",
    };
    res.json({ found: true, statusInfo: simulatedStatus });
  } else {
    res.status(404).json({ found: false, message: "Claim reference number not found." });
  }
});

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

app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [], currentLanguage = "rw", claimData = {}, flowState = "IDLE" } = req.body;

    const anyKeyConfigured = PROVIDERS.some((p) => !!p.apiKey);
    if (!anyKeyConfigured) {
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

    const missingFields = getMissingFields(claimData);

    const buildUserPrompt = (extraNote?: string) => `
User Input: "${message}"
Current Preferred Language: ${currentLanguage}
Current Flow State: ${flowState}
Current Extracted Claim Data JSON: ${JSON.stringify(claimData)}
Fields Still Needed (in order, ask only for the first one): ${JSON.stringify(missingFields)}

Conversation History So Far:
${JSON.stringify(conversationHistory.slice(-8))}

Task: Follow the HARD RULES exactly. Process user input, advance the flow by one step, extract any confidently-known fields, and respond in the required JSON structure only.
${extraNote ? `\nIMPORTANT CORRECTION: ${extraNote}` : ""}
    `;

    let result = await callLLM(SYSTEM_INSTRUCTION, buildUserPrompt());
    let parsedResult = result ? extractJson(result.text) : null;

    // Self-repair: the model answered but didn't return valid JSON. Give it
    // one more shot with an explicit correction instead of silently
    // degrading to a plain-text reply that drops all flow control.
    if (result && !parsedResult) {
      console.warn(`[llm:${result.providerName}] non-JSON reply, retrying once`);
      const retry = await callLLM(
        SYSTEM_INSTRUCTION,
        buildUserPrompt("Your previous response was not valid JSON. Respond with ONLY the raw JSON object, nothing else — no markdown fences, no commentary.")
      );
      if (retry) {
        result = retry;
        parsedResult = extractJson(retry.text);
      }
    }

    if (result) console.log(`[LLM RAW from ${result.providerName}]`, result.text);

    if (!result) {
      return res.json({
        replyText: currentLanguage === "rw"
          ? "Mbabarira, hari ikibazo cy'ihuza gato. Nyamuneka ongera ugerageze."
          : "Sorry, we're having a brief connection issue. Please try again.",
        detectedLanguage: currentLanguage,
        nextFlowState: flowState,
        triggerAction: "NONE",
      });
    }

    if (!parsedResult) {
      // Still no valid JSON after retry — surface the raw text rather than
      // silently dropping the model's answer, but keep flow state stable.
      parsedResult = {
        replyText: result.text.replace(/```json\s*|```/g, "").trim(),
        detectedLanguage: currentLanguage,
        nextFlowState: flowState,
        triggerAction: "NONE",
      };
    }

    const safeResult = sanitizeParsedResult(parsedResult, flowState, currentLanguage);
    return res.json(safeResult || parsedResult);
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error?.message || "LLM processing issue",
    });
  }
});

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
    const configured = PROVIDERS.filter((p) => !!p.apiKey).map((p) => p.name);
    console.log(configured.length ? `LLM providers active: ${configured.join(" -> ")}` : "No LLM provider API keys set - chat will use static fallback replies.");
  });
}

startServer();
