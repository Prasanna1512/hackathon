"use client";
import { motion } from "framer-motion";

const SCENARIOS = [
  { icon: "🚗", title: "Road Accident", desc: "Heavy bleeding from motorcycle crash", sampleIdx: 0 },
  { icon: "🔥", title: "Kitchen Burn", desc: "Red painful burn on hand from hot pan", sampleIdx: 1 },
  { icon: "☀️", title: "Heatstroke", desc: "Dizzy, confused, hot and dry skin", sampleIdx: 2 },
  { icon: "😵", title: "Unconscious Person", desc: "Found collapsed, no response", sampleIdx: 3 },
  { icon: "🩹", title: "Minor Injury", desc: "Small cut on finger, controlled bleeding", sampleIdx: 4 },
];

interface Props {
  onSelect: (sampleIdx: number) => void;
}

export function ScenarioSelector({ onSelect }: Props) {
  return (
    <div className="glass-card">
      <h2>🎯 Demo Scenarios</h2>
      <p style={{ color: "var(--text-muted)", marginBottom: 18, fontSize: "0.88rem" }}>
        Click any scenario to auto-fill and analyze instantly.
      </p>
      <div className="scenario-grid">
        {SCENARIOS.map((s, i) => (
          <motion.button
            key={i}
            className="scenario-card"
            onClick={() => onSelect(s.sampleIdx)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            <span className="scenario-icon">{s.icon}</span>
            <div className="scenario-title">{s.title}</div>
            <div className="scenario-desc">{s.desc}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
