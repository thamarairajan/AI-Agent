import React, { useState } from 'react';
import { PriceAlert, SymbolInfo } from '../types/trading';
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from '../utils/notifications';
import { playTradeSound } from '../utils/audio';
import {
  AlertCircle,
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Plus,
  Radio,
  Sliders,
  Sparkles,
  Trash2,
  Volume2,
  X,
  Zap,
} from 'lucide-react';

interface AlertsWatchdogModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  onAddAlert: (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'status'>) => void;
  onDeleteAlert: (alertId: string) => void;
  onClearTriggeredAlerts: () => void;
  symbols: SymbolInfo[];
  currentSymbol: SymbolInfo;
  onSelectSymbol: (symbol: SymbolInfo) => void;
}

export const AlertsWatchdogModal: React.FC<AlertsWatchdogModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onClearTriggeredAlerts,
  symbols,
  currentSymbol,
  onSelectSymbol,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getBrowserNotificationPermission()
  );
  const [tab, setTab] = useState<'ACTIVE' | 'HISTORY' | 'CREATE'>('ACTIVE');

  // New alert form state
  const [selectedSym, setSelectedSym] = useState<string>(currentSymbol.symbol);
  const [alertType, setAlertType] = useState<PriceAlert['alertType']>('ENTRY_REACHED');
  const [triggerPrice, setTriggerPrice] = useState<number>(currentSymbol.lastPrice);
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [note, setNote] = useState<string>('');
  const [autoTradeOnTrigger, setAutoTradeOnTrigger] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const triggeredAlerts = alerts.filter((a) => a.status === 'TRIGGERED');

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setPermission(perm);
    if (perm === 'granted') {
      sendBrowserNotification('🔔 Trading Alerts Enabled', {
        body: 'You will receive instant desktop notifications whenever price reaches your analysis entry levels!',
      });
      playTradeSound('ALERT');
    }
  };

  const handleTestAlert = () => {
    playTradeSound('ENTRY_HIT');
    sendBrowserNotification(`⚡ Test Entry Alert: ${currentSymbol.symbol}`, {
      body: `Entry level ₹${currentSymbol.lastPrice} touched! High-conviction setup active.`,
    });
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const symInfo = symbols.find((s) => s.symbol === selectedSym) || currentSymbol;

    onAddAlert({
      symbol: selectedSym,
      alertType,
      triggerPrice: Number(triggerPrice),
      currentPriceAtCreation: symInfo.lastPrice,
      direction,
      note: note.trim() || `${selectedSym} ${alertType.replace('_', ' ')} @ ₹${triggerPrice}`,
      source: 'MANUAL',
      autoTradeOnTrigger,
      soundEnabled: true,
      browserNotificationEnabled: true,
    });

    setNote('');
    setTab('ACTIVE');
  };

  return (
    <div
      id="alerts-watchdog-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-inner">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Level Watchdog & Price Alerts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {activeAlerts.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Daily real-time alerts when market price crosses your entry, target, or stop loss
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Permission & Sound Notification Banner */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Radio
              className={`w-4 h-4 ${
                permission === 'granted' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              }`}
            />
            <span className="text-slate-300">
              Desktop Push Notifications:{' '}
              <strong
                className={
                  permission === 'granted'
                    ? 'text-emerald-400'
                    : permission === 'denied'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }
              >
                {permission === 'granted'
                  ? 'Enabled (Alerts fire even in background)'
                  : permission === 'denied'
                  ? 'Blocked by browser'
                  : 'Needs Permission'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {permission !== 'granted' && isBrowserNotificationSupported() && (
              <button
                onClick={handleRequestPermission}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Enable Desktop Alerts
              </button>
            )}
            <button
              onClick={handleTestAlert}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Test audio chime and push notification"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Test Chime</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-900/50">
          <button
            onClick={() => setTab('ACTIVE')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              tab === 'ACTIVE'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Watchdogs ({activeAlerts.length})
          </button>
          <button
            onClick={() => setTab('CREATE')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1 ${
              tab === 'CREATE'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Alert
          </button>
          <button
            onClick={() => setTab('HISTORY')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              tab === 'HISTORY'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Triggered History ({triggeredAlerts.length})
          </button>
        </div>

        {/* Tab 1: Active Alerts List */}
        {tab === 'ACTIVE' && (
          <div className="p-5 max-h-96 overflow-y-auto">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Bell className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="text-sm font-semibold text-slate-300">No active price watchdogs</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click <span className="text-amber-400 font-semibold">"🔔 Set Entry Alert"</span> on any AI trade signal or Morning Briefing setup, or create one manually.
                </p>
                <button
                  onClick={() => setTab('CREATE')}
                  className="mt-4 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Add Your First Alert
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeAlerts.map((alert) => {
                  const currentSymInfo = symbols.find((s) => s.symbol === alert.symbol);
                  const curPrice = currentSymInfo ? currentSymInfo.lastPrice : alert.triggerPrice;
                  const diff = curPrice - alert.triggerPrice;
                  const diffPct = ((Math.abs(diff) / curPrice) * 100).toFixed(2);

                  return (
                    <div
                      key={alert.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black ${
                            alert.alertType === 'ENTRY_REACHED'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : alert.alertType === 'TARGET_REACHED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {alert.alertType === 'ENTRY_REACHED'
                            ? 'ENTRY'
                            : alert.alertType === 'TARGET_REACHED'
                            ? 'TP'
                            : 'SL'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{alert.symbol}</span>
                            {alert.direction && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  alert.direction === 'LONG'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {alert.direction}
                              </span>
                            )}
                            {alert.autoTradeOnTrigger && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5 fill-current" /> Auto-Trade
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            Trigger: <span className="text-amber-400 font-bold">₹{alert.triggerPrice}</span>
                            {' • '}
                            Current: <span className="text-slate-200">₹{curPrice}</span>
                            {' • '}
                            <span className="text-sky-400">{diffPct}% away</span>
                          </div>
                          {alert.note && (
                            <div className="text-[11px] text-slate-500 mt-1 truncate max-w-md">
                              {alert.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (currentSymInfo) onSelectSymbol(currentSymInfo);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700"
                        >
                          Chart
                        </button>
                        <button
                          onClick={() => onDeleteAlert(alert.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Custom Alert */}
        {tab === 'CREATE' && (
          <form onSubmit={handleCreateAlert} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Instrument / Symbol
                </label>
                <select
                  value={selectedSym}
                  onChange={(e) => {
                    setSelectedSym(e.target.value);
                    const found = symbols.find((s) => s.symbol === e.target.value);
                    if (found) setTriggerPrice(found.lastPrice);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-sky-500"
                >
                  {symbols.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} (₹{s.lastPrice})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Alert Type
                </label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-semibold focus:outline-none focus:border-sky-500"
                >
                  <option value="ENTRY_REACHED">⚡ Entry Level Reached</option>
                  <option value="TARGET_REACHED">🎯 Target Profit Hit</option>
                  <option value="STOP_LOSS_REACHED">🛑 Stop Loss Hit</option>
                  <option value="PRICE_CROSS_UP">📈 Price Crosses Above</option>
                  <option value="PRICE_CROSS_DOWN">📉 Price Crosses Below</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Trigger Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Direction Bias
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      direction === 'LONG'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    LONG / BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                      direction === 'SHORT'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    SHORT / SELL
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                Strategy Notes or Reason
              </label>
              <input
                type="text"
                placeholder="e.g. 15m SMC Order Block retest or morning breakout"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 placeholder-slate-600"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <input
                type="checkbox"
                id="auto-trade-check"
                checked={autoTradeOnTrigger}
                onChange={(e) => setAutoTradeOnTrigger(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="auto-trade-check" className="text-xs text-slate-300 cursor-pointer">
                <strong>Arm Auto-Trade Bracket:</strong> Automatically execute trade upon trigger hit
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-sky-600 hover:from-amber-400 hover:to-sky-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg cursor-pointer"
            >
              Arm Watchdog Alert
            </button>
          </form>
        )}

        {/* Tab 3: History of Triggered Alerts */}
        {tab === 'HISTORY' && (
          <div className="p-5 max-h-96 overflow-y-auto">
            {triggeredAlerts.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No alerts have triggered yet today.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-end mb-2">
                  <button
                    onClick={onClearTriggeredAlerts}
                    className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white">{alert.symbol}</span>
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-400 font-mono">
                          Triggered @ ₹{alert.triggerPrice}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{alert.note}</div>
                      {alert.triggeredAt && (
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {new Date(alert.triggeredAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteAlert(alert.id)}
                      className="text-slate-500 hover:text-slate-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

export default AlertsWatchdogModal;
