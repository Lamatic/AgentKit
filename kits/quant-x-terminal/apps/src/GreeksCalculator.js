import React, { useState } from 'react';

function GreeksCalculator() {
  const [underlyingPrice, setUnderlyingPrice] = useState(100);
  const [iv, setIv] = useState(20); // Implied Volatility %


  const delta = (0.5 + (underlyingPrice - 100) * 0.02).toFixed(2);
  const theta = (-0.05 * (iv / 20)).toFixed(3);
  const vega = (0.15 * (underlyingPrice / 100)).toFixed(2);

  return (
    <div style={{ backgroundColor: '#12161f', borderRadius: '12px', border: '1px solid #21262d', padding: '20px' }}>
      <h3 style={{ color: '#f0f6fc', marginTop: 0, fontSize: '14px', letterSpacing: '0.5px', borderBottom: '1px solid #21262d', paddingBottom: '10px' }}>
        🎛️ DERIVATIVES RISK PROFILE (GREEKS SIMULATOR)
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', marginTop: '15px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '5px' }}>Underlying Asset Price: ${underlyingPrice}</label>
          <input type="range" min="80" max="120" value={underlyingPrice} onChange={(e) => setUnderlyingPrice(Number(e.target.value))} style={{ width: '100%', accentColor: '#58a6ff' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '5px' }}>Implied Volatility (IV): {iv}%</label>
          <input type="range" min="10" max="100" value={iv} onChange={(e) => setIv(Number(e.target.value))} style={{ width: '100%', accentColor: '#7ee787' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ backgroundColor: '#161b22', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#8b949e' }}>Δ Delta (Direction)</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#58a6ff', marginTop: '4px' }}>{Math.min(Math.max(delta, 0), 1)}</div>
        </div>
        <div style={{ backgroundColor: '#161b22', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#8b949e' }}>θ Theta (Time Decay)</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff7b72', marginTop: '4px' }}>{theta} / day</div>
        </div>
        <div style={{ backgroundColor: '#161b22', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#8b949e' }}>ν Vega (Volatility)</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#7ee787', marginTop: '4px' }}>+{vega}</div>
        </div>
      </div>
    </div>
  );
}

export default GreeksCalculator;