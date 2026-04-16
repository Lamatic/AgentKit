//import type { DayPlan } from "./PlannerForm";

export default function DayCard({ day }: { day: any }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-cyan-300">Day {day.day}</p>
          <h4 className="text-xl font-semibold">{day.title}</h4>
        </div>

        <div className="rounded-2xl bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <span className="font-medium">Estimated cost:</span>{" "}
          {day.estimated_day_cost}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#0c1b33] p-4">
          <h5 className="mb-2 font-semibold text-cyan-300">Morning</h5>
          <p className="text-sm text-white/80">{day.morning}</p>
        </div>

        <div className="rounded-2xl bg-[#0c1b33] p-4">
          <h5 className="mb-2 font-semibold text-cyan-300">Afternoon</h5>
          <p className="text-sm text-white/80">{day.afternoon}</p>
        </div>

        <div className="rounded-2xl bg-[#0c1b33] p-4">
          <h5 className="mb-2 font-semibold text-cyan-300">Evening</h5>
          <p className="text-sm text-white/80">{day.evening}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h5 className="mb-2 font-semibold">Food Recommendation</h5>
          <p className="text-sm text-white/75">{day.food_recommendation}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h5 className="mb-2 font-semibold">Stay Suggestion</h5>
          <p className="text-sm text-white/75">{day.stay_suggestion}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h5 className="mb-2 font-semibold">Notes</h5>
          <p className="text-sm text-white/75">{day.notes}</p>
        </div>
      </div>
    </div>
  );
}