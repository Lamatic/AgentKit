import TripForm from '@/components/TripForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-b from-background via-[#1a1938] to-background flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <p className="font-display text-coral text-4xl tracking-wide mb-2">Chaos ✨ Trip Planner</p>
          <h1 className="font-display text-2xl sm:text-2xl font-medium leading-tight">
            Smart trips. <span className="text-coral">Real data.</span>
          </h1>
          <p className="text-ink/70 mt-4 text-base">
            We use live weather and real places to plan trips that actually make sense.
          </p>
        </div>
        <TripForm />
      </div>
    </main>
  );
}