import React, { useState, useRef, useEffect } from 'react';
import { DailyBriefing, MarketSessionStatus, SymbolInfo } from '../types/trading';
import { getMarketSessionStatus } from '../utils/strategyEngine';
import {
  Activity,
  BarChart2,
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  Clock,
  Code2,
  Compass,
  FileText,
  LogOut,
  Menu,
  MoreHorizontal,
  PieChart,
  Settings,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'CHAT' | 'UPSTOX' | 'TWO_TRADES' | 'CHART' | 'PYTHON' | 'BACKTEST' | 'PORTFOLIO';
  onTabChange: (tab: 'CHAT' | 'UPSTOX' | 'TWO_TRADES' | 'CHART' | 'PYTHON' | 'BACKTEST' | 'PORTFOLIO') => void;
  symbols: SymbolInfo[];
  selectedSymbol?: SymbolInfo;
  onSymbolSelect?: (sym: SymbolInfo) => void;
  dailyBriefing: DailyBriefing | null;
  onOpenDailyBriefing: () => void;
  onOpenSettings: () => void;
  liveTradingArmed: boolean;
  openPositionsCount: number;
  onOpenAutoTradeModal?: () => void;
  onOpenAppFlowGuide?: () => void;
  onOpenAlertsWatchdog?: () => void;
  onOpenStrategyHub?: () => void;
  activeAlertsCount?: number;
  onToggleLiveTrading?: () => void;
  onOpenPriceCalibrator?: () => void;
  upstoxConnected?: boolean;
  userProfile?: { displayName?: string; email?: string; photoURL?: string; isDemo?: boolean } | null;
  onSignOut?: () => void;
  executionsCount?: number;
  onOpenExecutionHistory?: () => void;
  offHoursSimulationMode?: boolean;
  onToggleOffHoursSimulation?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  symbols,
  selectedSymbol,
  onSymbolSelect,
  dailyBriefing,
  onOpenDailyBriefing,
  onOpenSettings,
  liveTradingArmed,
  openPositionsCount,
  onOpenAutoTradeModal,
  onOpenAppFlowGuide,
  onOpenAlertsWatchdog,
  onOpenStrategyHub,
  activeAlertsCount = 0,
  onToggleLiveTrading,
  onOpenPriceCalibrator,
  userProfile,
  onSignOut,
  executionsCount = 0,
  onOpenExecutionHistory,
  offHoursSimulationMode = false,
  onToggleOffHoursSimulation,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreTabsOpen, setMoreTabsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [priceFlash, setPriceFlash] = useState<'UP' | 'DOWN' | null>(null);
  const [marketStatus, setMarketStatus] = useState<MarketSessionStatus>(getMarketSessionStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setMarketStatus(getMarketSessionStatus());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevPriceRef = useRef<number | undefined>(selectedSymbol?.lastPrice);
  const moreTabsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Real-time price tick flash indicator (green for uptick, red for downtick)
  useEffect(() => {
    if (!selectedSymbol?.lastPrice) return;
    if (prevPriceRef.current !== undefined && selectedSymbol.lastPrice !== prevPriceRef.current) {
      const dir = selectedSymbol.lastPrice > prevPriceRef.current ? 'UP' : 'DOWN';
      setPriceFlash(dir);
      const timer = setTimeout(() => setPriceFlash(null), 800);
      prevPriceRef.current = selectedSymbol.lastPrice;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = selectedSymbol.lastPrice;
  }, [selectedSymbol?.lastPrice, selectedSymbol?.symbol]);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (moreTabsRef.current && !moreTabsRef.current.contains(target)) {
        setMoreTabsOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        setMoreTabsOpen(false);
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isMoreTabActive = activeTab === 'PYTHON' || activeTab === 'BACKTEST';

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-orange-200/90 backdrop-blur-md shadow-2xs">
        {/* Desktop Ticker Bar */}
        <div className="hidden md:flex items-center justify-between px-3 lg:px-6 py-1 bg-orange-50/75 border-b border-orange-200/60 text-[11px] font-mono text-stone-600 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2.5 shrink-0">
            {offHoursSimulationMode ? (
              <button
                onClick={onToggleOffHoursSimulation}
                className="flex items-center gap-1.5 text-purple-900 font-bold text-[10px] tracking-wider uppercase bg-purple-100 hover:bg-purple-200 border border-purple-300 px-2 py-0.5 rounded-full shadow-2xs transition-colors cursor-pointer"
                title="Practice Simulation Mode is ON (Click to toggle back to strict real exchange hours)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                <span>Sim Practice</span>
              </button>
            ) : marketStatus.isMarketOpen ? (
              <div
                className="flex items-center gap-1.5 text-emerald-800 font-bold text-[10px] tracking-wider uppercase bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs cursor-help"
                title={`NSE/BSE Active Live Session: 09:15 - 15:30 IST. Trading ongoing. Current IST: ${marketStatus.currentTimeIST}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>NSE/BSE Live</span>
              </div>
            ) : marketStatus.sessionPhase === 'BTST_WINDOW' ? (
              <div
                className="flex items-center gap-1.5 text-amber-800 font-bold text-[10px] tracking-wider uppercase bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs cursor-help"
                title="15:15 - 15:25 IST: Broker MIS Intraday Auto-Squareoff in progress! Market closes at 15:30 IST."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span>MIS Squareoff</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 text-stone-700 font-bold text-[10px] tracking-wider uppercase bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-full shadow-2xs cursor-help"
                title={`NSE & BSE Closed (3:30 PM - 09:15 AM IST). Real exchange will wake at ${marketStatus.nextOpenTime}. Prices locked at today's official closing LTP.`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Market Closed</span>
                <span className="text-[9px] text-stone-500 lowercase font-normal font-sans">
                  ({marketStatus.nextOpenTime})
                </span>
              </div>
            )}

            {symbols.slice(0, 8).map((sym) => {
              const isSelected = selectedSymbol?.symbol === sym.symbol;
              return (
                <button
                  key={sym.symbol}
                  onClick={() => onSymbolSelect && onSymbolSelect(sym)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-white font-bold shadow-2xs ring-1 ring-orange-500'
                      : 'hover:bg-white/80 hover:text-stone-950 text-stone-700'
                  }`}
                  title={`Switch to ${sym.symbol}`}
                >
                  <span className={isSelected ? 'text-orange-300 font-bold' : 'font-semibold'}>{sym.symbol}</span>
                  <span className={isSelected ? 'text-white font-bold' : 'text-stone-950 font-bold'}>
                    ₹{sym.lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`flex items-center text-[10px] font-bold ${
                      isSelected
                        ? sym.change24h >= 0 ? 'text-emerald-300' : 'text-rose-300'
                        : sym.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {sym.change24h >= 0 ? '+' : ''}
                    {sym.changePercent24h}%
                  </span>
                </button>
              );
            })}

            {onOpenPriceCalibrator && (
              <button
                id="navbar-sync-dhan-btn"
                onClick={onOpenPriceCalibrator}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white hover:bg-orange-50 text-stone-700 hover:text-orange-950 border border-orange-200 text-[10px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                title="Sync Terminal & AI Agent to Live Dhan/NSE Market Price"
              >
                <Zap className="w-3 h-3 text-orange-500 fill-current" />
                <span>Sync Price</span>
              </button>
            )}
          </div>

          {/* Market Bias Chip */}
          {dailyBriefing && (
            <button
              onClick={onOpenDailyBriefing}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 border border-stone-200 transition-colors cursor-pointer text-[10px] font-semibold shadow-2xs shrink-0 ml-2"
            >
              <Compass className="w-3 h-3 text-stone-500" />
              <span>Bias:</span>
              <strong
                className={
                  dailyBriefing.marketBias === 'BULLISH'
                    ? 'text-emerald-600'
                    : dailyBriefing.marketBias === 'BEARISH'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }
              >
                {dailyBriefing.marketBias} ({dailyBriefing.sentimentScore}%)
              </strong>
            </button>
          )}
        </div>

        {/* Mobile Mini Ticker Bar */}
        <div className="flex md:hidden items-center gap-2 px-3 py-1 bg-orange-50/80 border-b border-orange-200/60 text-[10px] font-mono text-stone-600 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-stone-700 font-bold text-[9px] uppercase shrink-0">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                offHoursSimulationMode
                  ? 'bg-purple-500 animate-pulse'
                  : marketStatus.isMarketOpen
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            {offHoursSimulationMode ? 'SIM' : marketStatus.isMarketOpen ? 'LIVE' : 'CLOSED'}
          </div>
          {symbols.map((sym) => {
            const isSelected = selectedSymbol?.symbol === sym.symbol;
            return (
              <button
                key={sym.symbol}
                onClick={() => onSymbolSelect && onSymbolSelect(sym)}
                className={`flex items-center gap-1 whitespace-nowrap shrink-0 px-1.5 py-0.5 rounded-full transition-colors ${
                  isSelected ? 'bg-stone-900 text-white font-bold' : 'text-stone-800'
                }`}
              >
                <span className={isSelected ? 'text-orange-300 font-bold' : 'font-semibold'}>{sym.symbol}</span>
                <span className={isSelected ? 'text-white font-bold' : 'text-stone-950 font-bold'}>
                  ₹{sym.lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-[9px] font-bold ${
                    isSelected
                      ? sym.change24h >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      : sym.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {sym.change24h >= 0 ? '+' : ''}{sym.changePercent24h}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Desktop & Responsive Navigation Bar */}
        <div className="w-full px-3 md:px-4 lg:px-6 py-2 max-w-[1700px] mx-auto flex items-center justify-between gap-2">
          {/* LEFT: Brand Logo + Dynamic Market Value Runner + Quick Market Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="text-base">📈</span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-stone-900 tracking-tight whitespace-nowrap">
                  AI TRADING AGENT
                </span>

                {/* Running Live Market Price Chip */}
                {selectedSymbol && (
                  <div
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-md font-mono transition-all duration-300 shadow-2xs border shrink-0 ${
                      priceFlash === 'UP'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-300/60'
                        : priceFlash === 'DOWN'
                        ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-300/60'
                        : 'bg-stone-900 border-stone-800 text-white'
                    }`}
                  >
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className={`text-[10px] font-bold tracking-wide uppercase ${priceFlash ? 'text-inherit' : 'text-orange-300'}`}>
                      {selectedSymbol.symbol}
                    </span>
                    <span className={`text-[11px] font-extrabold ${priceFlash === 'UP' ? 'text-emerald-700' : priceFlash === 'DOWN' ? 'text-rose-700' : 'text-white'}`}>
                      ₹{selectedSymbol.lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-[9px] font-bold flex items-center ${
                        selectedSymbol.change24h >= 0
                          ? priceFlash ? 'text-emerald-700' : 'text-emerald-400'
                          : priceFlash ? 'text-rose-700' : 'text-rose-400'
                      }`}
                    >
                      {selectedSymbol.change24h >= 0 ? '+' : ''}{selectedSymbol.changePercent24h.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Market Switcher: NIFTY 50 / SENSEX / BANKNIFTY */}
              <div className="hidden sm:flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-stone-500 font-semibold">Switch:</span>
                {['NIFTY 50', 'SENSEX', 'BANKNIFTY'].map((mKey) => {
                  const match = symbols.find((s) => s.symbol === mKey);
                  const isCurrent = selectedSymbol?.symbol === mKey;
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => {
                        if (match && onSymbolSelect) {
                          onSymbolSelect(match);
                        }
                      }}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'bg-stone-100 hover:bg-orange-50 text-stone-700 border border-stone-200'
                      }`}
                      title={`Switch active market to ${mKey}`}
                    >
                      <span>{mKey}</span>
                      {match && (
                        <span className={`text-[8px] ${isCurrent ? 'text-orange-100' : match.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {match.change24h >= 0 ? '+' : ''}{match.changePercent24h.toFixed(1)}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER: Streamlined Navigation Tabs with "More" Submenu (Prevents Screen Overflow) */}
          <nav className="hidden md:flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs shrink-0">
            {/* 1. AI Agent */}
            <button
              id="tab-btn-chat"
              onClick={() => onTabChange('CHAT')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'CHAT'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60 font-semibold'
              }`}
            >
              <Bot className={`w-3.5 h-3.5 ${activeTab === 'CHAT' ? 'text-orange-400' : 'text-stone-500'}`} />
              <span>AI Agent</span>
              {activeTab === 'CHAT' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-0.5" />}
            </button>

            {/* 2. Upstox AI */}
            <button
              id="tab-btn-upstox"
              onClick={() => onTabChange('UPSTOX')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'UPSTOX'
                  ? 'bg-purple-900 text-white font-bold shadow-xs'
                  : 'text-purple-700 hover:text-purple-950 hover:bg-purple-50 font-semibold'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'UPSTOX' ? 'text-purple-300' : 'text-purple-600'}`} />
              <span>Upstox AI</span>
              {activeTab === 'UPSTOX' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 ml-0.5" />}
            </button>

            {/* 3. Daily 2 Trades (High Confluence) */}
            <button
              id="tab-btn-two-trades"
              onClick={() => onTabChange('TWO_TRADES')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'TWO_TRADES'
                  ? 'bg-amber-950 text-amber-100 font-bold shadow-xs border border-amber-500/40'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-200/60 font-semibold'
              }`}
              title="Daily Double Alpha: Strict 2 High-Confluence Trades / Day"
            >
              <Target className={`w-3.5 h-3.5 ${activeTab === 'TWO_TRADES' ? 'text-amber-400' : 'text-amber-600'}`} />
              <span className="flex items-center gap-1">
                <span>2 Trades / Day</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-black bg-amber-500 text-stone-950">
                  TOP 2
                </span>
              </span>
              {activeTab === 'TWO_TRADES' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />}
            </button>

            {/* 4. TradingView Chart */}
            <button
              id="tab-btn-chart"
              onClick={() => onTabChange('CHART')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'CHART'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60 font-semibold'
              }`}
            >
              <BarChart2 className={`w-3.5 h-3.5 ${activeTab === 'CHART' ? 'text-orange-400' : 'text-stone-500'}`} />
              <span>Chart</span>
              {activeTab === 'CHART' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-0.5" />}
            </button>

            {/* 4. Portfolio */}
            <button
              id="tab-btn-portfolio"
              onClick={() => onTabChange('PORTFOLIO')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg transition-all relative cursor-pointer ${
                activeTab === 'PORTFOLIO'
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60 font-semibold'
              }`}
            >
              <PieChart className={`w-3.5 h-3.5 ${activeTab === 'PORTFOLIO' ? 'text-orange-400' : 'text-stone-500'}`} />
              <span>Portfolio</span>
              {openPositionsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">
                  {openPositionsCount}
                </span>
              )}
              {activeTab === 'PORTFOLIO' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-0.5" />}
            </button>

            {/* 5. "More" Submenu Dropdown (Python Lab & Backtest) */}
            <div className="relative" ref={moreTabsRef}>
              <button
                type="button"
                onClick={() => setMoreTabsOpen(!moreTabsOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isMoreTabActive
                    ? 'bg-stone-900 text-white font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-stone-200/60 font-semibold'
                }`}
                title="More Workspaces (Python Lab, Backtest)"
              >
                {activeTab === 'PYTHON' ? (
                  <>
                    <Code2 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Python Lab</span>
                  </>
                ) : activeTab === 'BACKTEST' ? (
                  <>
                    <Activity className="w-3.5 h-3.5 text-orange-400" />
                    <span>Backtest</span>
                  </>
                ) : (
                  <>
                    <span>More</span>
                  </>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${moreTabsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Submenu Popover */}
              {moreTabsOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-stone-200 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-600 border-b border-stone-100 mb-1">
                    Advanced Workspaces
                  </div>

                  <button
                    id="tab-btn-python"
                    onClick={() => {
                      onTabChange('PYTHON');
                      setMoreTabsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      activeTab === 'PYTHON'
                        ? 'bg-stone-900 text-white font-bold'
                        : 'text-stone-700 hover:bg-orange-50 hover:text-orange-950'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${activeTab === 'PYTHON' ? 'bg-stone-800' : 'bg-orange-100 text-orange-600'}`}>
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>Python Quant Lab</span>
                        {activeTab === 'PYTHON' && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                      </div>
                      <div className={`text-[10px] ${activeTab === 'PYTHON' ? 'text-stone-300' : 'text-stone-600'}`}>
                        Interactive algorithmic script execution
                      </div>
                    </div>
                  </button>

                  <button
                    id="tab-btn-backtest"
                    onClick={() => {
                      onTabChange('BACKTEST');
                      setMoreTabsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer mt-1 ${
                      activeTab === 'BACKTEST'
                        ? 'bg-stone-900 text-white font-bold'
                        : 'text-stone-700 hover:bg-orange-50 hover:text-orange-950'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${activeTab === 'BACKTEST' ? 'bg-stone-800' : 'bg-orange-100 text-orange-600'}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>Backtesting Engine</span>
                        {activeTab === 'BACKTEST' && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                      </div>
                      <div className={`text-[10px] ${activeTab === 'BACKTEST' ? 'text-stone-300' : 'text-stone-600'}`}>
                        Simulate strategies against historical candles
                      </div>
                    </div>
                  </button>

                  {/* Quick Shortcuts to Pro Modals */}
                  <div className="border-t border-stone-100 my-1 pt-1">
                    {onOpenExecutionHistory && (
                      <button
                        id="nav-more-executions-btn"
                        onClick={() => {
                          setMoreTabsOpen(false);
                          onOpenExecutionHistory();
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-950 rounded-lg cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span>Auto-Execution History</span>
                        </span>
                        {executionsCount > 0 && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                            {executionsCount}
                          </span>
                        )}
                      </button>
                    )}

                    {onOpenStrategyHub && (
                      <button
                        onClick={() => {
                          setMoreTabsOpen(false);
                          onOpenStrategyHub();
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-950 rounded-lg cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                          <span>9 Pro Strategies</span>
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold">
                          9 Pro
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setMoreTabsOpen(false);
                        onOpenDailyBriefing();
                      }}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-700 hover:bg-orange-50 hover:text-orange-950 rounded-lg cursor-pointer font-medium"
                    >
                      <Compass className="w-3.5 h-3.5 text-stone-500" />
                      <span>Daily Market Briefing</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT: Essential Controls + Modern Hamburger/Menu Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live vs Paper Trading Mode Switch */}
            {onToggleLiveTrading && (
              <button
                id="navbar-live-trading-toggle-btn"
                onClick={onToggleLiveTrading}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-black border transition-all cursor-pointer shadow-xs ${
                  liveTradingArmed
                    ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 shadow-rose-500/10'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 shadow-emerald-500/10'
                }`}
                title={
                  liveTradingArmed
                    ? 'Live Trading is ARMED (Real broker orders enabled). Click to switch to Paper Mode.'
                    : 'Paper Trading Mode (Simulated orders). Click to ARM Live Trading.'
                }
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    liveTradingArmed ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                  }`}
                />
                <span>{liveTradingArmed ? 'LIVE' : 'PAPER'}</span>
              </button>
            )}

            {/* Quick Auto-Trade Trigger Button */}
            {onOpenAutoTradeModal && (
              <button
                id="navbar-auto-trade-btn"
                onClick={onOpenAutoTradeModal}
                className="flex items-center gap-1 px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                title="Place Auto-Trade Bracket Order with Entry, SL, and Target"
              >
                <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                <span className="hidden xl:inline">Auto-Trade</span>
              </button>
            )}

            {/* Auto-Execution History Button */}
            {onOpenExecutionHistory && (
              <button
                id="navbar-executions-btn"
                onClick={onOpenExecutionHistory}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-stone-900 border border-amber-300 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                title="View Auto-Execution History with TP and SL Tracking"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-current shrink-0" />
                <span>History</span>
                {executionsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white font-mono text-[9px] font-bold">
                    {executionsCount}
                  </span>
                )}
              </button>
            )}

            {/* Price Alerts Watchdog Bell */}
            {onOpenAlertsWatchdog && (
              <button
                id="navbar-alerts-watchdog-btn"
                onClick={onOpenAlertsWatchdog}
                className={`relative p-1.5 rounded-xl border transition-colors cursor-pointer shadow-2xs ${
                  activeAlertsCount > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                }`}
                title="Price Alerts & Entry Watchdog"
              >
                <Bell className={`w-4 h-4 ${activeAlertsCount > 0 ? 'text-amber-600' : 'text-stone-600'}`} />
                {activeAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {activeAlertsCount}
                  </span>
                )}
              </button>
            )}

            {/* Pro Strategies Hub Trigger (Compact on md, full menu in drawer) */}
            {onOpenStrategyHub && (
              <button
                id="navbar-strategy-hub-btn"
                onClick={onOpenStrategyHub}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Open 9 Pro Strategies: World Market, OI, Scalping, 1:2 Hedging, BTST, ATM/ITM, Trailing SL"
              >
                <Sparkles className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>Strategies</span>
                <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 text-[9px] font-mono font-bold">
                  9 Pro
                </span>
              </button>
            )}

            {/* Desktop User Avatar & Menu Pill */}
            {userProfile && (
              <div className="relative hidden lg:block" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-orange-50/70 hover:bg-orange-100/70 border border-orange-200 text-xs transition-colors cursor-pointer"
                  title={`Signed in as ${userProfile.displayName || userProfile.email}`}
                >
                  <div className="w-6 h-6 rounded-full bg-linear-to-br from-orange-500 to-amber-700 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0">
                    {userProfile.photoURL ? (
                      <img src={userProfile.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      (userProfile.displayName || userProfile.email || 'T')[0].toUpperCase()
                    )}
                  </div>
                  <span className="font-semibold text-stone-800 max-w-[85px] truncate text-[11px] hidden xl:inline">
                    {userProfile.displayName?.split(' ')[0] || userProfile.email?.split('@')[0]}
                  </span>
                  {userProfile.isDemo && (
                    <span className="px-1 py-0.2 rounded bg-amber-200/80 text-amber-900 font-mono text-[8px] font-bold uppercase hidden xl:inline">
                      Demo
                    </span>
                  )}
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-stone-800">
                    <div className="px-2.5 py-1.5 border-b border-stone-100 mb-1">
                      <div className="font-bold text-xs text-stone-900 truncate">
                        {userProfile.displayName || 'Trader'}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">{userProfile.email}</div>
                      {userProfile.isDemo && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[9px] font-bold">
                          DEMO MODE
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-700 hover:bg-stone-50 rounded-lg cursor-pointer font-medium"
                    >
                      <Settings className="w-3.5 h-3.5 text-stone-500" />
                      <span>Dhan API & Guardrails</span>
                    </button>

                    {onSignOut && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer font-medium mt-1 border-t border-stone-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MODERN APP HAMBURGER / MENU BUTTON (Available on Desktop and Mobile) */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Open Pro Tools & Navigation Menu"
              title="Open Pro Features, Workspaces & Settings"
            >
              <Menu className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-bold hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* FULL SLIDE-OVER DRAWER MENU (Modern, responsive, organized pro tools) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content Panel */}
          <aside className="relative w-full max-w-sm sm:max-w-md bg-[#fffbf7] border-l border-orange-200 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-orange-200/80 bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                  📈
                </div>
                <div>
                  <h2 className="text-sm font-black text-stone-900">TERMINAL MENU</h2>
                  <p className="text-[10px] text-stone-500 font-medium">Pro Tools, Workspaces & Configuration</p>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                title="Close Menu (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Active Market Summary Banner */}
              {selectedSymbol && (
                <div className="bg-stone-900 text-white rounded-2xl p-3.5 shadow-sm border border-stone-800">
                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono mb-1">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-orange-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active Market
                    </span>
                    <span>UPSTOX LIVE</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-black tracking-tight">{selectedSymbol.symbol}</span>
                      <div className="text-lg font-mono font-bold text-white">
                        ₹{selectedSymbol.lastPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        selectedSymbol.change24h >= 0 ? 'bg-emerald-950/80 text-emerald-300' : 'bg-rose-950/80 text-rose-300'
                      }`}
                    >
                      {selectedSymbol.change24h >= 0 ? '+' : ''}{selectedSymbol.changePercent24h.toFixed(2)}%
                    </div>
                  </div>

                  {/* Market Quick Switcher */}
                  <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center gap-1.5">
                    {['NIFTY 50', 'SENSEX', 'BANKNIFTY'].map((mKey) => {
                      const match = symbols.find((s) => s.symbol === mKey);
                      const isCurrent = selectedSymbol?.symbol === mKey;
                      return (
                        <button
                          key={mKey}
                          onClick={() => {
                            if (match && onSymbolSelect) {
                              onSymbolSelect(match);
                            }
                          }}
                          className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold text-center cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-orange-600 text-white shadow-xs'
                              : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                          }`}
                        >
                          {mKey}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 1: Pro Trading Intelligence */}
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-2 px-1">
                  Pro Intelligence & Strategies
                </div>

                <div className="space-y-1.5">
                  {onOpenStrategyHub && (
                    <button
                      id="navbar-strategy-hub-btn-drawer"
                      onClick={() => {
                        setDrawerOpen(false);
                        onOpenStrategyHub();
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white hover:bg-orange-50/80 border border-orange-200/80 hover:border-orange-300 rounded-xl transition-all cursor-pointer shadow-2xs text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900 group-hover:text-orange-950">
                            9 Pro Strategies Hub
                          </div>
                          <div className="text-[10px] text-stone-600">
                            World Market, OI, Scalping, 1:2 Hedging, BTST
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white font-mono text-[9px] font-black">
                        9 PRO
                      </span>
                    </button>
                  )}

                  <button
                    id="daily-briefing-btn"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenDailyBriefing();
                    }}
                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900">Daily Morning Briefing</div>
                        <div className="text-[10px] text-stone-600">
                          AI sentiment analysis, sector trends & levels
                        </div>
                      </div>
                    </div>
                    {dailyBriefing && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          dailyBriefing.marketBias === 'BULLISH'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dailyBriefing.marketBias === 'BEARISH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {dailyBriefing.marketBias}
                      </span>
                    )}
                  </button>

                  {onOpenExecutionHistory && (
                    <button
                      id="navbar-executions-drawer-btn"
                      onClick={() => {
                        setDrawerOpen(false);
                        onOpenExecutionHistory();
                      }}
                      className="w-full flex items-center justify-between p-3 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 rounded-xl transition-all cursor-pointer shadow-2xs text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Zap className="w-4 h-4 fill-current text-amber-700" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-950">Auto-Execution History</div>
                          <div className="text-[10px] text-amber-800/80">
                            Track every chat setup, Entry, TP & SL hits
                          </div>
                        </div>
                      </div>
                      {executionsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-mono text-[9px] font-bold">
                          {executionsCount} LOGGED
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenAlertsWatchdog && (
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        onOpenAlertsWatchdog();
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900">Alerts & Watchdog</div>
                          <div className="text-[10px] text-stone-600">
                            Real-time price levels & automated alerts
                          </div>
                        </div>
                      </div>
                      {activeAlertsCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-mono text-[9px] font-bold">
                          {activeAlertsCount} ACTIVE
                        </span>
                      )}
                    </button>
                  )}

                  {onOpenAppFlowGuide && (
                    <button
                      id="app-flow-guide-btn"
                      onClick={() => {
                        setDrawerOpen(false);
                        onOpenAppFlowGuide();
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900">App Flow & PDF Guide</div>
                          <div className="text-[10px] text-stone-600">
                            Visual architecture, workflow diagram & printable PDF
                          </div>
                        </div>
                      </div>
                    </button>
                  )}

                  {onOpenPriceCalibrator && (
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        onOpenPriceCalibrator();
                      }}
                      className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-900">Sync Live Dhan/NSE Price</div>
                          <div className="text-[10px] text-stone-600">
                            Calibrate chart & terminal price data feeds
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 2: Workspaces & Labs */}
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-2 px-1">
                  Workspaces & Labs
                </div>

                {/* Featured: 2 Trades Per Day */}
                <button
                  onClick={() => {
                    onTabChange('TWO_TRADES');
                    setDrawerOpen(false);
                  }}
                  className={`w-full p-3 rounded-2xl border mb-2 text-left cursor-pointer transition-all flex items-center justify-between ${
                    activeTab === 'TWO_TRADES'
                      ? 'bg-amber-950 text-amber-100 border-amber-500 shadow-md'
                      : 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-200 text-stone-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>2 Trades / Day System</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-400 text-stone-950">
                          HIGH WIN
                        </span>
                      </div>
                      <div className={`text-[10px] ${activeTab === 'TWO_TRADES' ? 'text-amber-300' : 'text-stone-600'}`}>
                        Strict 2 trades, 45m momentum stop, 1:2.5 R:R
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600">→</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onTabChange('CHAT');
                      setDrawerOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      activeTab === 'CHAT'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <Bot className={`w-4 h-4 mb-1.5 ${activeTab === 'CHAT' ? 'text-orange-400' : 'text-stone-500'}`} />
                    <div className="text-xs font-bold">AI Agent</div>
                    <div className={`text-[10px] ${activeTab === 'CHAT' ? 'text-stone-300' : 'text-stone-600'}`}>
                      Interactive chat
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onTabChange('UPSTOX');
                      setDrawerOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      activeTab === 'UPSTOX'
                        ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                        : 'bg-white hover:bg-purple-50 border-purple-200 text-stone-800'
                    }`}
                  >
                    <BarChart3 className={`w-4 h-4 mb-1.5 ${activeTab === 'UPSTOX' ? 'text-purple-300' : 'text-purple-600'}`} />
                    <div className="text-xs font-bold">Upstox AI</div>
                    <div className={`text-[10px] ${activeTab === 'UPSTOX' ? 'text-purple-200' : 'text-stone-600'}`}>
                      Terminal feeds
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onTabChange('CHART');
                      setDrawerOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      activeTab === 'CHART'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <BarChart2 className={`w-4 h-4 mb-1.5 ${activeTab === 'CHART' ? 'text-orange-400' : 'text-stone-500'}`} />
                    <div className="text-xs font-bold">TradingView</div>
                    <div className={`text-[10px] ${activeTab === 'CHART' ? 'text-stone-300' : 'text-stone-600'}`}>
                      Live candlestick
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onTabChange('PORTFOLIO');
                      setDrawerOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      activeTab === 'PORTFOLIO'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <PieChart className={`w-4 h-4 ${activeTab === 'PORTFOLIO' ? 'text-orange-400' : 'text-stone-500'}`} />
                      {openPositionsCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">
                          {openPositionsCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold">Portfolio</div>
                    <div className={`text-[10px] ${activeTab === 'PORTFOLIO' ? 'text-stone-300' : 'text-stone-600'}`}>
                      P&L & positions
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onTabChange('PYTHON');
                      setDrawerOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      activeTab === 'PYTHON'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <Code2 className={`w-4 h-4 mb-1.5 ${activeTab === 'PYTHON' ? 'text-orange-400' : 'text-stone-500'}`} />
                    <div className="text-xs font-bold">Python Lab</div>
                    <div className={`text-[10px] ${activeTab === 'PYTHON' ? 'text-stone-300' : 'text-stone-600'}`}>
                      Quant execution
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onTabChange('BACKTEST');
                      setDrawerOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      activeTab === 'BACKTEST'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                    }`}
                  >
                    <Activity className={`w-4 h-4 mb-1.5 ${activeTab === 'BACKTEST' ? 'text-orange-400' : 'text-stone-500'}`} />
                    <div className="text-xs font-bold">Backtesting</div>
                    <div className={`text-[10px] ${activeTab === 'BACKTEST' ? 'text-stone-300' : 'text-stone-600'}`}>
                      Strategy simulator
                    </div>
                  </button>
                </div>
              </div>

              {/* Section 3: System & Broker Settings */}
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-2 px-1">
                  System & Risk Settings
                </div>

                <div className="space-y-1.5">
                  <button
                    id="open-settings-btn"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900">Dhan API & Risk Guardrails</div>
                        <div className="text-[10px] text-stone-600">
                          Credentials, stop-loss limits, lot sizing & webhook keys
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Mode switch row */}
                  {onToggleLiveTrading && (
                    <div className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-xl">
                      <div>
                        <div className="text-xs font-bold text-stone-900">Execution Mode</div>
                        <div className="text-[10px] text-stone-600">
                          {liveTradingArmed ? 'Real orders sent to Dhan broker' : 'Simulated paper trading'}
                        </div>
                      </div>

                      <button
                        onClick={onToggleLiveTrading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          liveTradingArmed
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>{liveTradingArmed ? 'LIVE ARMED' : 'PAPER MODE'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Account & Session */}
              {userProfile && (
                <div className="pt-2 border-t border-stone-200">
                  <div className="p-3 bg-white border border-stone-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-500 to-amber-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                        {userProfile.photoURL ? (
                          <img src={userProfile.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          (userProfile.displayName || userProfile.email || 'T')[0].toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {userProfile.displayName || userProfile.email}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">{userProfile.email}</div>
                      </div>
                    </div>

                    {onSignOut && (
                      <button
                        onClick={() => {
                          setDrawerOpen(false);
                          onSignOut();
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                        title="Sign Out"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3.5 border-t border-orange-200/80 bg-white/80 text-[11px] text-stone-500 flex items-center justify-between font-mono">
              <span>AI Trading Agent v2.5</span>
              <span className="text-stone-400">Esc to close</span>
            </div>
          </aside>
        </div>
      )}

      {/* Fixed Mobile Bottom Navigation Bar (md:hidden) */}
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 backdrop-blur-lg flex items-center justify-around px-2 py-1.5 select-none shadow-xl gap-1"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
      >
        <button
          onClick={() => onTabChange('CHAT')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'CHAT'
              ? 'bg-stone-900 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:text-stone-900 font-semibold'
          }`}
        >
          <Bot className={`w-4 h-4 ${activeTab === 'CHAT' ? 'text-orange-400' : 'text-stone-500'}`} />
          <span className="text-[10px] mt-0.5">AI Agent</span>
        </button>

        <button
          onClick={() => onTabChange('UPSTOX')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'UPSTOX'
              ? 'bg-purple-900 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:text-stone-900 font-semibold'
          }`}
        >
          <BarChart3 className={`w-4 h-4 ${activeTab === 'UPSTOX' ? 'text-purple-300' : 'text-stone-500'}`} />
          <span className="text-[10px] mt-0.5">Upstox</span>
        </button>

        <button
          onClick={() => onTabChange('CHART')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'CHART'
              ? 'bg-stone-900 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:text-stone-900 font-semibold'
          }`}
        >
          <BarChart2 className={`w-4 h-4 ${activeTab === 'CHART' ? 'text-orange-400' : 'text-stone-500'}`} />
          <span className="text-[10px] mt-0.5">Chart</span>
        </button>

        <button
          onClick={() => onTabChange('PORTFOLIO')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all relative cursor-pointer ${
            activeTab === 'PORTFOLIO'
              ? 'bg-stone-900 text-white font-bold shadow-xs'
              : 'text-stone-600 hover:text-stone-900 font-semibold'
          }`}
        >
          <div className="relative">
            <PieChart className={`w-4 h-4 ${activeTab === 'PORTFOLIO' ? 'text-orange-400' : 'text-stone-500'}`} />
            {openPositionsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center">
                {openPositionsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Portfolio</span>
        </button>

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl text-stone-600 hover:text-stone-900 font-semibold transition-all cursor-pointer"
        >
          <Menu className="w-4 h-4 text-orange-500" />
          <span className="text-[10px] mt-0.5 font-bold">More</span>
        </button>
      </nav>
    </>
  );
};
