"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_TRANSCRIPTS = [
  "Patient has heavy bleeding on left leg, conscious but in severe pain after motorcycle accident",
  "Person collapsed on the ground, not responding to voice or touch, breathing seems shallow",
  "Child is dizzy and confused after playing in extreme heat, skin is hot and dry",
  "Adult has red swollen burn on right hand from touching hot stove, no blisters visible",
  "Person complaining of severe chest pain and difficulty breathing, sweating profusely",
];

interface Props {
  onResult: (text: string) => void;
}

export function VoiceInput({ onResult }: Props) {
  const [recording, setRecording] = useState(false);
  const [waveformBars] = useState(() => Array.from({ length: 16 }, () => Math.random()));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(() => {
    setRecording(true);
    const duration = 1500 + Math.random() * 1500;
    timerRef.current = setTimeout(() => {
      setRecording(false);
      const transcript = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
      onResult(transcript);
    }, duration);
  }, [onResult]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRecording(false);
    const transcript = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)];
    onResult(transcript);
  }, [onResult]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <motion.button
        className={`voice-btn ${recording ? "recording" : ""}`}
        onClick={recording ? stopRecording : startRecording}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={recording ? "Stop recording" : "Start voice input (simulated)"}
        type="button"
      >
        {recording ? "⏹" : "🎙️"}
      </motion.button>

      <AnimatePresence>
        {recording && (
          <motion.div
            className="waveform-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 32 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {waveformBars.map((delay, i) => (
              <div
                key={i}
                className="waveform-bar"
                style={{
                  animationDelay: `${delay * 0.4}s`,
                  animationDuration: `${0.5 + delay * 0.5}s`,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", textAlign: "center" }}>
        {recording ? "Listening..." : "Voice"}
      </span>
    </div>
  );
}
