"use client";
import { useState } from "react";
import { sampleSingleCases } from "@/data/sampleCases";
import { CaseInput, TriageResult } from "@/lib/schemas/types";

const base = sampleSingleCases[0];

export default function Home() {
  const [single, setSingle] = useState<CaseInput>(base);
  const [multi, setMulti] = useState<CaseInput[]>(sampleSingleCases.slice(0, 3));
  const [result, setResult] = useState<TriageResult | null>(null);
  const [multiResult, setMultiResult] = useState<TriageResult[]>([]);

  const analyzeSingle = async () => setResult(await (await fetch("/api/analyze-case", { method: "POST", body: JSON.stringify(single) })).json());
  const analyzeMulti = async () => setMultiResult((await (await fetch("/api/analyze-multi", { method: "POST", body: JSON.stringify({ cases: multi }) })).json()).results);

  return <main className="container">
    <h1>FieldMedic AI</h1><p>Emergency triage support before help arrives.</p>
    <p className="disclaimer">FieldMedic AI is not a doctor and does not diagnose. It provides first-response guidance and triage support only. For serious symptoms, contact emergency services immediately.</p>
    <section className="card"><h2>Single Emergency Case</h2>
      <div className="grid"><label>Emergency Type<input value={single.emergencyType} onChange={e=>setSingle({...single, emergencyType:e.target.value})}/></label>
      <label>Age Group<input value={single.ageGroup} onChange={e=>setSingle({...single, ageGroup:e.target.value})}/></label>
      <label>Symptoms<textarea value={single.symptoms} onChange={e=>setSingle({...single, symptoms:e.target.value})}/></label>
      <label>Breathing<select value={single.vitals.breathing} onChange={e=>setSingle({...single,vitals:{...single.vitals,breathing:e.target.value}})}><option>normal</option><option>difficulty</option><option>not breathing</option><option>unknown</option></select></label>
      </div>
      <button onClick={analyzeSingle}>Analyze Case</button><button onClick={()=>setSingle(sampleSingleCases[(Math.random()*5)|0])}>Load Sample</button>
    </section>
    {result && <section className="card"><h2>Results Dashboard</h2><p><b>Risk:</b> {result.riskLevel}</p><p><b>Priority:</b> {result.priority}</p><p>{result.summary}</p>
      <ul>{result.immediateActions.map((a,i)=><li key={i}>{a}</li>)}</ul>
      <h3>Do NOT Do</h3><ul>{result.doNotDo.map((a,i)=><li key={i}>{a}</li>)}</ul>
      <h3>Escalation</h3><p>{result.escalation}</p>
      <h3>Handoff Report</h3><pre>{result.handoffReport}</pre>
      <button onClick={()=>navigator.clipboard.writeText(result.handoffReport)}>Copy Report</button>
      <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(result.handoffReport)}`} download="handoff-report.md">Download Report</a>
      <h3>AMD Compute Panel</h3><p>{result.amdCompute.gpu} | {result.amdCompute.stack} | Agents: {result.amdCompute.agentsExecuted} | Tokens: {result.amdCompute.tokensEstimated} | Latency: {result.amdCompute.latencyMs}ms</p>
    </section>}
    <section className="card"><h2>Multi-Person Triage</h2><button onClick={()=>setMulti(sampleSingleCases)}>Load Demo 5 Cases</button><button onClick={analyzeMulti}>Analyze All</button>
      {multiResult.map((r)=><div key={r.caseId} className={`priority ${r.priority.slice(0,2)}`}><b>{r.caseId}</b> - {r.priority} - {r.reason}<br/>First action: {r.immediateActions[0]}</div>)}
    </section>
  </main>;
}
