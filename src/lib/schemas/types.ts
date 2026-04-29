export type RiskLevel = "Critical" | "High" | "Medium" | "Low" | "Unknown";
export type Priority = "P1 Immediate" | "P2 Urgent" | "P3 Delayed" | "P4 Minor" | "Unknown";

export interface CaseInput {
  caseId?: string;
  label?: string;
  emergencyType: string;
  ageGroup: string;
  symptoms: string;
  voiceTranscript?: string;
  visibleIssue?: string;
  notes?: string;
  imageName?: string;
  vitals: {
    consciousness: string;
    breathing: string;
    bleeding: string;
    pain: number;
    temperature?: number;
    pulse?: number;
    bloodSugar?: number;
    oxygenSaturation?: number;
  };
  resources: {
    ambulance: string;
    nearbyClinic: string;
    firstAidKit: string;
    cleanWater: string;
    trainedResponder: string;
    crowdedDisaster: string;
  };
}

export interface TriageResult {
  caseId: string;
  riskLevel: RiskLevel;
  priority: Priority;
  summary: string;
  redFlags: string[];
  immediateActions: string[];
  doNotDo: string[];
  escalation: string;
  missingQuestions: string[];
  handoffReport: string;
  confidence: { level: "High" | "Medium" | "Low"; notes: string[] };
  amdCompute: {
    gpu: string;
    stack: string;
    agentsExecuted: number;
    imagesProcessed: number;
    tokensEstimated: number;
    latencyMs: number;
    safetyChecksCompleted: number;
    modelTargets: string[];
  };
  disclaimer: string;
  reason: string;
}
