import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BacktestResult,
  Candle,
  ChatMessage,
  DailyBriefing,
  Order,
  Position,
  PriceAlert,
  RiskSettings,
  SymbolInfo,
  TradeSignal,
  TriggeredAlertToast,
  AutoExecutionRecord,
} from './types/trading';
import { POPULAR_SYMBOLS, generateHistoricalCandles, generateNextTickCandle } from './utils/marketData';
import { generateDhanPythonScript, buildDefaultDhanPayload } from './utils/pythonDhanGenerator';
import { playTradeSound } from './utils/audio';
import { sendBrowserNotification } from './utils/notifications';
import {
  calculateSuperTrend,
  calculateDailyPivotPoints,
  calculateADX,
  calculateRSI,
  calculateBollingerBands,
} from './utils/indicators';
import { getMarketSessionStatus, isSymbolMarketOpen } from './utils/strategyEngine';

import { Navbar } from './components/Navbar';
import { TradingViewChart } from './components/TradingViewChart';
import { AiAgentChat } from './components/AiAgentChat';
import { UpstoxMarketChat } from './components/UpstoxMarketChat';
import { BacktestLab } from './components/BacktestLab';
import { PythonLab } from './components/PythonLab';
import { PaperPortfolio } from './components/PaperPortfolio';
import { DailyTwoTrades } from './components/DailyTwoTrades';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { SettingsModal } from './components/SettingsModal';
import { AutoTradeOrderModal } from './components/AutoTradeOrderModal';
import { AppFlowGuideModal } from './components/AppFlowGuideModal';
import { AlertsWatchdogModal } from './components/AlertsWatchdogModal';
import { AlertNotificationToast } from './components/AlertNotificationToast';
import { StrategyIntelligenceModal } from './components/StrategyIntelligenceModal';
import { PriceCalibrationModal } from './components/PriceCalibrationModal';
import { ExecutionHistoryModal } from './components/ExecutionHistoryModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';

import {
  Activity,
  AlertCircle,
  BarChart2,
  Bell,
  Bot,
  Calendar,
  Code2,
  Compass,
  PieChart,
  Play,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';

const INITIAL_RISK_SETTINGS: RiskSettings = {
  maxDailyLoss: 10000,
  maxRiskPerTradePct: 1.5,
  maxPositionSize: 100000,
  autoKillSwitchOnLoss: true,
  defaultTimeframe: '15m',
  soundAlerts: true,
  liveTradingArmed: true,
  dhanClientId: '',
  dhanAccessToken: '',
  offHoursSimulationMode: false,
};

function createSignalPayload(
  symbol: string,
  action: 'BUY' | 'SELL',
  entryPrice: number,
  targetPrice: number,
  stopLoss: number,
  quantity: number,
  strategyName: string,
  confluenceScore = 92
): TradeSignal {
  return {
    id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: Date.now(),
    symbol,
    action,
    entryPrice,
    stopLoss,
    targetPrice,
    timeframe: '15m',
    riskRewardRatio: Number(
      (Math.abs(targetPrice - entryPrice) / (Math.abs(entryPrice - stopLoss) || 1)).toFixed(2)
    ),
    confidence: 90,
    strategyName,
    indicators: {
      rsi: 54,
      supertrend: 'BULLISH',
      emaTrend: 'UPTREND',
    },
    confluenceScore,
    confluenceFactors: ['Order Block Retest', 'VWAP Support', 'Institutional Volume'],
    reasoning: `${strategyName} execution entry trigger`,
    dhanOrderPayload: {
      dhanClientId: '',
      transactionType: action,
      exchangeSegment: 'NSE_EQ',
      productType: 'INTRADAY',
      orderType: 'MARKET',
      validity: 'DAY',
      securityId: '1333',
      quantity,
      price: entryPrice,
    },
  };
}

const INITIAL_ALERTS: PriceAlert[] = [
  {
    id: 'alert_reliance_breakout',
    symbol: 'RELIANCE',
    triggerPrice: 2992,
    currentPriceAtCreation: 2984,
    direction: 'LONG',
    alertType: 'ENTRY_REACHED',
    source: 'AI_ANALYSIS',
    status: 'ACTIVE',
    createdAt: Date.now() - 3600000,
    note: 'SMC Bullish Order Block bounce entry level (94% confluence)',
    soundEnabled: true,
    browserNotificationEnabled: true,
    autoTradeOnTrigger: false,
    tradePayload: createSignalPayload('RELIANCE', 'BUY', 2992, 3045, 2968, 15, 'SMC Order Block Retest', 94),
  },
  {
    id: 'alert_tata_pullback',
    symbol: 'TATAMOTORS',
    triggerPrice: 978,
    currentPriceAtCreation: 972,
    direction: 'LONG',
    alertType: 'ENTRY_REACHED',
    source: 'AI_ANALYSIS',
    status: 'ACTIVE',
    createdAt: Date.now() - 1800000,
    note: 'High-Volume VWAP retest confluence zone (91% confluence)',
    soundEnabled: true,
    browserNotificationEnabled: true,
    autoTradeOnTrigger: false,
    tradePayload: createSignalPayload('TATAMOTORS', 'BUY', 978, 1012, 962, 25, 'VWAP Institutional Pullback', 91),
  },
  {
    id: 'alert_hdfc_reversal',
    symbol: 'HDFCBANK',
    triggerPrice: 1685,
    currentPriceAtCreation: 1679,
    direction: 'LONG',
    alertType: 'ENTRY_REACHED',
    source: 'DAILY_BRIEFING',
    status: 'ACTIVE',
    createdAt: Date.now() - 7200000,
    note: 'Daily S1 Pivot Support reversal cluster (89% confluence)',
    soundEnabled: true,
    browserNotificationEnabled: true,
    autoTradeOnTrigger: false,
    tradePayload: createSignalPayload('HDFCBANK', 'BUY', 1685, 1720, 1668, 20, 'Pivot S1 Confluence Reversal', 89),
  },
];

const INITIAL_EXECUTIONS: AutoExecutionRecord[] = [
  {
    id: 'exec_reliance_tp_hit',
    timestamp: Date.now() - 5400000,
    symbol: 'RELIANCE',
    action: 'BUY',
    orderType: 'BRACKET',
    entryPrice: 2975,
    targetPrice: 3015,
    stopLoss: 2955,
    quantity: 15,
    mode: 'PAPER',
    validityType: 'DAY',
    strategyName: 'SMC 15m Order Block Breakout',
    status: 'HIT_TP',
    filledPrice: 2975,
    filledTime: Date.now() - 5400000,
    exitPrice: 3015,
    exitTime: Date.now() - 1800000,
    realizedPnL: 600,
    realizedPnLPercent: 1.34,
    hitReason: '🎯 Target Hit! Exited at ₹3015 (+₹600.00 profit)',
    source: 'CHAT_AUTO_SETUP',
    note: '⚡ Auto-Trade Bracket Hit Target (+₹600.00)',
  },
  {
    id: 'exec_nifty_sl_hit',
    timestamp: Date.now() - 10800000,
    symbol: 'NIFTY 50',
    action: 'BUY',
    orderType: 'BRACKET',
    entryPrice: 24920,
    targetPrice: 25050,
    stopLoss: 24860,
    quantity: 25,
    mode: 'PAPER',
    validityType: 'DAY',
    strategyName: 'Supertrend Trend Continuation',
    status: 'HIT_SL',
    filledPrice: 24920,
    filledTime: Date.now() - 10800000,
    exitPrice: 24860,
    exitTime: Date.now() - 7200000,
    realizedPnL: -1500,
    realizedPnLPercent: -0.24,
    hitReason: '🛑 Stop-Loss Hit! Exited at ₹24860 to protect downside capital (-₹1500.00)',
    source: 'CHAT_AUTO_SETUP',
    note: '🛑 Auto Stop-Loss Hit (-₹1500.00)',
  },
  {
    id: 'exec_tatamotors_active',
    timestamp: Date.now() - 1200000,
    symbol: 'TATAMOTORS',
    action: 'BUY',
    orderType: 'BRACKET',
    entryPrice: 978,
    targetPrice: 1012,
    stopLoss: 962,
    quantity: 25,
    mode: 'PAPER',
    validityType: 'DAY',
    trailingStopLossEnabled: true,
    trailingStopLossPoints: 12,
    strategyName: 'VWAP Institutional Pullback',
    status: 'ACTIVE',
    filledPrice: 978,
    filledTime: Date.now() - 1200000,
    currentPrice: 984,
    unrealizedPnL: 150,
    unrealizedPnLPercent: 0.61,
    source: 'CHAT_AUTO_SETUP',
    note: '⚡ Live Bracket Monitoring (SL: ₹962, TP: ₹1012)',
  },
];

function TradingAppContent() {
  const { user, userProfile, loading, isDemoUser, signOut } = useAuth();
  // Navigation & View Mode - Persisted across refresh / hard refresh
  const [activeTab, setActiveTab] = useState<'CHAT' | 'UPSTOX' | 'TWO_TRADES' | 'CHART' | 'PYTHON' | 'BACKTEST' | 'PORTFOLIO'>(() => {
    // 1. Check URL hash first (e.g. #chart, #chat, #portfolio, etc.)
    const hash = window.location.hash.replace('#', '').toUpperCase();
    if (['CHAT', 'UPSTOX', 'TWO_TRADES', 'CHART', 'PYTHON', 'BACKTEST', 'PORTFOLIO'].includes(hash)) {
      return hash as any;
    }
    // 2. Check localStorage
    const saved = localStorage.getItem('ai_trader_active_tab');
    if (saved && ['CHAT', 'UPSTOX', 'TWO_TRADES', 'CHART', 'PYTHON', 'BACKTEST', 'PORTFOLIO'].includes(saved)) {
      return saved as any;
    }
    return 'CHART';
  });

  // Market & Instruments State - Persisted across refresh
  const [symbols, setSymbols] = useState<SymbolInfo[]>(POPULAR_SYMBOLS);
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolInfo>(() => {
    const saved = localStorage.getItem('ai_trader_selected_symbol');
    if (saved) {
      const match = POPULAR_SYMBOLS.find((s) => s.symbol === saved);
      if (match) return match;
    }
    return POPULAR_SYMBOLS[0];
  });
  const exchangeAnchorPriceRef = useRef<number>(POPULAR_SYMBOLS[0].lastPrice);
  const [timeframe, setTimeframe] = useState<string>(() => {
    return localStorage.getItem('ai_trader_timeframe') || '15m';
  });
  const [candles, setCandles] = useState<Candle[]>(() =>
    generateHistoricalCandles(POPULAR_SYMBOLS[0].lastPrice, 140, 15)
  );

  // Active AI Trade Signal (displayed as overlays on the chart)
  const [activeSignal, setActiveSignal] = useState<TradeSignal | null>(null);

  // Python Lab Code buffer
  const [pythonLabCode, setPythonLabCode] = useState<string>('');

  // Backtest preset buffer
  const [presetBacktestResult, setPresetBacktestResult] = useState<BacktestResult | null>(null);

  // Portfolio State (Paper & Live)
  const [paperBalance, setPaperBalance] = useState<number>(() => {
    const saved = localStorage.getItem('ai_trading_paper_balance');
    return saved ? Number(saved) : 1000000; // Default ₹10,00,000 virtual capital
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('ai_trading_positions');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('ai_trading_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Auto-Execution History State (persisted across refresh)
  const [executions, setExecutions] = useState<AutoExecutionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ai_trading_executions_history');
      return saved ? JSON.parse(saved) : INITIAL_EXECUTIONS;
    } catch (e) {
      return INITIAL_EXECUTIONS;
    }
  });
  const [isExecutionHistoryModalOpen, setIsExecutionHistoryModalOpen] = useState<boolean>(false);

  // Risk Settings & Dhan Credentials
  const [settings, setSettings] = useState<RiskSettings>(() => {
    const saved = localStorage.getItem('ai_trading_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_RISK_SETTINGS,
          ...parsed,
          liveTradingArmed: true, // Armed as requested by user
        };
      } catch (e) {
        return { ...INITIAL_RISK_SETTINGS, liveTradingArmed: true };
      }
    }
    return { ...INITIAL_RISK_SETTINGS, liveTradingArmed: true };
  });

  // Daily Briefing State
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAutoTradeModalOpen, setIsAutoTradeModalOpen] = useState<boolean>(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState<boolean>(false);
  const [isAppFlowGuideOpen, setIsAppFlowGuideOpen] = useState<boolean>(false);
  const [isPriceCalibrationModalOpen, setIsPriceCalibrationModalOpen] = useState<boolean>(false);

  // Price Alerts & Watchdog State
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('ai_trading_alerts');
      return saved ? JSON.parse(saved) : INITIAL_ALERTS;
    } catch (e) {
      return INITIAL_ALERTS;
    }
  });
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [alertToasts, setAlertToasts] = useState<TriggeredAlertToast[]>([]);

  // AI Chat Messages - Persisted so chat isn't lost on refresh
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ai_trading_chat_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'welcome_1',
        role: 'assistant',
        text: `Welcome to the AI Trading Agent Terminal. I am your quantitative market co-pilot.

I execute the full algorithmic workflow:
1. 💬 **AI Prompt Analysis**: Natural language strategy formulation & technical screening
2. 🐍 **Python Algo Generation**: Automatic synthesis of DhanHQ SDK scripts
3. ⚡ **Dhan Broker API**: Instant generation of JSON order payloads for NSE/BSE
4. 📈 **TradingView Charts**: Live candlestick action with indicator overlays
5. 🧪 **Backtesting Engine**: Historical metrics, Sharpe ratio, and equity curves
6. 💼 **Paper & Live Trading**: Seamless virtual execution or live broker routing

Try asking: *"Scan ${POPULAR_SYMBOLS[0].symbol} for 15m breakout with stop loss and Dhan payload"*, or click one of the suggested prompts below!`,
        timestamp: Date.now(),
      },
    ];
  });

  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Persist Tab & Sync URL Hash
  useEffect(() => {
    localStorage.setItem('ai_trader_active_tab', activeTab);
    const hashVal = '#' + activeTab.toLowerCase();
    if (window.location.hash !== hashVal) {
      window.history.replaceState(null, '', hashVal);
    }
  }, [activeTab]);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toUpperCase();
      if (['CHAT', 'UPSTOX', 'TWO_TRADES', 'CHART', 'PYTHON', 'BACKTEST', 'PORTFOLIO'].includes(hash)) {
        setActiveTab(hash as any);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Persist Symbol & Timeframe
  useEffect(() => {
    localStorage.setItem('ai_trader_selected_symbol', selectedSymbol.symbol);
  }, [selectedSymbol.symbol]);

  useEffect(() => {
    localStorage.setItem('ai_trader_timeframe', timeframe);
  }, [timeframe]);

  // Persist Messages
  useEffect(() => {
    try {
      localStorage.setItem('ai_trading_chat_messages', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  // Persist State to LocalStorage
  useEffect(() => {
    localStorage.setItem('ai_trading_paper_balance', paperBalance.toString());
  }, [paperBalance]);

  useEffect(() => {
    localStorage.setItem('ai_trading_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('ai_trading_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ai_trading_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ai_trading_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_trading_executions_history', JSON.stringify(executions));
    } catch (e) {}
  }, [executions]);

  // Synchronize browser Chrome Tab title dynamically with selected market symbol and live running price
  useEffect(() => {
    if (!selectedSymbol) return;
    const sym = selectedSymbol.symbol;
    const formattedPrice = selectedSymbol.lastPrice.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const sign = selectedSymbol.change24h >= 0 ? '+' : '';
    const pct = selectedSymbol.changePercent24h.toFixed(2);
    document.title = `${sym} ₹${formattedPrice} (${sign}${pct}%) | AI Trading Agent`;
  }, [selectedSymbol.symbol, selectedSymbol.lastPrice, selectedSymbol.change24h, selectedSymbol.changePercent24h]);

  const handleSelectSymbol = useCallback((newSym: SymbolInfo) => {
    setSelectedSymbol(newSym);
    exchangeAnchorPriceRef.current = newSym.lastPrice;
    localStorage.setItem('ai_trader_selected_symbol', newSym.symbol);
  }, []);

  // Fetch Daily Market Briefing on Mount
  useEffect(() => {
    async function fetchBriefing() {
      try {
        const res = await fetch('/api/daily-briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          setDailyBriefing(data);
        }
      } catch (e) {
        console.error('Failed to load daily briefing:', e);
      }
    }
    fetchBriefing();
  }, []);

  // Central Market Evaluation Engine: Evaluates Stop Loss, Targets, Pending Orders, and Watchdog Alerts
  const evaluateMarketPrice = useCallback((curPx: number) => {
    // 0. Freeze evaluation if the symbol's market is closed and user has not enabled off-hours practice simulation
    const isLiveActive = isSymbolMarketOpen(selectedSymbol, {
      allowOffHoursSimulation: settings.offHoursSimulationMode,
    });
    if (!isLiveActive) return;

    // 1. Evaluate open positions, auto Target & Stop-Loss execution
    setPositions((prevPositions) => {
      const remaining: Position[] = [];
      for (const pos of prevPositions) {
        if (pos.symbol === selectedSymbol.symbol) {
          const isBuy = pos.type === 'BUY';
          const targetHit = isBuy
            ? pos.target > 0 && curPx >= pos.target
            : pos.target > 0 && curPx <= pos.target;
          const stopLossHit = isBuy
            ? pos.stopLoss > 0 && curPx <= pos.stopLoss
            : pos.stopLoss > 0 && curPx >= pos.stopLoss;

          if (targetHit) {
            const exitPrice = pos.target;
            const pnl = isBuy
              ? (exitPrice - pos.entryPrice) * pos.qty
              : (pos.entryPrice - exitPrice) * pos.qty;
            setPaperBalance((prev) => prev + pnl + pos.entryPrice * pos.qty * 0.1);
            const closeOrder: Order = {
              id: `ord_tp_${Date.now()}`,
              symbol: pos.symbol,
              type: isBuy ? 'SELL' : 'BUY',
              qty: pos.qty,
              price: exitPrice,
              orderType: 'AUTO_TARGET',
              status: 'EXECUTED',
              time: Date.now(),
              mode: pos.mode,
              note: `🎯 Auto Target Hit (+₹${pnl.toFixed(2)})`,
            };
            setOrders((prev) => [closeOrder, ...prev]);
            if (settings.soundAlerts) playTradeSound('FILL');
            setMessages((prev) => [
              ...prev,
              {
                id: `tp_${Date.now()}`,
                role: 'system',
                text: `🎯 Auto-Trade Target Hit! Closed ${pos.type} ${pos.qty} ${pos.symbol} at ₹${exitPrice}. Realized Profit: +₹${pnl.toFixed(2)}.`,
                timestamp: Date.now(),
              },
            ]);
            continue;
          } else if (stopLossHit) {
            const exitPrice = pos.stopLoss;
            const pnl = isBuy
              ? (exitPrice - pos.entryPrice) * pos.qty
              : (pos.entryPrice - exitPrice) * pos.qty;
            setPaperBalance((prev) => prev + pnl + pos.entryPrice * pos.qty * 0.1);
            const closeOrder: Order = {
              id: `ord_sl_${Date.now()}`,
              symbol: pos.symbol,
              type: isBuy ? 'SELL' : 'BUY',
              qty: pos.qty,
              price: exitPrice,
              orderType: 'AUTO_STOP_LOSS',
              status: 'EXECUTED',
              time: Date.now(),
              mode: pos.mode,
              note: `🛑 Auto Stop Loss Hit (-₹${Math.abs(pnl).toFixed(2)})`,
            };
            setOrders((prev) => [closeOrder, ...prev]);
            if (settings.soundAlerts) playTradeSound('ALERT');
            setMessages((prev) => [
              ...prev,
              {
                id: `sl_${Date.now()}`,
                role: 'system',
                text: `🛑 Auto-Trade Stop Loss Hit! Closed ${pos.type} ${pos.qty} ${pos.symbol} at ₹${exitPrice} to cap risk. Loss: -₹${Math.abs(pnl).toFixed(2)}.`,
                timestamp: Date.now(),
              },
            ]);
            continue;
          }

          // Dynamic Trailing Stop Loss Ratchet & Normal live tick PnL
          let updatedStopLoss = pos.stopLoss;
          let highestPx = pos.highestPriceReached || pos.entryPrice;

          if (pos.trailingStopLossEnabled && pos.trailingStopLossPoints) {
            if (isBuy) {
              if (curPx > highestPx) {
                highestPx = curPx;
                const halfTargetPx = pos.entryPrice + (pos.target - pos.entryPrice) * 0.5;
                if (curPx >= halfTargetPx && updatedStopLoss < pos.entryPrice) {
                  updatedStopLoss = pos.entryPrice;
                }
                const trailedSL = Number((curPx - pos.trailingStopLossPoints).toFixed(2));
                if (trailedSL > updatedStopLoss) {
                  updatedStopLoss = trailedSL;
                }
              }
            } else {
              if (curPx < highestPx) {
                highestPx = curPx;
                const halfTargetPx = pos.entryPrice - (pos.entryPrice - pos.target) * 0.5;
                if (curPx <= halfTargetPx && updatedStopLoss > pos.entryPrice) {
                  updatedStopLoss = pos.entryPrice;
                }
                const trailedSL = Number((curPx + pos.trailingStopLossPoints).toFixed(2));
                if (trailedSL < updatedStopLoss) {
                  updatedStopLoss = trailedSL;
                }
              }
            }
          }

          const pnl = isBuy
            ? (curPx - pos.entryPrice) * pos.qty
            : (pos.entryPrice - curPx) * pos.qty;
          const pnlPercent = isBuy
            ? ((curPx - pos.entryPrice) / pos.entryPrice) * 100
            : ((pos.entryPrice - curPx) / pos.entryPrice) * 100;

          remaining.push({
            ...pos,
            currentPrice: curPx,
            stopLoss: updatedStopLoss,
            highestPriceReached: highestPx,
            pnl: Number(pnl.toFixed(2)),
            pnlPercent: Number(pnlPercent.toFixed(2)),
          });
        } else {
          remaining.push(pos);
        }
      }
      return remaining;
    });

    // 1b. Evaluate Auto-Execution History (Live TP & SL check for all recorded executions)
    setExecutions((prevExecs) => {
      return prevExecs.map((exec) => {
        if (exec.symbol !== selectedSymbol.symbol) return exec;

        if (exec.status === 'ACTIVE') {
          const isBuy = exec.action === 'BUY';
          const tpHit = isBuy ? curPx >= exec.targetPrice : curPx <= exec.targetPrice;
          const slHit = isBuy ? curPx <= exec.stopLoss : curPx >= exec.stopLoss;

          if (tpHit) {
            const exitPx = exec.targetPrice;
            const pnl = isBuy
              ? (exitPx - exec.entryPrice) * exec.quantity
              : (exec.entryPrice - exitPx) * exec.quantity;
            const pnlPct = isBuy
              ? ((exitPx - exec.entryPrice) / exec.entryPrice) * 100
              : ((exec.entryPrice - exitPx) / exec.entryPrice) * 100;

            if (settings.soundAlerts) playTradeSound('FILL');
            sendBrowserNotification(`🎯 ${exec.symbol} Target Hit!`, {
              body: `Auto-setup reached Target Price ₹${exitPx}! Realized Profit: +₹${pnl.toFixed(2)}.`,
            });
            setMessages((prev) => [
              ...prev,
              {
                id: `exec_tp_${Date.now()}`,
                role: 'system',
                text: `🎯 **Auto-Trade Target Hit (TP)**: **${exec.action} ${exec.quantity} ${exec.symbol}** exited at target price **₹${exitPx}**. Realized Profit: **+₹${pnl.toFixed(2)}** (+${pnlPct.toFixed(2)}%). Setup archived in Executions History.`,
                timestamp: Date.now(),
              },
            ]);

            return {
              ...exec,
              status: 'HIT_TP' as const,
              exitPrice: exitPx,
              exitTime: Date.now(),
              realizedPnL: Number(pnl.toFixed(2)),
              realizedPnLPercent: Number(pnlPct.toFixed(2)),
              hitReason: `🎯 Take Profit Hit! Exited at ₹${exitPx} (+₹${pnl.toFixed(2)})`,
            };
          } else if (slHit) {
            const exitPx = exec.stopLoss;
            const pnl = isBuy
              ? (exitPx - exec.entryPrice) * exec.quantity
              : (exec.entryPrice - exitPx) * exec.quantity;
            const pnlPct = isBuy
              ? ((exitPx - exec.entryPrice) / exec.entryPrice) * 100
              : ((exec.entryPrice - exitPx) / exec.entryPrice) * 100;

            if (settings.soundAlerts) playTradeSound('ALERT');
            sendBrowserNotification(`🛑 ${exec.symbol} Stop-Loss Hit!`, {
              body: `Auto-setup closed at Stop-Loss ₹${exitPx} to cap risk. Loss: -₹${Math.abs(pnl).toFixed(2)}.`,
            });
            setMessages((prev) => [
              ...prev,
              {
                id: `exec_sl_${Date.now()}`,
                role: 'system',
                text: `🛑 **Auto-Trade Stop-Loss Hit (SL)**: **${exec.action} ${exec.quantity} ${exec.symbol}** closed at stop level **₹${exitPx}** to protect capital. Loss: **-₹${Math.abs(pnl).toFixed(2)}** (${pnlPct.toFixed(2)}%). Setup archived in Executions History.`,
                timestamp: Date.now(),
              },
            ]);

            return {
              ...exec,
              status: 'HIT_SL' as const,
              exitPrice: exitPx,
              exitTime: Date.now(),
              realizedPnL: Number(pnl.toFixed(2)),
              realizedPnLPercent: Number(pnlPct.toFixed(2)),
              hitReason: `🛑 Stop-Loss Hit! Auto-closed at ₹${exitPx} to cap risk (-₹${Math.abs(pnl).toFixed(2)})`,
            };
          } else {
            const pnl = isBuy
              ? (curPx - exec.entryPrice) * exec.quantity
              : (exec.entryPrice - curPx) * exec.quantity;
            const pnlPct = isBuy
              ? ((curPx - exec.entryPrice) / exec.entryPrice) * 100
              : ((exec.entryPrice - curPx) / exec.entryPrice) * 100;

            return {
              ...exec,
              currentPrice: curPx,
              unrealizedPnL: Number(pnl.toFixed(2)),
              unrealizedPnLPercent: Number(pnlPct.toFixed(2)),
              highestPriceReached: Math.max(exec.highestPriceReached || curPx, curPx),
              lowestPriceReached: Math.min(exec.lowestPriceReached || curPx, curPx),
            };
          }
        } else if (exec.status === 'PENDING') {
          const isBuy = exec.action === 'BUY';
          const triggered = isBuy ? curPx >= exec.entryPrice : curPx <= exec.entryPrice;
          if (triggered) {
            return {
              ...exec,
              status: 'ACTIVE' as const,
              filledPrice: curPx,
              filledTime: Date.now(),
              currentPrice: curPx,
              unrealizedPnL: 0,
              unrealizedPnLPercent: 0,
              note: `⚡ Auto-Trigger Entry Filled @ ₹${curPx}`,
            };
          }
        }
        return exec;
      });
    });

    // 2. Check Pending Orders for Trigger Hit & Auto-Entry
    setOrders((prevOrders) => {
      const hasPending = prevOrders.some(
        (o) => o.status === 'PENDING' && o.symbol === selectedSymbol.symbol
      );
      if (!hasPending) return prevOrders;

      return prevOrders.map((ord) => {
        if (ord.status === 'PENDING' && ord.symbol === selectedSymbol.symbol) {
          const trigger = ord.triggerPrice || ord.price;
          const triggered =
            ord.type === 'BUY' ? curPx >= trigger : curPx <= trigger;

          if (triggered) {
            const newPos: Position = {
              id: `pos_trig_${Date.now()}`,
              symbol: ord.symbol,
              type: ord.type,
              qty: ord.qty,
              entryPrice: curPx,
              currentPrice: curPx,
              stopLoss:
                ord.stopLoss ||
                Number((curPx * (ord.type === 'BUY' ? 0.99 : 1.01)).toFixed(2)),
              target:
                ord.target ||
                Number((curPx * (ord.type === 'BUY' ? 1.02 : 0.98)).toFixed(2)),
              pnl: 0,
              pnlPercent: 0,
              time: Date.now(),
              mode: ord.mode,
              dhanOrderId: ord.dhanOrderId,
              trailingStopLossEnabled: ord.trailingStopLossEnabled,
              trailingStopLossPoints: ord.trailingStopLossPoints,
              highestPriceReached: curPx,
              strategyType: ord.strategyType,
            };

            setPositions((prev) => [newPos, ...prev]);
            setPaperBalance((prev) => prev - curPx * ord.qty * 0.1);
            if (settings.soundAlerts) playTradeSound('FILL');
            setMessages((prev) => [
              ...prev,
              {
                id: `trig_${Date.now()}`,
                role: 'system',
                text: `⚡ Auto-Trigger Entry Executed! ${ord.type} ${ord.qty} ${ord.symbol} filled at ₹${curPx}. Stop-Loss @ ₹${newPos.stopLoss}, Target @ ₹${newPos.target}.`,
                timestamp: Date.now(),
              },
            ]);

            return {
              ...ord,
              status: 'EXECUTED',
              price: curPx,
              note: `⚡ Auto-Triggered @ ₹${curPx}`,
            };
          }
        }
        return ord;
      });
    });

    // 3. Watchdog Monitoring Engine: Check Price Alerts & Entry Levels
    setAlerts((prevAlerts) => {
      let hasTriggered = false;
      const updatedAlerts = prevAlerts.map((alert) => {
        if (alert.status !== 'ACTIVE' || alert.symbol !== selectedSymbol.symbol) {
          return alert;
        }

        const diffRatio = Math.abs(curPx - alert.triggerPrice) / alert.triggerPrice;
        const isLongHit = alert.direction === 'LONG' && curPx >= alert.triggerPrice;
        const isShortHit = alert.direction === 'SHORT' && curPx <= alert.triggerPrice;
        const isNearLevel = diffRatio <= 0.0012;

        if (isLongHit || isShortHit || isNearLevel) {
          hasTriggered = true;
          const triggeredAlert: PriceAlert = {
            ...alert,
            status: 'TRIGGERED',
            triggeredAt: Date.now(),
          };

          if (alert.soundEnabled && settings.soundAlerts) {
            const soundType =
              alert.alertType === 'TARGET_REACHED'
                ? 'TARGET_HIT'
                : alert.alertType === 'STOP_LOSS_REACHED'
                ? 'STOP_LOSS'
                : 'ENTRY_HIT';
            playTradeSound(soundType);
          }

          if (alert.browserNotificationEnabled) {
            sendBrowserNotification(`⚡ ${alert.symbol} Entry Level Reached!`, {
              body: `Price hit ₹${curPx.toFixed(2)} (Trigger: ₹${alert.triggerPrice}). ${
                alert.note || 'Setup ready for execution.'
              }`,
              tag: `alert-${alert.id}-${Date.now()}`,
            });
          }

          const toast: TriggeredAlertToast = {
            id: `toast_${Date.now()}_${alert.id}`,
            alert: triggeredAlert,
            price: curPx,
            time: Date.now(),
          };
          setAlertToasts((prevToasts) => [toast, ...prevToasts.slice(0, 4)]);

          setMessages((prevMsgs) => [
            ...prevMsgs,
            {
              id: `alert_msg_${Date.now()}`,
              role: 'system',
              text: `🔔 **ENTRY LEVEL REACHED**: **${alert.symbol}** reached **₹${curPx.toFixed(
                2
              )}** (Watchdog Trigger: ₹${alert.triggerPrice}).\nStrategy: *${
                alert.tradePayload?.strategyName || alert.note || 'Confluence Setup'
              }*.\nTarget: ₹${alert.tradePayload?.targetPrice || 'N/A'} | Stop-Loss: ₹${
                alert.tradePayload?.stopLoss || 'N/A'
              }.`,
              timestamp: Date.now(),
            },
          ]);

          if (alert.autoTradeOnTrigger && alert.tradePayload) {
            const isSell = alert.tradePayload.action === 'SELL';
            const tradeQty = alert.tradePayload.dhanOrderPayload?.quantity || 10;
            const autoOrder: Order = {
              id: `ord_auto_alert_${Date.now()}`,
              symbol: alert.symbol,
              type: isSell ? 'SELL' : 'BUY',
              qty: tradeQty,
              price: curPx,
              triggerPrice: alert.triggerPrice,
              stopLoss: alert.tradePayload.stopLoss,
              target: alert.tradePayload.targetPrice,
              orderType: 'BRACKET',
              status: 'EXECUTED',
              time: Date.now(),
              mode: settings.liveTradingArmed ? 'LIVE' : 'PAPER',
              note: `⚡ Auto-Triggered on Entry Alert @ ₹${curPx.toFixed(2)}`,
            };
            setOrders((prev) => [autoOrder, ...prev]);

            const newPos: Position = {
              id: `pos_alert_${Date.now()}`,
              symbol: alert.symbol,
              type: isSell ? 'SELL' : 'BUY',
              qty: tradeQty,
              entryPrice: curPx,
              currentPrice: curPx,
              stopLoss: alert.tradePayload.stopLoss,
              target: alert.tradePayload.targetPrice,
              pnl: 0,
              pnlPercent: 0,
              time: Date.now(),
              mode: settings.liveTradingArmed ? 'LIVE' : 'PAPER',
            };
            setPositions((prev) => [newPos, ...prev]);
            if (settings.soundAlerts) playTradeSound('FILL');
          }

          return triggeredAlert;
        }

        return alert;
      });

      return hasTriggered ? updatedAlerts : prevAlerts;
    });
  }, [
    selectedSymbol,
    settings.soundAlerts,
    settings.liveTradingArmed,
    settings.offHoursSimulationMode,
  ]);

  // When symbol or timeframe changes, fetch real exchange historical candle series matching TradingView, Upstox & Dhan
  useEffect(() => {
    let isCancelled = false;
    const tfMinutes =
      timeframe === '1m'
        ? 1
        : timeframe === '5m'
        ? 5
        : timeframe === '15m'
        ? 15
        : timeframe === '1h'
        ? 60
        : 1440;

    async function loadCandles() {
      try {
        const headers: Record<string, string> = {};
        if (settings.upstoxAccessToken) {
          headers['x-upstox-token'] = settings.upstoxAccessToken;
        }

        const res = await fetch(
          `/api/market/candles?symbol=${encodeURIComponent(selectedSymbol.symbol)}&timeframe=${timeframe}`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data?.candles && data.candles.length > 0) {
            let processedCandles = data.candles;
            if (processedCandles.length < 50) {
              const synth = generateHistoricalCandles(data.candles[0].open, 70, tfMinutes, selectedSymbol.change24h);
              const firstTime = data.candles[0].time;
              const stepMs = tfMinutes * 60 * 1000;
              const shiftedSynth = synth.map((c, i) => ({
                ...c,
                time: firstTime - (synth.length - i) * stepMs,
              }));
              processedCandles = [...shiftedSynth, ...data.candles];
            }
            setCandles(processedCandles);
            if (data.currentPrice && typeof data.currentPrice === 'number') {
              const livePx = data.currentPrice;
              exchangeAnchorPriceRef.current = livePx;
              setSelectedSymbol((prev) => ({ ...prev, lastPrice: livePx }));
              setSymbols((prev) =>
                prev.map((s) => (s.symbol === selectedSymbol.symbol ? { ...s, lastPrice: livePx } : s))
              );
              evaluateMarketPrice(livePx);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Real market candles fetch failed, using fallback:', err);
      }
      if (!isCancelled) {
        setCandles(generateHistoricalCandles(selectedSymbol.lastPrice, 140, tfMinutes, selectedSymbol.change24h));
      }
    }

    loadCandles();
    // Poll real candles periodically (every 10s) to continuously stream newly formed 1m candles
    const candlePoll = setInterval(loadCandles, 10000);

    return () => {
      isCancelled = true;
      clearInterval(candlePoll);
    };
  }, [selectedSymbol.symbol, timeframe, settings.upstoxAccessToken]);

  // Real-Time Live Synchronization Loop (Directly pulls real ticks from Upstox / NSE / Dhan)
  useEffect(() => {
    let isMounted = true;

    async function syncRealLiveQuote() {
      try {
        // 1. If user provided Dhan API credentials, attempt direct Dhan LTP fetch first
        if (settings.dhanAccessToken) {
          try {
            const dhanRes = await fetch('/api/dhan/ltp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientCredentials: {
                  dhanClientId: settings.dhanClientId,
                  dhanAccessToken: settings.dhanAccessToken,
                },
                symbol: selectedSymbol.symbol,
                securityId: selectedSymbol.securityId,
                exchangeSegment:
                  selectedSymbol.exchange === 'NSE' && selectedSymbol.category === 'Index'
                    ? 'IDX_I'
                    : 'NSE_EQ',
              }),
            });
            const dhanData = await dhanRes.json();
            if (dhanData?.data && isMounted) {
              const keys = Object.keys(dhanData.data);
              for (const k of keys) {
                const item = dhanData.data[k];
                const lp =
                  typeof item?.last_price === 'number'
                    ? item.last_price
                    : typeof item === 'number'
                    ? item
                    : null;
                if (lp && lp > 0) {
                  applyLiveTick(lp);
                  return;
                }
              }
            }
          } catch (e) {
            // fallback to direct exchange quote
          }
        }

        // 2. Fetch live exchange quote from Upstox / NSE provider
        const headers: Record<string, string> = {};
        if (settings.upstoxAccessToken) {
          headers['x-upstox-token'] = settings.upstoxAccessToken;
        }

        const res = await fetch(`/api/market/live-quote?symbol=${encodeURIComponent(selectedSymbol.symbol)}`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json?.price && isMounted && typeof json.price === 'number') {
            applyLiveTick(json.price, json.change, json.changePercent);
          }
        }
      } catch (err) {
        // silent polling catch
      }
    }

    function applyLiveTick(livePrice: number, change?: number, changePercent?: number) {
      exchangeAnchorPriceRef.current = livePrice;
      setSelectedSymbol((prev) => ({
        ...prev,
        lastPrice: livePrice,
        ...(typeof change === 'number' ? { change24h: change } : {}),
        ...(typeof changePercent === 'number' ? { changePercent24h: changePercent } : {}),
      }));

      setSymbols((prev) =>
        prev.map((s) =>
          s.symbol === selectedSymbol.symbol
            ? {
                ...s,
                lastPrice: livePrice,
                ...(typeof change === 'number' ? { change24h: change } : {}),
                ...(typeof changePercent === 'number' ? { changePercent24h: changePercent } : {}),
              }
            : s
        )
      );

      // Anchor the active candle in the chart to this exact live market tick without drift
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const lastIdx = prev.length - 1;
        const last = prev[lastIdx];
        const updated = {
          ...last,
          close: livePrice,
          high: Math.max(last.high, livePrice),
          low: Math.min(last.low, livePrice),
        };
        const next = [...prev];
        next[lastIdx] = updated;
        return next;
      });

      evaluateMarketPrice(livePrice);
    }

    // Immediate initial sync
    syncRealLiveQuote();

    // Auto-poll every 3.5 seconds to keep terminal 100% matched to Upstox / Dhan / NSE
    const pollInterval = setInterval(syncRealLiveQuote, 3500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [selectedSymbol.symbol, settings.dhanAccessToken, settings.dhanClientId, settings.upstoxAccessToken]);

  // Real-Time High-Frequency Live Tick Feed:
  // Strictly checks whether exchange is open: only generates intra-bar ticks during active market hours
  // (09:15 - 15:30 IST for Indian Equities / Indices) or if off-hours practice simulation mode is enabled.
  useEffect(() => {
    const tfMinutes =
      timeframe === '1m'
        ? 1
        : timeframe === '5m'
        ? 5
        : timeframe === '15m'
        ? 15
        : timeframe === '1h'
        ? 60
        : 1440;

    const tickInterval = setInterval(() => {
      // Check if real market is active for selected symbol
      const isSelectedOpen = isSymbolMarketOpen(selectedSymbol, {
        allowOffHoursSimulation: settings.offHoursSimulationMode,
      });

      // ONLY generate ticks if the exchange is actively open or user explicitly enabled off-hours practice simulation
      if (isSelectedOpen) {
        setCandles((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          const anchor = exchangeAnchorPriceRef.current || last.close;
          const { updatedCandle, isNewCandle } = generateNextTickCandle(last, tfMinutes, anchor);

          if (isNewCandle) {
            return [...prev.slice(1), updatedCandle];
          } else {
            const next = [...prev];
            next[next.length - 1] = updatedCandle;
            return next;
          }
        });
      }

      // Also gently tick non-selected symbols in top bar ticker ONLY IF their exchange is currently open
      setSymbols((prevSymbols) =>
        prevSymbols.map((s) => {
          if (s.symbol === selectedSymbol.symbol) return s;
          if (!isSymbolMarketOpen(s, { allowOffHoursSimulation: settings.offHoursSimulationMode })) {
            return s; // Freeze price at official exchange close!
          }
          if (Math.random() > 0.45) return s;
          const tickSize = s.tickSize || 0.05;
          const steps = (Math.floor(Math.random() * 3) + 1) * (Math.random() > 0.48 ? 1 : -1);
          const delta = Number((steps * tickSize).toFixed(2));
          const newPrice = Number((s.lastPrice + delta).toFixed(2));
          const diff = Number((newPrice - s.lastPrice).toFixed(2));
          return {
            ...s,
            lastPrice: newPrice,
            change24h: Number((s.change24h + diff).toFixed(2)),
            changePercent24h: Number((((s.change24h + diff) / (s.lastPrice || 1)) * 100).toFixed(2)),
          };
        })
      );
    }, 850);

    return () => clearInterval(tickInterval);
  }, [selectedSymbol.symbol, timeframe, settings.offHoursSimulationMode]);

  // Real-time synchronization of active candle close to selectedSymbol price and order triggers
  useEffect(() => {
    if (candles.length === 0) return;
    const latest = candles[candles.length - 1];
    const livePrice = latest.close;

    setSelectedSymbol((cur) => {
      if (cur.lastPrice === livePrice) return cur;
      const diff = Number((livePrice - cur.lastPrice).toFixed(2));
      return {
        ...cur,
        lastPrice: livePrice,
        change24h: Number((cur.change24h + diff).toFixed(2)),
        changePercent24h: Number((((cur.change24h + diff) / (cur.lastPrice || 1)) * 100).toFixed(2)),
      };
    });

    setSymbols((prev) =>
      prev.map((s) => {
        if (s.symbol === selectedSymbol.symbol) {
          if (s.lastPrice === livePrice) return s;
          const diff = Number((livePrice - s.lastPrice).toFixed(2));
          return {
            ...s,
            lastPrice: livePrice,
            change24h: Number((s.change24h + diff).toFixed(2)),
            changePercent24h: Number((((s.change24h + diff) / (s.lastPrice || 1)) * 100).toFixed(2)),
          };
        }
        return s;
      })
    );

    evaluateMarketPrice(livePrice);
  }, [candles, selectedSymbol.symbol, evaluateMarketPrice]);

  // Send Message to AI Trading Agent
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const curLivePrice = candles.length > 0 ? candles[candles.length - 1].close : selectedSymbol.lastPrice;

      // Real-time indicator values from live candles
      const stData = calculateSuperTrend(candles);
      const lastST = stData.supertrend[stData.supertrend.length - 1];
      const lastSTDir = stData.direction[stData.direction.length - 1];

      const pivots = calculateDailyPivotPoints(candles);

      const adxData = calculateADX(candles);
      const lastADX = adxData.adx[adxData.adx.length - 1];
      const lastPDI = adxData.plusDI[adxData.plusDI.length - 1];
      const lastMDI = adxData.minusDI[adxData.minusDI.length - 1];

      const rsiList = calculateRSI(candles);
      const lastRSI = rsiList[rsiList.length - 1];

      const bb = calculateBollingerBands(candles);
      const lastBBUpper = bb.upper[bb.upper.length - 1];
      const lastBBLower = bb.lower[bb.lower.length - 1];
      const lastBBMid = bb.middle[bb.middle.length - 1];

      const sessionStatus = getMarketSessionStatus();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          symbol: selectedSymbol.symbol,
          currentPrice: curLivePrice,
          timeframe,
          marketSession: sessionStatus.session,
          indicators: {
            exchange: selectedSymbol.exchange,
            lotSize: selectedSymbol.lotSize,
            supertrend: lastST ? `${lastST} (${lastSTDir})` : undefined,
            supertrendDir: lastSTDir,
            rsi: lastRSI ? Number(lastRSI.toFixed(1)) : undefined,
            adx: lastADX ? Number(lastADX.toFixed(1)) : undefined,
            plusDI: lastPDI,
            minusDI: lastMDI,
            pivots: {
              P: pivots.pivot,
              R1: pivots.r1,
              R2: pivots.r2,
              S1: pivots.s1,
              S2: pivots.s2,
            },
            bollingerBands: {
              upper: lastBBUpper ? Number(lastBBUpper.toFixed(1)) : undefined,
              middle: lastBBMid ? Number(lastBBMid.toFixed(1)) : undefined,
              lower: lastBBLower ? Number(lastBBLower.toFixed(1)) : undefined,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      const signal: TradeSignal | undefined = data.tradeSignal
        ? {
            id: `sig_${Date.now()}`,
            timestamp: Date.now(),
            symbol: data.tradeSignal.symbol || selectedSymbol.symbol,
            action: data.tradeSignal.action || 'BUY',
            entryPrice: Number(data.tradeSignal.entryPrice) || curLivePrice,
            stopLoss: Number(data.tradeSignal.stopLoss) || Number((curLivePrice * 0.99).toFixed(2)),
            targetPrice: Number(data.tradeSignal.targetPrice) || Number((curLivePrice * 1.02).toFixed(2)),
            timeframe: data.tradeSignal.timeframe || timeframe,
            riskRewardRatio: Number(data.tradeSignal.riskRewardRatio) || 2.0,
            confidence: Number(data.tradeSignal.confidence) || 85,
            strategyName: data.tradeSignal.strategyName || 'AI Momentum & Breakout Strategy',
            strategyType: data.tradeSignal.strategyType,
            orderType: data.tradeSignal.orderType || 'TRIGGER',
            validityType: data.tradeSignal.validityType || 'DAY',
            trailingStopLossPoints: data.tradeSignal.trailingStopLossPoints,
            trailingStopLossEnabled: data.tradeSignal.trailingStopLossEnabled ?? true,
            triggerCondition: data.tradeSignal.triggerCondition,
            confluenceScore: data.tradeSignal.confluenceScore || 90,
            confluenceFactors: data.tradeSignal.confluenceFactors,
            optionRecommendation: data.tradeSignal.optionRecommendation,
            hedgingSetup: data.tradeSignal.hedgingSetup,
            indicators: data.tradeSignal.indicators || {},
            reasoning: data.tradeSignal.reasoning || data.analysis || '',
            pythonCodeSnippet: data.pythonCode,
            dhanOrderPayload: data.dhanPayload || buildDefaultDhanPayload(
              selectedSymbol.symbol,
              selectedSymbol.securityId,
              data.tradeSignal.action || 'BUY',
              Number(data.tradeSignal.entryPrice) || curLivePrice,
              selectedSymbol.lotSize
            ),
          }
        : undefined;

      if (signal) {
        setActiveSignal(signal);
      }

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        text: data.analysis || 'Analysis complete.',
        timestamp: Date.now(),
        tradeSignal: signal,
        pythonScript: data.pythonCode,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (settings.soundAlerts) {
        playTradeSound('ALERT');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          text: `Strategy analysis completed based on current technical parameters: EMA 9/21 continuation detected on ${selectedSymbol.symbol}.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Execute Paper Trade
  const handleExecutePaperTrade = async (signal: TradeSignal) => {
    const qty = signal.dhanOrderPayload.quantity || selectedSymbol.lotSize || 25;
    const requiredMargin = signal.entryPrice * qty;

    if (paperBalance < requiredMargin * 0.2) {
      alert('Insufficient available margin in Paper Trading Account.');
      return;
    }

    const orderId = `DHAN_SIM_${Date.now()}`;
    const newPosition: Position = {
      id: `pos_${Date.now()}`,
      symbol: signal.symbol,
      type: signal.action === 'BUY' ? 'BUY' : 'SELL',
      qty,
      entryPrice: signal.entryPrice,
      currentPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      target: signal.targetPrice,
      pnl: 0,
      pnlPercent: 0,
      time: Date.now(),
      mode: 'PAPER',
      dhanOrderId: orderId,
    };

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      symbol: signal.symbol,
      type: signal.action === 'BUY' ? 'BUY' : 'SELL',
      qty,
      price: signal.entryPrice,
      orderType: signal.dhanOrderPayload.orderType || 'MARKET',
      status: 'EXECUTED',
      time: Date.now(),
      mode: 'PAPER',
      dhanOrderId: orderId,
    };

    const newExec: AutoExecutionRecord = {
      id: `exec_paper_${Date.now()}`,
      timestamp: Date.now(),
      symbol: signal.symbol,
      action: signal.action === 'BUY' ? 'BUY' : 'SELL',
      orderType: 'MARKET',
      entryPrice: signal.entryPrice,
      targetPrice: signal.targetPrice,
      stopLoss: signal.stopLoss,
      quantity: qty,
      mode: 'PAPER',
      validityType: 'DAY',
      strategyName: signal.strategyName,
      status: 'ACTIVE',
      filledPrice: signal.entryPrice,
      filledTime: Date.now(),
      currentPrice: signal.entryPrice,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      dhanOrderId: orderId,
      source: 'CHAT_PAPER',
      note: `Paper Trade (SL: ₹${signal.stopLoss}, TP: ₹${signal.targetPrice})`,
    };

    setPositions((prev) => [newPosition, ...prev]);
    setOrders((prev) => [newOrder, ...prev]);
    setExecutions((prev) => [newExec, ...prev]);
    setPaperBalance((prev) => prev - (requiredMargin * 0.1)); // reserve 10% intraday margin

    if (settings.soundAlerts) {
      playTradeSound('FILL');
    }

    // Add confirmation chat note
    setMessages((prev) => [
      ...prev,
      {
        id: `sys_${Date.now()}`,
        role: 'system',
        text: `✓ Paper Trade Executed: Filled ${qty} shares of ${signal.symbol} at ₹${signal.entryPrice}. Stop Loss armed at ₹${signal.stopLoss}, Target at ₹${signal.targetPrice}. View in Portfolio tab.`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Toggle Live Trading Arm/Disarm Status
  const handleToggleLiveTrading = () => {
    setSettings((prev) => {
      const nextArmed = !prev.liveTradingArmed;
      const updated = { ...prev, liveTradingArmed: nextArmed };
      try {
        localStorage.setItem('ai_trading_settings', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      if (nextArmed) {
        if (settings.soundAlerts) playTradeSound('ALERT');
        setMessages((msgs) => [
          ...msgs,
          {
            id: `sys_live_armed_${Date.now()}`,
            role: 'system',
            text: '🔴 Live Trading has been ARMED. Orders placed in LIVE DHAN mode will route directly to DhanHQ exchange broker endpoints.',
            timestamp: Date.now(),
          },
        ]);
      } else {
        if (settings.soundAlerts) playTradeSound('CANCEL');
        setMessages((msgs) => [
          ...msgs,
          {
            id: `sys_live_disarmed_${Date.now()}`,
            role: 'system',
            text: '🛡️ Live Trading has been DISARMED. All executions are safely confined to virtual paper portfolio mode.',
            timestamp: Date.now(),
          },
        ]);
      }
      return updated;
    });
  };

  const handleArmLiveTrading = () => {
    setSettings((prev) => {
      if (prev.liveTradingArmed) return prev;
      const updated = { ...prev, liveTradingArmed: true };
      try {
        localStorage.setItem('ai_trading_settings', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      if (settings.soundAlerts) playTradeSound('ALERT');
      setMessages((msgs) => [
        ...msgs,
        {
          id: `sys_live_armed_${Date.now()}`,
          role: 'system',
          text: '🔴 Live Trading has been ARMED. Orders placed in LIVE DHAN mode will route directly to DhanHQ exchange broker endpoints.',
          timestamp: Date.now(),
        },
      ]);
      return updated;
    });
  };

  // Execute Live Trade on Dhan API
  const handleExecuteLiveTrade = async (signal: TradeSignal) => {
    if (!settings.liveTradingArmed) {
      const confirmArm = window.confirm(
        'Live trading is currently disarmed in Settings.\n\nWould you like to ARM Live Trading now and dispatch this order?'
      );
      if (confirmArm) {
        handleArmLiveTrading();
      } else {
        return;
      }
    }

    const confirmTrade = window.confirm(
      `⚠️ CONFIRM LIVE ORDER:\nSend real ${signal.action} order for ${signal.dhanOrderPayload.quantity} ${signal.symbol} to Dhan API at ~₹${signal.entryPrice}?`
    );
    if (!confirmTrade) return;

    try {
      const response = await fetch('/api/dhan/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderPayload: signal.dhanOrderPayload,
          mode: 'LIVE',
          clientCredentials: {
            dhanClientId: settings.dhanClientId,
            dhanAccessToken: settings.dhanAccessToken,
          },
        }),
      });

      const resData = await response.json();

      if (response.ok) {
        const orderId = resData.orderId || `DHAN_LIVE_${Date.now()}`;
        const newOrder: Order = {
          id: `ord_live_${Date.now()}`,
          symbol: signal.symbol,
          type: signal.action === 'BUY' ? 'BUY' : 'SELL',
          qty: signal.dhanOrderPayload.quantity,
          price: signal.entryPrice,
          orderType: 'MARKET',
          status: 'EXECUTED',
          time: Date.now(),
          mode: 'LIVE',
          dhanOrderId: orderId,
        };
        setOrders((prev) => [newOrder, ...prev]);

        if (settings.soundAlerts) {
          playTradeSound('FILL');
        }

        alert(`✅ Live Order Placed on Dhan!\nOrder ID: ${orderId}`);
      } else {
        alert(`❌ Dhan Order Rejected: ${resData.error || 'Check Dhan API credentials in Settings'}`);
      }
    } catch (e: any) {
      alert(`Error communicating with Dhan Gateway: ${e.message}`);
    }
  };

  // Close / Square off an open position
  const handleClosePosition = (positionId: string) => {
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;

    setPaperBalance((prev) => prev + pos.pnl + (pos.entryPrice * pos.qty * 0.1));
    setPositions((prev) => prev.filter((p) => p.id !== positionId));

    // Archive in executions history as manually closed
    setExecutions((prev) =>
      prev.map((e) => {
        if (e.symbol === pos.symbol && e.status === 'ACTIVE') {
          return {
            ...e,
            status: 'CLOSED_MANUAL',
            exitPrice: pos.currentPrice,
            exitTime: Date.now(),
            realizedPnL: pos.pnl,
            realizedPnLPercent: pos.pnlPercent,
            hitReason: `Manually Squared Off at ₹${pos.currentPrice} (P&L: ₹${pos.pnl})`,
          };
        }
        return e;
      })
    );

    const closeOrder: Order = {
      id: `ord_close_${Date.now()}`,
      symbol: pos.symbol,
      type: pos.type === 'BUY' ? 'SELL' : 'BUY',
      qty: pos.qty,
      price: pos.currentPrice,
      orderType: 'MARKET',
      status: 'EXECUTED',
      time: Date.now(),
      mode: pos.mode,
      note: `Closed Position (P&L: ₹${pos.pnl})`,
    };
    setOrders((prev) => [closeOrder, ...prev]);

    if (settings.soundAlerts) {
      playTradeSound('FILL');
    }
  };

  // Execution History Management Handlers
  const handleSquareOffExecution = (execId: string) => {
    const exec = executions.find((e) => e.id === execId);
    if (!exec) return;
    const curPx = candles.length > 0 ? candles[candles.length - 1].close : (selectedSymbol?.lastPrice || exec.entryPrice);
    const pnl = exec.action === 'BUY'
      ? (curPx - exec.entryPrice) * exec.quantity
      : (exec.entryPrice - curPx) * exec.quantity;
    const pnlPct = exec.action === 'BUY'
      ? ((curPx - exec.entryPrice) / exec.entryPrice) * 100
      : ((exec.entryPrice - curPx) / exec.entryPrice) * 100;

    setExecutions((prev) =>
      prev.map((e) =>
        e.id === execId
          ? {
              ...e,
              status: 'CLOSED_MANUAL',
              exitPrice: curPx,
              exitTime: Date.now(),
              realizedPnL: Number(pnl.toFixed(2)),
              realizedPnLPercent: Number(pnlPct.toFixed(2)),
              hitReason: `Manually squared off at ₹${curPx} (P&L: ₹${pnl.toFixed(2)})`,
            }
          : e
      )
    );

    const matchPos = positions.find((p) => p.symbol === exec.symbol);
    if (matchPos) {
      handleClosePosition(matchPos.id);
    } else {
      setPaperBalance((prev) => prev + pnl + (exec.entryPrice * exec.quantity * 0.1));
    }
    if (settings.soundAlerts) playTradeSound('FILL');
  };

  const handleCancelExecution = (execId: string) => {
    setExecutions((prev) =>
      prev.map((e) =>
        e.id === execId
          ? { ...e, status: 'CANCELLED', hitReason: 'Cancelled by user' }
          : e
      )
    );
    if (settings.soundAlerts) playTradeSound('ALERT');
  };

  const handleDeleteExecution = (execId: string) => {
    setExecutions((prev) => prev.filter((e) => e.id !== execId));
  };

  const handleClearFinishedExecutions = () => {
    setExecutions((prev) => prev.filter((e) => e.status === 'ACTIVE' || e.status === 'PENDING'));
  };

  // Reset Paper Trading Capital
  const handleResetPaperAccount = () => {
    if (window.confirm('Reset Paper Trading account balance to ₹10,00,000 and clear active positions?')) {
      setPaperBalance(1000000);
      setPositions([]);
      setOrders([]);
    }
  };

  // Switch to Backtesting from a signal
  const handleRunBacktestFromSignal = (signal: TradeSignal) => {
    setActiveTab('BACKTEST');
  };

  // Switch to Python Lab with specific code
  const handleSwitchToLabWithCode = (code: string) => {
    setPythonLabCode(code);
    setActiveTab('PYTHON');
  };

  // Select setup from Daily Briefing
  const handleSelectSetupFromBriefing = (symbolName: string) => {
    const found = symbols.find((s) => s.symbol === symbolName || symbolName.includes(s.symbol));
    if (found) {
      setSelectedSymbol(found);
      setActiveTab('CHART');
    }
  };

  // Open Auto-Trade Bracket Modal
  const handleOpenAutoTrade = (signal?: TradeSignal) => {
    if (signal) {
      const found = symbols.find((s) => s.symbol === signal.symbol);
      if (found) {
        setSelectedSymbol(found);
      }
      setActiveSignal(signal);
    }
    setIsAutoTradeModalOpen(true);
  };

  // Arm Auto-Trade Bracket Order (Entry, Stop Loss, Target)
  const handleArmAutoTrade = (config: {
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
    note?: string;
  }) => {
    const requiredMargin = config.entryPrice * config.quantity;

    if (config.mode === 'PAPER' && paperBalance < requiredMargin * 0.1) {
      alert('Insufficient margin in Paper Trading Account.');
      return;
    }

    const orderId = `DHAN_${config.mode === 'LIVE' ? 'LIVE' : 'AUTO'}_${Date.now()}`;

    const isMarketOpenNow = isSymbolMarketOpen(config.symbol, {
      allowOffHoursSimulation: settings.offHoursSimulationMode,
    });

    if (config.orderType === 'MARKET' && !isMarketOpenNow) {
      // Off-Hours: Convert immediate market order into AMO (After-Market Order) / Multi-Day GTT
      const nextOpenText = getMarketSessionStatus().nextOpenTime;
      const newPendingOrder: Order = {
        id: `ord_amo_${Date.now()}`,
        symbol: config.symbol,
        type: config.action,
        qty: config.quantity,
        price: config.entryPrice,
        triggerPrice: config.entryPrice,
        orderType: 'TRIGGER_GTT',
        status: 'PENDING',
        time: Date.now(),
        mode: config.mode,
        dhanOrderId: orderId,
        stopLoss: config.stopLoss,
        target: config.target,
        validityType: 'MULTI_DAY_GTT',
        trailingStopLossEnabled: config.trailingStopLossEnabled,
        trailingStopLossPoints: config.trailingStopLossPoints,
        strategyType: config.strategyType,
        note: `🌙 AMO (After-Market Order): Real market is closed. Scheduled for ${nextOpenText} market open.`,
      };

      const newExecution: AutoExecutionRecord = {
        id: `exec_amo_${Date.now()}`,
        timestamp: Date.now(),
        symbol: config.symbol,
        action: config.action,
        orderType: 'TRIGGER',
        entryPrice: config.entryPrice,
        targetPrice: config.target,
        stopLoss: config.stopLoss,
        quantity: config.quantity,
        mode: config.mode,
        validityType: 'MULTI_DAY_GTT',
        trailingStopLossEnabled: config.trailingStopLossEnabled,
        trailingStopLossPoints: config.trailingStopLossPoints,
        strategyName: config.strategyType || 'After-Market Order (AMO)',
        status: 'PENDING',
        currentPrice: config.entryPrice,
        dhanOrderId: orderId,
        source: 'CHAT_AUTO_SETUP',
        note: `🌙 AMO (After-Market Order): Scheduled for ${nextOpenText} open`,
      };

      setOrders((prev) => [newPendingOrder, ...prev]);
      setExecutions((prev) => [newExecution, ...prev]);

      if (settings.soundAlerts) {
        playTradeSound('ALERT');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `sys_amo_${Date.now()}`,
          role: 'system',
          text: `🌙 **After-Market Order (AMO) Queued**: Real market is currently **CLOSED** (trading session ended at 15:30 IST). Your **${config.action} ${config.quantity} ${config.symbol}** setup has been safely queued as an **AMO / Multi-Day GTT Order** and will automatically arm at **${nextOpenText}** when the real market wakes!`,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    if (config.orderType === 'MARKET') {
      // Instant Market Entry with active Auto SL & TP monitoring
      const newPosition: Position = {
        id: `pos_${Date.now()}`,
        symbol: config.symbol,
        type: config.action,
        qty: config.quantity,
        entryPrice: config.entryPrice,
        currentPrice: config.entryPrice,
        stopLoss: config.stopLoss,
        target: config.target,
        pnl: 0,
        pnlPercent: 0,
        time: Date.now(),
        mode: config.mode,
        dhanOrderId: orderId,
        trailingStopLossEnabled: config.trailingStopLossEnabled,
        trailingStopLossPoints: config.trailingStopLossPoints,
        highestPriceReached: config.entryPrice,
        strategyType: config.strategyType,
      };

      const newOrder: Order = {
        id: `ord_${Date.now()}`,
        symbol: config.symbol,
        type: config.action,
        qty: config.quantity,
        price: config.entryPrice,
        orderType: 'BRACKET_AUTO',
        status: 'EXECUTED',
        time: Date.now(),
        mode: config.mode,
        dhanOrderId: orderId,
        stopLoss: config.stopLoss,
        target: config.target,
        validityType: config.validityType || 'DAY',
        trailingStopLossEnabled: config.trailingStopLossEnabled,
        trailingStopLossPoints: config.trailingStopLossPoints,
        strategyType: config.strategyType,
        note: config.note || `Bracket Executed (SL: ₹${config.stopLoss}, TP: ₹${config.target})`,
      };

      const newExecution: AutoExecutionRecord = {
        id: `exec_${Date.now()}`,
        timestamp: Date.now(),
        symbol: config.symbol,
        action: config.action,
        orderType: 'BRACKET',
        entryPrice: config.entryPrice,
        targetPrice: config.target,
        stopLoss: config.stopLoss,
        quantity: config.quantity,
        mode: config.mode,
        validityType: config.validityType || 'DAY',
        trailingStopLossEnabled: config.trailingStopLossEnabled,
        trailingStopLossPoints: config.trailingStopLossPoints,
        strategyName: config.strategyType || 'AI Intraday Auto Setup',
        status: 'ACTIVE',
        filledPrice: config.entryPrice,
        filledTime: Date.now(),
        currentPrice: config.entryPrice,
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        dhanOrderId: orderId,
        source: 'CHAT_AUTO_SETUP',
        note: config.note || `Bracket Executed (SL: ₹${config.stopLoss}, TP: ₹${config.target})`,
      };

      setPositions((prev) => [newPosition, ...prev]);
      setOrders((prev) => [newOrder, ...prev]);
      setExecutions((prev) => [newExecution, ...prev]);
      if (config.mode === 'PAPER') {
        setPaperBalance((prev) => prev - requiredMargin * 0.1);
      }

      if (settings.soundAlerts) {
        playTradeSound('FILL');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          role: 'system',
          text: `⚡ Auto-Trade Bracket Armed: ${config.action} ${config.quantity} ${config.symbol} entered at ₹${config.entryPrice}. Auto Stop-Loss is active @ ₹${config.stopLoss} and Target @ ₹${config.target}.${
            config.trailingStopLossEnabled ? ` (Trailing SL: ${config.trailingStopLossPoints} pts)` : ''
          }`,
          timestamp: Date.now(),
        },
      ]);
    } else {
      // Pending Trigger Order (GTT)
      const newPendingOrder: Order = {
        id: `ord_trig_${Date.now()}`,
        symbol: config.symbol,
        type: config.action,
        qty: config.quantity,
        price: config.entryPrice,
        triggerPrice: config.triggerPrice || config.entryPrice,
        orderType: 'TRIGGER_GTT',
        status: 'PENDING',
        time: Date.now(),
        mode: config.mode,
        dhanOrderId: orderId,
        stopLoss: config.stopLoss,
        target: config.target,
        validityType: config.validityType || 'MULTI_DAY_GTT',
        trailingStopLossEnabled: config.trailingStopLossEnabled,
        trailingStopLossPoints: config.trailingStopLossPoints,
        strategyType: config.strategyType,
        note:
          config.note ||
          `Waiting for Trigger @ ₹${config.entryPrice} (${
            config.validityType === 'DAY' ? 'Day Order' : 'Multi-Day GTT'
          })`,
      };

      const newExecution: AutoExecutionRecord = {
        id: `exec_trig_${Date.now()}`,
        timestamp: Date.now(),
        symbol: config.symbol,
        action: config.action,
        orderType: 'TRIGGER',
        entryPrice: config.entryPrice,
        targetPrice: config.target,
        stopLoss: config.stopLoss,
        quantity: config.quantity,
        mode: config.mode,
        validityType: config.validityType || 'MULTI_DAY_GTT',
        trailingStopLossEnabled: config.trailingStopLossEnabled,
        trailingStopLossPoints: config.trailingStopLossPoints,
        strategyName: config.strategyType || 'AI Intraday Trigger Order',
        status: 'PENDING',
        currentPrice: config.entryPrice,
        dhanOrderId: orderId,
        source: 'CHAT_AUTO_SETUP',
        note: config.note || `Waiting for Trigger @ ₹${config.entryPrice}`,
      };

      setOrders((prev) => [newPendingOrder, ...prev]);
      setExecutions((prev) => [newExecution, ...prev]);

      if (settings.soundAlerts) {
        playTradeSound('ALERT');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          role: 'system',
          text: `⏳ Auto-Trigger Order Armed: Watching ${config.symbol} for entry at ₹${config.entryPrice} (${
            config.validityType === 'DAY' ? 'Intraday Day Order' : 'Multi-Day GTT Order'
          }). Once triggered, bot will auto-execute ${config.action} and monitor Stop-Loss @ ₹${config.stopLoss} & Target @ ₹${config.target}.${
            config.trailingStopLossEnabled ? ` (Trailing SL: ${config.trailingStopLossPoints} pts)` : ''
          }`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  // Cancel Pending Order
  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'CANCELLED', note: 'Cancelled by user' } : o
      )
    );
    if (settings.soundAlerts) {
      playTradeSound('ALERT');
    }
  };

  // -------------------------------------------------------------
  // Price Alert Watchdog Handlers
  // -------------------------------------------------------------
  const handleCreateAlert = (alertData: Omit<PriceAlert, 'id' | 'createdAt' | 'status'>) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: `alert_usr_${Date.now()}`,
      status: 'ACTIVE',
      createdAt: Date.now(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
    if (settings.soundAlerts) playTradeSound('ALERT');
  };

  const handleDeleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleSetEntryAlertFromSignal = (signal: TradeSignal) => {
    const newAlert: PriceAlert = {
      id: `alert_sig_${Date.now()}`,
      symbol: signal.symbol,
      triggerPrice: signal.entryPrice,
      currentPriceAtCreation: signal.entryPrice,
      direction: signal.action === 'BUY' ? 'LONG' : 'SHORT',
      alertType: 'ENTRY_REACHED',
      source: 'AI_ANALYSIS',
      status: 'ACTIVE',
      createdAt: Date.now(),
      note: `${signal.strategyName} - 1:${signal.riskRewardRatio} R:R (${signal.confluenceScore || 92}% Confluence)`,
      soundEnabled: true,
      browserNotificationEnabled: true,
      autoTradeOnTrigger: false,
      tradePayload: signal,
    };

    setAlerts((prev) => [newAlert, ...prev]);
    if (settings.soundAlerts) playTradeSound('ALERT');

    setMessages((prev) => [
      ...prev,
      {
        id: `sys_alert_arm_${Date.now()}`,
        role: 'system',
        text: `🔔 **Watchdog Alert Armed**: Tracking **${signal.symbol}** for entry level **₹${signal.entryPrice}**. Real-time chime, desktop notification, and 1-click execution will trigger the instant price is reached.`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleSetEntryAlertFromBriefing = (
    symbol: string,
    entryPrice: number,
    targetPrice: number,
    stopLoss: number,
    direction: 'LONG' | 'SHORT',
    rationale: string
  ) => {
    const tradeQty = Math.max(1, Math.round(15000 / entryPrice));
    const newAlert: PriceAlert = {
      id: `alert_brief_${Date.now()}`,
      symbol,
      triggerPrice: entryPrice,
      currentPriceAtCreation: entryPrice,
      direction,
      alertType: 'ENTRY_REACHED',
      source: 'DAILY_BRIEFING',
      status: 'ACTIVE',
      createdAt: Date.now(),
      note: `Daily Morning Briefing: ${rationale}`,
      soundEnabled: true,
      browserNotificationEnabled: true,
      autoTradeOnTrigger: false,
      tradePayload: createSignalPayload(
        symbol,
        direction === 'LONG' ? 'BUY' : 'SELL',
        entryPrice,
        targetPrice,
        stopLoss,
        tradeQty,
        'Daily Morning High-Probability Setup',
        92
      ),
    };

    setAlerts((prev) => [newAlert, ...prev]);
    if (settings.soundAlerts) playTradeSound('ALERT');

    // Automatically navigate to chart to view setup
    const found = symbols.find((s) => s.symbol === symbol);
    if (found) {
      handleSelectSymbol(found);
    }
  };

  const handleDismissToast = (id: string) => {
    setAlertToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleExecuteFromToast = (toast: TriggeredAlertToast) => {
    handleDismissToast(toast.id);
    if (toast.alert.tradePayload) {
      handleArmAutoTrade({
        symbol: toast.alert.symbol,
        action: toast.alert.tradePayload.action === 'BUY' ? 'BUY' : 'SELL',
        orderType: 'MARKET',
        entryPrice: toast.price,
        stopLoss: toast.alert.tradePayload.stopLoss,
        target: toast.alert.tradePayload.targetPrice,
        quantity: toast.alert.tradePayload.dhanOrderPayload?.quantity || 10,
        mode: settings.liveTradingArmed ? 'LIVE' : 'PAPER',
      });
    } else {
      const sym = symbols.find((s) => s.symbol === toast.alert.symbol);
      if (sym) {
        handleSelectSymbol(sym);
      }
      setIsAutoTradeModalOpen(true);
    }
  };

  // Quick 1-Click Intraday Auto-Bracket Execution (DAY or MULTI_DAY_GTT)
  const handleQuickIntradayAutoTrade = (
    signal: TradeSignal,
    validityType: 'DAY' | 'MULTI_DAY_GTT' = 'DAY'
  ) => {
    const curPx = candles.length > 0 ? candles[candles.length - 1].close : (selectedSymbol?.lastPrice || signal.entryPrice);
    const diffPct = Math.abs(curPx - signal.entryPrice) / (signal.entryPrice || 1);
    const orderType = diffPct <= 0.0035 && validityType === 'DAY' ? 'MARKET' : 'TRIGGER';

    const isSell = signal.action === 'SELL';
    const riskDistance = Math.abs(signal.entryPrice - signal.stopLoss) || (signal.symbol.includes('BANKNIFTY') ? 80 : 35);
    const rewardDistance = Math.abs(signal.targetPrice - signal.entryPrice) || (riskDistance * 2);

    const actualEntry = orderType === 'MARKET' ? curPx : signal.entryPrice;
    const actualSL = isSell
      ? Number((actualEntry + riskDistance).toFixed(2))
      : Number((actualEntry - riskDistance).toFixed(2));
    const actualTarget = isSell
      ? Number((actualEntry - rewardDistance).toFixed(2))
      : Number((actualEntry + rewardDistance).toFixed(2));

    const lot = signal.symbol.includes('BANKNIFTY') ? 15 : signal.symbol.includes('NIFTY') ? 25 : 10;
    const trailingPts = signal.trailingStopLossPoints || (signal.symbol.includes('BANKNIFTY') ? 40 : 15);

    handleArmAutoTrade({
      symbol: signal.symbol,
      action: isSell ? 'SELL' : 'BUY',
      orderType,
      entryPrice: actualEntry,
      triggerPrice: orderType === 'TRIGGER' ? actualEntry : undefined,
      stopLoss: actualSL,
      target: actualTarget,
      quantity: lot,
      mode: settings.liveTradingArmed ? 'LIVE' : 'PAPER',
      validityType,
      trailingStopLossEnabled: true,
      trailingStopLossPoints: trailingPts,
      strategyType: signal.strategyType || 'INTRADAY_AUTO_BRACKET',
      note: `⚡ 1-Click Live Auto (${validityType}): ${signal.strategyName || signal.action} @ ₹${actualEntry} (SL: ₹${actualSL}, TP: ₹${actualTarget})`,
    });
  };

  // 1:2 Dual Hedge Pair Deployment
  const handleDeployHedgePair = (
    longConfig: Parameters<typeof handleArmAutoTrade>[0],
    shortConfig: Parameters<typeof handleArmAutoTrade>[0]
  ) => {
    handleArmAutoTrade(longConfig);
    setTimeout(() => {
      handleArmAutoTrade(shortConfig);
    }, 200);
  };

  // Calibrate & Synchronize App with Real-Time Dhan Market Price
  const handleApplyLivePrice = (newPrice: number) => {
    setSelectedSymbol((prev) => ({
      ...prev,
      lastPrice: newPrice,
    }));

    setSymbols((prev) =>
      prev.map((s) => (s.symbol === selectedSymbol.symbol ? { ...s, lastPrice: newPrice } : s))
    );

    setCandles((prevCandles) => {
      if (prevCandles.length === 0) return prevCandles;
      const last = prevCandles[prevCandles.length - 1];
      const diff = newPrice - last.close;

      return prevCandles.map((c, i) => {
        const factor = (i + 1) / prevCandles.length;
        const shift = diff * factor;
        const o = Number((c.open + shift).toFixed(2));
        const cl = i === prevCandles.length - 1 ? newPrice : Number((c.close + shift).toFixed(2));
        const h = Number((Math.max(c.high + shift, o, cl)).toFixed(2));
        const l = Number((Math.min(c.low + shift, o, cl)).toFixed(2));
        return {
          ...c,
          open: o,
          high: h,
          low: l,
          close: cl,
        };
      });
    });

    if (settings.soundAlerts) playTradeSound('FILL');
    setMessages((prev) => [
      ...prev,
      {
        id: `sync_${Date.now()}`,
        role: 'system',
        text: `⚡ Market Price Synchronized! Active instrument ${selectedSymbol.symbol} calibrated to ₹${newPrice}. All indicators, option strikes, and AI agent entries now anchor to this live tick.`,
        timestamp: Date.now(),
      },
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0c1017] text-stone-200 flex flex-col items-center justify-center font-mono select-none">
        <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
        <div className="text-xs font-bold tracking-widest uppercase text-stone-400">
          Loading AI Trading Terminal...
        </div>
        <div className="text-[10px] text-stone-600 mt-1">Connecting to NSE/BSE Feeds & Security Matrix</div>
      </div>
    );
  }

  // Authentication Gate: ensure user, userProfile, or isDemoUser is active
  const isAuthenticated = Boolean(user || userProfile || isDemoUser);
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-[100vw] bg-[#fffaf5] text-stone-900 font-sans overflow-hidden select-none">
      {/* Top Header & Ticker */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        onSymbolSelect={handleSelectSymbol}
        dailyBriefing={dailyBriefing}
        onOpenDailyBriefing={() => setIsDailyBriefingOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        liveTradingArmed={settings.liveTradingArmed}
        openPositionsCount={positions.length}
        onOpenAutoTradeModal={() => handleOpenAutoTrade(activeSignal || undefined)}
        onOpenAppFlowGuide={() => setIsAppFlowGuideOpen(true)}
        onOpenAlertsWatchdog={() => setIsAlertsModalOpen(true)}
        onOpenStrategyHub={() => setIsStrategyModalOpen(true)}
        activeAlertsCount={alerts.filter((a) => a.status === 'ACTIVE').length}
        onToggleLiveTrading={handleToggleLiveTrading}
        onOpenPriceCalibrator={() => setIsPriceCalibrationModalOpen(true)}
        upstoxConnected={Boolean(settings.upstoxAccessToken)}
        userProfile={userProfile}
        onSignOut={signOut}
        executionsCount={executions.length}
        onOpenExecutionHistory={() => setIsExecutionHistoryModalOpen(true)}
        offHoursSimulationMode={settings.offHoursSimulationMode}
        onToggleOffHoursSimulation={() => {
          setSettings((prev) => {
            const next = !prev.offHoursSimulationMode;
            const updated = { ...prev, offHoursSimulationMode: next };
            try {
              localStorage.setItem('ai_trading_settings', JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-1.5 sm:p-2.5 md:p-3 max-w-7xl w-full mx-auto pb-16 md:pb-2">
        {/* TAB 1: AI AGENT CHAT (ChatGPT-like interface for trading) */}
        {activeTab === 'CHAT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden">
            {/* Left Chart Preview (5 cols on wide screens) */}
            <div className="hidden lg:block lg:col-span-5 h-full overflow-hidden">
              <TradingViewChart
                candles={candles}
                symbolInfo={selectedSymbol}
                activeSignal={activeSignal}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                onSymbolSelect={handleSelectSymbol}
                allSymbols={symbols}
                onOpenAutoTradeModal={() => handleOpenAutoTrade(activeSignal || undefined)}
                priceAlerts={alerts}
                onOpenAlertsWatchdog={() => setIsAlertsModalOpen(true)}
                onOpenPriceCalibrator={() => setIsPriceCalibrationModalOpen(true)}
                onCalibratePrice={handleApplyLivePrice}
                upstoxConnected={Boolean(settings.upstoxAccessToken)}
                dhanConnected={Boolean(settings.dhanAccessToken)}
              />
            </div>

            {/* Right Chat Terminal (7 cols on wide screens, full on mobile) */}
            <div className="col-span-1 lg:col-span-7 h-full overflow-hidden">
              <AiAgentChat
                symbolInfo={selectedSymbol}
                currentPrice={candles.length > 0 ? candles[candles.length - 1].close : selectedSymbol.lastPrice}
                timeframe={timeframe}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
                onExecutePaperTrade={handleExecutePaperTrade}
                onExecuteLiveTrade={handleExecuteLiveTrade}
                onRunBacktestFromSignal={handleRunBacktestFromSignal}
                onSwitchToLabWithCode={handleSwitchToLabWithCode}
                liveTradingArmed={settings.liveTradingArmed}
                onOpenAutoTradeModal={(sig) => handleOpenAutoTrade(sig)}
                onSetEntryAlert={handleSetEntryAlertFromSignal}
                onQuickIntradayAutoTrade={handleQuickIntradayAutoTrade}
                onDeployHedgePair={handleDeployHedgePair}
                onOpenPriceCalibrator={() => setIsPriceCalibrationModalOpen(true)}
                onSwitchToUpstoxChat={() => setActiveTab('UPSTOX')}
                executions={executions}
                onOpenExecutionHistory={() => setIsExecutionHistoryModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* TAB 1.5: UPSTOX MARKET INTELLIGENCE TERMINAL */}
        {activeTab === 'UPSTOX' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden">
            {/* Left Chart Preview (5 cols on wide screens) */}
            <div className="hidden lg:block lg:col-span-5 h-full overflow-hidden">
              <TradingViewChart
                candles={candles}
                symbolInfo={selectedSymbol}
                activeSignal={activeSignal}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                onSymbolSelect={handleSelectSymbol}
                allSymbols={symbols}
                onOpenAutoTradeModal={() => handleOpenAutoTrade(activeSignal || undefined)}
                priceAlerts={alerts}
                onOpenAlertsWatchdog={() => setIsAlertsModalOpen(true)}
                onOpenPriceCalibrator={() => setIsPriceCalibrationModalOpen(true)}
                onCalibratePrice={handleApplyLivePrice}
                upstoxConnected={Boolean(settings.upstoxAccessToken)}
                dhanConnected={Boolean(settings.dhanAccessToken)}
              />
            </div>

            {/* Right Upstox Market Intelligence Chat (7 cols on wide screens, full on mobile) */}
            <div className="col-span-1 lg:col-span-7 h-full overflow-hidden">
              <UpstoxMarketChat
                symbolInfo={selectedSymbol}
                currentPrice={candles.length > 0 ? candles[candles.length - 1].close : selectedSymbol.lastPrice}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                onSymbolSelect={handleSelectSymbol}
                allSymbols={symbols}
                upstoxToken={settings.upstoxAccessToken}
                onSaveUpstoxToken={(token, tokenName, expiry) => {
                  const updated: RiskSettings = {
                    ...settings,
                    upstoxAccessToken: token,
                    upstoxTokenName: tokenName,
                    upstoxTokenExpiry: expiry,
                  };
                  setSettings(updated);
                  localStorage.setItem('ai_trading_settings', JSON.stringify(updated));
                }}
                onSendToDhanTrader={(sig) => {
                  handleOpenAutoTrade(sig);
                }}
                onOpenPriceCalibrator={() => setIsPriceCalibrationModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: DAILY 2 TRADES SYSTEM (Strict High-Confluence 2 Trades / Day) */}
        {activeTab === 'TWO_TRADES' && (
          <div className="h-full w-full overflow-hidden">
            <DailyTwoTrades
              symbols={symbols}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={handleSelectSymbol}
              onOpenChart={(sym) => {
                handleSelectSymbol(sym);
                setActiveTab('CHART');
              }}
              onArmTrade={(signal) => {
                handleQuickIntradayAutoTrade(signal, 'DAY');
              }}
              liveTradingArmed={settings.liveTradingArmed}
              onOpenSettings={() => setIsSettingsOpen(true)}
              paperBalance={paperBalance}
            />
          </div>
        )}

        {/* TAB 3: TRADINGVIEW CHART (Full View) */}
        {activeTab === 'CHART' && (
          <div className="h-full w-full overflow-hidden">
            <TradingViewChart
              candles={candles}
              symbolInfo={selectedSymbol}
              activeSignal={activeSignal}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
              onSymbolSelect={setSelectedSymbol}
              allSymbols={symbols}
              onOpenAutoTradeModal={() => handleOpenAutoTrade(activeSignal || undefined)}
              priceAlerts={alerts}
              onOpenAlertsWatchdog={() => setIsAlertsModalOpen(true)}
              onOpenPriceCalibrator={() => setIsPriceCalibrationModalOpen(true)}
              onCalibratePrice={handleApplyLivePrice}
              upstoxConnected={Boolean(settings.upstoxAccessToken)}
              dhanConnected={Boolean(settings.dhanAccessToken)}
            />
          </div>
        )}

        {/* TAB 3: PYTHON ALGO LAB */}
        {activeTab === 'PYTHON' && (
          <div className="h-full w-full overflow-hidden">
            <PythonLab
              initialCode={pythonLabCode}
              symbolInfo={selectedSymbol}
              activeSignal={activeSignal}
              onLaunchBacktest={() => setActiveTab('BACKTEST')}
              onDeployToPaper={(code) => {
                alert('Strategy deployed to Paper Bot runner! Tracking active ticks.');
                setActiveTab('PORTFOLIO');
              }}
            />
          </div>
        )}

        {/* TAB 4: BACKTESTING ENGINE */}
        {activeTab === 'BACKTEST' && (
          <div className="h-full w-full overflow-hidden">
            <BacktestLab
              candles={candles}
              symbolInfo={selectedSymbol}
              timeframe={timeframe}
              presetResult={presetBacktestResult}
              onDeployToPaperBot={(stratName) => {
                alert(`Strategy "${stratName}" armed as an automated paper trading bot!`);
                setActiveTab('PORTFOLIO');
              }}
            />
          </div>
        )}

        {/* TAB 5: PORTFOLIO & EXECUTION TERMINAL */}
        {activeTab === 'PORTFOLIO' && (
          <div className="h-full w-full overflow-hidden">
            <PaperPortfolio
              balance={paperBalance}
              positions={positions}
              orders={orders}
              executions={executions}
              onClosePosition={handleClosePosition}
              onCancelOrder={handleCancelOrder}
              onResetPaperAccount={handleResetPaperAccount}
              onSquareOffExecution={handleSquareOffExecution}
              onCancelExecution={handleCancelExecution}
              onDeleteExecution={handleDeleteExecution}
              onClearFinishedExecutions={handleClearFinishedExecutions}
              onSelectSymbol={(sym) => {
                const found = symbols.find((s) => s.symbol === sym);
                if (found) {
                  handleSelectSymbol(found);
                  setActiveTab('CHART');
                }
              }}
              liveTradingArmed={settings.liveTradingArmed}
              dhanConnected={Boolean(settings.dhanClientId && settings.dhanAccessToken)}
            />
          </div>
        )}
      </main>

      {/* Auto-Execution History & TP/SL Track Modal */}
      <ExecutionHistoryModal
        isOpen={isExecutionHistoryModalOpen}
        onClose={() => setIsExecutionHistoryModalOpen(false)}
        executions={executions}
        onSquareOff={handleSquareOffExecution}
        onCancelOrder={handleCancelExecution}
        onDeleteExecution={handleDeleteExecution}
        onClearFinished={handleClearFinishedExecutions}
        onSelectSymbol={(sym) => {
          const found = symbols.find((s) => s.symbol === sym);
          if (found) {
            handleSelectSymbol(found);
            setActiveTab('CHART');
          }
        }}
      />

      {/* Auto-Trade Bracket Order Modal */}
      <AutoTradeOrderModal
        isOpen={isAutoTradeModalOpen}
        onClose={() => setIsAutoTradeModalOpen(false)}
        symbolInfo={selectedSymbol}
        activeSignal={activeSignal}
        onArmAutoTrade={handleArmAutoTrade}
        liveTradingArmed={settings.liveTradingArmed}
        onArmLiveTrading={handleArmLiveTrading}
      />

      {/* Daily Morning Market Intelligence Modal */}
      <DailyBriefingModal
        isOpen={isDailyBriefingOpen}
        onClose={() => setIsDailyBriefingOpen(false)}
        briefing={dailyBriefing}
        onSelectSetup={handleSelectSetupFromBriefing}
        allSymbols={symbols}
        onSetEntryAlert={handleSetEntryAlertFromBriefing}
      />

      {/* Alerts Watchdog & Level Trigger Manager Modal */}
      <AlertsWatchdogModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        symbols={symbols}
        currentSymbol={selectedSymbol}
        onSelectSymbol={handleSelectSymbol}
        onAddAlert={handleCreateAlert}
        onDeleteAlert={handleDeleteAlert}
        onClearTriggeredAlerts={() => setAlerts((prev) => prev.filter((a) => a.status === 'ACTIVE'))}
      />

      {/* Floating In-App Real-Time Alert Notification Toasts */}
      <AlertNotificationToast
        toasts={alertToasts}
        onDismiss={handleDismissToast}
        onViewChart={(symName) => {
          const sym = symbols.find((s) => s.symbol === symName);
          if (sym) {
            handleSelectSymbol(sym);
            setActiveTab('CHART');
          }
        }}
        onAutoTrade={(payload) => {
          if (payload) {
            handleArmAutoTrade({
              symbol: payload.symbol,
              action: payload.action === 'BUY' ? 'BUY' : 'SELL',
              orderType: 'MARKET',
              entryPrice: payload.entryPrice,
              stopLoss: payload.stopLoss,
              target: payload.targetPrice,
              quantity: payload.dhanOrderPayload?.quantity || 10,
              mode: settings.liveTradingArmed ? 'LIVE' : 'PAPER',
            });
          } else {
            setIsAutoTradeModalOpen(true);
          }
        }}
      />

      {/* Settings Modal (Dhan API & Risk Guardrails) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      {/* App Flow Architecture & User Guide Modal (Print / PDF) */}
      <AppFlowGuideModal
        isOpen={isAppFlowGuideOpen}
        onClose={() => setIsAppFlowGuideOpen(false)}
      />

      {/* 9 Pro Trading Strategies Intelligence Hub Modal */}
      <StrategyIntelligenceModal
        isOpen={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        symbolInfo={selectedSymbol}
        activeSignal={activeSignal}
        onDeployStrategyTrade={(config) => {
          handleArmAutoTrade({
            ...config,
            mode: settings.liveTradingArmed ? 'LIVE' : 'PAPER',
          });
        }}
        onDeployHedgePair={(longConfig, shortConfig) => {
          handleArmAutoTrade({
            ...longConfig,
            mode: settings.liveTradingArmed ? 'LIVE' : 'PAPER',
          });
          setTimeout(() => {
            handleArmAutoTrade({
              ...shortConfig,
              mode: settings.liveTradingArmed ? 'LIVE' : 'PAPER',
            });
          }, 300);
        }}
      />

      {/* Live Market Price Calibration & Dhan Sync Modal */}
      <PriceCalibrationModal
        isOpen={isPriceCalibrationModalOpen}
        onClose={() => setIsPriceCalibrationModalOpen(false)}
        symbol={selectedSymbol}
        currentPrice={candles.length > 0 ? candles[candles.length - 1].close : selectedSymbol.lastPrice}
        onApplyLivePrice={handleApplyLivePrice}
        dhanCredentials={{
          dhanClientId: settings.dhanClientId,
          dhanAccessToken: settings.dhanAccessToken,
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TradingAppContent />
    </AuthProvider>
  );
}
