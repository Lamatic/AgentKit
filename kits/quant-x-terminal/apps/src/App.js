import React, { useState, useEffect } from 'react';
import LiveChart from './LiveChart';
import StrategyConsole from './StrategyConsole';
import GreeksCalculator from './GreeksCalculator';
import HistoryLog from './HistoryLog';

const DEFAULT_VIRTUAL_BALANCE = 100000;

/**
 * Main Application Component for the Quant-X Options Strategy Engine.
 * Manages strategy workflow executions, state for tabs, and simulated paper trading.
 * @component
 */
function App() {
  const [currentTab, setCurrentTab] = useState('terminal'); 
  const [marketOutlook, setMarketOutlook] = useState('');
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTicker, setActiveTicker] = useState('AMEX:SPY');
  const [history, setHistory] = useState([]);

  const [virtualBalance, setVirtualBalance] = useState(DEFAULT_VIRTUAL_BALANCE); 
  const [openPositions, setOpenPositions] = useState([]);
  const [tradeQuantity, setTradeQuantity] = useState(10);
  const [selectedOrderType, setSelectedOrderType] = useState('CALL');

  /**
   * Safe initialization effect hook.
   * Loads historical data and balances from LocalStorage with fallback protection.
   */
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('quantx_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to parse local history:", e);
      setHistory([]);
    }

    try {
      const savedPositions = localStorage.getItem('quantx_positions');
      if (savedPositions) {
        setOpenPositions(JSON.parse(savedPositions));
      }
    } catch (e) {
      console.error("Failed to parse local positions:", e);
      setOpenPositions([]);
    }

    try {
      const savedBalance = localStorage.getItem('quantx_balance');
      if (savedBalance) {
        setVirtualBalance(Number(savedBalance));
      }
    } catch (e) {
      console.error("Failed to parse local balance:", e);
      setVirtualBalance(DEFAULT_VIRTUAL_BALANCE);
    }
  }, []);

  const scenarios = [
    { label: "🐂 Aggressive Index Bullish", text: "Highly bullish on major market indices for this week's expiry. Maximize gains using a defined-risk vertical strategy.", ticker: "AMEX:SPY" },
    { label: "🐻 Tech Earnings Bearish", text: "Bearish on Apple (AAPL) post-earnings due to surging implied volatility. Provide a protective spread setup.", ticker: "NASDAQ:AAPL" },
    { label: "⚡ Crypto Volatility Hedge", text: "Market outlook is showing explosive breakout momentum. Give me an aggressive long straddle setup.", ticker: "BINANCE:BTCUSDT" }
  ];

  /**
   * Executes the options workflow query via the Lamatic Edge node.
   * Reads target credentials securely via environment variables.
   * @async
   * @returns {Promise<void>}
   */
  const generateStrategy = async () => {
    if (!marketOutlook.trim()) return;
    
    setLoading(true);
    setError('');
    setStrategy('');

    const query = `
      query ExecuteWorkflow($workflowId: String!, $message: String) {
        executeWorkflow(workflowId: $workflowId, payload: { message: $message }) {
          status
          result
        }
      }
    `;

    const variables = {
      workflowId: "6d880d52-5571-4d64-9988-eb43391ee738",
      message: marketOutlook
    };

    const lamaticApiKey = process.env.REACT_APP_LAMATIC_API_KEY;
    const lamaticProjectId = process.env.REACT_APP_LAMATIC_PROJECT_ID;

    try {
      const response = await fetch("https://gowthaamsorganization383-fostrategyassistant720.lamatic.dev", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lamaticApiKey}`,
          "x-project-id": lamaticProjectId
        },
        body: JSON.stringify({ query, variables })
      });

      const jsonResponse = await response.json();
      
      if (jsonResponse.data && jsonResponse.data.executeWorkflow.status === "success") {
        const generatedResult = jsonResponse.data.executeWorkflow.result.strategy;
        setStrategy(generatedResult);

        const newLog = {
          ticker: activeTicker,
          prompt: marketOutlook,
          output: generatedResult,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedHistory = [newLog, ...history].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem('quantx_history', JSON.stringify(updatedHistory));
      } else {
        setError("Execution engine returned an invalid response structure.");
      }
    } catch (err) {
      setError("System failed to establish connection to Lamatic Edge Cluster.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Simulates derivatives buy orders and resets local virtual balances.
   * Prevents infinite loop, negative balance, and fractional balance exploits.
   * @param {'BUY'|'RESET'} action - Operation to execute.
   */
  const handleExecutePaperTrade = (action) => {
    if (action === 'BUY') {
      // Security Check: Guard against invalid, fractional, negative, or zero values
      const targetQty = Math.floor(Number(tradeQuantity));
      if (isNaN(targetQty) || targetQty <= 0) {
        alert("Action Aborted: You must input a valid positive integer quantity of 1 or more.");
        return;
      }

      const assetName = activeTicker.split(':')[1] || activeTicker;
      const estimatedPrice = assetName === 'BTCUSDT' ? 63000 : assetName === 'AAPL' ? 180 : 520; 
      const totalCost = estimatedPrice * targetQty * 0.15; 

      if (totalCost > virtualBalance) {
        alert("Insufficient virtual capital to execute this derivatives contract position.");
        return;
      }

      const newPosition = {
        ticker: assetName,
        type: selectedOrderType,
        qty: targetQty,
        entryPrice: estimatedPrice,
        timestamp: new Date().toLocaleTimeString()
      };
      const updatedPositions = [newPosition, ...openPositions];
      setOpenPositions(updatedPositions);
      const newBalance = virtualBalance - totalCost;
      setVirtualBalance(newBalance);
      localStorage.setItem('quantx_positions', JSON.stringify(updatedPositions));
      localStorage.setItem('quantx_balance', newBalance.toString());
    } else {
      setOpenPositions([]);
      setVirtualBalance(DEFAULT_VIRTUAL_BALANCE);
      localStorage.setItem('quantx_positions', JSON.stringify([]));
      localStorage.setItem('quantx_balance', DEFAULT_VIRTUAL_BALANCE.toString());
    }
  };

  return (
    <div style={{ backgroundColor: '#070a0f', minHeight: '100vh', padding: '30px 20px', color: '#c9d1d9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f242c', paddingBottom: '20px', marginBottom: '25px' }}>
          <div>
            <h1 style={{ color: '#f0f6fc', margin: '0 0 5px 0', fontSize: '26px', fontWeight: 700 }}>
              <span style={{ color: '#238636' }}>●</span> QUANT-X MULTI-ZONE ENGINE v3.0
            </h1>
            <p style={{ color: '#8b949e', margin: 0, fontSize: '14px' }}>AI-Driven Options Strategy Environment & Virtual Paper Trading Simulator</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', backgroundColor: '#12161f', padding: '5px', borderRadius: '8px', border: '1px solid #21262d' }}>
            <button 
              onClick={() => setCurrentTab('terminal')}
              style={{ padding: '8px 16px', backgroundColor: currentTab === 'terminal' ? '#238636' : 'transparent', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              📈 Strategy Terminal Dashboard
            </button>
            <button 
              onClick={() => setCurrentTab('papertrading')}
              style={{ padding: '8px 16px', backgroundColor: currentTab === 'papertrading' ? '#238636' : 'transparent', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              💼 Virtual Paper Trading Floor ({openPositions.length})
            </button>
          </div>
        </div>

        {currentTab === 'terminal' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '25px', alignItems: 'start' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <LiveChart activeTicker={activeTicker} onTickerSearch={(ticker) => setActiveTicker(ticker)} />
              <GreeksCalculator />
              <HistoryLog history={history} onSelectHistoryItem={(item) => { setMarketOutlook(item.prompt); setActiveTicker(item.ticker); setStrategy(item.output); }} onClearHistory={() => { setHistory([]); localStorage.removeItem('quantx_history'); }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <StrategyConsole 
                marketOutlook={marketOutlook} 
                setMarketOutlook={setMarketOutlook} 
                loading={loading} 
                generateStrategy={generateStrategy} 
                scenarios={scenarios} 
                setActiveTicker={setActiveTicker} 
              />

              <div style={{ backgroundColor: '#12161f', padding: '25px', borderRadius: '12px', border: '1px solid #21262d' }}>
                <h3 style={{ color: '#f0f6fc', marginTop: 0, fontSize: '14px', borderBottom: '1px solid #21262d', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🚀 LIVE SIMULATED ORDER COMPASS</span>
                  <span style={{ color: '#7ee787' }}>Balance: ${virtualBalance.toLocaleString()}</span>
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px', marginBottom: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '5px' }}>Derivative Type</label>
                    <select value={selectedOrderType} onChange={(e) => setSelectedOrderType(e.target.value)} style={{ width: '100%', backgroundColor: '#070a0f', border: '1px solid #30363d', borderRadius: '6px', padding: '8px', color: '#fff', outline: 'none' }}>
                      <option value="CALL">Long Call (Bullish Spread Leg)</option>
                      <option value="PUT">Long Put (Bearish Protection Leg)</option>
                      <option value="STRADDLE">Volatility Straddle Combination</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#8b949e', marginBottom: '5px' }}>Contracts (Lots)</label>
                    {/* Added min="1" attribute and value sanitizer */}
                    <input 
                      type="number" 
                      min="1" 
                      step="1"
                      value={tradeQuantity} 
                      onChange={(e) => setTradeQuantity(Math.max(1, Math.floor(Number(e.target.value))))} 
                      style={{ width: '100%', backgroundColor: '#070a0f', border: '1px solid #30363d', borderRadius: '6px', padding: '8px', color: '#fff', outline: 'none' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleExecutePaperTrade('BUY')} style={{ flex: 1, backgroundColor: '#238636', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Deploy Sandbox Position
                  </button>
                  <button onClick={() => handleExecutePaperTrade('RESET')} style={{ backgroundColor: '#21262d', border: '1px solid #f85149', color: '#ff7b72', padding: '12px', borderRadius: '6px', cursor: 'pointer' }}>
                    Reset Account
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#8b949e', margin: '10px 0 0 0', textAlign: 'center' }}>Positions automatically log into your dedicated Virtual Trading Floor page.</p>
              </div>

              {error && (
                <div style={{ backgroundColor: 'rgba(248,81,73,0.1)', border: '1px solid #f85149', color: '#ff7b72', padding: '15px', borderRadius: '8px', fontSize: '14px' }}>
                  🛑 <strong>Engine Fault:</strong> {error}
                </div>
              )}

              {strategy && (
                <div style={{ backgroundColor: '#12161f', borderRadius: '12px', border: '1px solid #21262d', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#161b22', padding: '14px 20px', borderBottom: '1px solid #21262d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#f0f6fc' }}>📈 OUTPUT CODES MATRIX</span>
                  </div>
                  <div style={{ padding: '25px', whiteSpace: 'pre-wrap', lineHeight: '1.7', color: '#e6edf3', fontSize: '14px', maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace' }}>
                    {strategy}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'papertrading' && (
          <div style={{ backgroundColor: '#12161f', borderRadius: '12px', border: '1px solid #21262d', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d', paddingBottom: '15px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: '#f0f6fc', margin: '0 0 5px 0' }}>💼 LIVE SIMULATED PERFORMANCE FLOOR</h2>
                <p style={{ color: '#8b949e', margin: 0, fontSize: '14px' }}>Monitor your paper risk profiles, active execution positions, and performance matrix.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#8b949e' }}>VIRTUAL CAPITAL LIQUIDITY</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7ee787' }}>${virtualBalance.toLocaleString()} USD</div>
              </div>
            </div>

            <h3 style={{ color: '#f0f6fc', fontSize: '16px', marginBottom: '15px' }}>📜 Active Derivatives Positions Ledger</h3>
            
            {openPositions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8b949e', backgroundColor: '#070a0f', borderRadius: '8px', border: '1px dashed #30363d' }}>
                No active positions loaded in this session. Head back to the Strategy Terminal, compute an AI structure, and tap "Deploy Sandbox Position" to log data here.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #21262d', color: '#8b949e', fontSize: '13px' }}>
                    <th style={{ padding: '12px' }}>UNDERLYING</th>
                    <th style={{ padding: '12px' }}>DERIVATIVE TYPE</th>
                    <th style={{ padding: '12px' }}>QUANTITY (LOTS)</th>
                    <th style={{ padding: '12px' }}>ENTRY REFERENCE PRICE</th>
                    <th style={{ padding: '12px', color: '#8b949e' }}>EXECUTION TIMESTAMP</th>
                    <th style={{ padding: '12px', color: '#7ee787' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {openPositions.map((pos, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #21262d', fontSize: '14px', backgroundColor: idx % 2 === 0 ? '#161b22' : 'transparent' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#58a6ff' }}>{pos.ticker}</td>
                      <td style={{ padding: '12px' }}><span style={{ backgroundColor: '#070a0f', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #30363d' }}>{pos.type}</span></td>
                      <td style={{ padding: '12px' }}>{pos.qty} Lots</td>
                      <td style={{ padding: '12px' }}>${pos.entryPrice}</td>
                      <td style={{ padding: '12px', color: '#8b949e' }}>{pos.timestamp}</td>
                      <td style={{ padding: '12px', color: '#7ee787', fontWeight: '500' }}>● ACTIVE LIVE RUN</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div style={{ 
          marginTop: '40px', 
          padding: '20px', 
          backgroundColor: '#12161f', 
          borderRadius: '8px', 
          border: '1px solid #21262d', 
          textAlign: 'center' 
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '11px', 
            color: '#8b949e', 
            letterSpacing: '0.8px', 
            lineHeight: '1.8',
            textTransform: 'uppercase' 
          }}>
            ⚠️ <strong style={{ color: '#ff7b72' }}>Simulated Risk Warning:</strong> Quantitative scenarios, algorithmic playbooks, and paper positions are subject to extensive theoretical modeling constraints. Past sandbox performance does not guarantee real-world market success. Read all generated matrix documentations carefully before executing simulated portfolio deployments.
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#58a6ff' }}>
            QUANT-X TERMINAL v3.0 // SECURE ACADEMIC SIMULATION NODE
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;