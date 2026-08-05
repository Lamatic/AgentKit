import type { AssessmentReport } from "./assessment";

export const SAMPLE_REPORT: AssessmentReport = {
  summary:
    "The rising temperature and sweet smell suggest a cooling-system leak that needs prompt inspection.",
  urgency: "urgent",
  stopDriving: false,
  confidence: "medium",
  safetyMessage:
    "Avoid long drives and stop safely if the temperature gauge rises again. Never open the cooling system while hot.",
  possibleCauses: [
    {
      cause: "External coolant leak",
      likelihood: "high",
      evidence: "Sweet smell after parking and a recent coolant top-up.",
    },
    {
      cause: "Cooling fan fault",
      likelihood: "medium",
      evidence: "The temperature rises mainly while the vehicle is stationary in traffic.",
    },
  ],
  clarifyingQuestions: [
    "Is there a colored puddle beneath the vehicle after parking?",
    "Does the cabin heater remain warm when the temperature rises?",
  ],
  inspectionPlan: [
    {
      priority: 1,
      action: "Check the coolant level only after the engine is fully cold.",
      performedBy: "owner",
      reason: "A low level supports the leak hypothesis and changes driving safety.",
    },
    {
      priority: 2,
      action: "Pressure-test the cooling system and inspect hoses, radiator, and water pump.",
      performedBy: "technician",
      reason: "This can locate an external leak without guessing or replacing parts blindly.",
    },
  ],
  ownerActions: [
    "Photograph any puddle without touching or tasting the fluid.",
    "Arrange a professional inspection within 24 hours.",
  ],
  mechanicBrief:
    "2018 Honda City, 74,000 km: temperature rises in traffic, sweet smell after parking, temperature warning appeared once, and coolant was topped up two weeks ago.",
  limitations:
    "This is a symptom-based triage report, not a confirmed diagnosis. A qualified technician must inspect the vehicle.",
};
