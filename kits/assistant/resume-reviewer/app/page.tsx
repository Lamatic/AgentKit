'use client';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID;
    const FLOW_ID = process.env.NEXT_PUBLIC_FLOW_ID;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const existingScript = document.querySelector(
      `script[src*="widget.lamatic.ai"]`
    );
    if (existingScript) return;

    const root = document.getElementById('lamatic-chat-root');
    if (root) {
      root.dataset.apiUrl = API_URL;
      root.dataset.flowId = FLOW_ID;
      root.dataset.projectId = PROJECT_ID;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = `https://widget.lamatic.ai/chat-v2?projectId=${PROJECT_ID}`;
    document.body.appendChild(script);

 return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };

  }, []);

  return (
    <main className="min-h-screen bg-[#0f1117] text-white">
      {/* Navbar */}
      <nav className="w-full px-8 py-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">📄</span>
          <span className="font-bold text-lg tracking-tight">ResumeAI</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#how" className="hover:text-white transition">How it works</a>
          <a href="#features" className="hover:text-white transition">Features</a>
       
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 flex flex-col lg:flex-row items-center gap-16">
        {/* Left */}
        <div className="flex-1">
          <span className="inline-flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
            AI-Powered Resume Review
          </span>

          <h1 className="text-5xl font-extrabold leading-tight mb-5">
            Land Your Dream Job <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              With a Stronger Resume
            </span>
          </h1>

          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Get resume feedback in seconds. Our AI reviews your resume like a senior HR professional identifying strengths, gaps, and exactly what to fix.
          </p>

          <div className="flex flex-wrap gap-3 mb-10" id="features">
            {[
              { icon: '✅', label: 'Strengths Analysis' },
              { icon: '❌', label: 'Weakness Detection' },
              { icon: '💡', label: 'Actionable Tips' },
              { icon: '⭐', label: 'Score out of 10' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300">
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div id="how" className="bg-gray-800/40 border border-gray-700 rounded-2xl p-6">
            <p className="text-sm font-semibold text-gray-300 mb-4">How it works</p>
            <div className="flex flex-col gap-3">
              {[
                { step: '1', text: 'Click the chat button on the bottom right' },
                { step: '2', text: 'Paste your resume text in the chat' },
                { step: '3', text: 'Get detailed AI feedback instantly' },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {s.step}
                  </span>
                  {s.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Stats */}
        <div className="flex-1 grid grid-cols-2 gap-4 w-full max-w-sm">
          {[
            { value: '10+', label: 'Years HR Experience Simulated' },
            { value: '< 30s', label: 'Average Review Time' },
            { value: '4', label: 'Feedback Categories' },
            { value: '100%', label: 'Free to Use' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 flex flex-col gap-1">
              <span className="text-3xl font-extrabold text-white">{s.value}</span>
              <span className="text-xs text-gray-500 leading-snug">{s.label}</span>
            </div>
          ))}

          <div className="col-span-2 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 rounded-2xl p-6">
            <p className="text-sm text-blue-300 font-medium mb-2">💬 Try it now</p>
            <p className="text-gray-400 text-sm">
              Click the <span className="text-white font-semibold">chat button</span> on the bottom right corner and paste your resume to get started!
            </p>
          </div>
        </div>
      </section>
      {/* Lamatic Widget */}
      <div id="lamatic-chat-root"></div>
    </main>
  );
}