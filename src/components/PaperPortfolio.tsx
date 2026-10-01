import React, { useState, useMemo } from 'react';
import { Order, Position, AutoExecutionRecord } from '../types/trading';
import {
  CheckCircle2,
  Clock,
  PieChart,
  RefreshCw,
  Shield,
  Trash2,
  TrendingUp,
  Zap,
  Target,
  AlertOctagon,
  Search,
  Filter,
  BarChart2,
} from 'lucide-react';

interface PaperPortfolioProps {
  balance: number;
  positions: Position[];
  orders: Order[];
  executions?: AutoExecutionRecord[];
  onClosePosition: (id: string) => void;
  onCancelOrder?: (id: string) => void;
  onResetPaperAccount: () => void;
  onSquareOffExecution?: (id: string) => void;
  onCancelExecution?: (id: string) => void;
  onDeleteExecution?: (id: string) => void;
  onClearFinishedExecutions?: () => void;
  onSelectSymbol?: (symbol: string) => void;
  liveTradingArmed: boolean;
  dhanConnected: boolean;
  defaultSubTab?: 'EXECUTIONS' | 'POSITIONS' | 'PENDING' | 'AUDIT';
}

export const PaperPortfolio: React.FC<PaperPortfolioProps> = ({
  balance,
  positions,
  orders,
  executions = [],
  onClosePosition,
  onCancelOrder,
  onResetPaperAccount,
  onSquareOffExecution,
  onCancelExecution,
  onDeleteExecution,
  onClearFinishedExecutions,
  onSelectSymbol,
  liveTradingArmed,
  dhanConnected,
  defaultSubTab = 'EXECUTIONS',
}) => {
  const [subTab, setSubTab] = useState<'EXECUTIONS' | 'POSITIONS' | 'PENDING' | 'AUDIT'>(defaultSubTab);
  const [execFilter, setExecFilter] = useState<string>('ALL');
  const [execSearch, setExecSearch] = useState<string>('');

  // Calculate total unrealized PnL from open positions
  const unrealizedPnL = positions.reduce((acc, p) => acc + p.pnl, 0);
  const totalEquity = balance + unrealizedPnL;

  // Split orders
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const pastOrders = orders.filter((o) => o.status !== 'PENDING');

  // Execution stats
  const execStats = useMemo(() => {
    const hitTPList = executions.filter((e) => e.status === 'HIT_TP');
    const hitSLList = executions.filter((e) => e.status === 'HIT_SL');
    const activeList = executions.filter((e) => e.status === 'ACTIVE');
    const pendingList = executions.filter((e) => e.status === 'PENDING');

    const totalRealizedProfit = hitTPList.reduce((acc, e) => acc + (e.realizedPnL || 0), 0);
    const totalRealizedLoss = hitSLList.reduce((acc, e) => acc + (e.realizedPnL || 0), 0);
    const netProfit = totalRealizedProfit + totalRealizedLoss;

    const completed = hitTPList.length + hitSLList.length;
    const winRate = completed > 0 ? Math.round((hitTPList.length / completed) * 100) : 0;

    return {
      total: executions.length,
      hitTPCount: hitTPList.length,
      hitSLCount: hitSLList.length,
      activeCount: activeList.length,
      pendingCount: pendingList.length,
      totalRealizedProfit,
      totalRealizedLoss,
      netProfit,
      winRate,
    };
  }, [executions]);

  // Filtered executions
  const filteredExecutions = useMemo(() => {
    return executions.filter((exec) => {
      if (execFilter !== 'ALL') {
        if (execFilter === 'ACTIVE' && exec.status !== 'ACTIVE') return false;
        if (execFilter === 'HIT_TP' && exec.status !== 'HIT_TP') return false;
        if (execFilter === 'HIT_SL' && exec.status !== 'HIT_SL') return false;
        if (execFilter === 'PENDING' && exec.status !== 'PENDING') return false;
        if (execFilter === 'CLOSED' && exec.status !== 'CLOSED_MANUAL' && exec.status !== 'CANCELLED') return false;
      }
      if (execSearch.trim()) {
        const q = execSearch.toLowerCase();
        if (
          !exec.symbol.toLowerCase().includes(q) &&
          !exec.strategyName?.toLowerCase().includes(q) &&
          !exec.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [executions, execFilter, execSearch]);

  return (
    <div
      id="portfolio-container"
      className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Portfolio & Execution Terminal</h2>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                  liveTradingArmed
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {liveTradingArmed ? '🔴 LIVE DHAN MODE' : '🟢 PAPER TRADING (SIM)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Track open positions, auto-trade executions, Target & Stop-Loss triggers, and order audit trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="reset-paper-account-btn"
            onClick={onResetPaperAccount}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs border border-slate-700 transition-colors cursor-pointer"
            title="Reset paper trading capital to ₹10,00,000"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Capital
          </button>
        </div>
      </div>

      {/* Account Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-950/60 border-b border-slate-800">
        {/* Total Equity */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Total Portfolio Equity</div>
          <div className="text-base font-bold font-mono text-white mt-0.5">
            ₹{totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Capital + Live Unrealized</div>
        </div>

        {/* Live Unrealized PnL */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Positions Unrealized P&L</div>
          <div
            className={`text-base font-bold font-mono mt-0.5 ${
              unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {unrealizedPnL >= 0 ? '+' : ''}₹{unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">
            {positions.length} active position{positions.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Realized Auto-Trades Yield */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Auto-Trades Net Realized</div>
          <div
            className={`text-base font-bold font-mono mt-0.5 ${
              execStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {execStats.netProfit >= 0 ? '+' : ''}₹{execStats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">
            {execStats.hitTPCount} TP hits &bull; {execStats.winRate}% win rate
          </div>
        </div>

        {/* Available Margin */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 uppercase font-medium">Available Margin</div>
          <div className="text-base font-bold font-mono text-sky-400 mt-0.5">
            ₹{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Ready for order deployment</div>
        </div>
      </div>

      {/* Subtab Navigation Bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setSubTab('EXECUTIONS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'EXECUTIONS'
              ? 'bg-orange-500 text-white shadow-xs font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
          <span>⚡ Auto-Execution History</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              subTab === 'EXECUTIONS' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {executions.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('POSITIONS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'POSITIONS'
              ? 'bg-slate-800 text-white shadow-xs font-bold ring-1 ring-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Active Positions</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {positions.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('PENDING')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'PENDING'
              ? 'bg-slate-800 text-white shadow-xs font-bold ring-1 ring-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Pending Triggers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {pendingOrders.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('AUDIT')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'AUDIT'
              ? 'bg-slate-800 text-white shadow-xs font-bold ring-1 ring-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Order Audit Trail</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
            {pastOrders.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* SUBTAB 1: AUTO EXECUTION HISTORY & TP/SL AUDIT */}
        {subTab === 'EXECUTIONS' && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  onClick={() => setExecFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    execFilter === 'ALL' ? 'bg-orange-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  All ({executions.length})
                </button>
                <button
                  onClick={() => setExecFilter('ACTIVE')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    execFilter === 'ACTIVE' ? 'bg-sky-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Active ({execStats.activeCount})
                </button>
                <button
                  onClick={() => setExecFilter('HIT_TP')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    execFilter === 'HIT_TP' ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                  }`}
                >
                  <Target className="w-3 h-3" />
                  Hit TP ({execStats.hitTPCount})
                </button>
                <button
                  onClick={() => setExecFilter('HIT_SL')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    execFilter === 'HIT_SL' ? 'bg-rose-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-rose-400'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  Hit SL ({execStats.hitSLCount})
                </button>
                <button
                  onClick={() => setExecFilter('PENDING')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    execFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Pending ({execStats.pendingCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-[160px]">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search symbol..."
                    value={execSearch}
                    onChange={(e) => setExecSearch(e.target.value)}
                    className="w-full pl-7 pr-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>
                {onClearFinishedExecutions && executions.some((e) => e.status === 'HIT_TP' || e.status === 'HIT_SL') && (
                  <button
                    onClick={onClearFinishedExecutions}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Clear completed trades"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Execution Cards */}
            {filteredExecutions.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-xs">
                <Zap className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="font-semibold text-slate-300">No Auto-Execution History Yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                  When you click "⚡ Buy Auto Setup" or "⚡ Auto-Trade Intraday" in the AI Agent Chat, the order is logged here as history. You will see its Entry, Take-Profit (TP), Stop-Loss (SL), and real-time alerts if it hits TP or hits SL.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExecutions.map((exec) => {
                  const isBuy = exec.action === 'BUY';
                  const isHitTP = exec.status === 'HIT_TP';
                  const isHitSL = exec.status === 'HIT_SL';
                  const isActive = exec.status === 'ACTIVE';
                  const isPending = exec.status === 'PENDING';
                  const cmp = exec.currentPrice || exec.entryPrice;

                  return (
                    <div
                      key={exec.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isHitTP
                          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/50 shadow-md'
                          : isHitSL
                          ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/50 shadow-md'
                          : isActive
                          ? 'bg-slate-950/90 border-sky-500/40'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white font-mono text-sm">{exec.symbol}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              isBuy ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                            }`}
                          >
                            {exec.action}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">Qty: {exec.quantity}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              exec.mode === 'LIVE'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {exec.mode}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isHitTP && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs shadow-xs animate-pulse">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                              <span>🎯 HIT TP (Target Reached!)</span>
                            </span>
                          )}
                          {isHitSL && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-xs shadow-xs">
                              <AlertOctagon className="w-3.5 h-3.5" />
                              <span>🛑 HIT SL (Stop-Loss Triggered)</span>
                            </span>
                          )}
                          {isActive && (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold text-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                              <span>🟢 ACTIVE (CMP: ₹{cmp})</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold text-xs">
                              <Clock className="w-3 h-3" />
                              <span>⏳ PENDING TRIGGER</span>
                            </span>
                          )}
                          {exec.status === 'CLOSED_MANUAL' && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs">
                              Closed Manually
                            </span>
                          )}
                          {exec.status === 'CANCELLED' && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-xs">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Values Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 mb-2.5">
                        <div className="p-1.5 bg-slate-800/80 rounded-lg">
                          <div className="text-[9px] text-slate-400 uppercase font-sans">Entry Price</div>
                          <div className="text-white font-bold text-xs">₹{exec.entryPrice}</div>
                        </div>

                        <div className={`p-1.5 rounded-lg border ${isHitSL ? 'bg-rose-950/60 border-rose-500' : 'bg-rose-950/20 border-rose-900/50'}`}>
                          <div className="text-[9px] text-rose-400 uppercase font-sans">Stop-Loss (SL)</div>
                          <div className="text-rose-300 font-bold text-xs">₹{exec.stopLoss}</div>
                        </div>

                        <div className={`p-1.5 rounded-lg border ${isHitTP ? 'bg-emerald-950/60 border-emerald-500' : 'bg-emerald-950/20 border-emerald-900/50'}`}>
                          <div className="text-[9px] text-emerald-400 uppercase font-sans">Target Price (TP)</div>
                          <div className="text-emerald-300 font-bold text-xs">₹{exec.targetPrice}</div>
                        </div>

                        <div className="p-1.5 bg-slate-800/80 rounded-lg">
                          <div className="text-[9px] text-slate-400 uppercase font-sans">
                            {isHitTP || isHitSL || exec.status === 'CLOSED_MANUAL' ? 'Realized P&L' : 'Live P&L'}
                          </div>
                          <div
                            className={`text-xs font-bold ${
                              (exec.realizedPnL ?? exec.unrealizedPnL ?? 0) >= 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {(exec.realizedPnL ?? exec.unrealizedPnL ?? 0) >= 0 ? '+' : ''}₹
                            {Math.abs(exec.realizedPnL ?? exec.unrealizedPnL ?? 0).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Banner Messages */}
                      {isHitTP && (
                        <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-200 mb-2 flex items-center justify-between">
                          <span>
                            🎉 <strong>Target Hit!</strong> Exited at ₹{exec.targetPrice}. Profit: +₹{(exec.realizedPnL || 0).toFixed(2)}.
                          </span>
                          {exec.exitTime && (
                            <span className="text-[10px] text-emerald-400">
                              {new Date(exec.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}

                      {isHitSL && (
                        <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-200 mb-2 flex items-center justify-between">
                          <span>
                            🛑 <strong>Stop-Loss Hit!</strong> Auto-closed at ₹{exec.stopLoss} to protect capital. Loss: -₹{Math.abs(exec.realizedPnL || 0).toFixed(2)}.
                          </span>
                          {exec.exitTime && (
                            <span className="text-[10px] text-rose-400">
                              {new Date(exec.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                        <div>
                          <span>Strategy: <strong className="text-slate-300">{exec.strategyName}</strong></span>
                          <span className="mx-1.5">&bull;</span>
                          <span>{new Date(exec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onSelectSymbol && (
                            <button
                              onClick={() => onSelectSymbol(exec.symbol)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            >
                              Chart
                            </button>
                          )}
                          {isActive && onSquareOffExecution && (
                            <button
                              onClick={() => onSquareOffExecution(exec.id)}
                              className="px-2.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold"
                            >
                              Square Off
                            </button>
                          )}
                          {isPending && onCancelExecution && (
                            <button
                              onClick={() => onCancelExecution(exec.id)}
                              className="px-2.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold"
                            >
                              Cancel Trigger
                            </button>
                          )}
                          {onDeleteExecution && (
                            <button
                              onClick={() => onDeleteExecution(exec.id)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-rose-400"
                              title="Delete record"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: OPEN POSITIONS */}
        {subTab === 'POSITIONS' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Active Open Positions ({positions.length})
              </h3>
              {positions.length > 0 && (
                <span className="text-[10px] text-slate-400">Live mark-to-market prices</span>
              )}
            </div>

            {positions.length === 0 ? (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 text-center text-slate-400 text-xs">
                <p className="mb-1 text-slate-300 font-medium">No open positions currently active.</p>
                <p className="text-[11px]">
                  Ask the AI Trading Agent to generate a signal, then click "⚡ Buy Auto Setup" to open a position.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {positions.map((pos) => (
                  <div
                    key={pos.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 font-mono text-xs shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{pos.symbol}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pos.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {pos.type}
                        </span>
                        <span className="text-slate-400 text-[11px]">Qty: {pos.qty}</span>
                      </div>
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        Square Off
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Entry Px</span>
                        <span className="text-slate-200">₹{pos.entryPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Current Px</span>
                        <span className="text-sky-300 font-semibold">₹{pos.currentPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Stop Loss / Target</span>
                        <span className="text-rose-400">SL: ₹{pos.stopLoss}</span>
                        <span className="text-emerald-400 ml-1.5">TP: ₹{pos.target}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Unrealized P&L</span>
                        <span
                          className={`font-bold ${
                            pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {pos.pnl >= 0 ? '+' : ''}₹{pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: PENDING TRIGGER ORDERS */}
        {subTab === 'PENDING' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Pending Auto-Trigger Orders ({pendingOrders.length})
              </h3>
              <span className="text-[10px] text-slate-400">
                Will auto-execute when market price touches Trigger Price
              </span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-6 text-center text-slate-500 text-xs">
                No pending trigger orders waiting for fill.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingOrders.map((pOrd) => (
                  <div
                    key={pOrd.id}
                    className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 font-mono text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{pOrd.symbol}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pOrd.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {pOrd.type}
                        </span>
                        <span className="text-slate-400 text-[10px]">Qty: {pOrd.qty}</span>
                      </div>
                      {onCancelOrder && (
                        <button
                          onClick={() => onCancelOrder(pOrd.id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 text-[10px]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                      <span className="text-amber-300 font-bold">Trigger: ₹{pOrd.triggerPrice || pOrd.price}</span>
                      <div className="text-[10px]">
                        <span className="text-rose-400 mr-2">SL: ₹{pOrd.stopLoss || '-'}</span>
                        <span className="text-emerald-400">TP: ₹{pOrd.target || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 4: ORDER AUDIT TRAIL */}
        {subTab === 'AUDIT' && (
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Order Execution Audit Trail ({pastOrders.length})
            </h3>

            {pastOrders.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 text-center text-slate-500 text-xs">
                No executed orders yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {pastOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 font-mono text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{ord.symbol}</span>
                        <span
                          className={`font-bold ${
                            ord.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {ord.type}
                        </span>
                        <span className="text-slate-400">Qty: {ord.qty}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] ${
                          ord.mode === 'LIVE'
                            ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50'
                            : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                        }`}
                      >
                        {ord.mode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Price: <strong className="text-slate-200">₹{ord.price}</strong></span>
                      <span>
                        {new Date(ord.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    {ord.note && <div className="text-[9px] text-slate-400 pt-0.5">{ord.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
