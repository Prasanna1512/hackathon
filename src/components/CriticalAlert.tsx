"use client";
import { motion } from "framer-motion";

export function CriticalAlert() {
  return (
    <motion.div
      className="critical-banner"
      initial={{ opacity: 0, scaleY: 0.8 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <span className="critical-banner-icon">⚠️</span>
      <span className="critical-banner-text">
        CRITICAL CASE DETECTED — IMMEDIATE ACTION REQUIRED
      </span>
    </motion.div>
  );
}
