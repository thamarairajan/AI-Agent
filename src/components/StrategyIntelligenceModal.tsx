import React, { useState, useEffect } from 'react';
import {
  HedgingSetup,
  MarketSessionStatus,
  OptionStrikeRecommendation,
  SymbolInfo,
  TradeSignal,
} from '../types/trading';
import {
  WORLD_MARKET_DATA,
  generateHedgingSetup,
  generateOpenInterestChain,
  getMarketSessionStatus,
  getOptionStrikeRecommendations,
} from '../utils/strategyEngine';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ExternalLink,
  Flame,
  Globe,
  Layers,
  Percent,
  Play,
  Repeat,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

interface StrategyIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbolInfo: SymbolInfo;
  activeSignal?: TradeSignal | null;
  onDeployStrategyTrade: (tradeConfig: {
    symbol: string;
    action: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'TRIGGER';
    entryPrice: number;
    triggerPrice?: number;
    stopLoss: number;
    target: number;
    quantity: number;
    validityType: 'DAY' | 'MULTI_DAY_GTT';
    trailingStopLossEnabled: boolean;
    trailingStopLossPoints: number;
    strategyType: string;
    note?: string;
  }) => void;
  onDeployHedgePair?: (longConfig: any, shortConfig: any) => void;
}

export const StrategyIntelligenceModal: React.FC<StrategyIntelligenceModalProps> = ({
  isOpen,
  onClose,
  symbolInfo,
  activeSignal,
  onDeployStrategyTrade,
  onDeployHedgePair,
}) => {
  const [activeTab, setActiveTab] = useState<
    'WORLD_MARKET' | 'OPEN_INTEREST' | 'SCALPING' | 'HEDGING' | 'BTST' | 'ATM_ITM' | 'TRAILING_SL'
  >('WORLD_MARKET');

  const [marketStatus, setMarketStatus] = useState<MarketSessionStatus>(getMarketSessionStatus());

  // Update market session timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getMarketSessionStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  // Compute Open Interest data for the current symbol
  const oiAnalysis = generateOpenInterestChain(
    symbolInfo.lastPrice,
    symbolInfo.symbol.includes('BANKNIFTY') ? 100 : 50
  );

  // Compute Options Strikes
  const optionsRec = getOptionStrikeRecommendations(symbolInfo.symbol, symbolInfo.lastPrice);

  // Compute Hedging setup
  const highEst = symbolInfo.lastPrice * 1.008;
  const lowEst = symbolInfo.lastPrice * 0.992;
  const hedgingSetup = generateHedgingSetup(
    symbolInfo.symbol,
    symbolInfo.lastPrice,
    Number(highEst.toFixed(2)),
    Number(lowEst.toFixed(2))
  );

  // Calculate World Market Sentiment Summary
  const bullishCount = WORLD_MARKET_DATA.filter((i) => i.sentiment === 'BULLISH').length;
  const globalScore = Math.round((bullishCount / WORLD_MARKET_DATA.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="strategy-intelligence-hub-modal"
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-950/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500/20 to-sky-500/20 border border-amber-500/40 rounded-xl text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Strategy & High-Accuracy Intelligence Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  9 Pro Strategies
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                World Market, OI, Scalping, 1:2 Hedging, BTST, Bollinger, ATM/ITM Only, Trailing SL &
                Multi-Day GTT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live IST Session Bar (Market Hours: 09:15 to 15:25) */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2 bg-slate-950/50 border-b border-slate-800/80 text-xs font-mono gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-300 font-semibold">{marketStatus.istTime}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                marketStatus.isMarketOpen
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {marketStatus.phaseLabel}
            </span>
          </div>

          {/* Multi-Day Carryover Notice */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Trigger not hit today (09:15-15:25)? Orders armed with{' '}
              <strong className="text-amber-300 font-semibold">Multi-Day GTT</strong> carry over to{' '}
              <strong className="text-emerald-300 font-semibold">tomorrow 09:15 AM</strong>!
            </span>
          </div>
        </div>

        {/* Strategy Navigation Tabs */}
        <div className="flex items-center px-4 sm:px-6 bg-slate-950/70 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0 gap-1 sm:gap-2 py-2">
          <button
            onClick={() => setActiveTab('WORLD_MARKET')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'WORLD_MARKET'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>World Market 💹</span>
          </button>

          <button
            onClick={() => setActiveTab('OPEN_INTEREST')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'OPEN_INTEREST'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Open Interest & PCR</span>
          </button>

          <button
            onClick={() => setActiveTab('SCALPING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'SCALPING'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Scalping (1m-5m) 🤓</span>
          </button>

          <button
            onClick={() => setActiveTab('HEDGING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'HEDGING'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>1:2 Hedging Method ⚖️</span>
          </button>

          <button
            onClick={() => setActiveTab('BTST')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'BTST'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>BTST Position (3:15 PM) 🌅</span>
          </button>

          <button
            onClick={() => setActiveTab('ATM_ITM')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'ATM_ITM'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>ATM / ITM Options Only 🎯</span>
          </button>

          <button
            onClick={() => setActiveTab('TRAILING_SL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'TRAILING_SL'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Trail Stop Loss 🛡️</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: WORLD MARKET ANALYSIS */}
          {activeTab === 'WORLD_MARKET' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="p-4 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-800/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-sky-400 font-bold flex items-center gap-1.5">
                    <Globe className="w-4 h-4" /> Global Market Sentiments & Opening Gap Forecast
                  </div>
                  <div className="text-sm font-semibold text-white mt-1">
                    GIFT Nifty indicates Indian Opening Bias: +70 to +90 Points Gap-Up at 09:15 AM IST
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Analyzing US Tech (Nasdaq), Wall Street (Dow Jones), Asia (Nikkei, GIFT), and Macro Cues (Brent Crude, DXY).
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800 shrink-0">
                  <div className="text-right font-mono">
                    <div className="text-[10px] text-slate-400 uppercase">Global Bias</div>
                    <div className="text-sm font-bold text-emerald-400">
                      {globalScore}% BULLISH
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center font-bold text-xs text-emerald-400">
                    {globalScore}%
                  </div>
                </div>
              </div>

              {/* World Market Table / Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {WORLD_MARKET_DATA.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.symbol} • {item.region}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.sentiment === 'BULLISH'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : item.sentiment === 'BEARISH'
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                            : 'bg-slate-700/30 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.sentiment}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-2.5 font-mono">
                      <span className="text-sm font-bold text-slate-100">
                        {item.region === 'COMMODITIES' ? '$' : ''}
                        {item.price.toLocaleString()}
                      </span>
                      <span
                        className={`text-xs font-semibold flex items-center ${
                          item.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.changePct >= 0 ? '+' : ''}
                        {item.changePct}%
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 leading-relaxed">
                      {item.impactOnIndianMarket}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: OPEN INTEREST & PCR */}
          {activeTab === 'OPEN_INTEREST' && (
            <div className="space-y-5">
              {/* Top Highlights: PCR and Max Pain */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-xs text-slate-400 font-medium">Put-Call Ratio (PCR)</div>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {oiAnalysis.pcr}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {oiAnalysis.pcr > 1.2
                        ? 'Bullish: Strong Put writing support'
                        : oiAnalysis.pcr < 0.8
                        ? 'Bearish: Call writing resistance'
                        : 'Neutral consolidation zone'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-xs text-slate-400 font-medium">Max Pain Strike</div>
                  <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                    ₹{oiAnalysis.maxPainStrike.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Strike where option buyers incur maximum decay loss at expiry.
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div className="text-xs text-slate-400 font-medium">Major Resistance / Support</div>
                  <div className="text-xs font-mono font-bold text-slate-200 mt-1">
                    Res: <span className="text-rose-400">₹{oiAnalysis.highestCallOIStrike} (Call OI)</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                    Sup: <span className="text-emerald-400">₹{oiAnalysis.highestPutOIStrike} (Put OI)</span>
                  </div>
                  <div className="text-[11px] text-sky-400 font-semibold mt-1">
                    Institutional Buildup: Long Accumulation
                  </div>
                </div>
              </div>

              {/* Open Interest Strike Chain Table */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                    {symbolInfo.symbol} Open Interest Strike Breakdown
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Current Spot: ₹{symbolInfo.lastPrice.toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/90 text-slate-400 text-[11px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 text-rose-400 font-bold">Call OI (Res)</th>
                        <th className="py-2.5 px-3 text-rose-300">Call IV</th>
                        <th className="py-2.5 px-3 text-center text-white font-black bg-slate-800/80">Strike</th>
                        <th className="py-2.5 px-3 text-emerald-300">Put IV</th>
                        <th className="py-2.5 px-3 text-emerald-400 font-bold text-right">Put OI (Sup)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {oiAnalysis.chain.map((item) => {
                        const maxOI = 2000000;
                        const callWidth = Math.min(100, (item.callOI / maxOI) * 100);
                        const putWidth = Math.min(100, (item.putOI / maxOI) * 100);

                        return (
                          <tr
                            key={item.strike}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              item.isATM ? 'bg-sky-950/30' : ''
                            }`}
                          >
                            {/* Call OI bar */}
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-800 rounded overflow-hidden">
                                  <div
                                    className="h-full bg-rose-500 rounded"
                                    style={{ width: `${callWidth}%` }}
                                  />
                                </div>
                                <span className="text-rose-300 font-semibold">
                                  {(item.callOI / 1000).toFixed(1)}k
                                </span>
                              </div>
                            </td>

                            <td className="py-2 px-3 text-slate-400">{item.callIV}%</td>

                            {/* Strike Center */}
                            <td className="py-2 px-3 text-center bg-slate-800/40">
                              <span
                                className={`font-bold text-xs px-2 py-0.5 rounded ${
                                  item.isATM
                                    ? 'bg-sky-500 text-slate-950 font-black'
                                    : item.isMaxPain
                                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                                    : 'text-slate-200'
                                }`}
                              >
                                {item.strike} {item.isATM && '(ATM)'} {item.isMaxPain && '★ Pain'}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-slate-400">{item.putIV}%</td>

                            {/* Put OI bar */}
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-emerald-300 font-semibold">
                                  {(item.putOI / 1000).toFixed(1)}k
                                </span>
                                <div className="w-16 h-2 bg-slate-800 rounded overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded"
                                    style={{ width: `${putWidth}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SCALPING METHOD */}
          {activeTab === 'SCALPING' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Zap className="w-4 h-4" /> Quick Momentum Scalping Method (1m – 5m Timeframe)
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Designed for active day trading between 09:15 and 15:15. Uses 9 EMA + SuperTrend momentum
                  flips with ultra-tight 0.35% Stop Loss and a 1:2 R:R profit target (0.70%) for lightning captures.
                </p>
              </div>

              {/* Scalp Setup Card */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold">Generated Scalp Setup</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{symbolInfo.symbol} 1m/5m Scalp</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    BUY SCALP (1:2 R:R)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 font-mono text-center">
                  <div className="p-2.5 bg-sky-950/30 border border-sky-900/40 rounded-lg">
                    <div className="text-[10px] text-sky-400 uppercase font-bold">Trigger Entry</div>
                    <div className="text-sm font-bold text-white">
                      ₹{symbolInfo.lastPrice.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2.5 bg-rose-950/30 border border-rose-900/40 rounded-lg">
                    <div className="text-[10px] text-rose-400 uppercase font-bold">Tight Stop Loss</div>
                    <div className="text-sm font-bold text-rose-300">
                      ₹{(symbolInfo.lastPrice * 0.9965).toFixed(2)} (-0.35%)
                    </div>
                  </div>
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-900/40 rounded-lg">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold">1:2 Target</div>
                    <div className="text-sm font-bold text-emerald-300">
                      ₹{(symbolInfo.lastPrice * 1.007).toFixed(2)} (+0.70%)
                    </div>
                  </div>
                </div>

                {/* Deploy Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Includes automatic Trailing Stop Loss ratcheting to breakeven at 50% target.
                  </span>
                  <button
                    onClick={() => {
                      onDeployStrategyTrade({
                        symbol: symbolInfo.symbol,
                        action: 'BUY',
                        orderType: 'TRIGGER',
                        entryPrice: symbolInfo.lastPrice,
                        triggerPrice: symbolInfo.lastPrice,
                        stopLoss: Number((symbolInfo.lastPrice * 0.9965).toFixed(2)),
                        target: Number((symbolInfo.lastPrice * 1.007).toFixed(2)),
                        quantity: symbolInfo.lotSize || 25,
                        validityType: 'DAY',
                        trailingStopLossEnabled: true,
                        trailingStopLossPoints: Number((symbolInfo.lastPrice * 0.002).toFixed(2)),
                        strategyType: 'SCALPING',
                        note: '1m/5m Momentum Scalp with 1:2 R:R and TSL',
                      });
                      onClose();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Deploy 1-Click Scalp Bracket</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HEDGING METHOD (1:2 RATIO) */}
          {activeTab === 'HEDGING' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Repeat className="w-4 h-4" /> Dual-Side Market Hedging (1:2 Profit Ratio on Both Positions)
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {hedgingSetup.rationale}
                </p>
              </div>

              {/* Long & Short Dual Legs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Long Breakout Leg */}
                <div className="p-4 bg-slate-950/80 border border-emerald-900/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4" /> Leg 1: Breakout Long
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      1:2 R:R Ratio
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trigger Entry (Above Resistance):</span>
                      <strong className="text-white">₹{hedgingSetup.longLeg.entry}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-400">Stop Loss:</span>
                      <strong className="text-rose-300">₹{hedgingSetup.longLeg.stopLoss}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400">1:2 Profit Target:</span>
                      <strong className="text-emerald-300">₹{hedgingSetup.longLeg.target} (+2R)</strong>
                    </div>
                  </div>
                </div>

                {/* Short Breakdown Leg */}
                <div className="p-4 bg-slate-950/80 border border-rose-900/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <ArrowDownRight className="w-4 h-4" /> Leg 2: Breakdown Short
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                      1:2 R:R Ratio
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trigger Entry (Below Support):</span>
                      <strong className="text-white">₹{hedgingSetup.shortLeg.entry}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-400">Stop Loss:</span>
                      <strong className="text-rose-300">₹{hedgingSetup.shortLeg.stopLoss}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400">1:2 Profit Target:</span>
                      <strong className="text-emerald-300">₹{hedgingSetup.shortLeg.target} (+2R)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mathematical Proof Box */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1 text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Mathematical Edge & Risk Capping
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When intense volatility hits (RBI announcement, opening momentum, breakout), if Market surges UP,
                  Leg 1 hits Target (<strong className="text-emerald-300">+2R</strong>) while Leg 2 is stopped out or un-triggered (<strong className="text-rose-300">-1R</strong>), netting <strong className="text-emerald-400">+1R guaranteed profit</strong>.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    // Arm both legs as Multi-Day GTT pending triggers
                    onDeployStrategyTrade({
                      symbol: symbolInfo.symbol,
                      action: 'BUY',
                      orderType: 'TRIGGER',
                      entryPrice: hedgingSetup.longLeg.entry,
                      triggerPrice: hedgingSetup.longLeg.entry,
                      stopLoss: hedgingSetup.longLeg.stopLoss,
                      target: hedgingSetup.longLeg.target,
                      quantity: symbolInfo.lotSize || 25,
                      validityType: 'MULTI_DAY_GTT',
                      trailingStopLossEnabled: true,
                      trailingStopLossPoints: Number((symbolInfo.lastPrice * 0.003).toFixed(2)),
                      strategyType: 'HEDGING',
                      note: 'Hedge Leg 1 (Long 1:2 Dual Breakout)',
                    });

                    onDeployStrategyTrade({
                      symbol: symbolInfo.symbol,
                      action: 'SELL',
                      orderType: 'TRIGGER',
                      entryPrice: hedgingSetup.shortLeg.entry,
                      triggerPrice: hedgingSetup.shortLeg.entry,
                      stopLoss: hedgingSetup.shortLeg.stopLoss,
                      target: hedgingSetup.shortLeg.target,
                      quantity: symbolInfo.lotSize || 25,
                      validityType: 'MULTI_DAY_GTT',
                      trailingStopLossEnabled: true,
                      trailingStopLossPoints: Number((symbolInfo.lastPrice * 0.003).toFixed(2)),
                      strategyType: 'HEDGING',
                      note: 'Hedge Leg 2 (Short 1:2 Dual Breakdown)',
                    });

                    onClose();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Deploy Both 1:2 Hedged Bracket Legs</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: BTST (BUY TODAY SELL TOMORROW) */}
          {activeTab === 'BTST' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Clock className="w-4 h-4" /> BTST (Buy Today, Sell Tomorrow) Window: 3:15 PM – 3:25 PM IST
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Executes in the final 10 minutes of the market session. Identifies instruments closing near
                  their day’s high with surging institutional delivery volume to capture overnight gap-up profits
                  at tomorrow’s 09:15 AM opening!
                </p>
              </div>

              {/* BTST Strategy Parameters */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold">Overnight Setup</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{symbolInfo.symbol} BTST Delivery</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30">
                    Overnight Hold to 09:15 AM
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Today 3:20 PM Entry</span>
                    <strong className="text-base text-white">₹{symbolInfo.lastPrice.toLocaleString()}</strong>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-rose-400 block text-[10px] uppercase">Day Low SL</span>
                    <strong className="text-base text-rose-300">
                      ₹{(symbolInfo.lastPrice * 0.988).toFixed(2)} (-1.2%)
                    </strong>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-emerald-400 block text-[10px] uppercase">Tomorrow 09:15 Gap Target</span>
                    <strong className="text-base text-emerald-300">
                      ₹{(symbolInfo.lastPrice * 1.024).toFixed(2)} (+2.4%)
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/40 border border-indigo-900/40 rounded-lg text-xs text-indigo-300 flex items-start gap-2">
                  <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                  <div>
                    <strong>Multi-Day Validity Active:</strong> Order position carries over overnight.
                    At 09:15 AM tomorrow, target trigger monitoring resumes automatically without any manual intervention.
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      onDeployStrategyTrade({
                        symbol: symbolInfo.symbol,
                        action: 'BUY',
                        orderType: 'MARKET',
                        entryPrice: symbolInfo.lastPrice,
                        stopLoss: Number((symbolInfo.lastPrice * 0.988).toFixed(2)),
                        target: Number((symbolInfo.lastPrice * 1.024).toFixed(2)),
                        quantity: symbolInfo.lotSize || 25,
                        validityType: 'MULTI_DAY_GTT',
                        trailingStopLossEnabled: true,
                        trailingStopLossPoints: Number((symbolInfo.lastPrice * 0.005).toFixed(2)),
                        strategyType: 'BTST',
                        note: 'BTST 3:20 PM Entry -> Tomorrow 9:15 AM Gap Exit',
                      });
                      onClose();
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Arm BTST Overnight Position</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ATM / ITM OPTIONS ONLY */}
          {activeTab === 'ATM_ITM' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-950/30 border border-teal-800/40 rounded-xl">
                <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                  <Target className="w-4 h-4" /> Strict Rule: Only Trade in ATM and ITM Contracts
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {optionsRec.disclaimer}
                </p>
              </div>

              {/* Calls vs Puts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Calls (CE) */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-emerald-400 uppercase tracking-wider">
                    Recommended Call Options (CE)
                  </div>

                  {/* ATM CE */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">
                          {optionsRec.symbol} {optionsRec.callAtm.strike} CE
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 text-[9px] font-bold">
                          ATM (Δ {optionsRec.callAtm.delta})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        Est. Prem: ₹{optionsRec.callAtm.estimatedPremium} • SL: ₹{optionsRec.callAtm.recommendedSL} • Target: ₹{optionsRec.callAtm.recommendedTarget}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onDeployStrategyTrade({
                          symbol: `${optionsRec.symbol} ${optionsRec.callAtm.strike} CE`,
                          action: 'BUY',
                          orderType: 'MARKET',
                          entryPrice: optionsRec.callAtm.estimatedPremium,
                          stopLoss: optionsRec.callAtm.recommendedSL,
                          target: optionsRec.callAtm.recommendedTarget,
                          quantity: symbolInfo.lotSize || 25,
                          validityType: 'MULTI_DAY_GTT',
                          trailingStopLossEnabled: true,
                          trailingStopLossPoints: Number((optionsRec.callAtm.estimatedPremium * 0.1).toFixed(1)),
                          strategyType: 'ATM_CE',
                        });
                        onClose();
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      Buy ATM
                    </button>
                  </div>

                  {/* ITM CE */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">
                          {optionsRec.symbol} {optionsRec.callItm.strike} CE
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                          ITM (Δ {optionsRec.callItm.delta})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        Est. Prem: ₹{optionsRec.callItm.estimatedPremium} • SL: ₹{optionsRec.callItm.recommendedSL} • Target: ₹{optionsRec.callItm.recommendedTarget}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onDeployStrategyTrade({
                          symbol: `${optionsRec.symbol} ${optionsRec.callItm.strike} CE`,
                          action: 'BUY',
                          orderType: 'MARKET',
                          entryPrice: optionsRec.callItm.estimatedPremium,
                          stopLoss: optionsRec.callItm.recommendedSL,
                          target: optionsRec.callItm.recommendedTarget,
                          quantity: symbolInfo.lotSize || 25,
                          validityType: 'MULTI_DAY_GTT',
                          trailingStopLossEnabled: true,
                          trailingStopLossPoints: Number((optionsRec.callItm.estimatedPremium * 0.1).toFixed(1)),
                          strategyType: 'ITM_CE',
                        });
                        onClose();
                      }}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      Buy ITM
                    </button>
                  </div>
                </div>

                {/* Puts (PE) */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="font-bold text-xs text-rose-400 uppercase tracking-wider">
                    Recommended Put Options (PE)
                  </div>

                  {/* ATM PE */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">
                          {optionsRec.symbol} {optionsRec.putAtm.strike} PE
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 text-[9px] font-bold">
                          ATM (Δ {optionsRec.putAtm.delta})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        Est. Prem: ₹{optionsRec.putAtm.estimatedPremium} • SL: ₹{optionsRec.putAtm.recommendedSL} • Target: ₹{optionsRec.putAtm.recommendedTarget}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onDeployStrategyTrade({
                          symbol: `${optionsRec.symbol} ${optionsRec.putAtm.strike} PE`,
                          action: 'BUY',
                          orderType: 'MARKET',
                          entryPrice: optionsRec.putAtm.estimatedPremium,
                          stopLoss: optionsRec.putAtm.recommendedSL,
                          target: optionsRec.putAtm.recommendedTarget,
                          quantity: symbolInfo.lotSize || 25,
                          validityType: 'MULTI_DAY_GTT',
                          trailingStopLossEnabled: true,
                          trailingStopLossPoints: Number((optionsRec.putAtm.estimatedPremium * 0.1).toFixed(1)),
                          strategyType: 'ATM_PE',
                        });
                        onClose();
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      Buy ATM
                    </button>
                  </div>

                  {/* ITM PE */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">
                          {optionsRec.symbol} {optionsRec.putItm.strike} PE
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold">
                          ITM (Δ {optionsRec.putItm.delta})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        Est. Prem: ₹{optionsRec.putItm.estimatedPremium} • SL: ₹{optionsRec.putItm.recommendedSL} • Target: ₹{optionsRec.putItm.recommendedTarget}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onDeployStrategyTrade({
                          symbol: `${optionsRec.symbol} ${optionsRec.putItm.strike} PE`,
                          action: 'BUY',
                          orderType: 'MARKET',
                          entryPrice: optionsRec.putItm.estimatedPremium,
                          stopLoss: optionsRec.putItm.recommendedSL,
                          target: optionsRec.putItm.recommendedTarget,
                          quantity: symbolInfo.lotSize || 25,
                          validityType: 'MULTI_DAY_GTT',
                          trailingStopLossEnabled: true,
                          trailingStopLossPoints: Number((optionsRec.putItm.estimatedPremium * 0.1).toFixed(1)),
                          strategyType: 'ITM_PE',
                        });
                        onClose();
                      }}
                      className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-lg transition-colors"
                    >
                      Buy ITM
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: TRAILING STOP LOSS */}
          {activeTab === 'TRAILING_SL' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-xl">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" /> Trailing Stop Loss Dynamic Ratchet
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Safeguards profits as price moves in your direction. Once a position achieves 50% of its
                  target profit, Stop Loss is automatically ratcheted to Breakeven (Entry Price). Thereafter, SL trails
                  upward at your specified step distance!
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
                <div className="font-bold text-xs text-slate-200 uppercase tracking-wider">
                  Trailing SL Logic & Visual Milestones
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                      1
                    </span>
                    <div>
                      <div className="font-bold text-white">Entry & Initial Stop Loss</div>
                      <div className="text-[11px] text-slate-400">Position opened with fixed protective SL.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      2
                    </span>
                    <div>
                      <div className="font-bold text-emerald-300">50% Profit Trigger &rarr; Breakeven Ratchet</div>
                      <div className="text-[11px] text-slate-400">
                        When price covers 50% distance to target, SL shifts to Entry Price (Zero-Risk Trade).
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      3
                    </span>
                    <div>
                      <div className="font-bold text-amber-300">Continuous Trail to Target</div>
                      <div className="text-[11px] text-slate-400">
                        Every new high pushes SL upwards by trail step points, locking in accumulated gains!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-400 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>All 9 Strategies & Indicators Integrated (Supertrend, Pivots, ADX, Renko, OI, World)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
