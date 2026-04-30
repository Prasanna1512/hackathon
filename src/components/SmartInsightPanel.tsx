"use client";
import { motion } from "framer-motion";
import { TriageResult } from "@/lib/schemas/types";

interface Props {
  result: TriageResult;
}

export function SmartInsightPanel({ result }: Props) {
  const confidencePercent =
    result.confidence.level === "High" ? 85 :
    result.confidence.level === "Medium" ? 55 : 25;

  const confidenceColor =
    result.confidence.level === "High" ? "var(--low)" :
    result.confidence.level === "Medium" ? "var(--medium)" : "var(--critical)";

  const riskFactors: string[] = [];

  if (result.riskLevel === "Critical" || result.riskLevel === "High") {
    if (result.redFlags.some(f => f.toLowerCase().includes("bleeding")))
      riskFactors.push("Heavy bleeding increases shock risk");
    if (result.redFlags.some(f => f.toLowerCase().includes("unconscious")))
      riskFactors.push("Unconsciousness threatens airway safety");
    if (result.redFlags.some(f => f.toLowerCase().includes("breathing")))
      riskFactors.push("Breathing issues indicate respiratory compromise");
    if (result.redFlags.some(f => f.toLowerCase().includes("chest pain")))
      riskFactors.push("Chest pain suggests possible cardiac event");
    if (result.redFlags.some(f => f.toLowerCase().includes("seizure")))
      riskFactors.push("Seizure activity requires immediate protection");
    if (riskFactors.length === 0 && result.redFlags.length > 0)
      riskFactors.push(`${result.redFlags.length} critical red flag(s) detected`);
  }
  if (riskFactors.length === 0) {
    riskFactors.push(result.reason);
  }

  const missingInfo = result.missingQuestions.slice(0, 3);

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ marginBottom: 16 }}
    >
      <h2>🧠 AI Insights</h2>

      <div className="insight-panel" style={{ gridTemplateColumns: "1fr 1fr", display: "grid", gap: 14 }}>
        {/* Why this priority */}
        <div className="insight-card">
          <div className="insight-label">Why this priority was assigned</div>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>{result.reason}</p>
        </div>

        {/* Risk factors */}
        <div className="insight-card">
          <div className="insight-label">Factors that increased risk</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {riskFactors.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: "0.85rem",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: result.riskLevel === "Critical" ? "var(--critical)" :
                    result.riskLevel === "High" ? "var(--high)" : "var(--medium)",
                  flexShrink: 0,
                }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Missing info */}
        <div className="insight-card">
          <div className="insight-label">Missing information</div>
          {missingInfo.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {missingInfo.map((q, i) => (
                <div key={i} style={{
                  fontSize: "0.85rem",
                  color: "var(--medium)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ fontSize: "0.7rem" }}>⚠</span> {q}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.85rem", color: "var(--low)" }}>
              ✓ All key information provided
            </p>
          )}
        </div>

        {/* Confidence */}
        <div className="insight-card">
          <div className="insight-label">Confidence Level</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <span style={{
              fontSize: "1.6rem",
              fontWeight: 900,
              color: confidenceColor,
              fontFamily: "var(--font-mono)",
            }}>
              {confidencePercent}%
            </span>
            <span style={{
              fontSize: "0.88rem",
              fontWeight: 600,
              color: confidenceColor,
            }}>
              {result.confidence.level} Confidence
            </span>
          </div>
          <div className="confidence-bar">
            <motion.div
              className="confidence-fill"
              style={{ background: confidenceColor }}
              initial={{ width: "0%" }}
              animate={{ width: `${confidencePercent}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            {result.confidence.notes.slice(0, 2).map((n, i) => (
              <p key={i} style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {n}
              </p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
