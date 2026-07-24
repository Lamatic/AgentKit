import React, { useState } from 'react';

function LiveChart({ activeTicker, onTickerSearch }) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    
    // Auto-format common entries (e.g., TSLA to NASDAQ:TSLA, NIFTY to NSE:NIFTY)
    let formattedTicker = searchInput.toUpperCase().trim();
    if (!formattedTicker.includes(':')) {
      if (formattedTicker === 'NIFTY') formattedTicker = 'NSE:NIFTY';
      else if (formattedTicker === 'BTC' || formattedTicker === 'BTCUSD') formattedTicker = 'BINANCE:BTCUSDT';
      else formattedTicker = `NASDAQ:${formattedTicker}`;
    }
    
    onTickerSearch(formattedTicker);
    setSearchInput('');
  };

  return (
    <div style={{ backgroundColor: '#12161f', borderRadius: '12px', border: '1px solid #21262d', padding: '15px', height: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ color: '#f0f6fc', fontSize: '14px', fontWeight: '600' }}>📊 REAL-TIME INTERACTIVE FEED</span>
        
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Search Ticker (e.g. NVDA, TSLA, NSE:NIFTY)" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ backgroundColor: '#070a0f', border: '1px solid #30363d', borderRadius: '6px', padding: '6px 12px', color: '#e6edf3', fontSize: '12px', outline: 'none', width: '220px' }}
          />
          <button type="submit" style={{ backgroundColor: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>
            Go
          </button>
        </form>
      </div>
      
      <iframe
        title="TradingView Live Chart"
       
        src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(activeTicker)}&interval=D&theme=dark&style=1&timezone=exchange&studies=%5B%5D&showpopupbutton=1&withdateranges=1&hideideas=1`}
        style={{ width: '100%', height: '88%', border: 'none', borderRadius: '8px' }}
      />
    </div>
  );
}

export default LiveChart;