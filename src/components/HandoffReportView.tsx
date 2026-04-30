"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
  report: string;
  onCopy: () => void;
  onDownload: (format: "md" | "txt") => void;
  copied: boolean;
}

export function HandoffReportView({ report, onCopy, onDownload, copied }: Props) {
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");

  const sections = useMemo(() => {
    const result: { title: string; content: string }[] = [];
    const lines = report.split("\n");
    let currentTitle = "";
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith("## ")) {
        if (currentTitle || currentContent.length > 0) {
          result.push({ title: currentTitle, content: currentContent.join("\n").trim() });
        }
        currentTitle = line.replace(/^##\s*/, "");
        currentContent = [];
      } else if (line.startsWith("# ")) {
        if (currentTitle || currentContent.length > 0) {
          result.push({ title: currentTitle, content: currentContent.join("\n").trim() });
        }
        currentTitle = line.replace(/^#\s*/, "");
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }
    if (currentTitle || currentContent.length > 0) {
      result.push({ title: currentTitle, content: currentContent.join("\n").trim() });
    }
    return result;
  }, [report]);

  const sectionIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("context")) return "📋";
    if (t.includes("vital")) return "💓";
    if (t.includes("triage") || t.includes("assessment")) return "🎯";
    if (t.includes("red flag")) return "⚠️";
    if (t.includes("action")) return "✅";
    if (t.includes("do not")) return "🚫";
    if (t.includes("escalation")) return "🚨";
    if (t.includes("missing")) return "❓";
    if (t.includes("resource")) return "🧰";
    if (t.includes("image")) return "📷";
    if (t.includes("handoff") || t.includes("report")) return "📝";
    if (t.includes("disclaimer")) return "⚠️";
    return "📌";
  };

  return (
    <div className="glass-card" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ marginBottom: 0 }}>📝 Handoff Report</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={`btn btn-sm ${viewMode === "formatted" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("formatted")}
          >
            Formatted
          </button>
          <button
            className={`btn btn-sm ${viewMode === "raw" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setViewMode("raw")}
          >
            Raw
          </button>
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 0, marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={onCopy}>
          {copied ? "✓ Copied!" : "📋 Copy Report"}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => onDownload("md")}>
          📥 Download .md
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => onDownload("txt")}>
          📄 Download .txt
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
          🖨️ Print
        </button>
      </div>

      {viewMode === "formatted" ? (
        <div>
          {sections.map((section, i) => (
            <motion.div
              key={i}
              className="report-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
            >
              {section.title && (
                <h4>
                  {sectionIcon(section.title)} {section.title}
                </h4>
              )}
              <div style={{
                fontSize: "0.85rem",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                color: "var(--text)",
              }}>
                {section.content.split("\n").map((line, li) => {
                  const cleaned = line.replace(/^\*\*(.+?)\*\*/, "$1").replace(/^- /, "").trim();
                  if (!cleaned) return null;
                  const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("⚠");
                  const isNumbered = /^\d+\./.test(line.trim());
                  return (
                    <div key={li} style={{
                      paddingLeft: (isBullet || isNumbered) ? 8 : 0,
                      marginBottom: 4,
                    }}>
                      {isBullet && <span style={{ color: "var(--accent)", marginRight: 6 }}>•</span>}
                      {cleaned}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="report-box">{report}</div>
      )}
    </div>
  );
}
