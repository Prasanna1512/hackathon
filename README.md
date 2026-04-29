# 🏥 FieldMedic AI

**AMD-Powered Multimodal Emergency Triage Agent**

> Emergency triage support before professional help arrives.

FieldMedic AI helps non-doctors make safer first-response decisions in low-resource environments — road accidents, schools, factories, rural areas, disaster camps, and public events.

⚠️ **FieldMedic AI is not a doctor and does not diagnose. It provides first-response guidance and triage support only. For serious symptoms, contact emergency services immediately.**

---

## Problem

When emergencies happen outside hospitals — at a roadside, school, factory, or disaster site — untrained bystanders must make critical decisions in minutes. Wrong actions (moving a spine injury, removing embedded objects, giving food to unconscious people) can cause permanent harm. Professional help may be minutes or hours away.

## Solution

FieldMedic AI provides:
- **Risk assessment** (Critical / High / Medium / Low)
- **Triage priority** (P1 Immediate → P4 Minor)
- **Safe first-response actions** in plain language
- **"Do NOT Do" warnings** to prevent harmful actions
- **Escalation guidance** adapted to available resources
- **Multi-person triage** for mass casualty scenarios
- **Doctor/ambulance handoff reports** for seamless transfer of care
- **Multimodal input** — text, vitals, images

## Why AMD

FieldMedic AI is architected for AMD Instinct MI300X GPUs via ROCm + vLLM:

- **Real-time multimodal inference** — analyze injury images + text symptoms simultaneously using vision-language models (Qwen2-VL, Llama Vision)
- **9-agent orchestration** — multiple AI agents run in parallel for comprehensive triage
- **192GB HBM3** on MI300X enables running large open-source models without quantization
- **ROCm + vLLM** provides production-grade serving with high throughput
- **Open-source models** — no vendor lock-in, deployable on AMD Developer Cloud

## Features

| Feature | Description |
|---------|-------------|
| Single Case Analysis | Full triage with vitals, symptoms, image upload |
| Multi-Person Triage | Rank multiple patients by urgency with P1–P4 priority board |
| 9-Agent Pipeline | Intake → Red Flags → Image → Triage → Actions → Safety → Escalation → Handoff → Verification |
| Handoff Reports | Structured markdown reports for doctor/ambulance handoff |
| Image Analysis | Multimodal injury photo analysis (placeholder for AMD cloud) |
| AMD Compute Panel | Live display of GPU, agents, tokens, latency metrics |
| Sample Scenarios | 5 built-in demo cases for instant testing |
| Safety Boundaries | Conservative escalation, no diagnosis, no medication |
| Export | Copy/download reports as markdown |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Next.js Frontend                │
│   Landing │ Single Case │ Multi-Triage │ Report  │
└──────────────────┬──────────────────────────────┘
                   │ API Routes
┌──────────────────┴──────────────────────────────┐
│              9-Agent Orchestrator                 │
│                                                  │
│  1. Intake Normalizer    6. Do-Not-Do Safety     │
│  2. Red Flag Detector    7. Escalation           │
│  3. Image Analyst        8. Handoff Report       │
│  4. Triage Priority      9. Verification         │
│  5. First Aid Actions                            │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│           AMD Provider Layer                     │
│   Demo Mode: Rule-based │ Cloud: ROCm + vLLM    │
│   Models: Qwen2-VL, Llama Vision, Mistral, Qwen │
│   GPU: AMD Instinct MI300X                       │
└─────────────────────────────────────────────────┘
```

## Agents

| # | Agent | Purpose |
|---|-------|---------|
| 1 | Intake Normalizer | Normalize input, extract context, detect missing info |
| 2 | Red Flag Detector | Detect life-threatening signs, upgrade risk level |
| 3 | Image Analyst | Non-diagnostic visual observations from uploaded photos |
| 4 | Triage Priority | Assign P1–P4 priority and risk level with reasoning |
| 5 | First Aid Actions | Generate safe, context-aware first-response steps |
| 6 | Do-Not-Do Safety | List harmful actions to avoid |
| 7 | Escalation | Determine emergency services, clinic, or monitoring path |
| 8 | Handoff Report | Generate structured doctor/ambulance summary |
| 9 | Verification | Check contradictions, list unknowns, add confidence notes |

## Safety Boundaries

- Never diagnoses diseases or conditions
- Never prescribes medication or dosage
- Never claims certainty from image analysis
- Always shows safety disclaimer
- Conservative escalation: when uncertain, upgrades risk
- Red flags (not breathing, unconscious, severe bleeding, chest pain, stroke, seizure, poisoning, self-harm) always trigger Critical/P1
- Self-harm: marks Critical, advises crisis support, never provides harmful details
- Uses cautious language: "possible concern", "seek urgent medical help", "confirm with clinician"

## Demo Scenarios

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Road accident — heavy leg bleeding, adult | Critical/P1 — pressure, emergency services |
| 2 | Kitchen burn — hand, adult | Medium/P3 — cool water, cover, no ice |
| 3 | School heatstroke — confused teen | High/P2 — cool body, urgent help |
| 4 | Unconscious person — breathing unknown | Critical/P1 — check breathing, emergency |
| 5 | Minor finger cut — controlled | Low/P4 — clean, cover, monitor |

## Local Setup

```bash
# Clone and install
git clone <repo-url>
cd fieldmedic-ai
npm install

# Run development server
npm run dev
# Open http://localhost:3000

# Build for production
npm run build
npm start
```

No external dependencies required for demo mode. All triage logic runs locally with deterministic rules.

## AMD Cloud Setup

To connect to AMD Instinct MI300X via ROCm + vLLM:

### 1. Deploy vLLM on AMD Developer Cloud

```bash
# On AMD GPU instance with ROCm
pip install vllm

# Serve a text model
vllm serve Qwen/Qwen2.5-7B-Instruct --host 0.0.0.0 --port 8000

# Serve a vision model (separate instance)
vllm serve Qwen/Qwen2-VL-7B-Instruct --host 0.0.0.0 --port 8001
```

### 2. Set Environment Variables

```bash
# In .env.local
AMD_VLLM_BASE_URL=http://your-amd-instance:8000
AMD_VLLM_API_KEY=your-api-key  # if needed
TEXT_MODEL_NAME=Qwen2.5-7B-Instruct
VISION_MODEL_NAME=Qwen2-VL-7B-Instruct
```

### 3. Run the App

```bash
npm run build
npm start
```

The app automatically detects `AMD_VLLM_BASE_URL` and switches from demo mode to AMD cloud inference.

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** Next.js API Routes
- **Triage Engine:** Deterministic rule-based with LLM-ready interfaces
- **AI Target:** AMD Instinct MI300X, ROCm, vLLM
- **Models:** Qwen2-VL-7B, Llama-3.2-Vision, Mistral-7B, Qwen2.5-7B

## Future Scope

- Voice input with Whisper transcription on AMD GPUs
- Real-time video triage from phone camera
- Offline PWA mode for disaster scenarios
- Multi-language support (translation pipeline)
- Integration with local emergency dispatch systems
- Training mode for first-aid education
- Wearable/IoT vital sign integration
- HIPAA-compliant deployment for healthcare organizations

## License

MIT
