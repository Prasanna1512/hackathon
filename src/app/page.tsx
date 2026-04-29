"use client";
import { useState, useRef } from "react";
import { sampleSingleCases } from "@/data/sampleCases";
import { CaseInput, TriageResult, DEFAULT_VITALS, DEFAULT_RESOURCES, EMERGENCY_TYPES, AGE_GROUPS } from "@/lib/schemas/types";

type Tab = "landing" | "single" | "multi";

const priorityClass = (p: string) => p.startsWith("P1") ? "p1" : p.startsWith("P2") ? "p2" : p.startsWith("P3") ? "p3" : p.startsWith("P4") ? "p4" : "";
const riskBadge = (r: string) => r === "Critical" ? "badge-critical" : r === "High" ? "badge-high" : r === "Medium" ? "badge-medium" : r === "Low" ? "badge-low" : "badge-unknown";
const priBadge = (p: string) => p.startsWith("P1") ? "badge-critical" : p.startsWith("P2") ? "badge-high" : p.startsWith("P3") ? "badge-medium" : p.startsWith("P4") ? "badge-low" : "badge-unknown";

function emptyCaseInput(): CaseInput {
  return { label: "", emergencyType: "unknown", ageGroup: "adult", symptoms: "", vitals: { ...DEFAULT_VITALS }, resources: { ...DEFAULT_RESOURCES } };
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("landing");
  const [caseInput, setCaseInput] = useState<CaseInput>(sampleSingleCases[0]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [multiCases, setMultiCases] = useState<CaseInput[]>(sampleSingleCases.slice(0, 3));
  const [multiResults, setMultiResults] = useState<TriageResult[]>([]);
  const [multiLoading, setMultiLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const updateCase = (patch: Partial<CaseInput>) => setCaseInput(prev => ({ ...prev, ...patch }));
  const updateVitals = (patch: Partial<CaseInput["vitals"]>) => setCaseInput(prev => ({ ...prev, vitals: { ...prev.vitals, ...patch } }));
  const updateResources = (patch: Partial<CaseInput["resources"]>) => setCaseInput(prev => ({ ...prev, resources: { ...prev.resources, ...patch } }));

  const analyzeSingle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-case", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(caseInput) });
      setResult(await res.json());
    } catch { setResult(null); }
    setLoading(false);
  };

  const analyzeMulti = async () => {
    setMultiLoading(true);
    try {
      const res = await fetch("/api/analyze-multi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cases: multiCases }) });
      setMultiResults((await res.json()).results);
    } catch { setMultiResults([]); }
    setMultiLoading(false);
  };

  const loadSample = (idx: number) => {
    setCaseInput(sampleSingleCases[idx % sampleSingleCases.length]);
    setResult(null);
    setImagePreview(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      setImagePreview(data);
      updateCase({ imageData: data.split(",")[1], imageName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const copyReport = () => {
    if (result) { navigator.clipboard.writeText(result.handoffReport); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const downloadReport = () => {
    if (!result) return;
    const blob = new Blob([result.handoffReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "fieldmedic-handoff-report.md"; a.click();
    URL.revokeObjectURL(url);
  };

  const updateMultiCase = (idx: number, patch: Partial<CaseInput>) => {
    setMultiCases(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };
  const updateMultiVitals = (idx: number, patch: Partial<CaseInput["vitals"]>) => {
    setMultiCases(prev => prev.map((c, i) => i === idx ? { ...c, vitals: { ...c.vitals, ...patch } } : c));
  };
  const removeMultiCase = (idx: number) => setMultiCases(prev => prev.filter((_, i) => i !== idx));
  const addMultiCase = () => setMultiCases(prev => [...prev, { ...emptyCaseInput(), label: `Patient ${prev.length + 1}` }]);

  // ─── LANDING ───
  if (tab === "landing") {
    return (
      <div className="container">
        <div className="header">
          <h1>🏥 FieldMedic AI</h1>
          <p className="subtitle">Emergency triage support before professional help arrives. Powered by AMD Instinct MI300X for multimodal AI reasoning.</p>
          <div className="badge-row">
            <span className="badge badge-amd">AMD MI300X</span>
            <span className="badge badge-blue">Multi-Agent</span>
            <span className="badge badge-blue">Multimodal</span>
            <span className="badge badge-critical">9 Safety Agents</span>
          </div>
        </div>
        <div className="disclaimer">⚠️ FieldMedic AI is not a doctor and does not diagnose. It provides first-response guidance and triage support only. For serious symptoms, contact emergency services immediately.</div>
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={() => { setTab("single"); loadSample(0); }}>🚑 Analyze Single Case</button>
          <button className="btn btn-secondary" onClick={() => setTab("multi")}>👥 Multi-Person Triage</button>
        </div>

        <div className="card" style={{ marginTop: 32 }}>
          <h2>🎯 Demo Scenarios</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 16, fontSize: "0.9rem" }}>Click any sample to load it instantly.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {sampleSingleCases.map((s, i) => (
              <button key={i} className="btn btn-secondary btn-sm" onClick={() => { setTab("single"); loadSample(i); }} style={{ justifyContent: "flex-start", textAlign: "left" }}>
                <span style={{ fontWeight: 700 }}>#{i + 1}</span> {s.label || s.emergencyType}
              </button>
            ))}
          </div>
        </div>

        <div className="amd-panel" style={{ marginTop: 16 }}>
          <h3>⚡ AMD Compute Architecture</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
            FieldMedic AI is designed for deployment on AMD Instinct MI300X GPUs via ROCm + vLLM, enabling real-time multimodal triage with open-source vision and language models.
          </p>
          <div className="amd-grid">
            <div className="amd-stat"><div className="value">MI300X</div><div className="label">GPU Target</div></div>
            <div className="amd-stat"><div className="value">ROCm</div><div className="label">Compute Stack</div></div>
            <div className="amd-stat"><div className="value">vLLM</div><div className="label">Inference Engine</div></div>
            <div className="amd-stat"><div className="value">9</div><div className="label">AI Agents</div></div>
          </div>
          <div className="amd-models" style={{ marginTop: 12 }}>
            {["Qwen2-VL-7B", "Llama-3.2-Vision", "Mistral-7B", "Qwen2.5-7B"].map(m => <span key={m} className="badge badge-amd">{m}</span>)}
          </div>
        </div>
      </div>
    );
  }

  // ─── SINGLE CASE ───
  if (tab === "single") {
    return (
      <div className="container">
        <div className="tabs">
          <button className="tab" onClick={() => setTab("landing")}>Home</button>
          <button className="tab active">Single Case</button>
          <button className="tab" onClick={() => setTab("multi")}>Multi-Person</button>
        </div>

        <div className="card">
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
              <textarea value={caseInput.symptoms} onChange={e => updateCase({ symptoms: e.target.value })} placeholder="Describe what you see and what the person reports..." />
            </div>
            <div className="form-group full">
              <span className="form-label">Voice Transcript (optional)</span>
              <textarea value={caseInput.voiceTranscript ?? ""} onChange={e => updateCase({ voiceTranscript: e.target.value })} placeholder="Paste any voice/call transcript..." rows={2} />
            </div>
          </div>

          <div className="section-title">Vital Signs</div>
          <div className="vitals-grid">
            <div className="form-group">
              <span className="form-label">Consciousness</span>
              <select value={caseInput.vitals.consciousness} onChange={e => updateVitals({ consciousness: e.target.value as any })}>
                <option value="alert">Alert</option><option value="confused">Confused</option><option value="unconscious">Unconscious</option><option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="form-group">
              <span className="form-label">Breathing</span>
              <select value={caseInput.vitals.breathing} onChange={e => updateVitals({ breathing: e.target.value as any })}>
                <option value="normal">Normal</option><option value="difficulty">Difficulty</option><option value="not breathing">Not Breathing</option><option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="form-group">
              <span className="form-label">Bleeding</span>
              <select value={caseInput.vitals.bleeding} onChange={e => updateVitals({ bleeding: e.target.value as any })}>
                <option value="none">None</option><option value="mild">Mild</option><option value="heavy">Heavy</option><option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="form-group">
              <span className="form-label">Pain: {caseInput.vitals.pain}/10</span>
              <input type="range" min={0} max={10} value={caseInput.vitals.pain} onChange={e => updateVitals({ pain: +e.target.value })} />
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: 10 }}>
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

          <div className="section-title">Resources & Location</div>
          <div className="form-grid">
            {([["ambulance", "Ambulance", ["available", "delayed", "unknown"]], ["nearbyClinic", "Nearby Clinic", ["yes", "no", "unknown"]], ["firstAidKit", "First Aid Kit", ["yes", "no"]], ["cleanWater", "Clean Water", ["yes", "no", "unknown"]], ["trainedResponder", "Trained Responder", ["yes", "no"]], ["crowdedDisaster", "Disaster/Crowded", ["yes", "no"]]] as const).map(([key, label, opts]) => (
              <div className="form-group" key={key}>
                <span className="form-label">{label}</span>
                <select value={(caseInput.resources as any)[key]} onChange={e => updateResources({ [key]: e.target.value } as any)}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div className="section-title">Image Upload (optional)</div>
          <div className="image-upload" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} />
            {imagePreview ? <img src={imagePreview} alt="Preview" className="image-preview" /> : <p style={{ color: "var(--text-muted)" }}>📷 Click to upload an injury photo (optional)</p>}
          </div>

          <div className="btn-row">
            <button className="btn btn-primary" onClick={analyzeSingle} disabled={loading}>
              {loading ? "Analyzing..." : "🔍 Analyze Case"}
            </button>
            {sampleSingleCases.map((_, i) => (
              <button key={i} className="btn btn-secondary btn-sm" onClick={() => loadSample(i)}>Sample #{i + 1}</button>
            ))}
          </div>
        </div>

        {loading && <div className="loading"><div className="spinner" /></div>}

        {result && !loading && <ResultsDashboard result={result} onCopy={copyReport} onDownload={downloadReport} copied={copied} />}

        <div className="disclaimer">⚠️ FieldMedic AI is not a doctor and does not diagnose. It provides first-response guidance and triage support only. For serious symptoms, contact emergency services immediately.</div>
      </div>
    );
  }

  // ─── MULTI-PERSON TRIAGE ───
  return (
    <div className="container">
      <div className="tabs">
        <button className="tab" onClick={() => setTab("landing")}>Home</button>
        <button className="tab" onClick={() => setTab("single")}>Single Case</button>
        <button className="tab active">Multi-Person</button>
      </div>

      <div className="card">
        <h2>👥 Multi-Person Triage</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 16, fontSize: "0.9rem" }}>Add multiple patients for priority ranking. The system will sort by urgency.</p>

        {multiCases.map((mc, idx) => (
          <div key={idx} className="multi-case-card">
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
                  <option value="alert">Alert</option><option value="confused">Confused</option><option value="unconscious">Unconscious</option><option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <span className="form-label">Breathing</span>
                <select value={mc.vitals.breathing} onChange={e => updateMultiVitals(idx, { breathing: e.target.value as any })}>
                  <option value="normal">Normal</option><option value="difficulty">Difficulty</option><option value="not breathing">Not Breathing</option><option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <span className="form-label">Bleeding</span>
                <select value={mc.vitals.bleeding} onChange={e => updateMultiVitals(idx, { bleeding: e.target.value as any })}>
                  <option value="none">None</option><option value="mild">Mild</option><option value="heavy">Heavy</option><option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <span className="form-label">Notes</span>
                <input value={mc.notes ?? ""} onChange={e => updateMultiCase(idx, { notes: e.target.value })} placeholder="Additional notes..." />
              </div>
            </div>
          </div>
        ))}

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={addMultiCase}>+ Add Patient</button>
          <button className="btn btn-secondary" onClick={() => { setMultiCases([...sampleSingleCases]); setMultiResults([]); }}>Load 5 Demo Cases</button>
          <button className="btn btn-primary" onClick={analyzeMulti} disabled={multiLoading || multiCases.length === 0}>
            {multiLoading ? "Analyzing..." : `🔍 Triage All (${multiCases.length})`}
          </button>
        </div>
      </div>

      {multiLoading && <div className="loading"><div className="spinner" /></div>}

      {multiResults.length > 0 && !multiLoading && (
        <div className="card">
          <h2>📋 Priority Ranking</h2>
          <div className="triage-board">
            {multiResults.map((r, i) => (
              <div key={r.caseId} className={`triage-patient ${priorityClass(r.priority)}`}>
                <div className="triage-rank">#{i + 1}</div>
                <div className="triage-info">
                  <h4>{r.caseId}</h4>
                  <p><strong>Reason:</strong> {r.reason}</p>
                  <p><strong>First action:</strong> {r.immediateActions[0]}</p>
                  <p style={{ color: "var(--critical)", fontSize: "0.8rem" }}><strong>Do NOT:</strong> {r.doNotDo[0]}</p>
                  <p style={{ fontSize: "0.8rem" }}><strong>Escalation:</strong> {r.escalation}</p>
                </div>
                <div className="triage-badge">
                  <span className={`badge ${priBadge(r.priority)}`}>{r.priority}</span>
                  <br />
                  <span className={`badge ${riskBadge(r.riskLevel)}`} style={{ marginTop: 4 }}>{r.riskLevel}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => {
              const text = multiResults.map((r, i) => `#${i + 1} ${r.caseId}\nPriority: ${r.priority} | Risk: ${r.riskLevel}\nReason: ${r.reason}\nFirst Action: ${r.immediateActions[0]}\nDo NOT: ${r.doNotDo[0]}\nEscalation: ${r.escalation}\n`).join("\n---\n");
              navigator.clipboard.writeText(text);
            }}>📋 Copy Summary</button>
            <button className="btn btn-secondary" onClick={() => {
              const text = multiResults.map((r, i) => `#${i + 1} ${r.caseId}\nPriority: ${r.priority} | Risk: ${r.riskLevel}\nReason: ${r.reason}\n\n${r.handoffReport}`).join("\n\n===\n\n");
              const blob = new Blob([text], { type: "text/markdown" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "fieldmedic-multi-triage.md"; a.click();
              URL.revokeObjectURL(url);
            }}>📥 Export All Reports</button>
          </div>
        </div>
      )}

      {multiResults.length > 0 && multiResults[0] && (
        <div className="amd-panel">
          <h3>⚡ AMD Compute Summary</h3>
          <div className="amd-grid">
            <div className="amd-stat"><div className="value">{multiResults[0].amdCompute.gpu}</div><div className="label">GPU</div></div>
            <div className="amd-stat"><div className="value">{multiResults.length * 9}</div><div className="label">Agents Run</div></div>
            <div className="amd-stat"><div className="value">{multiResults.reduce((s, r) => s + r.amdCompute.tokensEstimated, 0)}</div><div className="label">Tokens Est.</div></div>
            <div className="amd-stat"><div className="value">{Math.max(...multiResults.map(r => r.amdCompute.latencyMs))}ms</div><div className="label">Latency</div></div>
            <div className="amd-stat"><div className="value">{multiResults.reduce((s, r) => s + r.amdCompute.safetyChecksCompleted, 0)}</div><div className="label">Safety Checks</div></div>
            <div className="amd-stat"><div className="value">{multiResults.length}</div><div className="label">Cases Analyzed</div></div>
          </div>
        </div>
      )}

      <div className="disclaimer">⚠️ FieldMedic AI is not a doctor and does not diagnose. It provides first-response guidance and triage support only. For serious symptoms, contact emergency services immediately.</div>
    </div>
  );
}

// ─── Results Dashboard Component ────────────────────────────────────────────
function ResultsDashboard({ result, onCopy, onDownload, copied }: { result: TriageResult; onCopy: () => void; onDownload: () => void; copied: boolean }) {
  return (
    <>
      <div className="result-grid">
        <div className="result-card">
          <h3>🎯 Risk Level</h3>
          <div className={`risk-display`} style={{ color: result.riskLevel === "Critical" ? "var(--critical)" : result.riskLevel === "High" ? "var(--high)" : result.riskLevel === "Medium" ? "var(--medium)" : result.riskLevel === "Low" ? "var(--low)" : "var(--unknown)" }}>
            {result.riskLevel}
          </div>
          <p style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--text-muted)" }}>{result.reason}</p>
        </div>
        <div className="result-card">
          <h3>🏷️ Triage Priority</h3>
          <div className="priority-display">
            <span className={`badge ${priBadge(result.priority)}`} style={{ fontSize: "1.1rem", padding: "8px 16px" }}>{result.priority}</span>
          </div>
          <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--text-muted)" }}>{result.summary}</p>
        </div>

        <div className="result-card full">
          <h3>✅ Immediate Actions</h3>
          <ol className="action-list">
            {result.immediateActions.map((a, i) => <li key={i}><span className="action-num">{i + 1}</span><span>{a}</span></li>)}
          </ol>
        </div>

        <div className="result-card full">
          <h3>🚫 Do NOT Do</h3>
          <ul className="action-list dont-list">
            {result.doNotDo.map((d, i) => <li key={i}><span className="action-num">✕</span><span>{d}</span></li>)}
          </ul>
        </div>

        {result.redFlags.length > 0 && (
          <div className="result-card">
            <h3>⚠️ Red Flags</h3>
            <div className="red-flag-list">
              {result.redFlags.map((f, i) => <div key={i} className="red-flag-item"><span className="red-flag-icon">⚠</span>{f}</div>)}
            </div>
          </div>
        )}

        <div className="result-card">
          <h3>🚨 Escalation</h3>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>{result.escalation}</p>
        </div>

        {result.missingQuestions.length > 0 && (
          <div className="result-card">
            <h3>❓ Missing Information</h3>
            <div className="question-list">
              {result.missingQuestions.map((q, i) => <div key={i} className="question-item">❓ {q}</div>)}
            </div>
          </div>
        )}

        <div className="result-card">
          <h3>📊 Confidence</h3>
          <span className={`badge ${result.confidence.level === "High" ? "badge-low" : result.confidence.level === "Medium" ? "badge-medium" : "badge-critical"}`} style={{ fontSize: "1rem", padding: "6px 14px" }}>
            {result.confidence.level} Confidence
          </span>
          <ul style={{ marginTop: 12, paddingLeft: 16, fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {result.confidence.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>

        {result.imageObservations.length > 0 && (
          <div className="result-card">
            <h3>📷 Image Observations</h3>
            <ul style={{ paddingLeft: 16, fontSize: "0.85rem" }}>
              {result.imageObservations.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>Non-diagnostic observations only. Requires AMD cloud for full multimodal analysis.</p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>📝 Handoff Report</h2>
        <div className="btn-row" style={{ marginTop: 0, marginBottom: 12 }}>
          <button className="btn btn-primary btn-sm" onClick={onCopy}>{copied ? "✓ Copied!" : "📋 Copy Report"}</button>
          <button className="btn btn-secondary btn-sm" onClick={onDownload}>📥 Download .md</button>
        </div>
        <div className="report-box">{result.handoffReport}</div>
      </div>

      <div className="amd-panel" style={{ marginTop: 16 }}>
        <h3>⚡ AMD Compute Panel</h3>
        <div className="amd-grid">
          <div className="amd-stat"><div className="value">{result.amdCompute.gpu}</div><div className="label">GPU</div></div>
          <div className="amd-stat"><div className="value">{result.amdCompute.stack}</div><div className="label">Stack</div></div>
          <div className="amd-stat"><div className="value">{result.amdCompute.agentsExecuted}</div><div className="label">Agents</div></div>
          <div className="amd-stat"><div className="value">{result.amdCompute.imagesProcessed}</div><div className="label">Images</div></div>
          <div className="amd-stat"><div className="value">{result.amdCompute.tokensEstimated}</div><div className="label">Tokens Est.</div></div>
          <div className="amd-stat"><div className="value">{result.amdCompute.latencyMs}ms</div><div className="label">Latency</div></div>
          <div className="amd-stat"><div className="value">{result.amdCompute.safetyChecksCompleted}</div><div className="label">Safety Checks</div></div>
        </div>
        <div className="amd-models" style={{ marginTop: 12 }}>
          {result.amdCompute.modelTargets.map(m => <span key={m} className="badge badge-amd">{m}</span>)}
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 12 }}>
          Currently running in demo mode with deterministic rule-based triage. For full LLM-powered multimodal analysis, deploy on AMD Developer Cloud with ROCm + vLLM.
        </p>
      </div>
    </>
  );
}
