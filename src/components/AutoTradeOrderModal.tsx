import React, { useState, useEffect } from 'react';
import { SymbolInfo, TradeSignal, DhanOrderPayload } from '../types/trading';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Crosshair,
  DollarSign,
  HelpCircle,
  Percent,
  Play,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  Terminal,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

interface AutoTradeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbolInfo: SymbolInfo;
  activeSignal?: TradeSignal | null;
  onArmAutoTrade: (config: {
    symbol: string;
    action: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'TRIGGER';
    entryPrice: number;
    triggerPrice?: number;
    stopLoss: number;
    target: number;
    quantity: number;
    mode: 'PAPER' | 'LIVE';
    validityType?: 'DAY' | 'MULTI_DAY_GTT';
    trailingStopLossEnabled?: boolean;
    trailingStopLossPoints?: number;
    strategyType?: string;
  }) => void;
  liveTradingArmed: boolean;
  onArmLiveTrading?: () => void;
}

export const AutoTradeOrderModal: React.FC<AutoTradeOrderModalProps> = ({
  isOpen,
  onClose,
  symbolInfo,
  activeSignal,
  onArmAutoTrade,
  liveTradingArmed,
  onArmLiveTrading,
}) => {
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'TRIGGER'>('MARKET');
  const [entryPrice, setEntryPrice] = useState<number>(symbolInfo.lastPrice);
  const [stopLoss, setStopLoss] = useState<number>(() =>
    Number((symbolInfo.lastPrice * 0.99).toFixed(2))
  );
  const [target, setTarget] = useState<number>(() =>
    Number((symbolInfo.lastPrice * 1.02).toFixed(2))
  );
  const [quantity, setQuantity] = useState<number>(symbolInfo.lotSize || 25);
  const [tradeMode, setTradeMode] = useState<'PAPER' | 'LIVE'>(() => (liveTradingArmed ? 'LIVE' : 'PAPER'));
  const [validityType, setValidityType] = useState<'DAY' | 'MULTI_DAY_GTT'>('MULTI_DAY_GTT');
  const [trailingStopLossEnabled, setTrailingStopLossEnabled] = useState<boolean>(true);
  const [trailingStopLossPoints, setTrailingStopLossPoints] = useState<number>(() =>
    Math.max(1, Math.round(symbolInfo.lastPrice * 0.003 * 10) / 10)
  );
  const [strategyType, setStrategyType] = useState<string>('CONFLUENCE');
  const [showPayload, setShowPayload] = useState(false);

  // Update defaults when symbol or activeSignal changes
  useEffect(() => {
    if (activeSignal && activeSignal.symbol === symbolInfo.symbol) {
      setAction(activeSignal.action === 'SELL' ? 'SELL' : 'BUY');
      setEntryPrice(activeSignal.entryPrice);
      setStopLoss(activeSignal.stopLoss);
      setTarget(activeSignal.targetPrice);
    } else {
      setEntryPrice(symbolInfo.lastPrice);
      if (action === 'BUY') {
        setStopLoss(Number((symbolInfo.lastPrice * 0.99).toFixed(2)));
        setTarget(Number((symbolInfo.lastPrice * 1.02).toFixed(2)));
      } else {
        setStopLoss(Number((symbolInfo.lastPrice * 1.01).toFixed(2)));
        setTarget(Number((symbolInfo.lastPrice * 0.98).toFixed(2)));
      }
    }
  }, [symbolInfo.symbol, activeSignal]);

  if (!isOpen) return null;

  // Calculations
  const riskPerUnit = action === 'BUY' ? entryPrice - stopLoss : stopLoss - entryPrice;
  const rewardPerUnit = action === 'BUY' ? target - entryPrice : entryPrice - target;

  const totalRisk = Math.max(0, Number((riskPerUnit * quantity).toFixed(2)));
  const totalReward = Math.max(0, Number((rewardPerUnit * quantity).toFixed(2)));
  const riskRewardRatio = riskPerUnit > 0 ? (rewardPerUnit / riskPerUnit).toFixed(2) : '0';

  const handleApplyAISignal = () => {
    if (activeSignal) {
      setAction(activeSignal.action === 'SELL' ? 'SELL' : 'BUY');
      setEntryPrice(activeSignal.entryPrice);
      setStopLoss(activeSignal.stopLoss);
      setTarget(activeSignal.targetPrice);
      if (activeSignal.dhanOrderPayload?.quantity) {
        setQuantity(activeSignal.dhanOrderPayload.quantity);
      }
    }
  };

  const handleApplyPercentageSL = (pct: number) => {
    if (action === 'BUY') {
      setStopLoss(Number((entryPrice * (1 - pct / 100)).toFixed(2)));
    } else {
      setStopLoss(Number((entryPrice * (1 + pct / 100)).toFixed(2)));
    }
  };

  const handleApplyPercentageTarget = (pct: number) => {
    if (action === 'BUY') {
      setTarget(Number((entryPrice * (1 + pct / 100)).toFixed(2)));
    } else {
      setTarget(Number((entryPrice * (1 - pct / 100)).toFixed(2)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (action === 'BUY') {
      if (stopLoss >= entryPrice) {
        alert('For a BUY order, Stop Loss must be BELOW the Entry Price.');
        return;
      }
      if (target <= entryPrice) {
        alert('For a BUY order, Target must be ABOVE the Entry Price.');
        return;
      }
    } else {
      if (stopLoss <= entryPrice) {
        alert('For a SELL order, Stop Loss must be ABOVE the Entry Price.');
        return;
      }
      if (target >= entryPrice) {
        alert('For a SELL order, Target must be BELOW the Entry Price.');
        return;
      }
    }

    onArmAutoTrade({
      symbol: symbolInfo.symbol,
      action,
      orderType,
      entryPrice,
      triggerPrice: orderType === 'TRIGGER' ? entryPrice : undefined,
      stopLoss,
      target,
      quantity,
      mode: tradeMode,
      validityType,
      trailingStopLossEnabled,
      trailingStopLossPoints,
      strategyType,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="auto-trade-modal"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Auto-Trade Bracket Order (GTT / OCO)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                  Auto SL + Target
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automate entry trigger, trailing stop-loss, and profit target exit
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300">
          {/* Active Signal Banner if available */}
          {activeSignal && activeSignal.symbol === symbolInfo.symbol && (
            <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs font-bold text-sky-300">AI Signal Detected</span>
                  <span className="text-[11px] text-slate-400 block">
                    {activeSignal.action} @ ₹{activeSignal.entryPrice} | SL: ₹{activeSignal.stopLoss} | TP: ₹{activeSignal.targetPrice}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleApplyAISignal}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
              >
                Use AI Levels
              </button>
            </div>
          )}

          {/* Action Tabs: BUY vs SELL */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAction('BUY');
                setStopLoss(Number((entryPrice * 0.99).toFixed(2)));
                setTarget(Number((entryPrice * 1.02).toFixed(2)));
              }}
              className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                action === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> BUY / LONG
            </button>
            <button
              type="button"
              onClick={() => {
                setAction('SELL');
                setStopLoss(Number((entryPrice * 1.01).toFixed(2)));
                setTarget(Number((entryPrice * 0.98).toFixed(2)));
              }}
              className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                action === 'SELL'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" /> SELL / SHORT
            </button>
          </div>

          {/* Order Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setOrderType('MARKET');
                setEntryPrice(symbolInfo.lastPrice);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                orderType === 'MARKET'
                  ? 'bg-slate-800 border-sky-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold text-xs">Instant Market Entry</div>
              <div className="text-[10px] text-slate-400">
                Fills at current price (₹{symbolInfo.lastPrice}), arms auto SL/TP
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('TRIGGER')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                orderType === 'TRIGGER'
                  ? 'bg-slate-800 border-sky-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold text-xs">Pending Trigger (GTT)</div>
              <div className="text-[10px] text-slate-400">
                Auto-enters ONLY when price reaches your Entry level
              </div>
            </button>
          </div>

          {/* Pricing Grid: Entry / SL / Target */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            {/* Entry Price */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase text-slate-400 font-bold">
                  {orderType === 'TRIGGER' ? 'Entry Trigger Price (₹)' : 'Entry Price (₹)'}
                </label>
                <button
                  type="button"
                  onClick={() => setEntryPrice(symbolInfo.lastPrice)}
                  className="text-[10px] text-sky-400 hover:underline"
                >
                  Current LTP: ₹{symbolInfo.lastPrice}
                </button>
              </div>
              <input
                type="number"
                step="0.05"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Stop Loss Input & Quick Pills */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase text-rose-400 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Stop-Loss Price (₹)
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-slate-500">Quick:</span>
                  {[0.5, 1.0, 1.5, 2.0].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleApplyPercentageSL(p)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 border border-slate-700"
                    >
                      -{p}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.05"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="w-full bg-slate-900 border border-rose-900/60 focus:border-rose-500 rounded-lg px-3 py-2 text-sm text-rose-300 font-mono font-bold focus:outline-none"
              />
            </div>

            {/* Target Price Input & Quick Pills */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase text-emerald-400 font-bold flex items-center gap-1">
                  <Target className="w-3 h-3" /> Profit Target Price (₹)
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-slate-500">Quick:</span>
                  {[1.0, 2.0, 3.0, 5.0].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleApplyPercentageTarget(p)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-400 border border-slate-700"
                    >
                      +{p}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.05"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="w-full bg-slate-900 border border-emerald-900/60 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono font-bold focus:outline-none"
              />
            </div>

            {/* Quantity */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase text-slate-400 font-bold">
                  Quantity (Lots / Shares)
                </label>
                <span className="text-[10px] text-slate-500">Lot size: {symbolInfo.lotSize}</span>
              </div>
              <input
                type="number"
                min="1"
                step={symbolInfo.lotSize || 1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Risk:Reward & Metric Gauge */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center font-mono">
            <div className="p-1.5 bg-rose-950/20 border border-rose-900/30 rounded-lg">
              <div className="text-[9px] text-rose-400 uppercase font-medium">Max Risk</div>
              <div className="text-xs font-bold text-rose-300">₹{totalRisk.toLocaleString()}</div>
            </div>
            <div className="p-1.5 bg-sky-950/20 border border-sky-900/30 rounded-lg">
              <div className="text-[9px] text-sky-400 uppercase font-medium">Risk : Reward</div>
              <div className="text-xs font-bold text-sky-300">1 : {riskRewardRatio}</div>
            </div>
            <div className="p-1.5 bg-emerald-950/20 border border-emerald-900/30 rounded-lg">
              <div className="text-[9px] text-emerald-400 uppercase font-medium">Max Reward</div>
              <div className="text-xs font-bold text-emerald-300">₹{totalReward.toLocaleString()}</div>
            </div>
          </div>

          {/* Multi-Day Validity & Market Timing Setting */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-white block">Order Validity & Carryover</span>
                <span className="text-[10px] text-slate-400">
                  {validityType === 'MULTI_DAY_GTT'
                    ? 'Armed across market closes: If trigger point is not reached today (09:15-15:25), carries over to tomorrow 09:15 AM!'
                    : 'Intraday Day order: Automatically expires at 15:25 IST market closing'}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setValidityType('MULTI_DAY_GTT')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    validityType === 'MULTI_DAY_GTT'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Keeps order active tomorrow if not reached today"
                >
                  Multi-Day GTT
                </button>
                <button
                  type="button"
                  onClick={() => setValidityType('DAY')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    validityType === 'DAY'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Expires today at 3:25 PM"
                >
                  Day Order
                </button>
              </div>
            </div>

            {/* Trailing Stop Loss Sub-Section */}
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trailingStopLossEnabled}
                  onChange={(e) => setTrailingStopLossEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700"
                />
                <span className="text-xs text-slate-300 font-semibold">Enable Trailing Stop Loss</span>
              </label>

              {trailingStopLossEnabled && (
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-[10px] text-slate-400">Trail Step (₹):</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    value={trailingStopLossPoints}
                    onChange={(e) => setTrailingStopLossPoints(Number(e.target.value))}
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Execution Environment Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="font-bold text-xs text-white block">Execution Routing</span>
                <span className="text-[10px] text-slate-400">
                  {tradeMode === 'PAPER'
                    ? 'Runs in ₹10,00,000 Virtual Paper Account with auto SL/TP'
                    : 'Routes real orders directly to Dhan API v2 Exchange'}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTradeMode('PAPER')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    tradeMode === 'PAPER'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PAPER
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!liveTradingArmed) {
                      const confirmArm = window.confirm(
                        'Live trading is currently disarmed in Settings.\n\nWould you like to ARM Live Trading now and route real orders to Dhan?'
                      );
                      if (confirmArm && onArmLiveTrading) {
                        onArmLiveTrading();
                        setTradeMode('LIVE');
                      }
                      return;
                    }
                    setTradeMode('LIVE');
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    tradeMode === 'LIVE'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  LIVE DHAN
                </button>
              </div>
            </div>

            {/* Live Trading Warning/Arming Banner */}
            {!liveTradingArmed ? (
              <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  Live trading is currently disarmed in Settings.
                </span>
                {onArmLiveTrading && (
                  <button
                    type="button"
                    onClick={() => {
                      onArmLiveTrading();
                      setTradeMode('LIVE');
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg cursor-pointer transition-colors shadow-sm shrink-0"
                  >
                    ⚡ Arm Live Now
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[10px]">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Live Trading is ARMED. Selecting 'LIVE DHAN' will dispatch real broker orders.
                </span>
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            id="arm-auto-trade-btn"
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              action === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>
              {orderType === 'MARKET' ? 'Execute Auto-Trade' : 'Arm Pending Trigger Order'} (
              {action} {quantity} {symbolInfo.symbol})
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
