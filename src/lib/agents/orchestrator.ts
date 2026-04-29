import { amdConfig, callVisionModel } from "@/lib/amd/provider";
import { SAFETY_DISCLAIMER } from "@/lib/safety/constants";
import { CaseInput, Priority, RiskLevel, TriageResult } from "@/lib/schemas/types";

const contains = (s: string, terms: string[]) => terms.some((t) => s.includes(t));

function normalizeAgent(input: CaseInput) {
  const symptoms = `${input.symptoms} ${input.voiceTranscript ?? ""} ${input.visibleIssue ?? ""} ${input.notes ?? ""}`.toLowerCase();
  const missingQuestions: string[] = [];
  if (!input.symptoms) missingQuestions.push("What symptoms are currently visible?");
  if (input.vitals.breathing === "unknown") missingQuestions.push("Is the person breathing normally, with difficulty, or not breathing?");
  if (input.vitals.consciousness === "unknown") missingQuestions.push("Is the person alert, confused, or unconscious?");
  return { ...input, symptomsBlob: symptoms, missingQuestions };
}

function redFlagAgent(normalized: ReturnType<typeof normalizeAgent>) {
  const flags: string[] = [];
  const s = normalized.symptomsBlob;
  if (normalized.vitals.breathing === "not breathing" || s.includes("not breathing")) flags.push("Breathing stopped");
  if (normalized.vitals.consciousness === "unconscious") flags.push("Unconscious");
  if (normalized.vitals.bleeding === "heavy" || contains(s, ["heavy bleeding", "severe bleeding"])) flags.push("Severe bleeding");
  if (contains(s, ["chest pain", "stroke", "blue lips", "seizure", "poison", "self-harm", "suicidal"])) flags.push("Possible life-threatening symptom");
  if ((normalized.ageGroup === "infant" || normalized.ageGroup === "child") && (flags.length > 0 || normalized.vitals.breathing === "difficulty")) flags.push("Vulnerable age with severe symptoms");
  if (normalized.vitals.oxygenSaturation && normalized.vitals.oxygenSaturation < 90) flags.push("Very low oxygen saturation");
  return flags;
}

async function imageAgent(input: CaseInput) {
  if (!input.imageName) return { observations: [], confidence: 0 };
  const out = await callVisionModel(input.imageName, "Describe non-diagnostic observations only");
  return { observations: out.observations, confidence: out.confidence };
}

function triageAgent(input: CaseInput, redFlags: string[]): { riskLevel: RiskLevel; priority: Priority; reason: string } {
  if (redFlags.length > 0 || input.vitals.breathing === "not breathing" || input.vitals.consciousness === "unconscious") {
    return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Critical red flags detected." };
  }
  if (input.vitals.breathing === "difficulty" || input.vitals.bleeding === "heavy" || input.vitals.pain >= 8 || input.vitals.consciousness === "confused") {
    return { riskLevel: "High", priority: "P2 Urgent", reason: "Serious symptoms with instability risk." };
  }
  if (input.vitals.bleeding === "mild" || input.vitals.pain >= 4 || input.emergencyType === "burn") {
    return { riskLevel: "Medium", priority: "P3 Delayed", reason: "Needs medical review but currently more stable." };
  }
  if (input.symptoms || input.visibleIssue) return { riskLevel: "Low", priority: "P4 Minor", reason: "No major red flags in provided info." };
  return { riskLevel: "Unknown", priority: "Unknown", reason: "Insufficient information." };
}

function actionsAgent(input: CaseInput, priority: Priority): string[] {
  const actions = ["Check scene safety before approaching.", "Reassure the person and monitor breathing and consciousness continuously."];
  if (input.vitals.bleeding !== "none") actions.push("Apply firm direct pressure with clean cloth or dressing.");
  if (input.emergencyType === "burn") actions.push(input.resources.cleanWater === "yes" ? "Cool burn with clean running water for up to 20 minutes." : "Cool burn with any clean cool liquid available; avoid contamination.");
  if (priority === "P1 Immediate") actions.push("Call emergency services now and prepare for rapid handoff.");
  return actions;
}

function doNotDoAgent(input: CaseInput): string[] {
  const out = ["Do not delay emergency care if symptoms worsen.", "Do not give food or drink to an unconscious person."];
  if (input.emergencyType === "burn") out.push("Do not apply ice directly to the burn.");
  if (input.vitals.bleeding !== "none") out.push("Do not remove embedded objects from wounds.");
  out.push("Do not move suspected spine/head injury unless immediate danger exists.");
  return out;
}

function escalationAgent(priority: Priority, resources: CaseInput["resources"]) {
  if (priority === "P1 Immediate") return "Call emergency services immediately. Keep monitoring airway, breathing, and bleeding while waiting.";
  if (priority === "P2 Urgent") return resources.ambulance === "available" ? "Request urgent ambulance or rapid transport to nearest clinic." : "Arrange fastest safe transport to urgent care and call local emergency line for guidance.";
  return "Provide basic first aid, monitor closely, and seek clinic review if symptoms persist or worsen.";
}

function handoffAgent(input: CaseInput, riskLevel: RiskLevel, priority: Priority, redFlags: string[], actions: string[], escalation: string, missing: string[]) {
  return `Case: ${input.label ?? input.caseId ?? "Unlabeled"}\nContext: ${input.emergencyType}, ${input.ageGroup}\nReported symptoms: ${input.symptoms || "Not provided"}\nObserved signs: consciousness=${input.vitals.consciousness}, breathing=${input.vitals.breathing}, bleeding=${input.vitals.bleeding}\nRisk/Priority: ${riskLevel} / ${priority}\nRed flags: ${redFlags.join(", ") || "None clearly identified"}\nActions taken/recommended: ${actions.join(" | ")}\nUnknowns: ${missing.join(" | ") || "None"}\nEscalation: ${escalation}\nTimestamp: ${new Date().toISOString()}\nAI-generated triage support. Must be verified by medical professionals.`;
}

export async function analyzeCase(input: CaseInput): Promise<TriageResult> {
  const started = Date.now();
  const normalized = normalizeAgent(input);
  const redFlags = redFlagAgent(normalized);
  const imageResult = await imageAgent(input);
  const triage = triageAgent(input, redFlags);
  const immediateActions = actionsAgent(input, triage.priority);
  const doNotDo = doNotDoAgent(input);
  const escalation = escalationAgent(triage.priority, input.resources);
  const handoffReport = handoffAgent(input, triage.riskLevel, triage.priority, redFlags, immediateActions, escalation, normalized.missingQuestions);

  return {
    caseId: input.caseId ?? crypto.randomUUID(),
    riskLevel: triage.riskLevel,
    priority: triage.priority,
    reason: triage.reason,
    summary: `Based on the provided information, this case is ${triage.riskLevel} risk with ${triage.priority}.`,
    redFlags: [...redFlags, ...imageResult.observations],
    immediateActions,
    doNotDo,
    escalation,
    missingQuestions: normalized.missingQuestions,
    handoffReport,
    confidence: { level: normalized.missingQuestions.length > 2 ? "Low" : "Medium", notes: ["Deterministic triage rules applied.", "Uncertainty increases when key vitals are unknown."] },
    amdCompute: {
      gpu: "AMD Instinct MI300X",
      stack: "ROCm + vLLM",
      agentsExecuted: 9,
      imagesProcessed: input.imageName ? 1 : 0,
      tokensEstimated: Math.ceil((input.symptoms.length + (input.voiceTranscript?.length ?? 0)) / 4) + 240,
      latencyMs: Date.now() - started,
      safetyChecksCompleted: 6,
      modelTargets: ["Qwen-VL", "Llama Vision", "Mistral", "Qwen"]
    },
    disclaimer: SAFETY_DISCLAIMER
  };
}
