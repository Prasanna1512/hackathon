"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

const STEPS = [
  { icon: "📥", label: "Intake Processing", detail: "Normalizing patient data..." },
  { icon: "🚩", label: "Detecting Red Flags", detail: "Scanning for critical indicators..." },
  { icon: "🔬", label: "Analyzing Symptoms", detail: "Cross-referencing symptom patterns..." },
  { icon: "📊", label: "Assigning Priority", detail: "Computing triage classification..." },
  { icon: "💊", label: "Generating Actions", detail: "Building first-aid protocol..." },
  { icon: "🛡️", label: "Safety Validation", detail: "Running safety constraint checks..." },
  { icon: "📋", label: "Preparing Handoff Report", detail: "Compiling clinical summary..." },
];

interface Props {
  isActive: boolean;
}

export function TriageTimeline({ isActive }: Props) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const advanceStep = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next < STEPS.length) {
        if (prev >= 0) {
          setCompletedSteps(cs => new Set(cs).add(prev));
        }
        return next;
      }
      setCompletedSteps(cs => new Set(cs).add(prev));
      return prev;
    });
  }, []);

  useEffect(() => {
    if (!isActive) return;
    setCurrentStep(-1);
    setCompletedSteps(new Set());

    const startDelay = setTimeout(() => {
      setCurrentStep(0);
    }, 200);

    const timers: ReturnType<typeof setTimeout>[] = [startDelay];
    let accumulated = 200;

    for (let i = 1; i <= STEPS.length; i++) {
      const delay = 350 + Math.random() * 300;
      accumulated += delay;
      timers.push(setTimeout(() => advanceStep(), accumulated));
    }

    return () => timers.forEach(clearTimeout);
  }, [isActive, advanceStep]);

  return (
    <div className="glass-card" style={{ marginBottom: 16 }}>
      <h2>🧠 AI Triage Pipeline</h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: 20 }}>
        9-agent analysis in progress...
      </p>

      <div className="timeline-container" style={{ position: "relative", paddingLeft: 8 }}>
        {STEPS.map((step, idx) => {
          const isDone = completedSteps.has(idx);
          const isRunning = currentStep === idx;
          const isPending = !isDone && !isRunning;

          return (
            <motion.div
              key={idx}
              className="timeline-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "10px 0",
                position: "relative",
              }}
            >
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div style={{
                  position: "absolute",
                  left: 21,
                  top: 48,
                  bottom: -2,
                  width: 2,
                  background: isDone ? "var(--low)" : "var(--border)",
                  transition: "background 0.4s ease",
                }} />
              )}

              {/* Icon circle */}
              <motion.div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isDone ? "1.2rem" : "1.1rem",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 2,
                  border: `2px solid ${isDone ? "var(--low)" : isRunning ? "var(--accent)" : "var(--border)"}`,
                  background: isDone
                    ? "rgba(34, 197, 94, 0.12)"
                    : isRunning
                    ? "rgba(59, 130, 246, 0.1)"
                    : "var(--surface)",
                  boxShadow: isRunning ? "0 0 20px rgba(59, 130, 246, 0.25)" : "none",
                  transition: "all 0.4s ease",
                }}
                animate={isRunning ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {isDone ? "✓" : step.icon}
              </motion.div>

              {/* Label */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: isDone ? "var(--low)" : isRunning ? "var(--accent)" : "var(--text-muted)",
                  transition: "color 0.3s ease",
                }}>
                  {step.label}
                </div>
                <div style={{
                  fontSize: "0.78rem",
                  color: "var(--text-dim)",
                  marginTop: 2,
                }}>
                  {isDone ? "Complete" : isRunning ? step.detail : "Pending"}
                </div>
              </div>

              {/* Progress indicator */}
              {isRunning && (
                <motion.div
                  style={{
                    width: 20,
                    height: 20,
                    border: "2px solid var(--border)",
                    borderTop: "2px solid var(--accent)",
                    borderRadius: "50%",
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                />
              )}

              {isDone && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ color: "var(--low)", fontSize: "1.2rem", fontWeight: 800 }}
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{
        marginTop: 20,
        height: 4,
        background: "var(--surface2)",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        <motion.div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, var(--accent), var(--low))",
            borderRadius: 2,
          }}
          animate={{
            width: `${Math.min(((completedSteps.size) / STEPS.length) * 100, 100)}%`,
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
