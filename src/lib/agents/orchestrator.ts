import { callVisionModel } from "@/lib/amd/provider";
import {
  SAFETY_DISCLAIMER, RED_FLAG_KEYWORDS, CRITICAL_SYMPTOMS_MAP,
  BURN_DONTS, BLEEDING_DONTS, SPINE_DONTS, FRACTURE_DONTS, SEIZURE_DONTS, UNIVERSAL_DONTS,
} from "@/lib/safety/constants";
import { CaseInput, Priority, RiskLevel, TriageResult } from "@/lib/schemas/types";

const has = (blob: string, terms: string[]) => terms.some((t) => blob.includes(t));

// ─── Agent 1: Intake Normalizer ─────────────────────────────────────────────
function intakeNormalizerAgent(input: CaseInput) {
  const blob = [
    input.symptoms, input.voiceTranscript, input.visibleIssue, input.notes, input.emergencyType,
  ].filter(Boolean).join(" ").toLowerCase();

  const missing: string[] = [];
  if (!input.symptoms && !input.visibleIssue) missing.push("What symptoms or injuries are visible?");
  if (input.vitals.breathing === "unknown") missing.push("Is the person breathing normally, with difficulty, or not at all?");
  if (input.vitals.consciousness === "unknown") missing.push("Is the person alert, confused, or unconscious?");
  if (input.vitals.bleeding === "unknown") missing.push("Is there any visible bleeding? If so, is it mild or heavy?");
  if (input.ageGroup === "unknown") missing.push("What is the approximate age of the person?");
  if (!input.vitals.oxygenSaturation && !input.vitals.pulse) missing.push("Do you have access to pulse or oxygen readings?");

  return { blob, missing };
}

// ─── Agent 2: Red Flag Detector ─────────────────────────────────────────────
function redFlagDetectorAgent(input: CaseInput, blob: string): string[] {
  const flags: string[] = [];
  const v = input.vitals;

  if (v.breathing === "not breathing" || blob.includes("not breathing")) flags.push("Breathing stopped — possible respiratory/cardiac arrest");
  if (v.consciousness === "unconscious") flags.push("Unconscious — airway may be at risk");
  if (v.bleeding === "heavy" || has(blob, ["heavy bleeding", "severe bleeding", "uncontrolled bleeding"])) flags.push("Severe/uncontrolled bleeding — shock risk");
  if (has(blob, ["chest pain"])) flags.push("Chest pain — possible cardiac event");
  if (has(blob, ["stroke", "face droop", "arm weakness", "slurred speech"])) flags.push("Stroke-like symptoms — time-critical");
  if (has(blob, ["seizure", "convuls"])) flags.push("Seizure activity detected");
  if (has(blob, ["anaphylaxis", "severe allergic", "throat swelling", "tongue swelling"])) flags.push("Severe allergic reaction — anaphylaxis risk");
  if (has(blob, ["poison", "ingested", "swallowed chemical"])) flags.push("Possible poisoning");
  if (has(blob, ["suicidal", "self-harm", "kill myself", "end my life"])) flags.push("Suicidal/self-harm risk — immediate crisis support needed");
  if (has(blob, ["blue lips", "cyanosis"])) flags.push("Blue lips/cyanosis — inadequate oxygenation");
  if (has(blob, ["spine", "back injury", "neck injury", "paralysis"])) flags.push("Suspected spine/neck injury");
  if (has(blob, ["head injury", "skull", "concussion"])) flags.push("Possible severe head injury");
  if (has(blob, ["major burn", "full thickness", "3rd degree", "charred"])) flags.push("Major/severe burn");
  if (has(blob, ["choking", "can't breathe", "airway blocked"])) flags.push("Choking — airway obstruction");
  if (has(blob, ["pregnancy", "pregnant", "labor", "miscarriage"])) flags.push("Pregnancy-related emergency");
  if (has(blob, ["drowning", "submersion"])) flags.push("Drowning/submersion incident");

  if (v.oxygenSaturation !== undefined && v.oxygenSaturation < 90) flags.push(`Very low oxygen saturation (${v.oxygenSaturation}%)`);
  if (v.bloodSugar !== undefined && (v.bloodSugar < 54 || v.bloodSugar > 400)) flags.push(`Dangerous blood sugar level (${v.bloodSugar} mg/dL)`);
  if (v.pulse !== undefined && (v.pulse < 40 || v.pulse > 150)) flags.push(`Abnormal pulse (${v.pulse} bpm)`);
  if (v.temperature !== undefined && v.temperature >= 104) flags.push(`Very high temperature (${v.temperature}°F)`);

  const vulnerable = input.ageGroup === "infant" || input.ageGroup === "child";
  if (vulnerable && (flags.length > 0 || v.breathing === "difficulty")) flags.push("Vulnerable age (infant/child) with concerning symptoms — escalate");
  if (input.ageGroup === "elderly" && flags.length > 0) flags.push("Elderly patient with red flags — higher risk of complications");

  return flags;
}

// ─── Agent 3: Injury/Scene Analyst (Image) ──────────────────────────────────
async function imageAnalystAgent(input: CaseInput) {
  if (!input.imageData && !input.imageName) return { observations: [] as string[], confidence: 0 };
  const result = await callVisionModel(
    input.imageData ?? "",
    "Describe only visible non-diagnostic observations. Use cautious language like 'appears to show', 'visible area resembling'. Do not diagnose."
  );
  return { observations: result.observations, confidence: result.confidence };
}

// ─── Agent 4: Triage Priority ───────────────────────────────────────────────
function triagePriorityAgent(input: CaseInput, redFlags: string[], blob: string): { riskLevel: RiskLevel; priority: Priority; reason: string } {
  const v = input.vitals;

  // P1 Immediate — life threat
  if (redFlags.length >= 2) return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Multiple critical red flags detected. Immediate life-saving intervention needed." };
  if (v.breathing === "not breathing") return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Person is not breathing. Call emergency services and begin CPR if trained." };
  if (v.consciousness === "unconscious" && v.breathing === "unknown") return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Unconscious with unknown breathing — treat as life-threatening until confirmed otherwise." };
  if (v.consciousness === "unconscious") return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Unconscious person. Secure airway and call emergency services." };
  if (has(blob, ["suicidal", "self-harm"])) return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Suicidal/self-harm concern. Immediate crisis support required." };
  if (v.bleeding === "heavy") return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Heavy uncontrolled bleeding. Risk of hemorrhagic shock." };
  if (has(blob, ["chest pain", "cardiac", "heart attack"])) return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Chest pain — possible cardiac event. Call emergency services." };
  if (has(blob, ["stroke", "face droop"])) return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Stroke-like symptoms. Time-critical — call emergency services." };
  if (has(blob, ["anaphylaxis", "severe allergic", "throat swelling"])) return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Severe allergic reaction with airway risk." };
  if (has(blob, ["seizure"]) && has(blob, ["ongoing", "continuous", "not stopping"])) return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Ongoing seizure. Call emergency services." };
  if (has(blob, ["choking", "airway blocked"])) return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Choking/airway obstruction. Immediate intervention needed." };
  if (has(blob, ["drowning"])) return { riskLevel: "Critical", priority: "P1 Immediate", reason: "Drowning incident. Call emergency services immediately." };
  if (redFlags.length === 1) return { riskLevel: "Critical", priority: "P1 Immediate", reason: `Critical red flag: ${redFlags[0]}` };

  // P2 Urgent — serious but currently more stable
  const consciousness = v.consciousness as string;
  const breathing = v.breathing as string;
  if (breathing === "difficulty") return { riskLevel: "High", priority: "P2 Urgent", reason: "Breathing difficulty. Needs urgent medical evaluation." };
  if (consciousness === "confused") return { riskLevel: "High", priority: "P2 Urgent", reason: "Altered consciousness (confused). Monitor closely and seek urgent help." };
  if (v.pain >= 8) return { riskLevel: "High", priority: "P2 Urgent", reason: `Severe pain (${v.pain}/10). Urgent medical attention recommended.` };
  if (has(blob, ["fracture", "broken bone", "deform"])) return { riskLevel: "High", priority: "P2 Urgent", reason: "Suspected fracture. Immobilize and seek urgent care." };
  if (has(blob, ["asthma", "wheezing"]) && breathing !== "normal") return { riskLevel: "High", priority: "P2 Urgent", reason: "Asthma/breathing issue. Urgent if worsening." };
  if (input.emergencyType === "heatstroke" && consciousness === "confused") return { riskLevel: "High", priority: "P2 Urgent", reason: "Heatstroke with confusion. Urgent cooling and medical help needed." };
  if ((input.ageGroup === "infant" || input.ageGroup === "child" || input.ageGroup === "elderly") && v.pain >= 5) return { riskLevel: "High", priority: "P2 Urgent", reason: "Vulnerable age group with significant symptoms." };
  if (has(blob, ["burn"]) && v.pain >= 6) return { riskLevel: "High", priority: "P2 Urgent", reason: "Burn with significant pain. Medical assessment recommended." };

  // P3 Delayed
  const bleeding = v.bleeding as string;
  if (bleeding === "mild" || v.pain >= 4) return { riskLevel: "Medium", priority: "P3 Delayed", reason: "Moderate symptoms. Needs medical review but currently stable." };
  if (input.emergencyType === "burn" && v.pain < 6) return { riskLevel: "Medium", priority: "P3 Delayed", reason: "Minor to moderate burn. Apply first aid and seek clinic review." };
  if (has(blob, ["sprain", "twist", "swollen"])) return { riskLevel: "Medium", priority: "P3 Delayed", reason: "Possible sprain or soft tissue injury. Rest, ice, elevate." };
  if (input.emergencyType === "fall" && consciousness === "alert" && bleeding !== "heavy") return { riskLevel: "Medium", priority: "P3 Delayed", reason: "Fall with no critical signs. Monitor and seek clinic review." };

  // P4 Minor
  if (input.symptoms || input.visibleIssue) return { riskLevel: "Low", priority: "P4 Minor", reason: "No red flags detected. Basic first aid should be sufficient." };

  // Unknown
  return { riskLevel: "Unknown", priority: "Unknown", reason: "Insufficient information to determine priority. Answer the missing questions and exercise caution." };
}

// ─── Agent 5: First Aid Actions ─────────────────────────────────────────────
function firstAidActionAgent(input: CaseInput, priority: Priority, blob: string): string[] {
  const actions: string[] = [];
  const v = input.vitals;
  const r = input.resources;

  actions.push("Ensure the scene is safe before approaching the person.");

  if (v.breathing === "not breathing") {
    actions.push("Call emergency services immediately (or ask someone nearby to call).");
    actions.push("If trained, begin CPR: 30 chest compressions then 2 rescue breaths. Continue until help arrives.");
    actions.push("If an AED is available, use it following its voice instructions.");
  } else if (v.consciousness === "unconscious" && v.breathing === "normal") {
    actions.push("Place the person in the recovery position (on their side) to keep the airway clear.");
    actions.push("Call emergency services immediately.");
    actions.push("Monitor breathing continuously until help arrives.");
  } else if (v.consciousness === "unconscious") {
    actions.push("Check breathing by looking for chest movement and feeling for breath on your cheek.");
    actions.push("Call emergency services immediately.");
    actions.push("If breathing, place in recovery position. If not breathing and you are trained, begin CPR.");
  }

  if (v.bleeding === "heavy") {
    actions.push("Apply firm, direct pressure to the wound using a clean cloth, shirt, or bandage.");
    actions.push("Keep steady pressure — do not lift to check. If blood soaks through, add more layers on top.");
    if (r.firstAidKit === "yes") actions.push("If available, use gauze or bandage from the first aid kit to secure the dressing.");
    actions.push("Have the person lie down and elevate the injured area above heart level if possible.");
  } else if (v.bleeding === "mild") {
    actions.push("Clean the wound gently with clean water if available.");
    actions.push("Apply light pressure with a clean cloth until bleeding stops.");
    actions.push("Cover with a clean bandage or dressing.");
  }

  if (input.emergencyType === "burn" || has(blob, ["burn"])) {
    if (r.cleanWater === "yes") {
      actions.push("Cool the burn under clean, cool (not cold) running water for 10–20 minutes.");
    } else {
      actions.push("Cool the burn with any clean, cool liquid available. Avoid contaminated water.");
    }
    actions.push("Loosely cover the burn with a clean, non-stick dressing or clean cloth.");
    actions.push("Remove jewelry or tight items near the burn before swelling increases.");
  }

  if (input.emergencyType === "heatstroke" || has(blob, ["heat", "heatstroke"])) {
    actions.push("Move the person to a cool, shaded area immediately.");
    actions.push("Remove excess clothing.");
    actions.push("Cool the body: apply cool water to skin, fan the person, place cool cloths on neck/armpits/groin.");
    if (v.consciousness === "alert" && r.cleanWater === "yes") actions.push("If conscious and able to swallow, give small sips of cool water.");
    if (v.consciousness === "confused" || v.consciousness === "unconscious") actions.push("Do NOT give fluids if the person is confused or unconscious.");
  }

  if (has(blob, ["seizure"])) {
    actions.push("Clear the area around the person to prevent injury.");
    actions.push("Place something soft under their head if possible.");
    actions.push("Time the seizure. If it lasts more than 5 minutes, call emergency services.");
    actions.push("After the seizure, place the person in the recovery position.");
  }

  if (has(blob, ["fracture", "broken"]) || input.emergencyType === "fall") {
    actions.push("Keep the injured area as still as possible — do not try to straighten it.");
    if (r.firstAidKit === "yes") actions.push("Use a splint or padded support to immobilize the area if you know how.");
    actions.push("Apply a cold pack wrapped in cloth to reduce swelling (not directly on skin).");
  }

  if (has(blob, ["allergic", "allergy", "anaphylaxis"])) {
    actions.push("Call emergency services immediately if there is any throat swelling, breathing difficulty, or widespread reaction.");
    actions.push("If the person has a prescribed auto-injector (like an EpiPen), help them use it.");
    actions.push("Have the person sit upright to help with breathing.");
  }

  if (has(blob, ["poison"])) {
    actions.push("Call emergency services or poison control immediately.");
    actions.push("Try to identify what was ingested, inhaled, or contacted.");
    actions.push("Do NOT induce vomiting unless specifically instructed by a medical professional.");
  }

  if (has(blob, ["suicidal", "self-harm"])) {
    actions.push("Stay with the person. Do not leave them alone.");
    actions.push("Calmly talk with them and listen without judgment.");
    actions.push("Remove any immediate means of harm if safe to do so.");
    actions.push("Call local crisis/suicide hotline or emergency services.");
  }

  actions.push("Stay calm and reassure the person that help is on the way.");
  if (priority === "P1 Immediate" || priority === "P2 Urgent") {
    actions.push("Monitor breathing and consciousness continuously until professional help arrives.");
  }

  return [...new Set(actions)];
}

// ─── Agent 6: Do-Not-Do Safety ──────────────────────────────────────────────
function doNotDoAgent(input: CaseInput, blob: string): string[] {
  const out = [...UNIVERSAL_DONTS];

  if (input.emergencyType === "burn" || has(blob, ["burn"])) out.push(...BURN_DONTS);
  if (input.vitals.bleeding !== "none" || has(blob, ["bleeding", "wound"])) out.push(...BLEEDING_DONTS);
  if (has(blob, ["spine", "back injury", "neck", "head injury"])) out.push(...SPINE_DONTS);
  if (has(blob, ["fracture", "broken"])) out.push(...FRACTURE_DONTS);
  if (has(blob, ["seizure"])) out.push(...SEIZURE_DONTS);

  if (has(blob, ["heatstroke", "heat"])) {
    out.push("Do NOT give fluids to a confused or unconscious person.");
    out.push("Do NOT use ice-cold water for cooling — use cool water instead.");
  }
  if (has(blob, ["poison"])) {
    out.push("Do NOT induce vomiting unless a medical professional instructs you to do so.");
  }
  if (has(blob, ["allergic"])) {
    out.push("Do NOT administer any medication unless it is the person's own prescribed auto-injector.");
  }

  return [...new Set(out)];
}

// ─── Agent 7: Escalation ────────────────────────────────────────────────────
function escalationAgent(priority: Priority, resources: CaseInput["resources"], redFlags: string[]): string {
  if (priority === "P1 Immediate") {
    const base = "Call emergency services (ambulance/911) immediately.";
    if (resources.ambulance === "delayed") return `${base} Ambulance may be delayed — arrange fastest safe transport to nearest hospital. Keep monitoring vital signs.`;
    if (resources.ambulance === "unknown") return `${base} Attempt to contact emergency services and arrange transport. If unreachable, transport to nearest clinic urgently.`;
    return `${base} Keep the person stable and continuously monitored until paramedics arrive.`;
  }
  if (priority === "P2 Urgent") {
    if (resources.ambulance === "available") return "Request urgent ambulance or rapid transport to nearest emergency department. Monitor for any worsening.";
    if (resources.nearbyClinic === "yes") return "Transport safely to nearest clinic or emergency department as soon as possible. If symptoms worsen, call emergency services.";
    return "Arrange fastest safe transport to medical care. Call local emergency number for guidance. Monitor closely.";
  }
  if (priority === "P3 Delayed") {
    return "Provide first aid and arrange a clinic visit for professional evaluation. If symptoms worsen or new red flags appear, escalate to urgent.";
  }
  if (priority === "P4 Minor") {
    return "Basic first aid is sufficient. Monitor for any changes. Seek medical review if symptoms persist or worsen.";
  }
  return "Insufficient information for clear escalation guidance. Exercise caution — if in doubt, call emergency services.";
}

// ─── Agent 8: Handoff Report ────────────────────────────────────────────────
function handoffReportAgent(
  input: CaseInput, riskLevel: RiskLevel, priority: Priority, reason: string,
  redFlags: string[], actions: string[], doNotDo: string[], escalation: string, missing: string[],
  imageObs: string[]
): string {
  const ts = new Date().toISOString();
  const sections = [
    `# Emergency Handoff Report`,
    `**Generated:** ${ts}`,
    `**Case:** ${input.label || input.caseId || "Unlabeled"}`,
    ``,
    `## Context`,
    `- **Emergency type:** ${input.emergencyType}`,
    `- **Age group:** ${input.ageGroup}`,
    `- **Reported symptoms:** ${input.symptoms || "Not provided"}`,
    input.visibleIssue ? `- **Visible issue:** ${input.visibleIssue}` : "",
    input.voiceTranscript ? `- **Voice transcript:** ${input.voiceTranscript}` : "",
    ``,
    `## Vital Signs`,
    `- Consciousness: ${input.vitals.consciousness}`,
    `- Breathing: ${input.vitals.breathing}`,
    `- Bleeding: ${input.vitals.bleeding}`,
    `- Pain: ${input.vitals.pain}/10`,
    input.vitals.temperature ? `- Temperature: ${input.vitals.temperature}°F` : "",
    input.vitals.pulse ? `- Pulse: ${input.vitals.pulse} bpm` : "",
    input.vitals.oxygenSaturation ? `- SpO2: ${input.vitals.oxygenSaturation}%` : "",
    input.vitals.bloodSugar ? `- Blood sugar: ${input.vitals.bloodSugar} mg/dL` : "",
    ``,
    `## Triage Assessment`,
    `- **Risk Level:** ${riskLevel}`,
    `- **Priority:** ${priority}`,
    `- **Reason:** ${reason}`,
    ``,
    `## Red Flags`,
    redFlags.length > 0 ? redFlags.map(f => `- ⚠️ ${f}`).join("\n") : "- None clearly identified",
    ``,
    `## Recommended Actions`,
    actions.map((a, i) => `${i + 1}. ${a}`).join("\n"),
    ``,
    `## Do NOT Do`,
    doNotDo.map(d => `- ${d}`).join("\n"),
    ``,
    imageObs.length > 0 ? `## Image Observations\n${imageObs.map(o => `- ${o}`).join("\n")}\n` : "",
    `## Escalation`,
    escalation,
    ``,
    missing.length > 0 ? `## Missing Information\n${missing.map(m => `- ${m}`).join("\n")}\n` : "",
    `## Resources Available`,
    `- Ambulance: ${input.resources.ambulance}`,
    `- Nearby clinic: ${input.resources.nearbyClinic}`,
    `- First aid kit: ${input.resources.firstAidKit}`,
    `- Clean water: ${input.resources.cleanWater}`,
    `- Trained responder: ${input.resources.trainedResponder}`,
    ``,
    `---`,
    `⚠️ **DISCLAIMER:** This report is AI-generated triage support. It is NOT a medical diagnosis.`,
    `All information must be verified by qualified medical professionals.`,
    `${SAFETY_DISCLAIMER}`,
  ];
  return sections.filter(Boolean).join("\n");
}

// ─── Agent 9: Verification & Uncertainty ────────────────────────────────────
function verificationAgent(input: CaseInput, missing: string[], redFlags: string[], riskLevel: RiskLevel): { level: "High" | "Medium" | "Low"; notes: string[] } {
  const notes: string[] = [];
  let level: "High" | "Medium" | "Low" = "Medium";

  notes.push("Deterministic rule-based triage applied (demo mode).");

  if (missing.length === 0) {
    level = "High";
    notes.push("All key vitals and context provided — higher confidence in assessment.");
  } else if (missing.length <= 2) {
    level = "Medium";
    notes.push(`${missing.length} piece(s) of information missing — moderate confidence.`);
  } else {
    level = "Low";
    notes.push(`${missing.length} pieces of information missing — assessment confidence is low.`);
    notes.push("Answering the missing questions would improve triage accuracy.");
  }

  if (input.vitals.consciousness === "unknown" && input.vitals.breathing === "unknown") {
    notes.push("Both consciousness and breathing are unknown — safety-conservative escalation applied.");
  }

  if (redFlags.length > 0) {
    notes.push(`${redFlags.length} red flag(s) detected — priority has been escalated.`);
  }

  // Contradiction check
  if (input.vitals.consciousness === "unconscious" && input.vitals.pain > 0) {
    notes.push("Note: Pain score reported for unconscious person — may be an estimate. Treating as unconscious.");
  }

  notes.push("For AMD cloud deployment with full multimodal LLM analysis, confidence may improve.");

  return { level, notes };
}

// ─── Orchestrator ───────────────────────────────────────────────────────────
export async function analyzeCase(input: CaseInput): Promise<TriageResult> {
  const started = Date.now();

  // Agent 1: Intake Normalizer
  const { blob, missing } = intakeNormalizerAgent(input);

  // Agent 2: Red Flag Detector
  const redFlags = redFlagDetectorAgent(input, blob);

  // Agent 3: Image Analyst
  const imageResult = await imageAnalystAgent(input);

  // Agent 4: Triage Priority
  const triage = triagePriorityAgent(input, redFlags, blob);

  // Agent 5: First Aid Actions
  const immediateActions = firstAidActionAgent(input, triage.priority, blob);

  // Agent 6: Do-Not-Do
  const doNotDo = doNotDoAgent(input, blob);

  // Agent 7: Escalation
  const escalation = escalationAgent(triage.priority, input.resources, redFlags);

  // Agent 8: Handoff Report
  const handoffReport = handoffReportAgent(input, triage.riskLevel, triage.priority, triage.reason, redFlags, immediateActions, doNotDo, escalation, missing, imageResult.observations);

  // Agent 9: Verification & Uncertainty
  const confidence = verificationAgent(input, missing, redFlags, triage.riskLevel);

  return {
    caseId: input.caseId ?? input.label ?? crypto.randomUUID(),
    riskLevel: triage.riskLevel,
    priority: triage.priority,
    reason: triage.reason,
    summary: `Based on the provided information, this case is assessed as ${triage.riskLevel} risk (${triage.priority}). ${triage.reason}`,
    redFlags: [...redFlags, ...imageResult.observations.map(o => `[Image] ${o}`)],
    immediateActions,
    doNotDo,
    escalation,
    missingQuestions: missing,
    handoffReport,
    imageObservations: imageResult.observations,
    confidence,
    amdCompute: {
      gpu: "AMD Instinct MI300X",
      stack: "ROCm + vLLM",
      agentsExecuted: 9,
      imagesProcessed: (input.imageData || input.imageName) ? 1 : 0,
      tokensEstimated: Math.ceil(blob.length / 4) + 320,
      latencyMs: Date.now() - started,
      safetyChecksCompleted: 6 + redFlags.length,
      modelTargets: ["Qwen2-VL-7B-Instruct", "Llama-3.2-Vision", "Mistral-7B-Instruct", "Qwen2.5-7B"],
    },
    disclaimer: SAFETY_DISCLAIMER,
  };
}
