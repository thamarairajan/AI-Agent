import React, { useState, useMemo } from 'react';
import { AutoExecutionRecord, SymbolInfo } from '../types/trading';
import {
  X,
  Target,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Filter,
  Search,
  Trash2,
  ExternalLink,
  DollarSign,
  PieChart,
  BarChart2,
  RefreshCw,
} from 'lucide-react';

interface ExecutionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  executions: AutoExecutionRecord[];
  onSquareOff: (id: string) => void;
  onCancelOrder: (id: string) => void;
  onDeleteExecution: (id: string) => void;
  onClearFinished: () => void;
  onSelectSymbol?: (symbol: string) => void;
}

export const ExecutionHistoryModal: React.FC<ExecutionHistoryModalProps> = ({
  isOpen,
  onClose,
  executions,
  onSquareOff,
  onCancelOrder,
  onDeleteExecution,
  onClearFinished,
  onSelectSymbol,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Statistics
  const stats = useMemo(() => {
    const total = executions.length;
    const hitTPList = executions.filter((e) => e.status === 'HIT_TP');
    const hitSLList = executions.filter((e) => e.status === 'HIT_SL');
    const activeList = executions.filter((e) => e.status === 'ACTIVE');
    const pendingList = executions.filter((e) => e.status === 'PENDING');

    const totalRealizedProfit = hitTPList.reduce((acc, e) => acc + (e.realizedPnL || 0), 0);
    const totalRealizedLoss = hitSLList.reduce((acc, e) => acc + (e.realizedPnL || 0), 0);
    const netRealized = totalRealizedProfit + totalRealizedLoss;

    const completed = hitTPList.length + hitSLList.length;
    const winRate = completed > 0 ? Math.round((hitTPList.length / completed) * 100) : 0;

    const totalUnrealized = activeList.reduce((acc, e) => acc + (e.unrealizedPnL || 0), 0);

    return {
      total,
      hitTPCount: hitTPList.length,
      hitSLCount: hitSLList.length,
      activeCount: activeList.length,
      pendingCount: pendingList.length,
      totalRealizedProfit,
      totalRealizedLoss,
      netRealized,
      winRate,
      totalUnrealized,
    };
  }, [executions]);

  // Filtered executions
  const filteredExecutions = useMemo(() => {
    return executions.filter((exec) => {
      // Status filter
      if (filterStatus !== 'ALL') {
        if (filterStatus === 'ACTIVE' && exec.status !== 'ACTIVE') return false;
        if (filterStatus === 'HIT_TP' && exec.status !== 'HIT_TP') return false;
        if (filterStatus === 'HIT_SL' && exec.status !== 'HIT_SL') return false;
        if (filterStatus === 'PENDING' && exec.status !== 'PENDING') return false;
        if (filterStatus === 'CLOSED' && exec.status !== 'CLOSED_MANUAL' && exec.status !== 'CANCELLED') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSymbol = exec.symbol.toLowerCase().includes(q);
        const matchStrat = exec.strategyName?.toLowerCase().includes(q) || false;
        const matchId = exec.id.toLowerCase().includes(q);
        if (!matchSymbol && !matchStrat && !matchId) return false;
      }

      return true;
    });
  }, [executions, filterStatus, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-md font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Auto-Execution History & TP/SL Audit
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  {executions.length} Total Logged
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete record of every chat auto-trade setup, entry price, take-profit (TP), stop-loss (SL) & live trigger status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {executions.some((e) => e.status === 'HIT_TP' || e.status === 'HIT_SL' || e.status === 'CLOSED_MANUAL') && (
              <button
                onClick={onClearFinished}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                title="Clear completed trades from history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Closed</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-Time Metrics & Win-Rate Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 bg-slate-950/60 border-b border-slate-800/80">
          {/* 1. Win Rate */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">TP Win Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-lg font-black font-mono ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stats.winRate}%
              </span>
              <span className="text-[10px] text-slate-400">
                ({stats.hitTPCount}/{stats.hitTPCount + stats.hitSLCount})
              </span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.winRate}%` }}
              />
            </div>
          </div>

          {/* 2. Hit TP Count & Profit */}
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 font-semibold uppercase flex items-center gap-1">
                <Target className="w-3 h-3" /> Target Hit (TP)
              </span>
              <span className="text-xs font-black font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                {stats.hitTPCount}
              </span>
            </div>
            <div className="text-base font-bold font-mono text-emerald-300 mt-1">
              +₹{stats.totalRealizedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-400/80">Realized Profit</span>
          </div>

          {/* 3. Hit SL Count & Risk */}
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-rose-400 font-semibold uppercase flex items-center gap-1">
                <Shield className="w-3 h-3" /> Stop-Loss Hit (SL)
              </span>
              <span className="text-xs font-black font-mono text-rose-400 bg-rose-500/20 px-1.5 py-0.2 rounded">
                {stats.hitSLCount}
              </span>
            </div>
            <div className="text-base font-bold font-mono text-rose-300 mt-1">
              -₹{Math.abs(stats.totalRealizedLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-rose-400/80">Risk Cap Protected</span>
          </div>

          {/* 4. Active Trades Live P&L */}
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-sky-400 font-semibold uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" /> Active Open
              </span>
              <span className="text-xs font-black font-mono text-sky-400 bg-sky-500/20 px-1.5 py-0.2 rounded">
                {stats.activeCount}
              </span>
            </div>
            <div
              className={`text-base font-bold font-mono mt-1 ${
                stats.totalUnrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.totalUnrealized >= 0 ? '+' : ''}₹{stats.totalUnrealized.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">Live Unrealized P&L</span>
          </div>

          {/* 5. Net Realized PnL */}
          <div className="col-span-2 sm:col-span-1 bg-slate-800/70 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Net Strategy P&L</span>
            <div
              className={`text-base font-bold font-mono mt-1 ${
                stats.netRealized >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stats.netRealized >= 0 ? '+' : ''}₹{stats.netRealized.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400">Total Net Yield</span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-900 border-b border-slate-800">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              All ({executions.length})
            </button>
            <button
              onClick={() => setFilterStatus('ACTIVE')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'ACTIVE'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Active ({stats.activeCount})
            </button>
            <button
              onClick={() => setFilterStatus('HIT_TP')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'HIT_TP'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
              }`}
            >
              <Target className="w-3 h-3" />
              Hit TP ({stats.hitTPCount})
            </button>
            <button
              onClick={() => setFilterStatus('HIT_SL')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'HIT_SL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-rose-400'
              }`}
            >
              <Shield className="w-3 h-3" />
              Hit SL ({stats.hitSLCount})
            </button>
            <button
              onClick={() => setFilterStatus('PENDING')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterStatus === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
              }`}
            >
              <Clock className="w-3 h-3" />
              Pending ({stats.pendingCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search symbol, strategy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500"
            />
          </div>
        </div>

        {/* Executions List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredExecutions.length === 0 ? (
            <div className="py-12 px-4 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <Zap className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-bold text-slate-300">No Auto-Execution Records Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {searchQuery || filterStatus !== 'ALL'
                  ? 'No executions match your current search or filter criteria.'
                  : 'Click "⚡ Buy Auto Setup" or "⚡ Auto-Trade Intraday" on any AI agent trade signal in chat to arm bracket orders with live TP and SL tracking.'}
              </p>
            </div>
          ) : (
            filteredExecutions.map((exec) => {
              const isBuy = exec.action === 'BUY';
              const isHitTP = exec.status === 'HIT_TP';
              const isHitSL = exec.status === 'HIT_SL';
              const isActive = exec.status === 'ACTIVE';
              const isPending = exec.status === 'PENDING';

              const cmp = exec.currentPrice || exec.entryPrice;
              const tpDist = isBuy ? (exec.targetPrice - cmp).toFixed(2) : (cmp - exec.targetPrice).toFixed(2);
              const slDist = isBuy ? (cmp - exec.stopLoss).toFixed(2) : (exec.stopLoss - cmp).toFixed(2);

              return (
                <div
                  key={exec.id}
                  className={`rounded-xl border p-4 transition-all shadow-md ${
                    isHitTP
                      ? 'bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border-emerald-500/50 shadow-emerald-950/20'
                      : isHitSL
                      ? 'bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-900 border-rose-500/50 shadow-rose-950/20'
                      : isActive
                      ? 'bg-slate-950/90 border-sky-500/40 ring-1 ring-sky-500/20'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  {/* Top Row: Symbol, Side, Status Badge, Mode */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white font-mono tracking-tight">
                        {exec.symbol}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-black ${
                          isBuy ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {exec.action}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Qty: <strong className="text-white">{exec.quantity}</strong>
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                          exec.mode === 'LIVE'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {exec.mode}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {isHitTP && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/30 animate-pulse">
                          <CheckCircle2 className="w-4 h-4 fill-current" />
                          <span>🎯 HIT TP (Target Reached!)</span>
                        </span>
                      )}

                      {isHitSL && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/30">
                          <AlertOctagon className="w-4 h-4" />
                          <span>🛑 HIT SL (Stop-Loss Triggered)</span>
                        </span>
                      )}

                      {isActive && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                          <span>🟢 ACTIVE (Live Tracking)</span>
                        </span>
                      )}

                      {isPending && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>⏳ PENDING TRIGGER</span>
                        </span>
                      )}

                      {exec.status === 'CLOSED_MANUAL' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-xs">
                          Closed Manually
                        </span>
                      )}

                      {exec.status === 'CANCELLED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-500 font-bold text-xs">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core Value Metric Grid: Entry | Stop Loss | Target | Result */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 mb-3">
                    {/* Entry */}
                    <div className="p-2 bg-slate-800/80 rounded-lg">
                      <div className="text-[10px] text-slate-400 font-sans uppercase">Entry Value</div>
                      <div className="text-white font-bold text-sm">₹{exec.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        {exec.filledPrice ? `Filled @ ₹${exec.filledPrice}` : 'Trigger Level'}
                      </div>
                    </div>

                    {/* Stop Loss (SL) */}
                    <div className={`p-2 rounded-lg border ${isHitSL ? 'bg-rose-950/60 border-rose-500 text-rose-200' : 'bg-rose-950/20 border-rose-900/50'}`}>
                      <div className="text-[10px] text-rose-400 font-sans uppercase flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3" /> Stop-Loss (SL)
                      </div>
                      <div className="text-rose-300 font-bold text-sm">₹{exec.stopLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="text-[9px] text-rose-400/80 font-sans">
                        Risk: -{Math.abs(exec.entryPrice - exec.stopLoss).toFixed(1)} pts
                      </div>
                    </div>

                    {/* Target Price (TP) */}
                    <div className={`p-2 rounded-lg border ${isHitTP ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200' : 'bg-emerald-950/20 border-emerald-900/50'}`}>
                      <div className="text-[10px] text-emerald-400 font-sans uppercase flex items-center justify-center gap-1">
                        <Target className="w-3 h-3" /> Take-Profit (TP)
                      </div>
                      <div className="text-emerald-300 font-bold text-sm">₹{exec.targetPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <div className="text-[9px] text-emerald-400/80 font-sans">
                        Reward: +{Math.abs(exec.targetPrice - exec.entryPrice).toFixed(1)} pts
                      </div>
                    </div>

                    {/* Result / Realized P&L / Exit Price */}
                    <div className="p-2 bg-slate-800/80 rounded-lg">
                      <div className="text-[10px] text-slate-400 font-sans uppercase">
                        {isHitTP || isHitSL || exec.status === 'CLOSED_MANUAL' ? 'Realized P&L' : 'Live CMP / P&L'}
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          (exec.realizedPnL ?? exec.unrealizedPnL ?? 0) >= 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {(exec.realizedPnL ?? exec.unrealizedPnL ?? 0) >= 0 ? '+' : ''}₹
                        {Math.abs(exec.realizedPnL ?? exec.unrealizedPnL ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        {exec.exitPrice
                          ? `Exit: ₹${exec.exitPrice}`
                          : `CMP: ₹${exec.currentPrice || exec.entryPrice}`}
                      </div>
                    </div>
                  </div>

                  {/* Context Note & Live Distance Bar */}
                  {isActive && (
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] mb-3">
                      <div className="flex items-center justify-between text-slate-300 mb-1.5">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>Live Price: <strong className="text-white font-mono">₹{cmp}</strong></span>
                        </span>
                        <div className="flex items-center gap-3 font-mono text-[10px]">
                          <span className="text-emerald-400">TP Dist: {tpDist} pts away</span>
                          <span className="text-rose-400">SL Dist: {slDist} pts away</span>
                        </div>
                      </div>
                      {/* Range Visual Progress Bar */}
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex items-center">
                        <div className="bg-rose-500 h-full w-1/3 opacity-70" title="Stop Loss Zone" />
                        <div className="bg-amber-400 h-full w-1/3 opacity-70" title="Entry Zone" />
                        <div className="bg-emerald-500 h-full w-1/3 opacity-70" title="Target TP Zone" />
                      </div>
                    </div>
                  )}

                  {/* Hit TP Banner */}
                  {isHitTP && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎉</span>
                        <div>
                          <strong>Target Hit!</strong> Exited entire position at target price <strong>₹{exec.targetPrice}</strong>.
                          <span className="block text-[10px] text-emerald-300/80">
                            Realized profit: +₹{(exec.realizedPnL || 0).toFixed(2)} ({((exec.realizedPnLPercent || 0)).toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                      {exec.exitTime && (
                        <span className="text-[10px] font-mono text-emerald-300">
                          {new Date(exec.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Hit SL Banner */}
                  {isHitSL && (
                    <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-200 flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🛡️</span>
                        <div>
                          <strong>Stop-Loss Hit!</strong> Auto-closed at <strong>₹{exec.stopLoss}</strong> to protect capital and prevent further drawdown.
                          <span className="block text-[10px] text-rose-300/80">
                            Capped loss: -₹{Math.abs(exec.realizedPnL || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {exec.exitTime && (
                        <span className="text-[10px] font-mono text-rose-300">
                          {new Date(exec.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer Bar: Strategy, Timestamps, and Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>Strategy: <strong className="text-slate-300">{exec.strategyName || 'AI Confluence'}</strong></span>
                      <span>&bull;</span>
                      <span>
                        Time: {new Date(exec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {exec.validityType && (
                        <>
                          <span>&bull;</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {exec.validityType}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectSymbol && (
                        <button
                          onClick={() => {
                            onSelectSymbol(exec.symbol);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                        >
                          <BarChart2 className="w-3 h-3 text-orange-400" />
                          <span>View Chart</span>
                        </button>
                      )}

                      {isActive && (
                        <button
                          onClick={() => onSquareOff(exec.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Square Off Now
                        </button>
                      )}

                      {isPending && (
                        <button
                          onClick={() => onCancelOrder(exec.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Cancel Trigger
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteExecution(exec.id)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-time NSE/BSE tick evaluation active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
