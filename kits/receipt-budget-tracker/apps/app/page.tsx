import Dashboard from "@/components/Dashboard";

export default async function Home() {
  return (
    <main className="flex-1 bg-slate-950 text-slate-100 min-h-screen">
      <Dashboard />
    </main>
  );
}
