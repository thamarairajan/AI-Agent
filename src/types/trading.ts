export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolInfo {
  symbol: string;
  name: string;
  exchange: string;
  category: 'Indian Equity' | 'Index' | 'Crypto' | 'US Tech';
  lastPrice: number;
  change24h: number;
  changePercent24h: number;
  volume: string;
  high24h: number;
  low24h: number;
  securityId: string;
  lotSize: number;
  tickSize: number;
}

export interface DhanOrderPayload {
  dhanClientId?: string;
  transactionType: 'BUY' | 'SELL';
  exchangeSegment: 'NSE_EQ' | 'NSE_FNO' | 'BSE_EQ' | 'MCX_COMM';
  productType: 'INTRADAY' | 'CNC' | 'MARGIN' | 'CO' | 'BO';
  orderType: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_MARKET';
  validity: 'DAY' | 'IOC';
  securityId: string;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  disclosedQuantity?: number;
  afterMarketOrder?: boolean;
  boProfitValue?: number;
  boStopLossValue?: number;
}

export interface TradeSignal {
  id: string;
  timestamp: number;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  timeframe: string;
  riskRewardRatio: number;
  confidence: number;
  strategyName: string;
  indicators: {
    rsi?: number;
    macdSignal?: string;
    emaTrend?: string;
    supertrend?: string;
    volumeProfile?: string;
    orderBlock?: string;
    fvgZone?: string;
  };
  confluenceScore?: number; // 0 - 100% Institutional Multi-Factor Confluence
  confluenceFactors?: string[]; // e.g. ["15m Bullish Order Block", "VWAP Hold", "Supertrend Bullish", "RSI Divergence"]
  invalidationLevel?: number;
  reasoning: string;
  pythonCodeSnippet?: string;
  dhanOrderPayload: DhanOrderPayload;
  strategyType?: 'SCALPING' | 'OI_BREAKOUT' | 'HEDGING_1_2' | 'BTST' | 'BOLLINGER_SQUEEZE' | 'SUPERTREND_PIVOT' | string;
  orderType?: 'MARKET' | 'TRIGGER';
  trailingStopLossPoints?: number;
  trailingStopLossEnabled?: boolean;
  validityType?: 'DAY' | 'MULTI_DAY_GTT';
  optionRecommendation?: {
    strike: number;
    optionType: 'CE' | 'PE';
    moneyness: 'ATM' | 'ITM';
    estimatedPremium: number;
    targetPremium: number;
    stopLossPremium: number;
  };
  hedgingSetup?: {
    opposingAction: 'BUY' | 'SELL';
    opposingStrike: string;
    targetRatio: string;
    entryPrice: number;
    stopLoss: number;
    targetPrice: number;
  };
  sessionStatus?: string;
  triggerCondition?: string;
}

export interface BacktestTrade {
  id: string;
  entryTime: number;
  exitTime: number;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnl: number;
  pnlPct: number;
  exitReason: 'TARGET_HIT' | 'STOP_LOSS' | 'SIGNAL_FLIP' | 'TIMEFRAME_CLOSE';
}

export interface BacktestResult {
  strategyName: string;
  symbol: string;
  timeframe: string;
  initialCapital: number;
  finalCapital: number;
  netProfit: number;
  netProfitPct: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  avgTradeProfit: number;
  equityCurve: { time: number; equity: number; drawdown: number }[];
  trades: BacktestTrade[];
}

export interface Position {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  qty: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  target: number;
  pnl: number;
  pnlPercent: number;
  time: number;
  mode: 'PAPER' | 'LIVE';
  dhanOrderId?: string;
  trailingStopLossEnabled?: boolean;
  trailingStopLossPoints?: number;
  highestPriceReached?: number;
  strategyType?: string;
}

export interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  qty: number;
  price: number;
  orderType: string;
  status: 'EXECUTED' | 'PENDING' | 'REJECTED' | 'CANCELLED';
  time: number;
  mode: 'PAPER' | 'LIVE';
  dhanOrderId?: string;
  note?: string;
  triggerPrice?: number;
  stopLoss?: number;
  target?: number;
  validityType?: 'DAY' | 'MULTI_DAY_GTT';
  carryoverDays?: number;
  trailingStopLossEnabled?: boolean;
  trailingStopLossPoints?: number;
  strategyType?: string;
}

export type ExecutionStatus = 'ACTIVE' | 'PENDING' | 'HIT_TP' | 'HIT_SL' | 'CLOSED_MANUAL' | 'CANCELLED';

export interface AutoExecutionRecord {
  id: string;
  timestamp: number;
  symbol: string;
  action: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'TRIGGER' | 'BRACKET';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  quantity: number;
  mode: 'PAPER' | 'LIVE';
  validityType?: 'DAY' | 'MULTI_DAY_GTT';
  trailingStopLossEnabled?: boolean;
  trailingStopLossPoints?: number;
  strategyName: string;
  status: ExecutionStatus;
  filledPrice?: number;
  filledTime?: number;
  exitPrice?: number;
  exitTime?: number;
  realizedPnL?: number;
  realizedPnLPercent?: number;
  currentPrice?: number;
  unrealizedPnL?: number;
  unrealizedPnLPercent?: number;
  highestPriceReached?: number;
  lowestPriceReached?: number;
  hitReason?: string;
  source?: string;
  note?: string;
  dhanOrderId?: string;
}

export interface DailyBriefing {
  date: string;
  marketBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  sentimentScore: number; // 0 - 100
  marketOverview: string;
  niftyOutlook: string;
  bankNiftyOutlook: string;
  globalCues: string;
  topSetups: {
    symbol: string;
    direction: 'LONG' | 'SHORT';
    trigger: string;
    entry: number;
    target: number;
    stopLoss: number;
    rationale: string;
    confluenceScore?: number;
  }[];
  keyLevels: {
    instrument: string;
    support1: number;
    support2: number;
    resistance1: number;
    resistance2: number;
    pivot: number;
  }[];
  dailyTip: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  tradeSignal?: TradeSignal;
  pythonScript?: string;
  backtestResult?: BacktestResult;
  status?: 'thinking' | 'done' | 'error';
}

export interface UpstoxMarketAnalysis {
  symbol: string;
  timestamp: number;
  marketVerdict: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'BREAKOUT_PENDING';
  confidenceScore: number; // 0 - 100%
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close?: number;
  vwap?: number;
  pcr?: number;
  summary: string;
  detailedAnalysis: string;
  supportLevels: number[];
  resistanceLevels: number[];
  institutionalFlow: string;
  actionableSetup?: {
    bias: 'LONG' | 'SHORT' | 'WAIT';
    suggestedEntry: number;
    stopLoss: number;
    target: number;
    riskReward: string;
    optionContract?: string;
  };
  upstoxSource: string;
  tokenConnected: boolean;
  tokenName?: string;
}

export interface UpstoxChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  analysis?: UpstoxMarketAnalysis;
  status?: 'thinking' | 'done' | 'error';
}

export interface RiskSettings {
  maxDailyLoss: number;
  maxRiskPerTradePct: number;
  maxPositionSize: number;
  autoKillSwitchOnLoss: boolean;
  defaultTimeframe: string;
  soundAlerts: boolean;
  liveTradingArmed: boolean;
  dhanClientId: string;
  dhanAccessToken: string;
  upstoxApiKey?: string;
  upstoxAccessToken?: string;
  upstoxTokenName?: string;
  upstoxTokenExpiry?: string;
  offHoursSimulationMode?: boolean;
}

export type AlertType = 'ENTRY_REACHED' | 'TARGET_REACHED' | 'STOP_LOSS_REACHED' | 'PRICE_CROSS_UP' | 'PRICE_CROSS_DOWN';

export interface PriceAlert {
  id: string;
  symbol: string;
  alertType: AlertType;
  triggerPrice: number;
  currentPriceAtCreation: number;
  direction?: 'LONG' | 'SHORT';
  note: string;
  source: 'AI_ANALYSIS' | 'DAILY_BRIEFING' | 'MANUAL';
  createdAt: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';
  triggeredAt?: number;
  autoTradeOnTrigger?: boolean;
  tradePayload?: TradeSignal;
  soundEnabled?: boolean;
  browserNotificationEnabled?: boolean;
  validityType?: 'DAY' | 'MULTI_DAY_GTT';
  carryoverDays?: number;
}

export interface TriggeredAlertToast {
  id: string;
  alert: PriceAlert;
  price: number;
  time: number;
}

export interface RenkoBrick {
  index: number;
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  type: 'UP' | 'DOWN';
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface SuperTrendPoint {
  value: number | null;
  direction: 'BULLISH' | 'BEARISH' | null;
}

export interface AdxPoint {
  adx: number | null;
  plusDI: number | null;
  minusDI: number | null;
}

export interface WorldMarketItem {
  id: string;
  name: string;
  symbol: string;
  region: 'US' | 'ASIA' | 'EUROPE' | 'COMMODITIES';
  price: number;
  change: number;
  changePct: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  impactOnIndianMarket: string;
}

export interface OpenInterestItem {
  strike: number;
  callOI: number;
  putOI: number;
  callOIChange: number;
  putOIChange: number;
  callIV: number;
  putIV: number;
  isATM?: boolean;
  isMaxPain?: boolean;
}

export interface OptionStrikeRecommendation {
  symbol: string;
  spotPrice: number;
  atmStrike: number;
  callAtm: {
    strike: number;
    optionType: 'CE';
    moneyness: 'ATM';
    estimatedPremium: number;
    delta: number;
    recommendedSL: number;
    recommendedTarget: number;
  };
  callItm: {
    strike: number;
    optionType: 'CE';
    moneyness: 'ITM';
    estimatedPremium: number;
    delta: number;
    recommendedSL: number;
    recommendedTarget: number;
  };
  putAtm: {
    strike: number;
    optionType: 'PE';
    moneyness: 'ATM';
    estimatedPremium: number;
    delta: number;
    recommendedSL: number;
    recommendedTarget: number;
  };
  putItm: {
    strike: number;
    optionType: 'PE';
    moneyness: 'ITM';
    estimatedPremium: number;
    delta: number;
    recommendedSL: number;
    recommendedTarget: number;
  };
  disclaimer: string;
}

export interface HedgingSetup {
  symbol: string;
  spotPrice: number;
  breakoutHigh: number;
  breakoutLow: number;
  longLeg: {
    entry: number;
    stopLoss: number;
    target: number;
    ratio: string;
  };
  shortLeg: {
    entry: number;
    stopLoss: number;
    target: number;
    ratio: string;
  };
  rationale: string;
}

export interface MarketSessionStatus {
  istTime: string;
  isMarketOpen: boolean;
  isWeekend: boolean;
  isIndianMarketOpen: boolean;
  sessionPhase:
    | 'PRE_MARKET' // 09:00 - 09:15
    | 'ACTIVE_TRADING' // 09:15 - 15:15
    | 'BTST_WINDOW' // 15:15 - 15:25
    | 'CLOSING_SESSION' // 15:25 - 15:30
    | 'AFTER_HOURS'; // 15:30 - 09:00
  phaseLabel: string;
  minutesUntilClose: number;
  nextOpenTime: string;
  isOpen?: boolean;
  session?: string;
  message?: string;
  currentTimeIST?: string;
}

