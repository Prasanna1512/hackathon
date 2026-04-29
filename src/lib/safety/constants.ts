export const SAFETY_DISCLAIMER =
  "FieldMedic AI is not a doctor and does not diagnose. It provides first-response guidance and triage support only. For serious symptoms, contact emergency services immediately.";

export const RED_FLAG_KEYWORDS = [
  "not breathing", "unconscious", "severe bleeding", "heavy bleeding",
  "chest pain", "stroke", "anaphylaxis", "major burn", "spine injury",
  "seizure", "head injury", "blue lips", "poison", "suicidal", "self-harm",
  "pregnancy emergency", "choking", "drowning", "cardiac arrest",
  "unresponsive", "severe allergic", "collapsed", "no pulse"
];

export const CRITICAL_SYMPTOMS_MAP: Record<string, string> = {
  "not breathing": "Person is not breathing — possible respiratory/cardiac arrest",
  "unconscious": "Person is unconscious — airway may be compromised",
  "heavy bleeding": "Heavy/uncontrolled bleeding — risk of shock",
  "chest pain": "Chest pain — possible cardiac event",
  "stroke": "Stroke-like symptoms — time-critical emergency",
  "seizure": "Active seizure — protect from injury",
  "poison": "Possible poisoning — contact poison control/emergency",
  "anaphylaxis": "Severe allergic reaction — airway risk",
  "choking": "Choking — airway obstruction",
  "blue lips": "Cyanosis (blue lips) — inadequate oxygenation",
  "suicidal": "Suicidal/self-harm risk — immediate crisis support needed",
  "self-harm": "Self-harm concern — stay with person, remove dangers",
  "no pulse": "No detectable pulse — possible cardiac arrest",
  "collapsed": "Person found collapsed — unknown cause, treat as critical",
};

export const BURN_DONTS = [
  "Do NOT apply ice directly to the burn — it can cause further tissue damage.",
  "Do NOT burst blisters.",
  "Do NOT apply butter, toothpaste, or home remedies to the burn.",
  "Do NOT remove clothing stuck to the burn.",
];

export const BLEEDING_DONTS = [
  "Do NOT remove embedded objects from the wound.",
  "Do NOT apply a tourniquet unless trained and bleeding is life-threatening.",
  "Do NOT keep lifting the dressing to check — maintain pressure.",
];

export const SPINE_DONTS = [
  "Do NOT move the person unless there is immediate danger (fire, flood).",
  "Do NOT twist the head or body.",
  "Do NOT attempt to straighten the spine or limbs.",
];

export const FRACTURE_DONTS = [
  "Do NOT attempt to reset or realign a broken bone.",
  "Do NOT force the person to move the injured limb.",
  "Do NOT apply heat to a suspected fracture.",
];

export const SEIZURE_DONTS = [
  "Do NOT put anything in the person's mouth during a seizure.",
  "Do NOT restrain the person.",
  "Do NOT give food or drink until fully recovered.",
];

export const UNIVERSAL_DONTS = [
  "Do NOT delay calling emergency services if symptoms worsen.",
  "Do NOT give food or drink to an unconscious person.",
  "Do NOT leave an unconscious person alone face-up (risk of choking).",
  "Do NOT attempt any procedure you are not trained for.",
];

export const PRIORITY_COLORS: Record<string, string> = {
  "P1 Immediate": "#dc2626",
  "P2 Urgent": "#ea580c",
  "P3 Delayed": "#ca8a04",
  "P4 Minor": "#16a34a",
  "Unknown": "#6b7280",
};

export const RISK_COLORS: Record<string, string> = {
  "Critical": "#dc2626",
  "High": "#ea580c",
  "Medium": "#ca8a04",
  "Low": "#16a34a",
  "Unknown": "#6b7280",
};
