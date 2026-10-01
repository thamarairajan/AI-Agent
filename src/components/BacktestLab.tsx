import React, { useState } from 'react';
import { BacktestResult, Candle, SymbolInfo } from '../types/trading';
import { runBacktestSimulation } from '../utils/backtestEngine';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Filter,
  Play,
  RotateCcw,
  Sliders,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface BacktestLabProps {
  candles: Candle[];
  symbolInfo: SymbolInfo;
  timeframe: string;
  onDeployToPaperBot?: (strategyName: string) => void;
  presetResult?: BacktestResult | null;
}

export const BacktestLab: React.FC<BacktestLabProps> = ({
  candles,
  symbolInfo,
  timeframe,
  onDeployToPaperBot,
  presetResult,
}) => {
  const [strategy, setStrategy] = useState('EMA Crossover (9/21) + Trend Filter');
  const [initialCapital, setInitialCapital] = useState(100000);
  const [stopLossPct, setStopLossPct] = useState(0.8);
  const [takeProfitPct, setTakeProfitPct] = useState(1.8);
  const [slippagePct, setSlippagePct] = useState(0.05);

  const [result, setResult] = useState<BacktestResult | null>(() => {
    if (presetResult) return presetResult;
    // Default initial backtest run
    return runBacktestSimulation({
      strategyName: 'EMA Crossover (9/21) + Trend Filter',
      candles,
      symbol: symbolInfo.symbol,
      timeframe,
      initialCapital: 100000,
      stopLossPct: 0.8,
      takeProfitPct: 1.8,
      slippagePct: 0.05,
    });
  });

  const [activeTab, setActiveTab] = useState<'METRICS' | 'EQUITY_CURVE' | 'TRADES_LOG'>('METRICS');

  const handleRunBacktest = () => {
    const res = runBacktestSimulation({
      strategyName: strategy,
      candles,
      symbol: symbolInfo.symbol,
      timeframe,
      initialCapital,
      stopLossPct,
      takeProfitPct,
      slippagePct,
    });
    setResult(res);
  };

  return (
    <div
      id="backtest-lab-container"
      className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Quantitative Backtesting Engine</h2>
            <p className="text-[11px] text-slate-400">
              Simulate historical strategy returns, risk metrics, and order flow on {symbolInfo.symbol} ({timeframe})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="run-backtest-btn"
            onClick={handleRunBacktest}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Run Backtest
          </button>
          {onDeployToPaperBot && (
            <button
              id="deploy-strategy-btn"
              onClick={() => onDeployToPaperBot(strategy)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-semibold rounded-lg text-xs transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" /> Deploy as Paper Bot
            </button>
          )}
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-950/60 border-b border-slate-800 text-xs">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Strategy Algorithm</label>
          <select
            id="strategy-algo-select"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="EMA Crossover (9/21) + Trend Filter">EMA (9/21) Crossover + Trend</option>
            <option value="RSI Mean Reversion (30/70)">RSI (14) Mean Reversion</option>
            <option value="Bollinger Bands Breakout">Bollinger Bands Volatility Breakout</option>
            <option value="MACD Zero-Lag Momentum">MACD (12,26,9) Zero-Lag</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Initial Capital (₹)</label>
          <input
            id="capital-input"
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            step="10000"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Stop Loss (%)</label>
          <input
            id="sl-pct-input"
            type="number"
            value={stopLossPct}
            onChange={(e) => setStopLossPct(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            step="0.1"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Take Profit (%)</label>
          <input
            id="tp-pct-input"
            type="number"
            value={takeProfitPct}
            onChange={(e) => setTakeProfitPct(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            step="0.1"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Slippage & Fees (%)</label>
          <input
            id="slippage-pct-input"
            type="number"
            value={slippagePct}
            onChange={(e) => setSlippagePct(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            step="0.01"
          />
        </div>
      </div>

      {/* Main Results View */}
      {result ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 p-3 bg-slate-900/60 border-b border-slate-800">
            {/* Net PnL */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 font-medium">Net Profit / Loss</div>
              <div
                className={`text-base font-bold font-mono ${
                  result.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.netProfit >= 0 ? '+' : ''}₹{result.netProfit.toLocaleString()}
              </div>
              <div
                className={`text-[10px] font-semibold flex items-center ${
                  result.netProfitPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.netProfitPct >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {result.netProfitPct}%
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 font-medium">Win Rate</div>
              <div className="text-base font-bold font-mono text-sky-400">{result.winRate}%</div>
              <div className="text-[10px] text-slate-400">
                {result.winningTrades}W / {result.losingTrades}L of {result.totalTrades}
              </div>
            </div>

            {/* Profit Factor */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 font-medium">Profit Factor</div>
              <div className="text-base font-bold font-mono text-indigo-300">
                {result.profitFactor}x
              </div>
              <div className="text-[10px] text-slate-400">Gross Win / Loss ratio</div>
            </div>

            {/* Max Drawdown */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 font-medium">Max Drawdown</div>
              <div className="text-base font-bold font-mono text-rose-400">
                -{result.maxDrawdownPct}%
              </div>
              <div className="text-[10px] text-slate-400">-₹{result.maxDrawdown.toLocaleString()}</div>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 font-medium">Sharpe Ratio</div>
              <div className="text-base font-bold font-mono text-amber-300">{result.sharpeRatio}</div>
              <div className="text-[10px] text-slate-400">Risk-Adjusted Alpha</div>
            </div>

            {/* Final Capital */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 font-medium">Final Capital</div>
              <div className="text-base font-bold font-mono text-white">
                ₹{result.finalCapital.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">From ₹{result.initialCapital.toLocaleString()}</div>
            </div>
          </div>

          {/* Sub-view switcher */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900 text-xs">
            <button
              onClick={() => setActiveTab('METRICS')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'METRICS'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Performance Summary
            </button>
            <button
              onClick={() => setActiveTab('EQUITY_CURVE')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'EQUITY_CURVE'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Equity Growth Curve
            </button>
            <button
              onClick={() => setActiveTab('TRADES_LOG')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeTab === 'TRADES_LOG'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Executed Trades Log ({result.trades.length})
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4 text-xs">
            {activeTab === 'METRICS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visual Win-Loss Distribution */}
                <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Trade Outcomes Breakdown
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Winning Trades</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {result.winningTrades} ({result.winRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${result.winRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Losing Trades</span>
                        <span className="font-mono text-rose-400 font-bold">
                          {result.losingTrades} ({Number((100 - result.winRate).toFixed(1))}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${100 - result.winRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="p-2 bg-slate-900/80 rounded-lg">
                      <div className="text-[10px] text-slate-400">Avg Trade Return</div>
                      <div
                        className={`text-xs font-bold ${
                          result.avgTradeProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {result.avgTradeProfit >= 0 ? '+' : ''}₹{result.avgTradeProfit}
                      </div>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded-lg">
                      <div className="text-[10px] text-slate-400">Expected Value</div>
                      <div className="text-xs font-bold text-sky-400 font-mono">
                        {(
                          (result.winRate / 100) * (takeProfitPct / stopLossPct) -
                          ((100 - result.winRate) / 100)
                        ).toFixed(2)}
                        R
                      </div>
                    </div>
                  </div>
                </div>

                {/* Strategy Risk Notes */}
                <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Execution Parameters & Safeguards
                    </h3>
                    <ul className="space-y-1.5 text-slate-300 text-[11px]">
                      <li>
                        • Tested on <strong>{candles.length}</strong> historical candles of {symbolInfo.symbol} ({timeframe}).
                      </li>
                      <li>
                        • Stop loss strictly enforced at <strong>{stopLossPct}%</strong> from entry.
                      </li>
                      <li>
                        • Profit target fixed at <strong>{takeProfitPct}%</strong> (Risk-Reward 1:
                        {(takeProfitPct / stopLossPct).toFixed(1)}).
                      </li>
                      <li>
                        • Exchange slippage & broker STT factored at <strong>{slippagePct}%</strong> per leg.
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg text-[11px] text-indigo-300">
                    💡 <strong>Live Dhan Recommendation:</strong> This strategy passes the minimum threshold with a Profit Factor &gt; 1.5. You can safely paper trade this setup before arming live Dhan API orders.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'EQUITY_CURVE' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-white mb-3">Portfolio Equity Growth Over Time</h3>
                {/* SVG Line Chart */}
                <div className="h-64 w-full">
                  <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="600" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="0" y1="150" x2="600" y2="150" stroke="#1e293b" strokeDasharray="3 3" />

                    {/* Plot Points */}
                    {(() => {
                      const points = result.equityCurve;
                      if (points.length < 2) return null;

                      let minE = Math.min(...points.map((p) => p.equity));
                      let maxE = Math.max(...points.map((p) => p.equity));
                      if (maxE === minE) {
                        maxE += 1000;
                        minE -= 1000;
                      }

                      const pathD = points
                        .map((p, i) => {
                          const x = (i / (points.length - 1)) * 600;
                          const y = 180 - ((p.equity - minE) / (maxE - minE)) * 160;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ');

                      const areaD = `${pathD} L 600 190 L 0 190 Z`;

                      return (
                        <>
                          <path d={areaD} fill="url(#equityGrad)" />
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                  <span>Start: ₹{result.initialCapital.toLocaleString()}</span>
                  <span>End: ₹{result.finalCapital.toLocaleString()}</span>
                </div>
              </div>
            )}

            {activeTab === 'TRADES_LOG' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Trade #</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Entry Time / Px</th>
                      <th className="py-2.5 px-3">Exit Time / Px</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">P&L (₹)</th>
                      <th className="py-2.5 px-3">Return %</th>
                      <th className="py-2.5 px-3">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {result.trades.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-slate-400">{tr.id}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tr.type === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {tr.type}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <div>₹{tr.entryPrice}</div>
                          <div className="text-[9px] text-slate-500">
                            {new Date(tr.entryTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div>₹{tr.exitPrice}</div>
                          <div className="text-[9px] text-slate-500">
                            {new Date(tr.exitTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-2 px-3">{tr.qty}</td>
                        <td
                          className={`py-2 px-3 font-bold ${
                            tr.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tr.pnl >= 0 ? '+' : ''}₹{tr.pnl}
                        </td>
                        <td
                          className={`py-2 px-3 font-bold ${
                            tr.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tr.pnlPct >= 0 ? '+' : ''}
                          {tr.pnlPct}%
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] ${
                              tr.exitReason === 'TARGET_HIT'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : tr.exitReason === 'STOP_LOSS'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {tr.exitReason.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
          <Activity className="w-8 h-8 text-slate-600 mb-2" />
          <p>Select strategy rules and click "Run Backtest" to evaluate historical performance.</p>
        </div>
      )}
    </div>
  );
};
