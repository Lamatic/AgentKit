"use client";

export default function BackgroundDecoration() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none">
      {/* Top yellow glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-primary-200/40 via-primary-100/20 to-transparent blur-3xl" />

      {/* Floating orbs */}
      <div className="absolute top-20 left-[10%] w-64 h-64 bg-primary-300/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute top-40 right-[10%] w-48 h-48 bg-primary-400/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-20 left-[20%] w-56 h-56 bg-primary-200/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle, #854D0E 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
