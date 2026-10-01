import { BacktestResult, BacktestTrade, Candle } from '../types/trading';
import { calculateBollingerBands, calculateEMA, calculateMACD, calculateRSI, calculateSMA } from './indicators';

export interface BacktestParams {
  strategyName: string;
  candles: Candle[];
  symbol: string;
  timeframe: string;
  initialCapital?: number;
  riskRewardRatio?: number;
  stopLossPct?: number;
  takeProfitPct?: number;
  slippagePct?: number;
}

export function runBacktestSimulation(params: BacktestParams): BacktestResult {
  const {
    strategyName,
    candles,
    symbol,
    timeframe,
    initialCapital = 100000,
    stopLossPct = 1.0,
    takeProfitPct = 2.0,
    slippagePct = 0.05,
  } = params;

  const trades: BacktestTrade[] = [];
  const equityCurve: { time: number; equity: number; drawdown: number }[] = [];

  let capital = initialCapital;
  let peakEquity = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;

  // Pre-calculate indicators
  const ema9 = calculateEMA(candles, 9);
  const ema21 = calculateEMA(candles, 21);
  const sma50 = calculateSMA(candles, 50);
  const rsi = calculateRSI(candles, 14);
  const macd = calculateMACD(candles, 12, 26, 9);
  const bb = calculateBollingerBands(candles, 20, 2);

  let activePosition: {
    entryTime: number;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    qty: number;
    stopLoss: number;
    takeProfit: number;
  } | null = null;

  for (let i = 30; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];

    // Check exit conditions if in position
    if (activePosition) {
      let exitPrice: number | null = null;
      let exitReason: BacktestTrade['exitReason'] = 'SIGNAL_FLIP';

      if (activePosition.type === 'BUY') {
        if (candle.low <= activePosition.stopLoss) {
          exitPrice = activePosition.stopLoss;
          exitReason = 'STOP_LOSS';
        } else if (candle.high >= activePosition.takeProfit) {
          exitPrice = activePosition.takeProfit;
          exitReason = 'TARGET_HIT';
        }
      } else {
        if (candle.high >= activePosition.stopLoss) {
          exitPrice = activePosition.stopLoss;
          exitReason = 'STOP_LOSS';
        } else if (candle.low <= activePosition.takeProfit) {
          exitPrice = activePosition.takeProfit;
          exitReason = 'TARGET_HIT';
        }
      }

      if (exitPrice !== null) {
        // Apply slippage
        const finalExitPrice =
          activePosition.type === 'BUY'
            ? exitPrice * (1 - slippagePct / 100)
            : exitPrice * (1 + slippagePct / 100);

        const pnl =
          activePosition.type === 'BUY'
            ? (finalExitPrice - activePosition.entryPrice) * activePosition.qty
            : (activePosition.entryPrice - finalExitPrice) * activePosition.qty;

        const pnlPct =
          activePosition.type === 'BUY'
            ? ((finalExitPrice - activePosition.entryPrice) / activePosition.entryPrice) * 100
            : ((activePosition.entryPrice - finalExitPrice) / activePosition.entryPrice) * 100;

        capital += pnl;

        trades.push({
          id: `bt_${trades.length + 1}`,
          entryTime: activePosition.entryTime,
          exitTime: candle.time,
          type: activePosition.type,
          entryPrice: Number(activePosition.entryPrice.toFixed(2)),
          exitPrice: Number(finalExitPrice.toFixed(2)),
          qty: activePosition.qty,
          pnl: Number(pnl.toFixed(2)),
          pnlPct: Number(pnlPct.toFixed(2)),
          exitReason,
        });

        activePosition = null;
      }
    }

    // If no active position, check for entry signals
    if (!activePosition && i < candles.length - 1) {
      let signal: 'BUY' | 'SELL' | null = null;

      if (strategyName.toLowerCase().includes('rsi')) {
        const curRsi = rsi[i];
        const prevRsi = rsi[i - 1];
        if (curRsi !== null && prevRsi !== null) {
          if (prevRsi < 32 && curRsi >= 32) signal = 'BUY';
          else if (prevRsi > 68 && curRsi <= 68) signal = 'SELL';
        }
      } else if (strategyName.toLowerCase().includes('macd')) {
        const hist = macd.histogram[i];
        const prevHist = macd.histogram[i - 1];
        if (hist !== null && prevHist !== null) {
          if (prevHist < 0 && hist >= 0) signal = 'BUY';
          else if (prevHist > 0 && hist <= 0) signal = 'SELL';
        }
      } else if (strategyName.toLowerCase().includes('bollinger')) {
        const upper = bb.upper[i];
        const lower = bb.lower[i];
        if (lower !== null && candle.close > lower && prevCandle.close <= lower) {
          signal = 'BUY';
        } else if (upper !== null && candle.close < upper && prevCandle.close >= upper) {
          signal = 'SELL';
        }
      } else {
        // Default EMA Crossover strategy (9 & 21 with 50 SMA trend filter)
        const e9 = ema9[i];
        const e21 = ema21[i];
        const prevE9 = ema9[i - 1];
        const prevE21 = ema21[i - 1];
        const s50 = sma50[i];

        if (e9 !== null && e21 !== null && prevE9 !== null && prevE21 !== null) {
          // Golden cross
          if (prevE9 <= prevE21 && e9 > e21 && (!s50 || candle.close > s50)) {
            signal = 'BUY';
          }
          // Death cross
          else if (prevE9 >= prevE21 && e9 < e21 && (!s50 || candle.close < s50)) {
            signal = 'SELL';
          }
        }
      }

      if (signal) {
        const entryPrice =
          signal === 'BUY'
            ? candle.close * (1 + slippagePct / 100)
            : candle.close * (1 - slippagePct / 100);

        // Position sizing: risk 2% of capital
        const riskAmount = capital * 0.02;
        const slDistance = entryPrice * (stopLossPct / 100);
        const qty = Math.max(1, Math.floor(riskAmount / slDistance));

        const stopLoss =
          signal === 'BUY' ? entryPrice - slDistance : entryPrice + slDistance;
        const takeProfit =
          signal === 'BUY'
            ? entryPrice + slDistance * (takeProfitPct / stopLossPct)
            : entryPrice - slDistance * (takeProfitPct / stopLossPct);

        activePosition = {
          entryTime: candle.time,
          type: signal,
          entryPrice,
          qty,
          stopLoss,
          takeProfit,
        };
      }
    }

    // Track equity curve
    const currentUnrealized = activePosition
      ? activePosition.type === 'BUY'
        ? (candle.close - activePosition.entryPrice) * activePosition.qty
        : (activePosition.entryPrice - candle.close) * activePosition.qty
      : 0;

    const currentTotalEquity = capital + currentUnrealized;
    if (currentTotalEquity > peakEquity) {
      peakEquity = currentTotalEquity;
    }
    const currentDd = Math.max(0, peakEquity - currentTotalEquity);
    const currentDdPct = peakEquity > 0 ? (currentDd / peakEquity) * 100 : 0;

    if (currentDd > maxDrawdown) maxDrawdown = currentDd;
    if (currentDdPct > maxDrawdownPct) maxDrawdownPct = currentDdPct;

    equityCurve.push({
      time: candle.time,
      equity: Number(currentTotalEquity.toFixed(2)),
      drawdown: Number(currentDdPct.toFixed(2)),
    });
  }

  // Force close remaining open position at end
  if (activePosition && candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    const pnl =
      activePosition.type === 'BUY'
        ? (lastCandle.close - activePosition.entryPrice) * activePosition.qty
        : (activePosition.entryPrice - lastCandle.close) * activePosition.qty;
    capital += pnl;

    trades.push({
      id: `bt_${trades.length + 1}`,
      entryTime: activePosition.entryTime,
      exitTime: lastCandle.time,
      type: activePosition.type,
      entryPrice: Number(activePosition.entryPrice.toFixed(2)),
      exitPrice: Number(lastCandle.close.toFixed(2)),
      qty: activePosition.qty,
      pnl: Number(pnl.toFixed(2)),
      pnlPct: Number(((pnl / (activePosition.entryPrice * activePosition.qty)) * 100).toFixed(2)),
      exitReason: 'TIMEFRAME_CLOSE',
    });
  }

  const winningTrades = trades.filter((t) => t.pnl > 0);
  const losingTrades = trades.filter((t) => t.pnl <= 0);
  const totalWinAmount = winningTrades.reduce((acc, t) => acc + t.pnl, 0);
  const totalLossAmount = Math.abs(losingTrades.reduce((acc, t) => acc + t.pnl, 0));

  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount > 0 ? 99.9 : 0;
  const netProfit = capital - initialCapital;
  const netProfitPct = (netProfit / initialCapital) * 100;
  const avgTradeProfit = trades.length > 0 ? netProfit / trades.length : 0;

  // Simple annualized Sharpe approximation
  const returns = trades.map((t) => t.pnlPct);
  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance =
    returns.length > 1
      ? returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length - 1)
      : 1;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  return {
    strategyName,
    symbol,
    timeframe,
    initialCapital,
    finalCapital: Number(capital.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    netProfitPct: Number(netProfitPct.toFixed(2)),
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Number(winRate.toFixed(1)),
    profitFactor: Number(profitFactor.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    avgTradeProfit: Number(avgTradeProfit.toFixed(2)),
    equityCurve,
    trades: trades.reverse(), // most recent first
  };
}
