'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [showEco, setShowEco] = useState(false);
  const [showSkin, setShowSkin] = useState(false);
  const [showNeg, setShowNeg] = useState(false);

  const analyze = async () => {
    if (!url) return;

    setLoading(true);
    setData(null);
    setShowEco(false);
    setShowSkin(false);
    setShowNeg(false);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await res.json();
      setData(result);
    } catch {
      setData({ note: 'Something went wrong' });
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#e9e4d1] px-6 py-8 flex flex-col items-center">
      
      
      <div className="mb-16">
        <img
          className="w-60 h-auto border-[#587c47] border-2 rounded-xl"
          src="/logo.png"
          alt="fablens-logo"
        />
      </div>

      <p className="text-gray-600 mb-8 text-center">
        paste in the input, the URL of the clothing product and see how good a friend it is of your skin and the planet
      </p>

      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full max-w-3xl border border-gray-300 bg-white rounded-lg px-4 py-3 text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-[#587c47]"
      />

      <button
        onClick={analyze}
        disabled={loading}
        style={{ backgroundColor: '#587c47' }}
        className="w-100 max-w-xl text-white py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 cursor-pointer text-lg"
      >
        {loading ? 'analyzing...' : 'analyze'}
      </button>

      
      {data && (
        <div className="mt-10 w-full max-w-2xl bg-white/70 p-6 rounded-xl shadow space-y-6">

          
          {data.materials?.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2 text-lg">Materials</h2>
              <ul className="list-disc pl-5 text-gray-700">
                {data.materials.map((m: string, i: number) => (
                  <li key={i} className="capitalize">{m}</li>
                ))}
              </ul>
            </div>
          )}

          
          {data.ecoScore !== undefined && (
            <div>
              <p className="font-medium text-lg">🌱 Eco Friendly: {data.ecoScore}%</p>

              {data.ecoScore > 0 && data.ecoReasons?.length > 0 && (
                <button
                  onClick={() => setShowEco(!showEco)}
                  className="text-blue-600 text-sm mt-1 cursor-pointer hover:underline"
                >
                  {showEco ? 'Hide details' : 'Learn more'}
                </button>
              )}

              {showEco && (
                <ul className="text-sm mt-2 text-gray-600 space-y-1">
                  {data.ecoReasons.map((r: string, i: number) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          
          {data.skinScore !== undefined && (
            <div>
              <p className="font-medium text-lg">🧴 Skin Friendly: {data.skinScore}%</p>

              {data.skinScore > 0 && data.skinReasons?.length > 0 && (
                <button
                  onClick={() => setShowSkin(!showSkin)}
                  className="text-blue-600 text-sm mt-1 cursor-pointer hover:underline"
                >
                  {showSkin ? 'Hide details' : 'Learn more'}
                </button>
              )}

              {showSkin && (
                <ul className="text-sm mt-2 text-gray-600 space-y-1">
                  {data.skinReasons.map((r: string, i: number) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          
          {data.negatives?.length > 0 && (
            <div>
              <button
                onClick={() => setShowNeg(!showNeg)}
                className="text-red-600 text-sm cursor-pointer hover:underline"
              >
                {showNeg ? 'Hide negatives' : 'Show negatives'}
              </button>

              {showNeg && (
                <ul className="text-sm mt-2 text-red-500 space-y-1">
                  {data.negatives.map((n: string, i: number) => (
                    <li key={i}>• {n}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          
          {data.note && (
            <p className="text-gray-500 text-sm">{data.note}</p>
          )}
        </div>
      )}
    </main>
  );
}