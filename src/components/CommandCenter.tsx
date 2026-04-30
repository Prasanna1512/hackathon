"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { TriageResult } from "@/lib/schemas/types";

interface Props {
  results: TriageResult[];
  priorityClass: (p: string) => string;
  priBadge: (p: string) => string;
  riskBadge: (r: string) => string;
}

export function CommandCenter({ results, priorityClass, priBadge, riskBadge }: Props) {
  const columns = useMemo(() => {
    const p1 = results.filter(r => r.priority.startsWith("P1"));
    const p2 = results.filter(r => r.priority.startsWith("P2"));
    const p3 = results.filter(r => r.priority.startsWith("P3"));
    const p4 = results.filter(r => r.priority.startsWith("P4") || r.priority === "Unknown");
    return { p1, p2, p3, p4 };
  }, [results]);

  const totalCritical = columns.p1.length;
  const totalUrgent = columns.p2.length;

  const resourceSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    columns.p1.forEach((r, i) => {
      suggestions.push(`Responder ${i + 1} should attend ${r.caseId} immediately — ${r.immediateActions[0]}`);
    });
    columns.p2.forEach(r => {
      if (r.immediateActions[0]) {
        suggestions.push(`${r.caseId}: ${r.immediateActions[0]}`);
      }
    });
    if (suggestions.length === 0) {
      suggestions.push("No critical cases — monitor all patients for changes");
    }
    return suggestions.slice(0, 5);
  }, [columns]);

  const nextActions = useMemo(() => {
    const actions: string[] = [];
    results.slice(0, 5).forEach(r => {
      const action = r.immediateActions[0];
      if (action) actions.push(`${r.caseId}: ${action}`);
    });
    return actions;
  }, [results]);

  const copyMultiSummary = () => {
    const text = results.map((r, i) =>
      `#${i + 1} ${r.caseId}\nPriority: ${r.priority} | Risk: ${r.riskLevel}\nReason: ${r.reason}\nFirst Action: ${r.immediateActions[0]}\nDo NOT: ${r.doNotDo[0]}\nEscalation: ${r.escalation}\n`
    ).join("\n---\n");
    navigator.clipboard.writeText(text);
  };

  const exportAll = () => {
    const text = results.map((r, i) =>
      `#${i + 1} ${r.caseId}\nPriority: ${r.priority} | Risk: ${r.riskLevel}\nReason: ${r.reason}\n\n${r.handoffReport}`
    ).join("\n\n===\n\n");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fieldmedic-multi-triage.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Situation Summary */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2>📊 Situation Summary</h2>
        <div className="situation-summary">
          <div className="situation-stat">
            <div className="stat-number" style={{ color: "var(--critical)" }}>{totalCritical}</div>
            <div className="stat-label">Critical (P1)</div>
          </div>
          <div className="situation-stat">
            <div className="stat-number" style={{ color: "var(--high)" }}>{totalUrgent}</div>
            <div className="stat-label">Urgent (P2)</div>
          </div>
          <div className="situation-stat">
            <div className="stat-number" style={{ color: "var(--medium)" }}>{columns.p3.length}</div>
            <div className="stat-label">Delayed (P3)</div>
          </div>
          <div className="situation-stat">
            <div className="stat-number" style={{ color: "var(--low)" }}>{columns.p4.length}</div>
            <div className="stat-label">Minor (P4)</div>
          </div>
        </div>

        {/* Next actions */}
        <div style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-muted)", marginBottom: 10, fontWeight: 700 }}>
            Recommended Next Actions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {nextActions.map((a, i) => (
              <motion.div
                key={i}
                className="resource-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="resource-icon" style={{
                  background: i === 0 ? "rgba(239,68,68,0.15)" : i === 1 ? "rgba(249,115,22,0.15)" : "rgba(59,130,246,0.1)",
                  color: i === 0 ? "var(--critical)" : i === 1 ? "var(--high)" : "var(--accent)",
                }}>
                  {i + 1}
                </div>
                <span>{a}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        <h2>🏥 Priority Command Board</h2>
        <div className="kanban-board">
          <KanbanColumn
            title="P1 Immediate"
            color="var(--critical)"
            bgColor="rgba(239,68,68,0.08)"
            items={columns.p1}
            isP1
          />
          <KanbanColumn
            title="P2 Urgent"
            color="var(--high)"
            bgColor="rgba(249,115,22,0.08)"
            items={columns.p2}
          />
          <KanbanColumn
            title="P3 Delayed"
            color="var(--medium)"
            bgColor="rgba(234,179,8,0.08)"
            items={columns.p3}
          />
          <KanbanColumn
            title="P4 Minor"
            color="var(--low)"
            bgColor="rgba(34,197,94,0.08)"
            items={columns.p4}
          />
        </div>
      </motion.div>

      {/* Resource Allocation */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        <h2>🧑‍⚕️ Resource Allocation Suggestions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {resourceSuggestions.map((s, i) => (
            <motion.div
              key={i}
              className="resource-item"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <div className="resource-icon" style={{
                background: i < totalCritical ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.1)",
                color: i < totalCritical ? "var(--critical)" : "var(--accent)",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}>
                {i < totalCritical ? "!" : "→"}
              </div>
              <span>{s}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Priority Ranking List */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
      >
        <h2>📋 Priority Ranking</h2>
        <div className="triage-board">
          {results.map((r, i) => (
            <motion.div
              key={r.caseId}
              className={`triage-patient ${priorityClass(r.priority)} ${r.priority.startsWith("P1") ? "p1-blink" : ""}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <div className="triage-rank">#{i + 1}</div>
              <div className="triage-info">
                <h4>{r.caseId}</h4>
                <p><strong>Reason:</strong> {r.reason}</p>
                <p><strong>First action:</strong> {r.immediateActions[0]}</p>
                <p style={{ color: "var(--critical)", fontSize: "0.8rem" }}>
                  <strong>Do NOT:</strong> {r.doNotDo[0]}
                </p>
                <p style={{ fontSize: "0.8rem" }}>
                  <strong>Escalation:</strong> {r.escalation}
                </p>
              </div>
              <div className="triage-badge">
                <span className={`badge ${priBadge(r.priority)}`}>{r.priority}</span>
                <br />
                <span className={`badge ${riskBadge(r.riskLevel)}`} style={{ marginTop: 4, display: "inline-flex" }}>
                  {r.riskLevel}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={copyMultiSummary}>📋 Copy Summary</button>
          <button className="btn btn-secondary" onClick={exportAll}>📥 Export All Reports</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>🖨️ Print</button>
        </div>
      </motion.div>
    </>
  );
}

function KanbanColumn({
  title,
  color,
  bgColor,
  items,
  isP1 = false,
}: {
  title: string;
  color: string;
  bgColor: string;
  items: TriageResult[];
  isP1?: boolean;
}) {
  return (
    <div className="kanban-column" style={{ borderTopColor: color, borderTopWidth: 3 }}>
      <div className="kanban-column-header" style={{ color }}>
        <span>{title}</span>
        <span className="kanban-count" style={{ background: bgColor, color }}>{items.length}</span>
      </div>
      {items.map((item, i) => (
        <motion.div
          key={item.caseId}
          className={`kanban-card ${isP1 ? "p1-blink" : ""}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.25 }}
          style={{ borderLeft: `3px solid ${color}` }}
        >
          <div className="kanban-card-title">{item.caseId}</div>
          <div className="kanban-card-action">{item.immediateActions[0]}</div>
        </motion.div>
      ))}
      {items.length === 0 && (
        <div style={{ textAlign: "center", padding: 20, color: "var(--text-dim)", fontSize: "0.8rem" }}>
          No patients
        </div>
      )}
    </div>
  );
}
