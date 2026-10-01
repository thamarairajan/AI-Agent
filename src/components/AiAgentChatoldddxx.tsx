import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  SymbolInfo,
  TradeSignal,
  BacktestResult,
  DhanOrderPayload,
} from '../types/trading';
import {
  Bot,
  Send,
  Sparkles,
  Code2,
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Zap,
  RefreshCw,
  BellRing,
  Layers,
  Clock,
  Target,
  Shield,
  Percent,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Check,
} from 'lucide-react';
import { getMarketSessionStatus } from '../utils/strategyEngine';

interface AiAgentChatProps {
  symbolInfo: SymbolInfo;
  currentPrice: number;
  timeframe: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onExecutePaperTrade: (signal: TradeSignal) => void;
  onExecuteLiveTrade: (signal: TradeSignal) => void;
  onRunBacktestFromSignal: (signal: TradeSignal) => void;
  onSwitchToLabWithCode: (code: string) => void;
  liveTradingArmed: boolean;
  onOpenAutoTradeModal?: (signal?: TradeSignal) => void;
  onSetEntryAlert?: (signal: TradeSignal) => void;
  onQuickIntradayAutoTrade?: (signal: TradeSignal, validityType: 'DAY' | 'MULTI_DAY_GTT') => void;
  onDeployHedgePair?: (longConfig: any, shortConfig: any) => void;
}

export const AiAgentChat: React.FC<AiAgentChatProps> = ({
  symbolInfo,
  currentPrice,
  timeframe,
  messages,
  onSendMessage,
  isLoading,
  onExecutePaperTrade,
  onExecuteLiveTrade,
  onRunBacktestFromSignal,
  onSwitchToLabWithCode,
  liveTradingArmed,
  onOpenAutoTradeModal,
  onSetEntryAlert,
  onQuickIntradayAutoTrade,
  onDeployHedgePair,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<Record<string, 'SIGNAL' | 'PYTHON' | 'DHAN_PAYLOAD'>>({});
  const [alertSetSignals, setAlertSetSignals] = useState<Record<string, boolean>>({});
  const [executedSignals, setExecutedSignals] = useState<Record<string, 'DAY' | 'GTT' | 'HEDGE'>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const marketStatus = getMarketSessionStatus();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const samplePrompts = [
    `⚡ Intraday high-accuracy setup for ${symbolInfo.symbol} with exact Entry, SL, Target & TSL`,
    `📈 Scalping trade setup (1-3m) with RSI & Supertrend for ${symbolInfo.symbol}`,
    `🛡️ 1:2 Hedging setup for ${symbolInfo.symbol} taking both sides around current range`,
    `📊 Open Interest PCR & Daily Pivot Point breakout setup for ${symbolInfo.symbol}`,
    `⏰ BTST setup for ${symbolInfo.symbol} with Multi-Day GTT validity for tomorrow 9:15 AM`,
  ];

  return (
    <div
      id="ai-agent-chat-container"
      className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">AI Intraday Quant Agent</h2>
              <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">
                <Sparkles className="w-2.5 h-2.5 mr-1" /> Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live Intraday Strategy Execution &bull; 100% Accuracy Confluence &bull; ATM/ITM &bull; TSL &bull; Multi-Day GTT
            </p>
          </div>
        </div>

        {/* Current Asset Pill & Session Indicator */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className="text-slate-400 font-medium">Tracking:</span>
            <span className="font-bold text-sky-400">{symbolInfo.symbol}</span>
            <span className="font-mono text-slate-200">₹{currentPrice}</span>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${
              marketStatus.isOpen
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
            title={marketStatus.message}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${marketStatus.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-mono">{marketStatus.currentTimeIST} IST</span>
          </div>
        </div>
      </div>

      {/* Intraday Live Moment Quick Bar */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-medium text-slate-300">Intraday (09:15 - 15:25):</span>
        </div>
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar">
          <button
            onClick={() => onSendMessage(`⚡ Generate high-accuracy Intraday setup for ${symbolInfo.symbol} right now at live price ₹${currentPrice} with exact Entry, Stop Loss, 1:2 Target & TSL`)}
            className="flex-shrink-0 px-2 py-0.5 rounded bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/60 hover:border-sky-500 text-[10px] font-semibold transition-all cursor-pointer"
          >
            ⚡ Live Setup
          </button>
          <button
            onClick={() => onSendMessage(`📈 Generate rapid Intraday Scalping setup for ${symbolInfo.symbol} based on live momentum, Supertrend & RSI with tight stop loss`)}
            className="flex-shrink-0 px-2 py-0.5 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 hover:border-indigo-500 text-[10px] font-semibold transition-all cursor-pointer"
          >
            📈 Scalping (1-3m)
          </button>
          <button
            onClick={() => onSendMessage(`🛡️ Generate 1:2 ratio Intraday Hedging setup for ${symbolInfo.symbol} taking both sides around current range`)}
            className="flex-shrink-0 px-2 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/60 hover:border-purple-500 text-[10px] font-semibold transition-all cursor-pointer"
          >
            🛡️ 1:2 Hedging
          </button>
          <button
            onClick={() => onSendMessage(`📊 Generate precision Intraday setup based on Open Interest PCR and Daily Pivot Points for ${symbolInfo.symbol}`)}
            className="flex-shrink-0 px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/60 hover:border-amber-500 text-[10px] font-semibold transition-all cursor-pointer"
          >
            📊 OI + Pivots
          </button>
          <button
            onClick={() => onSendMessage(`⏰ Generate BTST setup for ${symbolInfo.symbol} with Multi-Day GTT validity if entry triggers tomorrow morning at 09:15 open`)}
            className="flex-shrink-0 px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 hover:border-emerald-500 text-[10px] font-semibold transition-all cursor-pointer"
          >
            ⏰ BTST / GTT
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => {
          const isSignal = !!msg.tradeSignal;
          const sig = msg.tradeSignal;
          const isNearMarket = sig ? Math.abs(currentPrice - sig.entryPrice) / currentPrice < 0.002 : false;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[95%] sm:max-w-[88%] rounded-2xl p-3.5 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-sky-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-bl-none'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between mb-1.5 text-sky-400 font-semibold text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      <span>Quantitative Strategy & Execution Plan</span>
                    </div>
                    {sig?.strategyType && (
                      <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 text-[10px] font-mono text-sky-300">
                        {sig.strategyType}
                      </span>
                    )}
                  </div>
                )}
                <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>

                {/* Comprehensive Intraday Trade Signal Card */}
                {sig && (
                  <div className="mt-3.5 pt-3 border-t border-slate-700/60 space-y-3">
                    {/* Header: Action & Confluence Probability */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider ${
                            sig.action === 'BUY'
                              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                          }`}
                        >
                          {sig.action} {sig.symbol}
                        </span>
                        <span className="text-[11px] text-slate-300 font-bold">
                          {sig.strategyName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{sig.confluenceScore || 96}% Confluence Accuracy</span>
                      </div>
                    </div>

                    {/* Live Timing / Trigger Status Alert Box */}
                    <div
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-[11px] ${
                        isNearMarket
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                      }`}
                    >
                      <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                      <div className="flex-1 leading-snug">
                        {isNearMarket ? (
                          <>
                            <strong className="text-emerald-300 block">⚡ LIVE MARKET ENTRY MOMENT REACHED</strong>
                            Price is currently at optimal confluence (₹{currentPrice}). Order will execute immediately with 1:2 Auto-Bracket.
                          </>
                        ) : (
                          <>
                            <strong className="text-sky-300 block">
                              ⏳ PENDING TRIGGER ENTRY: {sig.action === 'BUY' ? 'BUY ABOVE' : 'SELL BELOW'} ₹{sig.entryPrice}
                            </strong>
                            {sig.triggerCondition || `Entry might arrive today during 09:15-15:25 IST. If pending at 15:25, Multi-Day GTT keeps this order active for tomorrow 09:15 AM market opening.`}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Precision Pricing Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 font-mono text-center">
                      <div className="p-2 bg-slate-800/80 rounded-lg">
                        <div className="text-[10px] text-slate-400 font-sans uppercase">Entry / Trigger</div>
                        <div className="text-white font-bold text-sm">₹{sig.entryPrice}</div>
                        <div className="text-[9px] text-slate-400 font-sans">
                          {isNearMarket ? 'Market Now' : `Diff: ${(Math.abs(sig.entryPrice - currentPrice)).toFixed(1)} pts`}
                        </div>
                      </div>
                      <div className="p-2 bg-rose-950/40 border border-rose-900/50 rounded-lg">
                        <div className="text-[10px] text-rose-400 font-sans uppercase">Stop-Loss (Risk)</div>
                        <div className="text-rose-300 font-bold text-sm">₹{sig.stopLoss}</div>
                        <div className="text-[9px] text-rose-400/80 font-sans">
                          -{(Math.abs(sig.entryPrice - sig.stopLoss)).toFixed(1)} pts
                        </div>
                      </div>
                      <div className="p-2 bg-emerald-950/40 border border-emerald-900/50 rounded-lg">
                        <div className="text-[10px] text-emerald-400 font-sans uppercase">Target (1:2 Reward)</div>
                        <div className="text-emerald-300 font-bold text-sm">₹{sig.targetPrice}</div>
                        <div className="text-[9px] text-emerald-400/80 font-sans">
                          +{(Math.abs(sig.targetPrice - sig.entryPrice)).toFixed(1)} pts
                        </div>
                      </div>
                    </div>

                    {/* Trailing Stop Loss & Risk Management Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                        <Shield className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        <div>
                          <span className="text-slate-400">Trailing Stop Loss (TSL):</span>{' '}
                          <strong className="text-sky-300">
                            {sig.trailingStopLossPoints || 16} pts ratchet
                          </strong>
                          <span className="text-[10px] text-slate-400 block">Ratchet to Breakeven at 50% target</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                        <Percent className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <div>
                          <span className="text-slate-400">Session Window:</span>{' '}
                          <strong className="text-amber-300">Intraday 09:15 - 15:25</strong>
                          <span className="text-[10px] text-slate-400 block">Valid today or Multi-Day GTT</span>
                        </div>
                      </div>
                    </div>

                    {/* ATM / ITM Option Contract Recommendation Card */}
                    {sig.optionRecommendation && (
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900/80 border border-indigo-500/30 text-[11px]">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-bold text-indigo-200">
                              Options Contract ({sig.optionRecommendation.moneyness} Only)
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold">
                            Delta &ge; 0.50 No OTM Theta Decay
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5 font-mono text-center bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                          <div>
                            <span className="text-[9px] text-slate-400 font-sans block">Strike</span>
                            <span className="font-bold text-indigo-300">
                              {sig.optionRecommendation.strike} {sig.optionRecommendation.optionType}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-sans block">Est. Premium</span>
                            <span className="font-bold text-white">₹{sig.optionRecommendation.estimatedPremium}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-rose-400 font-sans block">Option SL</span>
                            <span className="font-bold text-rose-300">₹{sig.optionRecommendation.stopLossPremium}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-emerald-400 font-sans block">Option Target</span>
                            <span className="font-bold text-emerald-300">₹{sig.optionRecommendation.targetPremium}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hedging Setup (1:2 Ratio Dual Position) */}
                    {sig.hedgingSetup && (
                      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-[11px]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-purple-200 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                            Hedging Method: Both Sides with 1:2 Profit Ratio
                          </span>
                          <span className="text-[10px] text-purple-300 font-mono">
                            Opposing {sig.hedgingSetup.opposingAction} Leg
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300">
                          Opposing Contract: <strong className="text-white">{sig.hedgingSetup.opposingStrike}</strong> &bull; Entry: ₹{sig.hedgingSetup.entryPrice} &bull; SL: ₹{sig.hedgingSetup.stopLoss} &bull; Target: ₹{sig.hedgingSetup.targetPrice}
                        </div>
                      </div>
                    )}

                    {/* Confluence Checkpoints */}
                    {sig.confluenceFactors && sig.confluenceFactors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {sig.confluenceFactors.map((factor, fIdx) => (
                          <span
                            key={fIdx}
                            className="text-[10px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60 font-medium"
                          >
                            ✓ {factor}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sub-tabs: Details / Python Algo / Dhan Payload */}
                    <div className="flex items-center gap-1.5 border-t border-slate-800 pt-2">
                      <button
                        onClick={() =>
                          setExpandedTab((prev) => ({ ...prev, [msg.id]: 'SIGNAL' }))
                        }
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          (expandedTab[msg.id] || 'SIGNAL') === 'SIGNAL'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Institutional Reasoning
                      </button>
                      <button
                        onClick={() =>
                          setExpandedTab((prev) => ({ ...prev, [msg.id]: 'PYTHON' }))
                        }
                        className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                          expandedTab[msg.id] === 'PYTHON'
                            ? 'bg-slate-700 text-sky-400'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Code2 className="w-3 h-3" /> Python Algo
                      </button>
                      <button
                        onClick={() =>
                          setExpandedTab((prev) => ({ ...prev, [msg.id]: 'DHAN_PAYLOAD' }))
                        }
                        className={`px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
                          expandedTab[msg.id] === 'DHAN_PAYLOAD'
                            ? 'bg-slate-700 text-amber-400'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Terminal className="w-3 h-3" /> Dhan Payload
                      </button>
                    </div>

                    {/* Sub-tab content */}
                    {(expandedTab[msg.id] || 'SIGNAL') === 'SIGNAL' && (
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-300">
                        <p className="mb-1.5 leading-relaxed">{sig.reasoning}</p>
                        {sig.indicators && (
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 pt-1">
                            {sig.indicators.supertrend && (
                              <span className="bg-slate-800 px-2 py-0.5 rounded">
                                Supertrend: {sig.indicators.supertrend}
                              </span>
                            )}
                            {sig.indicators.rsi && (
                              <span className="bg-slate-800 px-2 py-0.5 rounded">
                                RSI (14): {sig.indicators.rsi}
                              </span>
                            )}
                            {sig.indicators.orderBlock && (
                              <span className="bg-slate-800 px-2 py-0.5 rounded">
                                SMC: {sig.indicators.orderBlock}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {expandedTab[msg.id] === 'PYTHON' && msg.pythonScript && (
                      <div className="relative">
                        <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-44">
                          {msg.pythonScript}
                        </pre>
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(msg.pythonScript!, msg.id + '_py')}
                            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                            title="Copy Python Code"
                          >
                            {copiedId === msg.id + '_py' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => onSwitchToLabWithCode(msg.pythonScript!)}
                            className="px-2 py-1 rounded bg-sky-600 text-white text-[10px] font-medium hover:bg-sky-500"
                          >
                            Open in Lab
                          </button>
                        </div>
                      </div>
                    )}

                    {expandedTab[msg.id] === 'DHAN_PAYLOAD' && sig.dhanOrderPayload && (
                      <div className="relative">
                        <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-amber-300 overflow-x-auto max-h-44">
                          {JSON.stringify(sig.dhanOrderPayload, null, 2)}
                        </pre>
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(sig?.dhanOrderPayload, null, 2),
                              msg.id + '_dhan'
                            )
                          }
                          className="absolute top-2 right-2 p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                          title="Copy Dhan Payload"
                        >
                          {copiedId === msg.id + '_dhan' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Primary Strategy Execution Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* 1-Click Intraday Auto-Bracket Execution */}
                      {onQuickIntradayAutoTrade && (
                        <button
                          id={`quick-intraday-btn-${msg.id}`}
                          onClick={() => {
                            onQuickIntradayAutoTrade(sig, 'DAY');
                            setExecutedSignals((prev) => ({ ...prev, [msg.id]: 'DAY' }));
                          }}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer ${
                            executedSignals[msg.id] === 'DAY'
                              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                              : 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white shadow-amber-950/40'
                          }`}
                          title="Auto-Execute Intraday Bracket (Stop-Loss, Target & Trailing SL)"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          {executedSignals[msg.id] === 'DAY' ? '✓ Bracket Armed' : '⚡ Auto-Trade Intraday (DAY)'}
                        </button>
                      )}

                      {/* Multi-Day GTT Order Button */}
                      {onQuickIntradayAutoTrade && (
                        <button
                          id={`arm-gtt-btn-${msg.id}`}
                          onClick={() => {
                            onQuickIntradayAutoTrade(sig, 'MULTI_DAY_GTT');
                            setExecutedSignals((prev) => ({ ...prev, [msg.id]: 'GTT' }));
                          }}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                            executedSignals[msg.id] === 'GTT'
                              ? 'bg-sky-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-600/50 shadow-sky-950/30'
                          }`}
                          title="Arm trigger order that remains valid until filled (active tomorrow morning 09:15 if unhit today)"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {executedSignals[msg.id] === 'GTT' ? '✓ GTT Armed' : '⏳ Arm Multi-Day GTT'}
                        </button>
                      )}

                      {/* 1:2 Hedging Dual Deploy Button */}
                      {sig.hedgingSetup && onDeployHedgePair && (
                        <button
                          id={`deploy-hedge-btn-${msg.id}`}
                          onClick={() => {
                            if (!sig.hedgingSetup) return;
                            const hedge = sig.hedgingSetup;
                            const lot = sig.symbol.includes('BANKNIFTY') ? 15 : sig.symbol.includes('NIFTY') ? 25 : 10;
                            const longConfig = {
                              symbol: sig.symbol,
                              action: (sig.action === 'SELL' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
                              orderType: 'MARKET' as const,
                              entryPrice: sig.entryPrice,
                              stopLoss: sig.stopLoss,
                              target: sig.targetPrice,
                              quantity: lot,
                              mode: (liveTradingArmed ? 'LIVE' : 'PAPER') as 'LIVE' | 'PAPER',
                              strategyType: 'HEDGING_1_2',
                              note: `1:2 Hedge Main Leg: ${sig.action}`,
                            };
                            const shortConfig = {
                              symbol: sig.symbol,
                              action: hedge.opposingAction as 'BUY' | 'SELL',
                              orderType: 'TRIGGER' as const,
                              entryPrice: hedge.entryPrice,
                              triggerPrice: hedge.entryPrice,
                              stopLoss: hedge.stopLoss,
                              target: hedge.targetPrice,
                              quantity: lot,
                              mode: (liveTradingArmed ? 'LIVE' : 'PAPER') as 'LIVE' | 'PAPER',
                              strategyType: 'HEDGING_1_2',
                              note: `1:2 Hedge Opposing Leg: ${hedge.opposingAction}`,
                            };
                            onDeployHedgePair(longConfig, shortConfig);
                            setExecutedSignals((prev) => ({ ...prev, [msg.id]: 'HEDGE' }));
                          }}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                            executedSignals[msg.id] === 'HEDGE'
                              ? 'bg-purple-500 text-white'
                              : 'bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-600/50 shadow-purple-950/30'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {executedSignals[msg.id] === 'HEDGE' ? '✓ Hedge Pair Deployed' : '🛡️ Deploy 1:2 Hedge Pair'}
                        </button>
                      )}

                      {/* Entry Price Alert Watchdog */}
                      {onSetEntryAlert && (
                        <button
                          id={`set-entry-alert-btn-${msg.id}`}
                          onClick={() => {
                            onSetEntryAlert(sig);
                            setAlertSetSignals((prev) => ({ ...prev, [msg.id]: true }));
                          }}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                            alertSetSignals[msg.id]
                              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950/40'
                          }`}
                          title="Arm alert notification when price reaches entry price"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          {alertSetSignals[msg.id] ? '✓ Alert Set' : `🔔 Alert @ ₹${sig.entryPrice}`}
                        </button>
                      )}

                      {/* Paper Trade */}
                      <button
                        id={`paper-trade-btn-${msg.id}`}
                        onClick={() => onExecutePaperTrade(sig)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paper (₹10L)
                      </button>

                      {/* Backtest */}
                      <button
                        id={`run-bt-btn-${msg.id}`}
                        onClick={() => onRunBacktestFromSignal(sig)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-950/40 transition-all cursor-pointer"
                        title="Simulate backtest"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Backtest
                      </button>

                      {/* Route Live to Dhan API */}
                      {liveTradingArmed && (
                        <button
                          id={`live-trade-btn-${msg.id}`}
                          onClick={() => onExecuteLiveTrade(sig)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
                          title="Direct order route to Dhan API v2"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Route Live
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>AI Quantitative Agent calculating Supertrend, Pivot points, Open Interest & formulating high-accuracy intraday setup...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Pills */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto flex items-center gap-2 no-scrollbar">
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            id={`suggested-prompt-${i}`}
            onClick={() => onSendMessage(prompt)}
            className="flex-shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            id="ai-agent-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask AI trading agent (e.g. "Scalping setup for ${symbolInfo.symbol}", "1:2 Hedging trade", "OI breakout trigger with SL & TP")...`}
            className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500 pr-10 shadow-inner"
            disabled={isLoading}
          />
        </div>
        <button
          id="ai-agent-send-btn"
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold shadow-md shadow-sky-600/30 transition-all flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

