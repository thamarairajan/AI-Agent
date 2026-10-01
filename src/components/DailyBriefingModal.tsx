import React, { useState } from 'react';
import { DailyBriefing, SymbolInfo } from '../types/trading';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  Globe,
  HelpCircle,
  Layers,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefing: DailyBriefing | null;
  onSelectSetup: (symbolName: string) => void;
  allSymbols: SymbolInfo[];
  onSetEntryAlert?: (
    symbol: string,
    entryPrice: number,
    targetPrice: number,
    stopLoss: number,
    direction: 'LONG' | 'SHORT',
    rationale: string
  ) => void;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  briefing,
  onSelectSetup,
  allSymbols,
  onSetEntryAlert,
}) => {
  const [armedSetups, setArmedSetups] = useState<Record<string, boolean>>({});

  if (!isOpen || !briefing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="daily-briefing-modal"
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Daily Morning Market Intelligence & Scanner
                </h2>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" /> Live Institutional Brief
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                {briefing.date} • Pre-Market AI Scanner
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Top Row: Bias & Sentiment Meter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Daily Bias Card */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">
                  Today's Market Bias
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xl font-black tracking-tight ${
                      briefing.marketBias === 'BULLISH'
                        ? 'text-emerald-400'
                        : briefing.marketBias === 'BEARISH'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {briefing.marketBias}
                  </span>
                  {briefing.marketBias === 'BULLISH' ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  )}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Order flow favors trend continuation on pullbacks.
              </div>
            </div>

            {/* Sentiment Meter Card */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    Institutional Sentiment
                  </span>
                  <span className="font-mono text-sm font-bold text-sky-400">
                    {briefing.sentimentScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden mt-2 p-0.5 border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${briefing.sentimentScore}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                <span>Extreme Fear</span>
                <span>Neutral</span>
                <span>Greed</span>
              </div>
            </div>

            {/* Global Cues Summary */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-sky-400" /> Global Market Cues
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{briefing.globalCues}</p>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-2">Gift Nifty: Positive Bias</div>
            </div>
          </div>

          {/* Market Overview Paragraph */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              Executive Market Regime Analysis
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs">{briefing.marketOverview}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="font-bold text-sky-400">NIFTY 50 Outlook:</span>
                <p className="text-slate-300 text-[11px] mt-0.5">{briefing.niftyOutlook}</p>
              </div>
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800">
                <span className="font-bold text-indigo-400">BANKNIFTY Outlook:</span>
                <p className="text-slate-300 text-[11px] mt-0.5">{briefing.bankNiftyOutlook}</p>
              </div>
            </div>
          </div>

          {/* Top 3 AI Trade Setups */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                Top 3 High-Probability Trade Setups Today
              </h3>
              <span className="text-[11px] text-slate-400">Calculated with 1:2+ Risk-Reward</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {briefing.topSetups.map((setup, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-sky-500/60 transition-all shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white tracking-tight">
                        {setup.symbol}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {setup.confluenceScore || 92}% Confluence
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            setup.direction === 'LONG'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {setup.direction}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-300 font-medium mb-2.5">
                      Trigger: <span className="text-white">{setup.trigger}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 bg-slate-950/70 p-2 rounded-lg text-center font-mono text-[10px] mb-2.5">
                      <div>
                        <div className="text-slate-400">ENTRY</div>
                        <div className="font-bold text-white">₹{setup.entry}</div>
                      </div>
                      <div>
                        <div className="text-rose-400">SL</div>
                        <div className="font-bold text-rose-300">₹{setup.stopLoss}</div>
                      </div>
                      <div>
                        <div className="text-emerald-400">TARGET</div>
                        <div className="font-bold text-emerald-300">₹{setup.target}</div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-snug">{setup.rationale}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {onSetEntryAlert && (
                      <button
                        onClick={() => {
                          onSetEntryAlert(
                            setup.symbol,
                            setup.entry,
                            setup.target,
                            setup.stopLoss,
                            setup.direction,
                            setup.rationale
                          );
                          setArmedSetups((prev) => ({ ...prev, [setup.symbol]: true }));
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-sm ${
                          armedSetups[setup.symbol]
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                        title="Get notified when this entry level is reached"
                      >
                        <BellRing className="w-3 h-3" />
                        <span>{armedSetups[setup.symbol] ? 'Alert Armed' : `Alert @ ₹${setup.entry}`}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onSelectSetup(setup.symbol);
                        onClose();
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-slate-700"
                    >
                      <span>Chart</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Pivot Points Table */}
          {briefing.keyLevels && briefing.keyLevels.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Intraday Pivot Support & Resistance Clusters
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-[10px] uppercase text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="py-2 px-3">Instrument</th>
                      <th className="py-2 px-3 text-rose-400">Support 2</th>
                      <th className="py-2 px-3 text-rose-300">Support 1</th>
                      <th className="py-2 px-3 text-amber-400">Pivot (P)</th>
                      <th className="py-2 px-3 text-emerald-300">Resistance 1</th>
                      <th className="py-2 px-3 text-emerald-400">Resistance 2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {briefing.keyLevels.map((lvl, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-bold text-white">{lvl.instrument}</td>
                        <td className="py-2 px-3 text-rose-400">₹{lvl.support2.toLocaleString()}</td>
                        <td className="py-2 px-3 text-rose-300">₹{lvl.support1.toLocaleString()}</td>
                        <td className="py-2 px-3 text-amber-300 font-bold">₹{lvl.pivot.toLocaleString()}</td>
                        <td className="py-2 px-3 text-emerald-300">₹{lvl.resistance1.toLocaleString()}</td>
                        <td className="py-2 px-3 text-emerald-400">₹{lvl.resistance2.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Daily Institutional Rule */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-amber-300">Today's Institutional Risk Rule</div>
              <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">{briefing.dailyTip}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Refreshed daily before market open (09:00 AM IST)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            Close & Start Trading
          </button>
        </div>
      </div>
    </div>
  );
};
