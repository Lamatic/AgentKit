import PlannerForm from "@/components/PlannerForm";
import FloatingChatbot from "@/components/FloatingChatbot";

export default function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-badge">Agentic AI Travel Platform</div>

        <h1 className="hero-title">Smart Travel Planner</h1>

        <p className="hero-subtitle">
          Plan complete trips using AI. Enter your destination, number of days,
          budget, and travel style to generate a structured itinerary with local
          highlights, food, culture, tips, and day-wise planning.
        </p>

        <PlannerForm />
      </section>

      <FloatingChatbot />
    </main>
  );
}