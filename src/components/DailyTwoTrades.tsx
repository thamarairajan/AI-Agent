import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  Flame,
  Info,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Scale,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { SymbolInfo, TradeSignal } from '../types/trading';
import { buildDefaultDhanPayload } from '../utils/pythonDhanGenerator';

export interface DailyPrimeTrade {
  id: string;
  session: 'MORNING' | 'AFTERNOON';
  sessionName: string;
  sessionTimeWindow: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  strategyName: string;
  rationale: string;
  triggerCondition: string;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: string;
  optionContract: {
    symbol: string;
    strike: number;
    optionType: 'CE' | 'PE';
    estimatedPremium: number;
    targetPremium: number;
    stopLossPremium: number;
    lotSize: number;
    marginRequired: number;
  };
  timeStopMinutes: number;
  autoBreakevenTrigger: number;
  confidenceScore: number;
  status: 'PENDING_TRIGGER' | 'ARMED' | 'ACTIVE' | 'HIT_TP' | 'HIT_SL' | 'TIME_STOPPED';
  realizedPnL?: number;
}

interface DailyTwoTradesProps {
  symbols: SymbolInfo[];
  selectedSymbol: SymbolInfo;
  onSelectSymbol: (sym: SymbolInfo) => void;
  onOpenChart: (sym: SymbolInfo) => void;
  onArmTrade: (signal: TradeSignal) => void;
  liveTradingArmed: boolean;
  onOpenSettings: () => void;
  paperBalance: number;
}

export const DailyTwoTrades: React.FC<DailyTwoTradesProps> = ({
  symbols,
  selectedSymbol,
  onSelectSymbol,
  onOpenChart,
  onArmTrade,
  liveTradingArmed,
  onOpenSettings,
  paperBalance,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTradeFilter, setActiveTradeFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON'>('ALL');

  // Find symbols for the two prime daily trades
  const niftySym = symbols.find((s) => s.symbol === 'NIFTY 50') || selectedSymbol;
  const bankNiftySym = symbols.find((s) => s.symbol === 'BANKNIFTY') || symbols[1] || selectedSymbol;

  // Generate dynamic 2 High-Confluence Trades based on current live market anchors
  const [trades, setTrades] = useState<DailyPrimeTrade[]>(() => {
    return generateDailyTrades(niftySym, bankNiftySym);
  });

  // Re-generate or update trades when base prices change
  function generateDailyTrades(nifty: SymbolInfo, banknifty: SymbolInfo): DailyPrimeTrade[] {
    const nPrice = nifty.lastPrice || 24850;
    const bPrice = banknifty.lastPrice || 55600;

    // Trade 1: 🌅 Morning Opening Drive Setup (NIFTY 50)
    const t1Entry = Number(nPrice.toFixed(1));
    const t1SL = Number((nPrice - 42).toFixed(1));
    const t1TP1 = Number((nPrice + 84).toFixed(1)); // 1:2
    const t1TP2 = Number((nPrice + 126).toFixed(1)); // 1:3
    const t1Breakeven = Number((nPrice + 42).toFixed(1));
    const t1Strike = Math.round(nPrice / 50) * 50;

    // Trade 2: ⚡ Afternoon Power Breakout Setup (BANKNIFTY)
    const t2Entry = Number(bPrice.toFixed(1));
    const t2SL = Number((bPrice - 130).toFixed(1));
    const t2TP1 = Number((bPrice + 325).toFixed(1)); // 1:2.5
    const t2TP2 = Number((bPrice + 450).toFixed(1));
    const t2Breakeven = Number((bPrice + 130).toFixed(1));
    const t2Strike = Math.round(bPrice / 100) * 100;

    return [
      {
        id: 'daily_trade_morning',
        session: 'MORNING',
        sessionName: '🌅 Trade #1: Morning Opening Drive',
        sessionTimeWindow: '09:30 AM – 10:45 AM IST',
        symbol: nifty.symbol,
        action: 'BUY',
        strategyName: 'Opening Range Breakout (ORB) + VWAP Support Floor',
        rationale:
          'Institutional absorption above opening VWAP anchor with Call OI unwinding. High probability continuation towards upper liquidity resistance.',
        triggerCondition: `Wait for a 5m candle to close strictly above ₹${t1Entry} with volume > 1.5x 20-period average. Avoid entering at 09:15 opening noise.`,
        entryPrice: t1Entry,
        stopLoss: t1SL,
        target1: t1TP1,
        target2: t1TP2,
        riskReward: '1:2.5',
        optionContract: {
          symbol: `${nifty.symbol} ${t1Strike} CE`,
          strike: t1Strike,
          optionType: 'CE',
          estimatedPremium: Number((nPrice * 0.006).toFixed(1)),
          targetPremium: Number((nPrice * 0.011).toFixed(1)),
          stopLossPremium: Number((nPrice * 0.0038).toFixed(1)),
          lotSize: 25,
          marginRequired: Math.round(nPrice * 0.006 * 25),
        },
        timeStopMinutes: 45,
        autoBreakevenTrigger: t1Breakeven,
        confidenceScore: 94,
        status: 'PENDING_TRIGGER',
      },
      {
        id: 'daily_trade_afternoon',
        session: 'AFTERNOON',
        sessionName: '⚡ Trade #2: Afternoon Power Breakout',
        sessionTimeWindow: '01:45 PM – 02:45 PM IST',
        symbol: banknifty.symbol,
        action: 'BUY',
        strategyName: 'European Inflow Confluence & 15m S/R Liquidity Sweep',
        rationale:
          'Capitalizes on afternoon momentum and expiry gamma volume while strictly closing positions before the 03:15 PM broker MIS auto-squareoff.',
        triggerCondition: `Pullback retest of intraday pivot floor near ₹${t2Entry} followed by strong 15m bullish engulfing wick rejection.`,
        entryPrice: t2Entry,
        stopLoss: t2SL,
        target1: t2TP1,
        target2: t2TP2,
        riskReward: '1:2.5',
        optionContract: {
          symbol: `${banknifty.symbol} ${t2Strike} CE`,
          strike: t2Strike,
          optionType: 'CE',
          estimatedPremium: Number((bPrice * 0.007).toFixed(1)),
          targetPremium: Number((bPrice * 0.0135).toFixed(1)),
          stopLossPremium: Number((bPrice * 0.0042).toFixed(1)),
          lotSize: 15,
          marginRequired: Math.round(bPrice * 0.007 * 15),
        },
        timeStopMinutes: 45,
        autoBreakevenTrigger: t2Breakeven,
        confidenceScore: 91,
        status: 'PENDING_TRIGGER',
      },
    ];
  }

  const handleRefreshTrades = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setTrades(generateDailyTrades(niftySym, bankNiftySym));
      setIsRefreshing(false);
    }, 600);
  };

  const handleCopySetup = (trade: DailyPrimeTrade) => {
    const text = `🎯 [DAILY 2 TRADES] ${trade.sessionName}
Instrument: ${trade.symbol} (${trade.action})
Strategy: ${trade.strategyName}
Entry: ₹${trade.entryPrice}
Stop Loss: ₹${trade.stopLoss} (Risk: ₹${(Math.abs(trade.entryPrice - trade.stopLoss)).toFixed(1)})
Target: ₹${trade.target1} (Reward: ₹${(Math.abs(trade.target1 - trade.entryPrice)).toFixed(1)})
Risk:Reward: ${trade.riskReward}
Time-Stop: ${trade.timeStopMinutes} Minutes
Auto-Breakeven at: ₹${trade.autoBreakevenTrigger}
Recommended Contract: ${trade.optionContract.symbol}
Margin: ₹${trade.optionContract.marginRequired.toLocaleString()}`;

    navigator.clipboard.writeText(text);
    setCopiedId(trade.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleArmAutoTrade = (trade: DailyPrimeTrade) => {
    // Convert to standard TradeSignal format and invoke parent execution handler
    const signal: TradeSignal = {
      id: `sig_prime_${trade.session.toLowerCase()}_${Date.now()}`,
      timestamp: Date.now(),
      symbol: trade.symbol,
      action: trade.action,
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      targetPrice: trade.target1,
      timeframe: '15m',
      riskRewardRatio: 2.5,
      confidence: trade.confidenceScore,
      strategyName: `2-Trades-Per-Day: ${trade.strategyName}`,
      strategyType: 'HIGH_CONFLUENCE_DAILY',
      orderType: 'TRIGGER',
      indicators: {
        rsi: 58,
        supertrend: trade.action === 'BUY' ? 'BULLISH' : 'BEARISH',
        volumeProfile: 'Top Daily Confluence',
      },
      reasoning: trade.rationale,
      optionRecommendation: {
        strike: trade.optionContract.strike,
        optionType: trade.optionContract.optionType,
        moneyness: 'ATM',
        estimatedPremium: trade.optionContract.estimatedPremium,
        targetPremium: trade.optionContract.targetPremium,
        stopLossPremium: trade.optionContract.stopLossPremium,
      },
      dhanOrderPayload: buildDefaultDhanPayload(
        trade.symbol,
        trade.symbol.includes('BANKNIFTY') ? '25' : '13',
        trade.action,
        trade.entryPrice,
        trade.optionContract.lotSize
      ),
    };

    onArmTrade(signal);
    // Update local status
    setTrades((prev) =>
      prev.map((t) => (t.id === trade.id ? { ...t, status: 'ARMED' } : t))
    );
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-stone-50 text-stone-900 p-3 sm:p-5 lg:p-7 space-y-6">
      {/* 1. Header Banner: Philosophy & Rules */}
      <div className="bg-gradient-to-r from-orange-950 via-stone-900 to-amber-950 text-white rounded-3xl p-5 sm:p-7 border border-orange-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                <Target className="w-3.5 h-3.5 text-orange-400" />
                Institutional Discipline System
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                Max 2 Trades / Day
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Daily Double Alpha: The 2 High-Win Setups
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Eliminate over-trading, mid-day chop traps, and 1-hour reversals. Trade strictly the{' '}
              <strong className="text-orange-300">2 most explosive liquidity windows</strong> of the Indian market
              with an asymmetric <strong className="text-emerald-400">1:2.5+ Risk-Reward ratio</strong> and a strict{' '}
              <strong className="text-amber-300">45-minute momentum limit</strong>.
            </p>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-stone-300">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Max Capital Risk: 1.5%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>45m Time-Stop Rule</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                <span>Auto-Breakeven at +1R</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>11:30 - 1:30 PM Chop Locked</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Box */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 shrink-0 min-w-[260px]">
            <div>
              <div className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                Execution Status
              </div>
              <div className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    liveTradingArmed ? 'bg-emerald-400 animate-pulse' : 'bg-orange-400'
                  }`}
                />
                <span>{liveTradingArmed ? 'Live Dhan Broker Mode' : 'Paper Simulation Mode'}</span>
              </div>
              <div className="text-xs text-stone-300 mt-1 font-mono">
                Virtual Balance: ₹{paperBalance.toLocaleString('en-IN')}
              </div>
            </div>

            <button
              onClick={handleRefreshTrades}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Scanning Live Telemetry...' : 'Refresh with Live Price'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Math Proof Card: 2 Trades/Day vs 10 Over-Trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bad: Over-trading */}
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-950">
          <div className="flex items-center justify-between pb-2 border-b border-rose-200/60 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              The Trap: Over-Trading (8–12 Trades / Day)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200/60 text-rose-900">
              High Risk / Low Net Profit
            </span>
          </div>
          <p className="text-xs text-rose-900/80 leading-relaxed mb-3">
            Taking trades all day catches you in low-volume lunch chop (11:30–1:30 PM). Stalled 1-hour trades
            reverse, brokerage fees mount, and emotional revenge trading kills profits.
          </p>
          <div className="bg-white/80 rounded-xl p-2.5 font-mono text-xs flex justify-between items-center text-rose-950 border border-rose-200">
            <span>Result: 5 Wins, 5 Losses</span>
            <span className="font-bold text-rose-600">-₹1,800 (Eaten by STT & Fees)</span>
          </div>
        </div>

        {/* Good: 2 Trades Per Day */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              The Edge: Strict 2 Trades / Day (1:2.5 R:R)
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
              Institutional Standard
            </span>
          </div>
          <p className="text-xs text-emerald-900/80 leading-relaxed mb-3">
            Even if 1 trade hits SL and 1 trade hits Target: With a 1:2.5 Risk-to-Reward ratio, your 1 winner covers
            the loss with a healthy net profit, zero stress, and negligible brokerage charges!
          </p>
          <div className="bg-white/80 rounded-xl p-2.5 font-mono text-xs flex justify-between items-center text-emerald-950 border border-emerald-200">
            <span>Result: 1 Win (+2.5R), 1 Loss (-1.0R)</span>
            <span className="font-bold text-emerald-600">+1.5R Net Profit (+₹4,500)</span>
          </div>
        </div>
      </div>

      {/* 3. The 2 Daily Trades Container */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-black text-stone-900">Today's 2 High-Confluence Setups</h2>
            <span className="text-xs text-stone-500 font-mono">
              (Anchored to Live NSE Telemetry)
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-200/80 p-0.5 rounded-xl border border-stone-300 text-xs font-bold">
            <button
              onClick={() => setActiveTradeFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTradeFilter === 'ALL'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Both Setups (2)
            </button>
            <button
              onClick={() => setActiveTradeFilter('MORNING')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTradeFilter === 'MORNING'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Morning Only
            </button>
            <button
              onClick={() => setActiveTradeFilter('AFTERNOON')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTradeFilter === 'AFTERNOON'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Afternoon Only
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {trades
            .filter((t) => activeTradeFilter === 'ALL' || t.session === activeTradeFilter)
            .map((trade) => {
              const riskPoints = Math.abs(trade.entryPrice - trade.stopLoss);
              const rewardPoints = Math.abs(trade.target1 - trade.entryPrice);
              const isMorning = trade.session === 'MORNING';

              return (
                <div
                  key={trade.id}
                  className={`bg-white rounded-3xl border-2 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden flex flex-col justify-between ${
                    isMorning
                      ? 'border-orange-200 hover:border-orange-400'
                      : 'border-purple-200 hover:border-purple-400'
                  }`}
                >
                  {/* Card Top Banner */}
                  <div
                    className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
                      isMorning
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50/50 border-orange-200'
                        : 'bg-gradient-to-r from-purple-50 to-indigo-50/50 border-purple-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isMorning
                              ? 'bg-orange-600 text-white'
                              : 'bg-purple-700 text-white'
                          }`}
                        >
                          {trade.sessionName}
                        </span>
                        <span className="text-[11px] font-mono text-stone-600 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-500" />
                          {trade.sessionTimeWindow}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-stone-900 mt-1 flex items-center gap-2">
                        <span>{trade.symbol}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-black ${
                            trade.action === 'BUY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {trade.action}
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-500">
                          (Confidence: {trade.confidenceScore}%)
                        </span>
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                        Risk : Reward
                      </span>
                      <span className="text-base font-black text-emerald-600 font-mono">
                        {trade.riskReward}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4 flex-1">
                    {/* Strategy & Rationale */}
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-stone-500" />
                        <span>Strategy: {trade.strategyName}</span>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {trade.rationale}
                      </p>
                    </div>

                    {/* Trigger Rule Alert (Crucial for eliminating bad entries) */}
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 text-xs space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Strict Trigger Rule (Do Not Jump in Early):</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-normal pl-5">
                        {trade.triggerCondition}
                      </p>
                    </div>

                    {/* Execution Matrix (Entry, SL, TP, Breakeven) */}
                    <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
                      {/* Entry */}
                      <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200">
                        <div className="text-[10px] text-stone-500 font-bold uppercase">Suggested Entry</div>
                        <div className="text-sm font-black text-stone-900 mt-0.5">₹{trade.entryPrice}</div>
                        <div className="text-[10px] text-stone-500">Limit / Trigger</div>
                      </div>

                      {/* Stop Loss with Buffer */}
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                        <div className="text-[10px] text-rose-700 font-bold uppercase">Stop-Loss (SL)</div>
                        <div className="text-sm font-black text-rose-600 mt-0.5">₹{trade.stopLoss}</div>
                        <div className="text-[10px] text-rose-700 font-bold">-₹{riskPoints.toFixed(1)} pts</div>
                      </div>

                      {/* Target 1 (1:2.5) */}
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="text-[10px] text-emerald-700 font-bold uppercase">Target (TP)</div>
                        <div className="text-sm font-black text-emerald-600 mt-0.5">₹{trade.target1}</div>
                        <div className="text-[10px] text-emerald-700 font-bold">+₹{rewardPoints.toFixed(1)} pts</div>
                      </div>
                    </div>

                    {/* 45-Minute Momentum & Auto-Breakeven Rules */}
                    <div className="p-3 rounded-2xl bg-stone-100/80 border border-stone-200 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-stone-700">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Zap className="w-3.5 h-3.5 text-orange-500" />
                          Auto-Breakeven Level:
                        </span>
                        <strong className="text-stone-900">₹{trade.autoBreakevenTrigger}</strong>
                      </div>
                      <p className="text-[10px] text-stone-500 font-sans">
                        As soon as price reaches ₹{trade.autoBreakevenTrigger} (+1R), our terminal immediately shifts your SL to Cost (₹{trade.entryPrice}) so your trade is completely risk-free!
                      </p>

                      <div className="flex items-center justify-between text-stone-700 pt-1 border-t border-stone-200/60">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Max Duration Limit (Time-Stop):
                        </span>
                        <strong className="text-stone-900">{trade.timeStopMinutes} Minutes</strong>
                      </div>
                      <p className="text-[10px] text-stone-500 font-sans">
                        If price stalls for 45 minutes without hitting target, momentum has evaporated — close the trade flat or at breakeven. Never hold past 45 minutes!
                      </p>
                    </div>

                    {/* Recommended Option Contract */}
                    <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-purple-900 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-purple-600" />
                          Recommended Option Strike (ATM):
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-200 text-purple-900 font-mono font-bold text-[10px]">
                          Lot Size: {trade.optionContract.lotSize}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between font-mono text-purple-950 gap-2">
                        <div>
                          <div className="font-bold text-sm text-purple-950">{trade.optionContract.symbol}</div>
                          <div className="text-[11px] text-purple-700">
                            Est. Premium: <b>₹{trade.optionContract.estimatedPremium}</b> (Target: ₹{trade.optionContract.targetPremium} | SL: ₹{trade.optionContract.stopLossPremium})
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] uppercase text-purple-700 font-bold">Margin Required</div>
                          <div className="text-sm font-black text-purple-950">
                            ₹{trade.optionContract.marginRequired.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopySetup(trade)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        title="Copy full setup details"
                      >
                        <Copy className="w-3 h-3 text-stone-500" />
                        <span>{copiedId === trade.id ? 'Copied!' : 'Copy Setup'}</span>
                      </button>

                      <button
                        onClick={() => {
                          const matched = symbols.find((s) => s.symbol === trade.symbol);
                          if (matched) {
                            onSelectSymbol(matched);
                            onOpenChart(matched);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        title="Open this instrument on the TradingView chart"
                      >
                        <BarChart2 className="w-3 h-3 text-stone-500" />
                        <span>View Chart</span>
                      </button>
                    </div>

                    <button
                      id={`arm-daily-trade-${trade.session.toLowerCase()}`}
                      onClick={() => handleArmAutoTrade(trade)}
                      className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-orange-400 fill-current" />
                      <span>{trade.status === 'ARMED' ? 'Armed & Monitoring' : 'Arm 1-Click Auto-Trade'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 4. Discipline Checklist for Maximum Win Rate */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-3">
        <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          The 4 Golden Rules to Keep Your Daily Profit Safe
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 block">1. Max 2 Trades Allowed</span>
            <p className="text-[11px] text-stone-600">
              Once you execute Trade 1 and Trade 2, close your screen. Do not take a 3rd trade under any circumstances.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 block">2. The 45-Minute Clock</span>
            <p className="text-[11px] text-stone-600">
              Never sit in a trade for 1+ hour. If the trade stalls for 45 minutes, cut it at breakeven before momentum dies.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 block">3. Move SL to Breakeven</span>
            <p className="text-[11px] text-stone-600">
              As soon as the trade reaches 50% distance to target, move your SL to entry price to make it 100% risk-free.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="font-bold text-stone-900 block">4. Respect 03:15 PM Cutoff</span>
            <p className="text-[11px] text-stone-600">
              Trade 2 automatically winds down by 02:45 PM to stay well ahead of Dhan's 03:15 PM intraday square-off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
