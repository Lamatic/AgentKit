import PRReviewForm from "@/components/PRReviewForm";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#0a0a0a",
        color: "#ffffff",
      }}
    >
      <PRReviewForm />
    </main>
  );
}
