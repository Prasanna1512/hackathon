export type RiskLevel = "Critical" | "High" | "Medium" | "Low" | "Unknown";
export type Priority = "P1 Immediate" | "P2 Urgent" | "P3 Delayed" | "P4 Minor" | "Unknown";
export type Consciousness = "alert" | "confused" | "unconscious" | "unknown";
export type Breathing = "normal" | "difficulty" | "not breathing" | "unknown";
export type Bleeding = "none" | "mild" | "heavy" | "unknown";
export type Ambulance = "available" | "delayed" | "unknown";
export type YesNoUnknown = "yes" | "no" | "unknown";

export const EMERGENCY_TYPES = [
  "road accident", "burn", "bleeding", "fall", "heatstroke", "unconscious",
  "breathing issue", "allergic reaction", "workplace injury", "sports injury",
  "disaster camp", "chest pain", "seizure", "poisoning", "unknown"
] as const;

export const AGE_GROUPS = ["infant", "child", "teen", "adult", "elderly", "unknown"] as const;

export interface Vitals {
  consciousness: Consciousness;
  breathing: Breathing;
  bleeding: Bleeding;
  pain: number;
  temperature?: number;
  pulse?: number;
  bloodSugar?: number;
  oxygenSaturation?: number;
}

export interface Resources {
  ambulance: Ambulance;
  nearbyClinic: YesNoUnknown;
  firstAidKit: YesNoUnknown;
  cleanWater: YesNoUnknown;
  trainedResponder: YesNoUnknown;
  crowdedDisaster: YesNoUnknown;
}

export interface CaseInput {
  caseId?: string;
  label?: string;
  emergencyType: string;
  ageGroup: string;
  symptoms: string;
  voiceTranscript?: string;
  visibleIssue?: string;
  notes?: string;
  imageData?: string;
  imageName?: string;
  vitals: Vitals;
  resources: Resources;
}

export interface TriageResult {
  caseId: string;
  riskLevel: RiskLevel;
  priority: Priority;
  summary: string;
  reason: string;
  redFlags: string[];
  immediateActions: string[];
  doNotDo: string[];
  escalation: string;
  missingQuestions: string[];
  handoffReport: string;
  imageObservations: string[];
  confidence: { level: "High" | "Medium" | "Low"; notes: string[] };
  amdCompute: AmdCompute;
  disclaimer: string;
}

export interface AmdCompute {
  gpu: string;
  stack: string;
  agentsExecuted: number;
  imagesProcessed: number;
  tokensEstimated: number;
  latencyMs: number;
  safetyChecksCompleted: number;
  modelTargets: string[];
}

export const DEFAULT_VITALS: Vitals = {
  consciousness: "unknown", breathing: "unknown", bleeding: "unknown", pain: 0,
};

export const DEFAULT_RESOURCES: Resources = {
  ambulance: "unknown", nearbyClinic: "unknown", firstAidKit: "no",
  cleanWater: "unknown", trainedResponder: "no", crowdedDisaster: "no",
};
