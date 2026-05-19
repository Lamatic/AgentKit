import DayCard from "./DayCard";
import type { ItineraryData } from "./PlannerForm";


export default function ItineraryDisplay({ data }: { data: ItineraryData }) {
  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">{data.destination}</h2>
            <p className="mt-1 text-white/70">{data.country}</p>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            <p>
              <span className="font-semibold">Best time:</span>{" "}
              {data.best_time_to_visit}
            </p>
            <p>
              <span className="font-semibold">Estimated budget:</span>{" "}
              {data.estimated_budget}
            </p>
          </div>
        </div>

        <p className="mt-6 text-white/85">{data.introduction}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-2xl font-semibold">Top Highlights</h3>
          <div className="space-y-4">
            {data.highlights?.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <h4 className="font-semibold">{item.name}</h4>
                <p className="mt-1 text-sm text-white/75">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-2xl font-semibold">Local Food</h3>
          <div className="space-y-4">
            {data.food?.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <h4 className="font-semibold">{item.name}</h4>
                <p className="mt-1 text-sm text-white/75">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-2xl font-semibold">Culture</h3>
          <div className="space-y-3">
            {data.culture?.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-2xl font-semibold">Travel Tips</h3>
          <div className="space-y-3">
            {data.travel_tips?.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
        <h3 className="mb-6 text-2xl font-semibold">Day-wise Itinerary</h3>
        <div className="space-y-5">
          {data.days?.map((day) => (
            <DayCard key={day.day} day={day} />
          ))}
        </div>
      </div>
    </section>
  );
}