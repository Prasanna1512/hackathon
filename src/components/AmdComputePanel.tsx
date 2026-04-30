"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Props {
  mode: "landing" | "results";
  gpu: string;
  stack: string;
  agents: number;
  tokens: number;
  latency: number;
  safetyChecks: number;
  images: number;
  models: string[];
}

function AnimatedCounter({ target, duration = 1.2, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    startRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return <>{value}{suffix}</>;
}

export function AmdComputePanel({ mode, gpu, stack, agents, tokens, latency, safetyChecks, images, models }: Props) {
  const stats = mode === "landing"
    ? [
        { value: gpu, label: "GPU Target", isText: true },
        { value: stack.split(" + ")[0], label: "Compute Stack", isText: true },
        { value: "vLLM", label: "Inference Engine", isText: true },
        { value: agents, label: "AI Agents", suffix: "" },
      ]
    : [
        { value: gpu, label: "GPU", isText: true },
        { value: stack, label: "Stack", isText: true },
        { value: agents, label: "Agents Run", suffix: "" },
        { value: images, label: "Images", suffix: "" },
        { value: tokens, label: "Tokens Est.", suffix: "" },
        { value: latency, label: "Latency", suffix: "ms" },
        { value: safetyChecks, label: "Safety Checks", suffix: "" },
      ];

  return (
    <motion.div
      className="amd-panel"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3>⚡ AMD Compute {mode === "landing" ? "Architecture" : "Panel"}</h3>

      {mode === "landing" && (
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 18 }}>
          Designed for deployment on AMD Instinct MI300X GPUs via ROCm + vLLM, enabling real-time multimodal triage.
        </p>
      )}

      <div className="amd-grid">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            className="amd-stat"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <div className="value">
              {s.isText ? (
                String(s.value)
              ) : (
                <AnimatedCounter target={Number(s.value)} suffix={s.suffix || ""} />
              )}
            </div>
            <div className="label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="amd-models">
        {models.map((m, i) => (
          <motion.span
            key={m}
            className="badge badge-amd"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.25 }}
          >
            {m}
          </motion.span>
        ))}
      </div>

      {/* Mode badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
        <span className="badge badge-blue">
          {mode === "landing" ? "Local Demo" : "Demo Mode"}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {mode === "landing"
            ? "Full LLM analysis requires AMD Developer Cloud deployment"
            : "Deterministic rule-based triage active"
          }
        </span>
      </div>
    </motion.div>
  );
}
