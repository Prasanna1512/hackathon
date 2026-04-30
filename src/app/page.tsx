"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TriageTimeline } from "@/components/TriageTimeline";
import { ScenarioSelector } from "@/components/ScenarioSelector";
import { VoiceInput } from "@/components/VoiceInput";
import { SmartInsightPanel } from "@/components/SmartInsightPanel";
import { HandoffReportView } from "@/components/HandoffReportView";
import { AmdComputePanel } from "@/components/AmdComputePanel";
import { CommandCenter } from "@/components/CommandCenter";
import { CriticalAlert } from "@/components/CriticalAlert";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { sampleSingleCases } from "@/data/sampleCases";
import {
  CaseInput, TriageResult, DEFAULT_VITALS, DEFAULT_RESOURCES,
  EMERGENCY_TYPES, AGE_GROUPS,
} from "@/lib/schemas/types";

type Tab = "landing" | "single" | "multi";

const priorityClass = (p: string) =>
  p.startsWith("P1") ? "p1" : p.startsWith("P2") ? "p2" : p.startsWith("P3") ? "p3" : p.startsWith("P4") ? "p4" : "";

const riskBadge = (r: string) =>
  r === "Critical" ? "badge-critical" : r === "High" ? "badge-high" : r === "Medium" ? "badge-medium" : r === "Low" ? "badge-low" : "badge-unknown";

const priBadge = (p: string) =>
  p.startsWith("P1") ? "badge-critical" : p.startsWith("P2") ? "badge-high" : p.startsWith("P3") ? "badge-medium" : p.startsWith("P4") ? "badge-low" : "badge-unknown";

const riskColor = (r: string) =>
  r === "Critical" ? "var(--critical)" : r === "High" ? "var(--high)" : r === "Medium" ? "var(--medium)" : r === "Low" ? "var(--low)" : "var(--unknown)";

function emptyCaseInput(): CaseInput {
  return {
    label: "", emergencyType: "unknown", ageGroup: "adult",
    symptoms: "", vitals: { ...DEFAULT_VITALS }, resources: { ...DEFAULT_RESOURCES },
  };
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
};

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

export default function Home() {
  const [tab, setTab] = useState<Tab>("landing");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [caseInput, setCaseInput] = useState<CaseInput>(sampleSingleCases[0]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [multiCases, setMultiCases] = useState<CaseInput[]>(sampleSingleCases.slice(0, 3));
  const [multiResults, setMultiResults] = useState<TriageResult[]>([]);
  const [multiLoading, setMultiLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-emergency", String(emergencyMode));
  }, [emergencyMode]);

  const updateCase = useCallback((patch: Partial<CaseInput>) => {
    setCaseInput(prev => ({ ...prev, ...patch }));
  }, []);

  const updateVitals = useCallback((patch: Partial<CaseInput["vitals"]>) => {
    setCaseInput(prev => ({ ...prev, vitals: { ...prev.vitals, ...patch } }));
  }, []);

  const updateResources = useCallback((patch: Partial<CaseInput["resources"]>) => {
    setCaseInput(prev => ({ ...prev, resources: { ...prev.resources, ...patch } }));
  }, []);

  const analyzeSingle = useCallback(async () => {
    setLoading(true);
    setShowTimeline(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseInput),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    }
    setLoading(false);
  }, [caseInput]);

  const analyzeMulti = useCallback(async () => {
    setMultiLoading(true);
    try {
      const res = await fetch("/api/analyze-multi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cases: multiCases }),
      });
      const data = await res.json();
      setMultiResults(data.results);
    } catch {
      setMultiResults([]);
    }
    setMultiLoading(false);
  }, [multiCases]);

  const loadSample = useCallback((idx: number) => {
    setCaseInput(sampleSingleCases[idx % sampleSingleCases.length]);
    setResult(null);
    setShowTimeline(false);
    setImagePreview(null);
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setImagePreview(data);
      updateCase({ imageData: data.split(",")[1], imageName: file.name });
    };
    reader.readAsDataURL(file);
  }, [updateCase]);

  const copyReport = useCallback(() => {
    if (result) {
      navigator.clipboard.writeText(result.handoffReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const downloadReport = useCallback((format: "md" | "txt") => {
    if (!result) return;
    const content = format === "txt" ? result.handoffReport.replace(/[#*`]/g, "") : result.handoffReport;
    const blob = new Blob([content], { type: format === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fieldmedic-handoff-report.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const handleVoiceResult = useCallback((text: string) => {
    setCaseInput(prev => ({
      ...prev,
      symptoms: prev.symptoms ? `${prev.symptoms} ${text}` : text,
    }));
  }, []);

  const updateMultiCase = useCallback((idx: number, patch: Partial<CaseInput>) => {
    setMultiCases(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }, []);

  const updateMultiVitals = useCallback((idx: number, patch: Partial<CaseInput["vitals"]>) => {
    setMultiCases(prev => prev.map((c, i) => i === idx ? { ...c, vitals: { ...c.vitals, ...patch } } : c));
  }, []);

  const removeMultiCase = useCallback((idx: number) => {
    setMultiCases(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const addMultiCase = useCallback(() => {
    setMultiCases(prev => [...prev, { ...emptyCaseInput(), label: `Patient ${prev.length + 1}` }]);
  }, []);

  const isCritical = result && (result.riskLevel === "Critical" || result.priority.startsWith("P1"));

  const TopBar = useMemo(() => (
    <header className="top-bar">
      <div className="top-bar-brand" onClick={() => { setTab("landing"); setResult(null); setShowTimeline(false); }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#grad)" />
          <path d="M8 14h12M14 8v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="28" y2="28">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        FieldMedic AI
      </div>
      <div className="top-bar-right">
        <span className="badge badge-offline">● Offline Safe Mode</span>
        <button
          className={`emergency-mode-toggle ${emergencyMode ? "active" : ""}`}
          onClick={() => setEmergencyMode(p => !p)}
        >
          {emergencyMode ? "🚨 Emergency ON" : "Emergency Mode"}
        </button>
        <button className="theme-toggle" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [theme, emergencyMode]);

  // ─── LANDING ───
  if (tab === "landing") {
    return (
      <div className="app-shell">
        {TopBar}
        <div className="container">
          <motion.div className="hero" {...fadeIn}>
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              FieldMedic AI
            </motion.h1>
            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Emergency triage support before professional help arrives.
              Powered by AMD Instinct MI300X for multimodal AI reasoning.
            </motion.p>
            <motion.div
              className="hero-badges"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <span className="badge badge-amd">AMD MI300X</span>
              <span className="badge badge-blue">Multi-Agent</span>
              <span className="badge badge-blue">Multimodal</span>
              <span className="badge badge-critical">9 Safety Agents</span>
              <span className="badge badge-offline">● Offline Ready</span>
            </motion.div>
            <motion.div
              className="hero-cta"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <button className="btn btn-primary btn-lg" onClick={() => { setTab("single"); loadSample(0); }}>
                🚑 Analyze Single Case
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setTab("multi")}>
                👥 Multi-Person Triage
              </button>
            </motion.div>
          </motion.div>

          <div className="disclaimer">
            ⚠️ FieldMedic AI is not a doctor and does not diagnose. It provides first-response guidance and triage support only. For serious symptoms, contact emergency services immediately.
          </div>

          <motion.div {...fadeIn} transition={{ delay: 0.5 }}>
            <ScenarioSelector onSelect={(idx) => { setTab("single"); loadSample(idx); }} />
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.6 }}>
            <AmdComputePanel
              mode="landing"
              gpu="MI300X"
              stack="ROCm + vLLM"
              agents={9}
              tokens={0}
              latency={0}
              safetyChecks={0}
              images={0}
              models={["Qwen2-VL-7B", "Llama-3.2-Vision", "Mistral-7B", "Qwen2.5-7B"]}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── SINGLE CASE ───
  if (tab === "single") {
    return (
      <div className="app-shell">
        {TopBar}
        <div className="container">
          <div className="nav-tabs">
            <button className="nav-tab" onClick={() => setTab("landing")}>Home</button>
            <button className="nav-tab active">Single Case</button>
            <button className="nav-tab" onClick={() => setTab("multi")}>Multi-Person</button>
          </div>

          <motion.div className="glass-card" {...fadeIn}>
            <h2>🚑 Single Emergency Case</h2>

            <div className="section-title">Emergency Context</div>
            <div className="form-grid">
              <div className="form-group">
                <span className="form-label">Emergency Type</span>
                <select value={caseInput.emergencyType} onChange={e => updateCase({ emergencyType: e.target.value })}>
                  {EMERGENCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <span className="form-label">Age Group</span>
                <select value={caseInput.ageGroup} onChange={e => updateCase({ ageGroup: e.target.value })}>
                  {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <span className="form-label">Symptoms</span>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <textarea
                    style={{ flex: 1 }}
                    value={caseInput.symptoms}
                    onChange={e => updateCase({ symptoms: e.target.value })}
                    placeholder="Describe what you see and what the person reports..."
                  />
                  <VoiceInput onResult={handleVoiceResult} />
                </div>
              </div>
              <div className="form-group full">
                <span className="form-label">Voice Transcript (optional)</span>
                <textarea
                  value={caseInput.voiceTranscript ?? ""}
                  onChange={e => updateCase({ voiceTranscript: e.target.value })}
                  placeholder="Paste any voice/call transcript..."
                  rows={2}
                />
              </div>
            </div>

            <div className="section-title">Vital Signs</div>
            <div className="vitals-grid">
              <div className="form-group">
                <span className="form-label">Consciousness</span>
                <select value={caseInput.vitals.consciousness} onChange={e => updateVitals({ consciousness: e.target.value as any })}>
                  <option value="alert">Alert</option>
                  <option value="confused">Confused</option>
                  <option value="unconscious">Unconscious</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <span className="form-label">Breathing</span>
                <select value={caseInput.vitals.breathing} onChange={e => updateVitals({ breathing: e.target.value as any })}>
                  <option value="normal">Normal</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="not breathing">Not Breathing</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <span className="form-label">Bleeding</span>
                <select value={caseInput.vitals.bleeding} onChange={e => updateVitals({ bleeding: e.target.value as any })}>
                  <option value="none">None</option>
                  <option value="mild">Mild</option>
                  <option value="heavy">Heavy</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <span className="form-label">Pain: {caseInput.vitals.pain}/10</span>
                <input type="range" min={0} max={10} value={caseInput.vitals.pain} onChange={e => updateVitals({ pain: +e.target.value })} />
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="form-group">
                <span className="form-label">Temperature (°F)</span>
                <input type="number" placeholder="e.g. 101.5" value={caseInput.vitals.temperature ?? ""} onChange={e => updateVitals({ temperature: e.target.value ? +e.target.value : undefined })} />
              </div>
              <div className="form-group">
                <span className="form-label">Pulse (bpm)</span>
                <input type="number" placeholder="e.g. 88" value={caseInput.vitals.pulse ?? ""} onChange={e => updateVitals({ pulse: e.target.value ? +e.target.value : undefined })} />
              </div>
              <div className="form-group">
                <span className="form-label">Blood Sugar (mg/dL)</span>
                <input type="number" placeholder="e.g. 110" value={caseInput.vitals.bloodSugar ?? ""} onChange={e => updateVitals({ bloodSugar: e.target.value ? +e.target.value : undefined })} />
              </div>
              <div className="form-group">
                <span className="form-label">O₂ Saturation (%)</span>
                <input type="number" placeholder="e.g. 97" value={caseInput.vitals.oxygenSaturation ?? ""} onChange={e => updateVitals({ oxygenSaturation: e.target.value ? +e.target.value : undefined })} />
              </div>
            </div>

            <div className="section-title">Resources &amp; Location</div>
            <div className="form-grid">
              {([
                ["ambulance", "Ambulance", ["available", "delayed", "unknown"]],
                ["nearbyClinic", "Nearby Clinic", ["yes", "no", "unknown"]],
                ["firstAidKit", "First Aid Kit", ["yes", "no"]],
                ["cleanWater", "Clean Water", ["yes", "no", "unknown"]],
                ["trainedResponder", "Trained Responder", ["yes", "no"]],
                ["crowdedDisaster", "Disaster/Crowded", ["yes", "no"]],
              ] as const).map(([key, label, opts]) => (
                <div className="form-group" key={key}>
                  <span className="form-label">{label}</span>
                  <select value={(caseInput.resources as any)[key]} onChange={e => updateResources({ [key]: e.target.value } as any)}>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="section-title">Image Upload (optional)</div>
            <div className="image-upload" onClick={() => document.getElementById("file-input")?.click()}>
              <input id="file-input" type="file" accept="image/*" onChange={handleImageUpload} />
              {imagePreview
                ? <img src={imagePreview} alt="Preview" className="image-preview" />
                : <p style={{ color: "var(--text-muted)" }}>📷 Click to upload an injury photo (optional)</p>
              }
            </div>

            <div className="btn-row">
              <button className="btn btn-primary btn-lg" onClick={analyzeSingle} disabled={loading}>
                {loading ? "⏳ Analyzing..." : "🔍 Analyze Case"}
              </button>
              {sampleSingleCases.map((_, i) => (
                <button key={i} className="btn btn-secondary btn-sm" onClick={() => loadSample(i)}>
                  Sample #{i + 1}
                </button>
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {showTimeline && loading && (
              <motion.div key="timeline" {...fadeIn}>
                <TriageTimeline isActive={loading} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loading && !showTimeline && (
              <motion.div key="skeleton" {...fadeIn}>
                <SkeletonLoader />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {result && !loading && (
              <motion.div key="results" {...fadeIn}>
                <ResultsDashboard
                  result={result}
                  onCopy={copyReport}
                  onDownload={downloadReport}
                  copied={copied}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="disclaimer">
            ⚠️ FieldMedic AI is not a doctor and does not diagnose. It provides first-response guidance and triage support only. For serious symptoms, contact emergency services immediately.
          </div>
        </div>
      </div>
    );
  }

  // ─── MULTI-PERSON TRIAGE ───
  return (
    <div className="app-shell">
      {TopBar}
      <div className="container">
        <div className="nav-tabs">
          <button className="nav-tab" onClick={() => setTab("landing")}>Home</button>
          <button className="nav-tab" onClick={() => setTab("single")}>Single Case</button>
          <button className="nav-tab active">Multi-Person</button>
        </div>

        <motion.div className="glass-card" {...fadeIn}>
          <h2>👥 Multi-Person Triage</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 16, fontSize: "0.9rem" }}>
            Add multiple patients for priority ranking. The system will sort by urgency.
          </p>

          <AnimatePresence>
            {multiCases.map((mc, idx) => (
              <motion.div
                key={idx}
                className="multi-case-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="multi-case-header">
                  <strong>{mc.label || `Patient ${idx + 1}`}</strong>
                  <button className="btn btn-danger btn-sm" onClick={() => removeMultiCase(idx)}>Remove</button>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <span className="form-label">Name/Label</span>
                    <input value={mc.label ?? ""} onChange={e => updateMultiCase(idx, { label: e.target.value })} placeholder="e.g. Patient A" />
                  </div>
                  <div className="form-group">
                    <span className="form-label">Emergency Type</span>
                    <select value={mc.emergencyType} onChange={e => updateMultiCase(idx, { emergencyType: e.target.value })}>
                      {EMERGENCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group full">
                    <span className="form-label">Symptoms</span>
                    <textarea value={mc.symptoms} onChange={e => updateMultiCase(idx, { symptoms: e.target.value })} rows={2} />
                  </div>
                  <div className="form-group">
                    <span className="form-label">Consciousness</span>
                    <select value={mc.vitals.consciousness} onChange={e => updateMultiVitals(idx, { consciousness: e.target.value as any })}>
                      <option value="alert">Alert</option>
                      <option value="confused">Confused</option>
                      <option value="unconscious">Unconscious</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Breathing</span>
                    <select value={mc.vitals.breathing} onChange={e => updateMultiVitals(idx, { breathing: e.target.value as any })}>
                      <option value="normal">Normal</option>
                      <option value="difficulty">Difficulty</option>
                      <option value="not breathing">Not Breathing</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Bleeding</span>
                    <select value={mc.vitals.bleeding} onChange={e => updateMultiVitals(idx, { bleeding: e.target.value as any })}>
                      <option value="none">None</option>
                      <option value="mild">Mild</option>
                      <option value="heavy">Heavy</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Notes</span>
                    <input value={mc.notes ?? ""} onChange={e => updateMultiCase(idx, { notes: e.target.value })} placeholder="Additional notes..." />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="btn-row">
            <button className="btn btn-secondary" onClick={addMultiCase}>+ Add Patient</button>
            <button className="btn btn-secondary" onClick={() => { setMultiCases([...sampleSingleCases]); setMultiResults([]); }}>
              Load 5 Demo Cases
            </button>
            <button className="btn btn-primary btn-lg" onClick={analyzeMulti} disabled={multiLoading || multiCases.length === 0}>
              {multiLoading ? "⏳ Analyzing..." : `🔍 Triage All (${multiCases.length})`}
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {multiLoading && (
            <motion.div key="multi-timeline" {...fadeIn}>
              <TriageTimeline isActive={true} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {multiResults.length > 0 && !multiLoading && (
            <motion.div key="command-center" {...fadeIn}>
              <CommandCenter
                results={multiResults}
                priorityClass={priorityClass}
                priBadge={priBadge}
                riskBadge={riskBadge}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {multiResults.length > 0 && multiResults[0] && !multiLoading && (
          <motion.div {...fadeIn}>
            <AmdComputePanel
              mode="results"
              gpu={multiResults[0].amdCompute.gpu}
              stack={multiResults[0].amdCompute.stack}
              agents={multiResults.length * 9}
              tokens={multiResults.reduce((s, r) => s + r.amdCompute.tokensEstimated, 0)}
              latency={Math.max(...multiResults.map(r => r.amdCompute.latencyMs))}
              safetyChecks={multiResults.reduce((s, r) => s + r.amdCompute.safetyChecksCompleted, 0)}
              images={multiResults.reduce((s, r) => s + r.amdCompute.imagesProcessed, 0)}
              models={multiResults[0].amdCompute.modelTargets}
            />
          </motion.div>
        )}

        <div className="disclaimer">
          ⚠️ FieldMedic AI is not a doctor and does not diagnose. It provides first-response guidance and triage support only. For serious symptoms, contact emergency services immediately.
        </div>
      </div>
    </div>
  );
}

// ─── Results Dashboard ──────────────────────────────────────────────────────
function ResultsDashboard({
  result,
  onCopy,
  onDownload,
  copied,
}: {
  result: TriageResult;
  onCopy: () => void;
  onDownload: (format: "md" | "txt") => void;
  copied: boolean;
}) {
  const isCritical = result.riskLevel === "Critical" || result.priority.startsWith("P1");

  return (
    <>
      {isCritical && <CriticalAlert />}

      <SmartInsightPanel result={result} />

      <motion.div className="result-grid" variants={stagger} initial="initial" animate="animate">
        <motion.div className="result-card" variants={fadeIn}>
          <h3>🎯 Risk Level</h3>
          <div className="risk-display" style={{ color: riskColor(result.riskLevel) }}>
            {result.riskLevel}
          </div>
          <p style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--text-muted)" }}>{result.reason}</p>
        </motion.div>

        <motion.div className="result-card" variants={fadeIn}>
          <h3>🏷️ Triage Priority</h3>
          <div className="priority-display">
            <span className={`badge ${priBadge(result.priority)}`} style={{ fontSize: "1.1rem", padding: "8px 16px" }}>
              {result.priority}
            </span>
          </div>
          <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--text-muted)" }}>{result.summary}</p>
        </motion.div>

        <motion.div className="result-card full" variants={fadeIn}>
          <h3>✅ Immediate Actions</h3>
          <ol className="action-list">
            {result.immediateActions.map((a, i) => (
              <li key={i}><span className="action-num">{i + 1}</span><span>{a}</span></li>
            ))}
          </ol>
        </motion.div>

        <motion.div className="result-card full" variants={fadeIn}>
          <h3>🚫 Do NOT Do</h3>
          <ul className="action-list dont-list">
            {result.doNotDo.map((d, i) => (
              <li key={i}><span className="action-num">✕</span><span>{d}</span></li>
            ))}
          </ul>
        </motion.div>

        {result.redFlags.length > 0 && (
          <motion.div className="result-card" variants={fadeIn}>
            <h3>⚠️ Red Flags</h3>
            <div className="red-flag-list">
              {result.redFlags.map((f, i) => (
                <div key={i} className="red-flag-item">
                  <span style={{ color: "var(--critical)", fontWeight: 800 }}>⚠</span>{f}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div className="result-card" variants={fadeIn}>
          <h3>🚨 Escalation</h3>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>{result.escalation}</p>
        </motion.div>

        {result.missingQuestions.length > 0 && (
          <motion.div className="result-card" variants={fadeIn}>
            <h3>❓ Missing Information</h3>
            <div className="question-list">
              {result.missingQuestions.map((q, i) => (
                <div key={i} className="question-item">❓ {q}</div>
              ))}
            </div>
          </motion.div>
        )}

        {result.imageObservations.length > 0 && (
          <motion.div className="result-card" variants={fadeIn}>
            <h3>📷 Image Observations</h3>
            <ul style={{ paddingLeft: 16, fontSize: "0.85rem" }}>
              {result.imageObservations.map((o, i) => <li key={i} style={{ marginBottom: 4 }}>{o}</li>)}
            </ul>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
              Non-diagnostic observations only. Requires AMD cloud for full multimodal analysis.
            </p>
          </motion.div>
        )}
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
        <HandoffReportView
          report={result.handoffReport}
          onCopy={onCopy}
          onDownload={onDownload}
          copied={copied}
        />
      </motion.div>

      <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
        <AmdComputePanel
          mode="results"
          gpu={result.amdCompute.gpu}
          stack={result.amdCompute.stack}
          agents={result.amdCompute.agentsExecuted}
          tokens={result.amdCompute.tokensEstimated}
          latency={result.amdCompute.latencyMs}
          safetyChecks={result.amdCompute.safetyChecksCompleted}
          images={result.amdCompute.imagesProcessed}
          models={result.amdCompute.modelTargets}
        />
      </motion.div>
    </>
  );
}
