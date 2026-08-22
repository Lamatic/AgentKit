import React, { useState } from 'react';

function HistoryItem({ item, onSelectHistoryItem }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const activeBorderColor = isHovered || isFocused ? '#58a6ff' : '#30363d';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectHistoryItem(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectHistoryItem(item);
        }
      }}
      style={{
        backgroundColor: '#161b22',
        border: `1px solid ${activeBorderColor}`,
        borderRadius: '6px',
        padding: '10px',
        cursor: 'pointer',
        fontSize: '12px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#58a6ff', fontWeight: 'bold', marginBottom: '4px' }}>
        <span>{item.ticker.split(':')[1] || item.ticker}</span>
        <span style={{ color: '#8b949e', fontSize: '10px', fontWeight: 'normal' }}>{item.time}</span>
      </div>
      <div style={{ color: '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.prompt}
      </div>
    </div>
  );
}

function HistoryLog({ history, onSelectHistoryItem, onClearHistory }) {
  return (
    <div style={{ backgroundColor: '#12161f', borderRadius: '12px', border: '1px solid #21262d', padding: '20px', maxHeight: '350px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #21262d', paddingBottom: '10px' }}>
        <h3 style={{ color: '#f0f6fc', margin: 0, fontSize: '14px', letterSpacing: '0.5px' }}>📜 HISTORICAL SIMULATIONS</h3>
        {history.length > 0 && (
          <button onClick={onClearHistory} style={{ background: 'none', border: 'none', color: '#ff7b72', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
            Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ color: '#8b949e', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No local simulation records found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.map((item, idx) => {
            const uniqueKey = item.id || `${item.ticker}-${item.time}-${idx}`;
            return (
              <HistoryItem
                key={uniqueKey}
                item={item}
                onSelectHistoryItem={onSelectHistoryItem}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HistoryLog;