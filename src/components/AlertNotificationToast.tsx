import React from 'react';
import { TriggeredAlertToast, TradeSignal } from '../types/trading';
import { BellRing, CheckCircle2, ChevronRight, X, Zap } from 'lucide-react';

interface AlertNotificationToastProps {
  toasts: TriggeredAlertToast[];
  onDismiss: (toastId: string) => void;
  onViewChart: (symbol: string) => void;
  onAutoTrade?: (tradePayload?: TradeSignal) => void;
}

export const AlertNotificationToast: React.FC<AlertNotificationToastProps> = ({
  toasts,
  onDismiss,
  onViewChart,
  onAutoTrade,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="active-alert-toasts-container"
      className="fixed top-14 right-3 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
    >
      {toasts.map((item) => {
        const { alert, price } = item;
        const isEntry = alert.alertType === 'ENTRY_REACHED';
        const isTarget = alert.alertType === 'TARGET_REACHED';
        const isSL = alert.alertType === 'STOP_LOSS_REACHED';

        const borderColor = isEntry
          ? 'border-amber-500/80'
          : isTarget
          ? 'border-emerald-500/80'
          : isSL
          ? 'border-rose-500/80'
          : 'border-sky-500/80';

        const badgeBg = isEntry
          ? 'bg-amber-500 text-slate-950'
          : isTarget
          ? 'bg-emerald-500 text-slate-950'
          : isSL
          ? 'bg-rose-500 text-white'
          : 'bg-sky-500 text-slate-950';

        const headline = isEntry
          ? '⚡ ENTRY LEVEL REACHED'
          : isTarget
          ? '🎯 TARGET LEVEL HIT'
          : isSL
          ? '🛑 STOP LOSS REACHED'
          : '🔔 PRICE LEVEL REACHED';

        return (
          <div
            key={item.id}
            className={`pointer-events-auto bg-slate-900/95 backdrop-blur-xl border-2 ${borderColor} rounded-2xl p-3.5 shadow-2xl shadow-slate-950/80 text-white animate-in slide-in-from-top-4 duration-200 transition-all`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${badgeBg}`}>
                  <BellRing className="w-3 h-3 animate-bounce" />
                  {headline}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <button
                onClick={() => onDismiss(item.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-black text-white">{alert.symbol}</span>
                <span className="text-xs font-semibold text-emerald-400 font-mono">
                  Current: ₹{price.toLocaleString()}
                </span>
              </div>
              <div className="text-[11px] font-mono text-amber-300">
                Trigger: ₹{alert.triggerPrice.toLocaleString()}
              </div>
            </div>

            {alert.note && (
              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-snug">
                {alert.note}
              </p>
            )}

            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center gap-2">
              {onAutoTrade && alert.tradePayload && (
                <button
                  onClick={() => {
                    onAutoTrade(alert.tradePayload);
                    onDismiss(item.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Auto-Trade Now
                </button>
              )}
              <button
                onClick={() => {
                  onViewChart(alert.symbol);
                  onDismiss(item.id);
                }}
                className="flex items-center justify-center gap-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                <span>View Chart</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertNotificationToast;
