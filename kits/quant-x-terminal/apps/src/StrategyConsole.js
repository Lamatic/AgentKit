import React from 'react';

function StrategyConsole({ marketOutlook, setMarketOutlook, loading, generateStrategy, scenarios, setActiveTicker }) {
  return (
    <div style={{ backgroundColor: '#12161f', padding: '25px', borderRadius: '12px', border: '1px solid #21262d' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#f0f6fc', marginBottom: '12px' }}>
        Select Preset Parameter or Write Custom Posture:
      </label>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
        {scenarios.map((scen, idx) => (
          <button
            key={idx}
            onClick={() => {
              setMarketOutlook(scen.text);
              setActiveTicker(scen.ticker);
            }}
            style={{ padding: '8px 14px', backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '20px', color: '#c9d1d9', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
          >
            {scen.label}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Type your strategic market posture here..."
        value={marketOutlook}
        onChange={(e) => setMarketOutlook(e.target.value)}
        rows={4}
        style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '8px', backgroundColor: '#070a0f', border: '1px solid #21262d', color: '#e6edf3', boxSizing: 'border-box', marginBottom: '15px', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: '1.5' }}
      />
      
      <button 
        onClick={generateStrategy} 
        disabled={loading}
        style={{ padding: '14px 24px', backgroundColor: loading ? '#21262d' : '#238636', color: loading ? '#8b949e' : '#ffffff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '600', width: '100%', boxShadow: '0 4px 12px rgba(35,134,54,0.2)' }}
      >
        {loading ? "🔄 COMPUTING RISK MATRICES & LEGS..." : "⚡ RUN DERIVATIVE STRATEGY SIMULATION"}
      </button>
    </div>
  );
}

export default StrategyConsole;