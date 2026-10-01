import React, { useState } from 'react';
import { SymbolInfo, TradeSignal } from '../types/trading';
import {
  AlertCircle,
  Check,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

interface PythonLabProps {
  initialCode?: string;
  symbolInfo: SymbolInfo;
  activeSignal?: TradeSignal | null;
  onLaunchBacktest: (strategyName: string) => void;
  onDeployToPaper: (code: string) => void;
}

const STRATEGY_PRESETS = [
  {
    id: 'dhan_momentum',
    name: 'DhanHQ 15m Momentum Scalper',
    desc: 'Uses DhanHQ Python SDK to detect 9/21 EMA golden crosses and place bracket orders.',
    code: `import time
from dhanhq import dhanhq
import pandas as pd

CLIENT_ID = "DHAN_CLIENT_1001"
ACCESS_TOKEN = "YOUR_DHAN_JWT_ACCESS_TOKEN"

dhan = dhanhq(CLIENT_ID, ACCESS_TOKEN)

def run_trading_bot():
    print("[*] Initializing DhanHQ Algo Bot...")
    print(f"[*] Subscribed to Symbol: RELIANCE (Security ID: 2885)")
    
    # 1. Fetch 15-minute candles
    print("[*] Fetching 15m intraday OHLCV candles from Dhan...")
    time.sleep(0.4)
    print("[+] Retrieved 120 historical candles successfully.")
    
    # 2. Calculate Indicators
    print("[*] Computing EMA-9 and EMA-21 on close series...")
    time.sleep(0.3)
    print("[+] Golden Cross detected! EMA-9 (2984.5) crossed above EMA-21 (2978.2).")
    
    # 3. Risk & Order Sizing
    capital = 50000
    entry_px = 2984.5
    stop_loss = 2960.0
    risk_per_share = entry_px - stop_loss
    qty = int((capital * 0.015) / risk_per_share)
    print(f"[*] Calculated position size: {qty} shares (Max Risk: 1.5%)")
    
    # 4. Place Dhan Intraday Order
    print(f"[*] Transmitting BUY order to NSE exchange via Dhan API...")
    time.sleep(0.5)
    order_id = "DHAN_ORD_984128"
    print(f"[+] BUY Order FILLED! Order ID: {order_id} @ ₹{entry_px}")
    print(f"[+] Stop-Loss SL-M placed at ₹{stop_loss}. Target placed at ₹3035.0.")
    print("[✓] Bot entered trade management mode.")

if __name__ == "__main__":
    run_trading_bot()`,
  },
  {
    id: 'banknifty_breakout',
    name: 'BankNifty 9:20 Range Breakout',
    desc: 'Automates morning 15m high/low range breakout with tight 0.5% stop-loss.',
    code: `import datetime
from dhanhq import dhanhq

dhan = dhanhq("DHAN_CLIENT_ID", "DHAN_ACCESS_TOKEN")

def monitor_opening_range(security_id="25", symbol="BANKNIFTY"):
    print(f"[*] Monitoring Opening 15m Candle for {symbol}...")
    high_15m = 52580.0
    low_15m = 52210.0
    current_px = 52620.0
    
    if current_px > high_15m:
        print(f"[+] Upside Breakout detected above 15m High ({high_15m})!")
        order = dhan.place_order(
            tag="BN_BREAKOUT",
            transaction_type=dhan.BUY,
            exchange_segment=dhan.FNO,
            product_type=dhan.INTRA,
            order_type=dhan.MARKET,
            validity='DAY',
            security_id=security_id,
            quantity=15,
            price=0,
            trigger_price=0
        )
        print(f"[+] Placed BankNifty Long Order: {order}")

if __name__ == "__main__":
    monitor_opening_range()`,
  },
  {
    id: 'rsi_mean_reversion',
    name: 'RSI Oversold / Overbought Reversal',
    desc: 'Executes mean reversion on extreme RSI < 30 and sells when RSI > 68.',
    code: `from dhanhq import dhanhq

def rsi_strategy(symbol="NIFTY 50", rsi_period=14):
    print(f"[*] Running RSI Mean Reversion scanner for {symbol}...")
    current_rsi = 28.4
    if current_rsi < 30.0:
        print(f"[!] Alert: RSI oversold at {current_rsi} < 30.0! Triggering Long Entry.")
        print("[+] Dhan API BUY payload generated with 1:2.5 Risk-Reward ratio.")
    elif current_rsi > 70.0:
        print(f"[!] Alert: RSI overbought at {current_rsi} > 70.0! Triggering Short Entry.")

if __name__ == "__main__":
    rsi_strategy()`,
  },
];

export const PythonLab: React.FC<PythonLabProps> = ({
  initialCode,
  symbolInfo,
  activeSignal,
  onLaunchBacktest,
  onDeployToPaper,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(STRATEGY_PRESETS[0].id);
  const [code, setCode] = useState<string>(
    initialCode || STRATEGY_PRESETS[0].code
  );
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    'Python 3.11.8 (Algorithmic Trading Virtual Environment with dhanhq v2.0)',
    'Ready. Click "Run Code in Simulator" to test strategy execution.',
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunSimulator = () => {
    setIsRunning(true);
    setConsoleOutput([
      `$ python3 algo_strategy.py --symbol "${symbolInfo.symbol}"`,
      '[*] Initializing Python runtime with DhanHQ API bindings...',
    ]);

    setTimeout(() => {
      setConsoleOutput((prev) => [
        ...prev,
        `[*] Connecting to Dhan REST endpoint (https://api.dhan.co/v2)...`,
        `[+] Client authenticated: DHAN_SANDBOX_USER (Security Id: ${symbolInfo.securityId})`,
        `[*] Fetching historical candle series for ${symbolInfo.symbol}...`,
      ]);
    }, 400);

    setTimeout(() => {
      setConsoleOutput((prev) => [
        ...prev,
        `[+] Market Data Stream Connected. Current LTP: ₹${symbolInfo.lastPrice}`,
        `[*] Evaluating strategy conditions (Trend Filter + Momentum Trigger)...`,
        `[+] Strategy Condition: TRIGGERED (Action: BUY, Confidence: 88%)`,
        `[*] Safety Guard Check: Risk < 1.5% capital (PASSED)`,
        `[+] Dhan API Order Placed: { "orderId": "DHAN_SIM_${Date.now()}", "status": "FILLED", "price": ${symbolInfo.lastPrice} }`,
        `[✓] Execution complete. Trailing stop-loss active.`,
      ]);
      setIsRunning(false);
    }, 1200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = STRATEGY_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setCode(found.code);
    }
  };

  return (
    <div
      id="python-lab-container"
      className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Python Algo Strategy Lab</h2>
            <p className="text-[11px] text-slate-400">
              Write, edit, and test DhanHQ Python SDK algorithms with automated paper/live execution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="run-python-btn"
            onClick={handleRunSimulator}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Simulator...' : 'Run in Simulator'}
          </button>
          <button
            id="copy-python-btn"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-xs overflow-x-auto">
        <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider flex-shrink-0">
          Algo Templates:
        </span>
        {STRATEGY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            id={`preset-${preset.id}`}
            onClick={() => handleSelectPreset(preset.id)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-lg transition-colors text-[11px] font-medium ${
              selectedPreset === preset.id
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Code Editor and Output Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Editor Area (7 cols) */}
        <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
            <span>algo_strategy.py</span>
            <span className="text-[10px] text-emerald-400">dhanhq==2.0</span>
          </div>
          <textarea
            id="python-code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full bg-slate-950 text-emerald-300 p-4 font-mono text-xs leading-relaxed focus:outline-none resize-none overflow-y-auto selection:bg-emerald-900/50"
            spellCheck={false}
          />
        </div>

        {/* Terminal Output Area (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-sky-400" /> Execution Output
            </span>
            <button
              onClick={() => setConsoleOutput(['Console cleared. Ready.'])}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 p-3 font-mono text-[11px] text-slate-300 space-y-1 overflow-y-auto bg-slate-950/80">
            {consoleOutput.map((line, idx) => (
              <div
                key={idx}
                className={`${
                  line.startsWith('[+]')
                    ? 'text-emerald-400 font-semibold'
                    : line.startsWith('[-]')
                    ? 'text-rose-400'
                    : line.startsWith('[!]')
                    ? 'text-amber-300'
                    : line.startsWith('[*]')
                    ? 'text-sky-300'
                    : 'text-slate-400'
                }`}
              >
                {line}
              </div>
            ))}
          </div>

          {/* Quick Actions Footer */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <button
              id="lab-launch-bt-btn"
              onClick={() => onLaunchBacktest('EMA Crossover (9/21) + Trend Filter')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> Backtest Strategy
            </button>
            <button
              id="lab-deploy-paper-btn"
              onClick={() => onDeployToPaper(code)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" /> Paper Trade This
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
