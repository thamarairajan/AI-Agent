import React, { useState } from 'react';
import { RiskSettings } from '../types/trading';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Key,
  Lock,
  Save,
  Shield,
  ShieldAlert,
  Sliders,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RiskSettings;
  onSaveSettings: (newSettings: RiskSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<RiskSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="settings-modal"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Trading Terminal & Dhan API Settings
              </h2>
              <p className="text-xs text-slate-400">
                Configure DhanHQ broker gateway credentials, live execution safeguards, and risk limits
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Section 1: Dhan API Credentials */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-sky-400" />
                DhanHQ Broker API Gateway (v2.0)
              </h3>
              <a
                href="https://dhanhq.co/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <span>Get Dhan API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              Provide your Dhan Client ID and Access Token to enable direct live trading on NSE/BSE. If left empty, the app runs in full-fidelity Paper Trading mode.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                  Dhan Client ID
                </label>
                <input
                  id="dhan-client-id-input"
                  type="text"
                  value={formData.dhanClientId}
                  onChange={(e) =>
                    setFormData({ ...formData, dhanClientId: e.target.value })
                  }
                  placeholder="e.g. 1000189283 (Optional)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                  Dhan Access Token (JWT)
                </label>
                <input
                  id="dhan-access-token-input"
                  type="password"
                  value={formData.dhanAccessToken}
                  onChange={(e) =>
                    setFormData({ ...formData, dhanAccessToken: e.target.value })
                  }
                  placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9... (Optional)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 1b: Upstox API Credentials */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-4 h-4 text-purple-400" />
                Upstox Developer App & Market Feed API (v2.0)
              </h3>
              <a
                href="https://upstox.com/developer/api-documentation/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <span>Upstox API Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              Enter your Upstox App Token or Analytics Token to power the dedicated Upstox Market Intelligence Chat and stream live exchange ticks. You can also specify this in your <code className="text-purple-300">.env</code> file as <code className="text-purple-300">UPSTOX_ACCESS_TOKEN</code>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                  App / Token Name
                </label>
                <input
                  id="upstox-token-name-input"
                  type="text"
                  value={formData.upstoxTokenName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, upstoxTokenName: e.target.value })
                  }
                  placeholder="e.g. Analytics Token / My App"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  id="upstox-expiry-input"
                  type="text"
                  value={formData.upstoxTokenExpiry || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, upstoxTokenExpiry: e.target.value })
                  }
                  placeholder="e.g. 2026-12-31"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                  Upstox Access / Analytics Token
                </label>
                <input
                  id="upstox-access-token-input"
                  type="password"
                  value={formData.upstoxAccessToken || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, upstoxAccessToken: e.target.value })
                  }
                  placeholder="Bearer or Analytics Token from Upstox console (Optional)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Institutional Risk Management Rules */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              Automated Risk Management Guardrails
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                  Max Daily Loss Cap (₹)
                </label>
                <input
                  id="max-daily-loss-input"
                  type="number"
                  value={formData.maxDailyLoss}
                  onChange={(e) =>
                    setFormData({ ...formData, maxDailyLoss: Number(e.target.value) })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Halts all bot activity if hit</span>
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">
                  Max Risk Per Trade (%)
                </label>
                <input
                  id="max-risk-per-trade-input"
                  type="number"
                  step="0.1"
                  value={formData.maxRiskPerTradePct}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxRiskPerTradePct: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">Max portfolio risk per position</span>
              </div>
            </div>

            {/* Toggle Kill Switch */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-semibold text-slate-200">Auto Kill-Switch</div>
                <div className="text-[10px] text-slate-400">
                  Automatically squares off all open positions if daily drawdown limit is reached
                </div>
              </div>
              <input
                id="auto-killswitch-toggle"
                type="checkbox"
                checked={formData.autoKillSwitchOnLoss}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    autoKillSwitchOnLoss: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 3: Live Trading Safety Switch */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <div>
                  <div className="font-bold text-rose-300">Live Trading Execution Arming</div>
                  <div className="text-[11px] text-rose-200/70">
                    When enabled, trade signals can be dispatched to your live Dhan broker account.
                  </div>
                </div>
              </div>
              <input
                id="live-trading-armed-toggle"
                type="checkbox"
                checked={formData.liveTradingArmed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    liveTradingArmed: e.target.checked,
                  })
                }
                className="w-5 h-5 accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 4: Sound Alerts */}
          <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-2">
              {formData.soundAlerts ? (
                <Volume2 className="w-4 h-4 text-sky-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <span className="font-medium text-slate-200">Audio Chime Alerts</span>
            </div>
            <input
              id="sound-alerts-toggle"
              type="checkbox"
              checked={formData.soundAlerts}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  soundAlerts: e.target.checked,
                })
              }
              className="w-4 h-4 accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Section 5: Real Exchange Hours & Off-Hours Practice Mode */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div>
              <div className="font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-white font-bold uppercase tracking-wider text-[11px]">
                  Exchange Hours Discipline (NSE / BSE)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  09:15 - 15:30 IST
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Real Indian markets halt trading after 15:25 / 15:30 IST and remain frozen at the day's final closing price until 09:15 AM next morning.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div className="pr-4">
                <div className="font-semibold text-slate-200 text-xs">Off-Hours Practice Simulation (Test Mode)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Keep <strong className="text-slate-300">OFF</strong> to freeze ticks when the real market is closed. Turn <strong className="text-amber-300">ON</strong> only if you want to practice paper trading on weekends or late at night with synthetic ticks.
                </div>
              </div>
              <input
                id="off-hours-simulation-toggle"
                type="checkbox"
                checked={formData.offHoursSimulationMode || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    offHoursSimulationMode: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Footer save */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-settings-btn"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-sky-600/30 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
