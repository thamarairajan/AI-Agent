import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Copy,
  Check,
  Bot,
  BarChart2,
  Code2,
  Activity,
  PieChart,
  Zap,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface AppFlowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppFlowGuideModal: React.FC<AppFlowGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'FLOW' | 'STEPS' | 'ARCHITECTURE' | 'FAQ'>('FLOW');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const text = `# AI TRADING AGENT TERMINAL — ARCHITECTURE & WORKFLOW GUIDE

## 1. SYSTEM OVERVIEW
The AI Trading Agent Terminal is an institutional-grade algorithmic trading workstation designed for the Indian Stock Market (NSE/BSE via DhanHQ API) and global financial assets. It bridges quantitative research, natural language strategy ideation, automated Python code generation, backtesting, and autonomous execution.

---

## 2. END-TO-END APPLICATION WORKFLOW

### STEP 1: PRE-MARKET INTELLIGENCE (DAILY BRIEFING)
- Automatic analysis of global cues (Gift Nifty, US Tech indices, Crude Oil).
- Institutional market bias (Bullish / Bearish / Neutral) with sentiment scoring.
- Key intraday pivot points, support/resistance levels for NIFTY 50, BANKNIFTY, and large caps.
- Pre-screened high-probability trade setups with technical triggers.

### STEP 2: NATURAL LANGUAGE STRATEGY FORMULATION (AI AGENT CHAT)
- Traders type plain English or Hinglish prompts (e.g. "Scan Reliance for 15m breakout strategy with 1:2 risk reward").
- AI Server analyzes market structure, trend (EMA 9/21), momentum (RSI), and MACD crossovers.
- Generates 4 simultaneous synchronized outputs:
  1. Technical Narrative & Reasoning
  2. Trade Signal Card (Entry Price, Stop Loss, Target Price, Risk-to-Reward ratio)
  3. DhanHQ REST API Order Payload JSON
  4. Complete Executable Python Script using official DhanHQ SDK (\`dhanhq\`)

### STEP 3: VISUAL CHART VERIFICATION (TRADINGVIEW CHARTS)
- Live candlestick chart (1m, 5m, 15m, 1h, 1D).
- Real-time indicator overlays (EMA 9, EMA 21, Bollinger Bands, RSI, MACD Histogram).
- Visual horizontal lines mapping Entry, Stop-Loss, and Target directly on price candles.

### STEP 4: CODE REFINEMENT & SCRIPT TESTING (PYTHON ALGO LAB)
- Built-in Monaco/Ace-style Python workstation with DhanHQ syntax highlighting.
- Ability to tweak quantity, risk-per-trade, indicator thresholds, and trailing stop rules.
- One-click transfer of generated algorithms to Backtest Lab or Paper Bot deployment.

### STEP 5: HISTORICAL QUANTITATIVE VALIDATION (BACKTEST ENGINE)
- Simulates algorithmic rules over historical multi-session candle data.
- Generates key institutional performance metrics:
  - Cumulative Net Profit (%)
  - Win Rate (%) & Total Trade Count
  - Maximum Drawdown (MDD %)
  - Sharpe Ratio (Risk-Adjusted Return)
  - Profit Factor (Gross Profits / Gross Losses)
- Visual Equity Curve chart vs benchmark.

### STEP 6: RISK-MANAGED EXECUTION (PORTFOLIO & AUTO-TRADE ENGINE)
- **Paper Trading Mode**: Virtual ₹10,00,000 capital with live mark-to-market unrealized P&L calculation on every market tick.
- **Auto-Trade Bracket Orders (OCO)**:
  - Configure Entry Price (Instant Market or Trigger/GTT Entry).
  - Stop Loss & Target are monitored automatically by the background engine.
  - Target Hit -> Automatically closes position and secures profits.
  - Stop Loss Hit -> Automatically cuts loss to protect capital.
- **Live Dhan Broker Routing**: Seamless order execution to NSE/BSE via Dhan API credentials when armed in Settings.

---

## 3. CORE ARCHITECTURE
- **Frontend SPA**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Canvas Candlestick Engine.
- **Backend API**: Node.js & Express server binding to 0.0.0.0:3000.
- **AI Engine**: Google Gemini API (@google/genai) with cascading model failovers (gemini-3.8-flash -> gemini-3.1-flash-lite -> gemini-flash-latest) and in-memory caching.
- **Broker Gateway**: DhanHQ REST API v2.0 & DhanHQ Python SDK.
- **Virtual Matching Engine**: Sub-second tick simulator with automated OCO target and stop-loss triggers.
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="app-flow-guide-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="app-flow-guide-modal-container"
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Application Flow & Workflow Guide
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  PDF Exportable
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end operational architecture, trading workflow, and user handbook
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Markdown */}
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Copy Full Documentation Text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Doc'}</span>
            </button>

            {/* Print / Save as PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all cursor-pointer shadow-md shadow-cyan-950/40"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save / Print PDF</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 bg-slate-950/40 border-b border-slate-800 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('FLOW')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'FLOW'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Visual Flow Diagram
          </button>
          <button
            onClick={() => setActiveSection('STEPS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'STEPS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Step-by-Step User Guide
          </button>
          <button
            onClick={() => setActiveSection('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'ARCHITECTURE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            System Architecture
          </button>
          <button
            onClick={() => setActiveSection('FAQ')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeSection === 'FAQ'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Auto-Trade & Dhan FAQ
          </button>
        </div>

        {/* Printable Document Body */}
        <div
          id="printable-app-flow-doc"
          className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200 text-sm leading-relaxed"
        >
          {/* TAB 1: VISUAL FLOW DIAGRAM */}
          {activeSection === 'FLOW' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Full Application Lifecycle (From Prompt to Profit)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  The terminal automates the complete quantitative loop: strategy formulation, mathematical level sizing, broker code generation, backtesting, and automated trade execution.
                </p>

                {/* Workflow Diagram Nodes */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                  {/* Node 1 */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
                          STAGE 1
                        </span>
                        <Bot className="w-4 h-4 text-cyan-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">AI Prompt & Scan</h4>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Type natural language query or pick pre-market setup from Daily Briefing.
                      </p>
                    </div>
                    <div className="mt-3 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 p-1.5 rounded border border-cyan-900/40">
                      Gemini 3.8 Flash
                    </div>
                  </div>

                  {/* Node 2 */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-blue-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/50">
                          STAGE 2
                        </span>
                        <Layers className="w-4 h-4 text-blue-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">4-Part Synthesis</h4>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Generates Signal Card (Entry/SL/TP), Python Code, Dhan JSON & Analysis.
                      </p>
                    </div>
                    <div className="mt-3 text-[10px] font-mono text-blue-300 bg-blue-950/40 p-1.5 rounded border border-blue-900/40">
                      1:2+ Risk:Reward
                    </div>
                  </div>

                  {/* Node 3 */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-indigo-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/50">
                          STAGE 3
                        </span>
                        <BarChart2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">Chart & Verify</h4>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Live TradingView candles with EMA 9/21, RSI, MACD & target lines.
                      </p>
                    </div>
                    <div className="mt-3 text-[10px] font-mono text-indigo-300 bg-indigo-950/40 p-1.5 rounded border border-indigo-900/40">
                      Technical Align
                    </div>
                  </div>

                  {/* Node 4 */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-purple-400 px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/50">
                          STAGE 4
                        </span>
                        <Activity className="w-4 h-4 text-purple-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">Backtest Lab</h4>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Simulate over historical bars to check Win Rate, Sharpe & Max Drawdown.
                      </p>
                    </div>
                    <div className="mt-3 text-[10px] font-mono text-purple-300 bg-purple-950/40 p-1.5 rounded border border-purple-900/40">
                      Quant Proof
                    </div>
                  </div>

                  {/* Node 5 */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50">
                          STAGE 5
                        </span>
                        <Zap className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1">Auto Execution</h4>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        One-click Paper or Live Dhan API routing with auto Target & SL triggers.
                      </p>
                    </div>
                    <div className="mt-3 text-[10px] font-mono text-emerald-300 bg-emerald-950/40 p-1.5 rounded border border-emerald-900/40">
                      Autonomous OCO
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4" />
                    Autonomous Risk Guardrails
                  </h4>
                  <p className="text-xs text-slate-300">
                    Once a trade is placed, the background tick loop watches market price every second:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-white">Auto Target Hit</strong>: Automatically executes a closing market order and locks in realized profits.</li>
                    <li><strong className="text-white">Auto Stop-Loss Hit</strong>: Automatically cuts loss at your exact price boundary to defend capital.</li>
                    <li><strong className="text-white">Trigger / GTT Entry</strong>: Waits for price to cross your breakout price before entering.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Dual Mode Execution (Paper & Live)
                  </h4>
                  <p className="text-xs text-slate-300">
                    Switch between safe virtual capital and direct exchange routing:
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li><strong className="text-white">Paper Trading</strong>: Pre-funded with ₹10,00,000 virtual balance. Zero financial risk.</li>
                    <li><strong className="text-white">Live Dhan Broker API</strong>: Direct REST order placement on NSE_EQ or NSE_FNO with your Dhan Client ID & Access Token.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STEP-BY-STEP USER GUIDE */}
          {activeSection === 'STEPS' && (
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/30 text-xs">
                  01
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Check Morning Market Intelligence</h4>
                  <p className="text-xs text-slate-400">
                    Click <strong>Daily Brief</strong> in the top header. View institutional market bias, sentiment score (0-100), Gift Nifty cues, and daily pivot levels for NIFTY 50 and BANKNIFTY. Click any setup to load the chart instantly.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/30 text-xs">
                  02
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Ask AI for Strategies or Analysis</h4>
                  <p className="text-xs text-slate-400">
                    In the <strong>AI Terminal</strong>, type any request: e.g., <em>"Scan Reliance for a 15-minute momentum breakout"</em>, <em>"Nifty 50 expiry strategy"</em>, or <em>"Tata Motors swing setup"</em>. The AI calculates exact Entry, Stop-Loss, and Target with at least a 1:2 risk-to-reward ratio.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/30 text-xs">
                  03
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Inspect TradingView Chart Overlays</h4>
                  <p className="text-xs text-slate-400">
                    Switch to the <strong>TradingView Chart</strong> tab. Toggle indicators like EMA 9/21, RSI, MACD, and Bollinger Bands. Your active AI Trade Signal will automatically project color-coded horizontal levels (Green for Target, Red for Stop Loss) over the live price candles.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/30 text-xs">
                  04
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Review & Edit DhanHQ Python Code</h4>
                  <p className="text-xs text-slate-400">
                    Click <strong>Python Algo Lab</strong> or click "Inspect Dhan Python Code" on any trade signal. Inspect the ready-to-run Python script utilizing the official <code>dhanhq</code> SDK. Edit parameters or deploy to the Paper Bot runner.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/30 text-xs">
                  05
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Backtest on Historical Data</h4>
                  <p className="text-xs text-slate-400">
                    Open the <strong>Backtest Lab</strong>. Select your strategy (e.g. EMA Momentum, RSI Reversal, or MACD Trend), set your Stop-Loss and Take-Profit percentages, and run the backtest. Inspect your Win Rate, Sharpe Ratio, Profit Factor, and Equity Curve before committing money.
                  </p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-xs">
                  06
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Place Auto-Trade Bracket Order</h4>
                  <p className="text-xs text-slate-400">
                    Click <strong>⚡ Auto-Trade</strong> anywhere (top navbar, chart toolbar, or trade signal card). Enter your quantity, review the automated Stop-Loss and Target, and click <strong>Arm Auto-Trade Bracket</strong>. The terminal will monitor price ticks autonomously and close the position at target or stop loss!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM ARCHITECTURE */}
          {activeSection === 'ARCHITECTURE' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-300 font-semibold border-b border-slate-800">
                      <th className="p-3">Layer</th>
                      <th className="p-3">Technology</th>
                      <th className="p-3">Key Functionality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-sans font-bold text-cyan-400">Frontend SPA</td>
                      <td className="p-3 text-slate-300">React 18 + Vite + Tailwind CSS</td>
                      <td className="p-3 font-sans text-slate-400">High-speed modular UI with 5 main views, sub-second candle tick engine, and custom canvas charts.</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-sans font-bold text-blue-400">Backend Server</td>
                      <td className="p-3 text-slate-300">Express + TypeScript (0.0.0.0:3000)</td>
                      <td className="p-3 font-sans text-slate-400">API proxying for Gemini AI & DhanHQ endpoints, avoiding browser CORS and protecting API secrets.</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-sans font-bold text-indigo-400">AI Intelligence</td>
                      <td className="p-3 text-slate-300">Google GenAI SDK (Cascading Fallback)</td>
                      <td className="p-3 font-sans text-slate-400">Auto-routes between gemini-3.8-flash, 3.1-flash-lite & flash-latest with in-memory briefing caching.</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-sans font-bold text-purple-400">Broker Gateway</td>
                      <td className="p-3 text-slate-300">DhanHQ v2 REST API + Python SDK</td>
                      <td className="p-3 font-sans text-slate-400">Instant generation of valid Dhan JSON order payloads, order placement, and executable Python scripts.</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="p-3 font-sans font-bold text-emerald-400">Autonomous Engine</td>
                      <td className="p-3 text-slate-300">React State + In-Memory Tick Engine</td>
                      <td className="p-3 font-sans text-slate-400">Monitors pending GTT triggers and open bracket orders; auto-executes square-off on Target or Stop-Loss.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* API Endpoints Reference */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Core Backend API Endpoints
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      POST
                    </span>
                    <div>
                      <code className="text-cyan-300">/api/chat</code>
                      <p className="font-sans text-[11px] text-slate-400 mt-0.5">
                        Accepts user message, active symbol, price, and indicators. Returns technical analysis, tradeSignal, dhanPayload, and pythonCode.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      POST
                    </span>
                    <div>
                      <code className="text-cyan-300">/api/daily-briefing</code>
                      <p className="font-sans text-[11px] text-slate-400 mt-0.5">
                        Returns institutional pre-market summary, Gift Nifty cues, Nifty/BankNifty pivots, and top 3 setups (cached for 15 minutes).
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-start gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      POST
                    </span>
                    <div>
                      <code className="text-cyan-300">/api/dhan/order</code>
                      <p className="font-sans text-[11px] text-slate-400 mt-0.5">
                        Executes live Dhan REST API orders to exchange servers or routes instantly to the local Paper Trading matching engine.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FAQ & TROUBLESHOOTING */}
          {activeSection === 'FAQ' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  How do I connect my live Dhan Broker account?
                </h4>
                <p className="text-xs text-slate-400">
                  Click the <strong>Settings (⚙️)</strong> icon in the top right. Enter your <strong>Dhan Client ID</strong> and <strong>Dhan Access Token</strong> (generated from your Dhan Web profile &gt; DhanHQ Developer APIs). Turn ON the <strong>Arm Live Trading</strong> toggle.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  How does Auto-Trade handle Target and Stop Loss?
                </h4>
                <p className="text-xs text-slate-400">
                  When an Auto-Trade Bracket is armed, the terminal continuously compares every incoming price tick against your configured Target and Stop Loss. As soon as the price touches or breaches your Target, it closes the trade at profit. If it hits your Stop Loss, it squares off to prevent larger losses.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  Can I export this guide as an official PDF?
                </h4>
                <p className="text-xs text-slate-400">
                  Yes! Click the <strong>Save / Print PDF</strong> button in the top right of this dialog. Your browser's print dialog will open with print-optimized styles. Select <em>"Save as PDF"</em> as your destination.
                </p>
              </div>
            </div>
          )}

          {/* Footer Notes for PDF Print */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>AI Trading Agent Terminal • DhanHQ Algorithmic Architecture</span>
            <span className="text-slate-400">Compliant with NSE/BSE Algo Guidelines &amp; DhanHQ API v2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
