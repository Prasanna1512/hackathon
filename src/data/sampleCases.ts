import { CaseInput } from "@/lib/schemas/types";

export const sampleSingleCases: CaseInput[] = [
  {
    label: "Road Accident — Heavy Bleeding",
    emergencyType: "road accident",
    ageGroup: "adult",
    symptoms: "Heavy leg bleeding after motorcycle crash, conscious but in severe pain, wound on left thigh",
    vitals: { consciousness: "alert", breathing: "normal", bleeding: "heavy", pain: 9 },
    resources: { ambulance: "delayed", nearbyClinic: "yes", firstAidKit: "yes", cleanWater: "yes", trainedResponder: "no", crowdedDisaster: "no" },
  },
  {
    label: "Kitchen Burn — Hand",
    emergencyType: "burn",
    ageGroup: "adult",
    symptoms: "Red painful burn on right hand from touching hot pan, skin red and swollen, no blisters yet",
    vitals: { consciousness: "alert", breathing: "normal", bleeding: "none", pain: 6 },
    resources: { ambulance: "unknown", nearbyClinic: "yes", firstAidKit: "yes", cleanWater: "yes", trainedResponder: "no", crowdedDisaster: "no" },
  },
  {
    label: "School Heatstroke — Teen",
    emergencyType: "heatstroke",
    ageGroup: "teen",
    symptoms: "Dizzy, confused, was playing outside in extreme heat, skin hot and dry, stopped sweating",
    vitals: { consciousness: "confused", breathing: "difficulty", bleeding: "none", pain: 3 },
    resources: { ambulance: "available", nearbyClinic: "yes", firstAidKit: "yes", cleanWater: "yes", trainedResponder: "yes", crowdedDisaster: "no" },
  },
  {
    label: "Unconscious Person — Unknown",
    emergencyType: "unconscious",
    ageGroup: "adult",
    symptoms: "Found collapsed on sidewalk, no response to voice or shaking, breathing status unclear",
    vitals: { consciousness: "unconscious", breathing: "unknown", bleeding: "unknown", pain: 0 },
    resources: { ambulance: "available", nearbyClinic: "unknown", firstAidKit: "yes", cleanWater: "unknown", trainedResponder: "yes", crowdedDisaster: "no" },
  },
  {
    label: "Minor Finger Cut",
    emergencyType: "bleeding",
    ageGroup: "adult",
    symptoms: "Small cut on index finger from kitchen knife, bleeding controlled with tissue, no deep wound",
    vitals: { consciousness: "alert", breathing: "normal", bleeding: "mild", pain: 2 },
    resources: { ambulance: "unknown", nearbyClinic: "yes", firstAidKit: "yes", cleanWater: "yes", trainedResponder: "no", crowdedDisaster: "no" },
  },
];
