import type { AssessmentReport } from "./assessment";

export const SAMPLE_REPORT: AssessmentReport = {
  summary:
    "The rising temperature and sweet smell suggest a cooling-system leak that needs prompt inspection.",
  urgency: "stop_now",
  stopDriving: true,
  confidence: "medium",
  safetyMessage:
    "Keep the engine off and do not drive the vehicle. Arrange towing for immediate professional inspection, and never open the cooling system while hot.",
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
      action: "Keep the engine off and arrange transport to a repair facility.",
      performedBy: "owner",
      reason: "Driving an overheating vehicle can cause severe engine damage.",
    },
    {
      priority: 2,
      action: "Pressure-test the cooling system and inspect hoses, radiator, and water pump.",
      performedBy: "technician",
      reason: "This can locate an external leak without guessing or replacing parts blindly.",
    },
  ],
  ownerActions: [
    "Do not drive or restart the vehicle while an overheating condition is suspected.",
    "Arrange towing for immediate professional inspection.",
    "Photograph any puddle without touching or tasting the fluid.",
  ],
  mechanicBrief:
    "2018 Honda City, 74,000 km: temperature rises in traffic, sweet smell after parking, temperature warning appeared once, and coolant was topped up two weeks ago.",
  limitations:
    "This is a symptom-based triage report, not a confirmed diagnosis. A qualified technician must inspect the vehicle.",
};
