# FieldMedic AI

## Problem
Bystanders and non-medical responders often face critical delays before professional help arrives, especially in low-resource settings.

## Solution
FieldMedic AI provides **safe first-response triage support** with deterministic multi-agent logic, escalation guidance, do-not-do warnings, and handoff-ready summaries.

## Why AMD
The app includes an AMD Compute Panel and pluggable provider interfaces for **AMD Instinct MI300X + ROCm + vLLM** hosted inference.

## Features
- Single Emergency Case analysis
- Multi-Person priority ranking board (P1–P4)
- Handoff Report copy/download
- Safety-first red flag detection
- Placeholder multimodal injury/scene observation
- Offline-friendly deterministic local mode

## Architecture
```mermaid
flowchart TD
A[UI Form] --> B[/api/analyze-case]
B --> C[Intake Normalizer]
C --> D[Red Flag Detector]
D --> E[Image/Scene Analyst]
E --> F[Triage Priority Agent]
F --> G[First Aid Action Agent]
G --> H[Do-Not-Do Safety Agent]
H --> I[Escalation Agent]
I --> J[Handoff Report Agent]
J --> K[Verification & Uncertainty Agent]
K --> L[Results + AMD Compute Panel]
```

## Agents
1. Intake Normalizer Agent
2. Red Flag Detector Agent
3. Injury/Scene Analyst Agent
4. Triage Priority Agent
5. First Aid Action Agent
6. Do-Not-Do Safety Agent
7. Escalation Agent
8. Handoff Report Agent
9. Verification & Uncertainty Agent

## Safety Boundaries
- No diagnosis, no prescriptions, no dosages.
- Conservative escalation when uncertain.
- Mandatory disclaimer on every result.

## Demo Scenarios
Use built-in sample cases from road accidents, burns, heat illness, unconscious person, and minor cuts.

## Local Setup
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## AMD Cloud Setup
Set env vars:
```bash
AMD_VLLM_BASE_URL=
AMD_VLLM_API_KEY=
TEXT_MODEL_NAME=Qwen2.5-7B-Instruct
VISION_MODEL_NAME=Qwen2-VL-7B-Instruct
```
Then wire `callTextModel` and `callVisionModel` to your ROCm/vLLM endpoint.

## Future Scope
- Regional language support
- Audio ingestion pipeline
- Device camera stream analysis
- EHR/ambulance integration
- Audit logs and governance controls

## Demo Script
1. Load sample case and click **Analyze Case**.
2. Show risk/priority/escalation/do-not-do cards.
3. Copy/download handoff report.
4. Switch to Multi-Person Triage and analyze all sample cases.
5. Highlight AMD compute panel + cloud-mode readiness.

## Screenshots
- `docs/screenshots/landing.png` (placeholder)
- `docs/screenshots/results.png` (placeholder)
