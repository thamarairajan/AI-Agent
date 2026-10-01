import { Candle, PivotPoints, RenkoBrick } from '../types/trading';

export function calculateSMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    result.push(sum / period);
  }
  return result;
}

export function calculateEMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (prevEma === null) {
      // First EMA is simple average of first period
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      prevEma = sum / period;
      result.push(prevEma);
    } else {
      const currentEma: number = candles[i].close * k + (prevEma as number) * (1 - k);
      prevEma = currentEma;
      result.push(currentEma);
    }
  }
  return result;
}

export function calculateRSI(candles: Candle[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (candles.length <= period) {
    return candles.map(() => null);
  }

  let gains = 0;
  let losses = 0;

  // First period
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  result.push(rsi);

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    result.push(rsi);
  }

  return result;
}

export function calculateMACD(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);
  const macdLine: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    const f = fastEMA[i];
    const s = slowEMA[i];
    if (f !== null && s !== null) {
      macdLine.push(f - s);
    } else {
      macdLine.push(null);
    }
  }

  // Calculate signal line (EMA of MACD line)
  const validMacdStart = macdLine.findIndex((v) => v !== null);
  const signalLine: (number | null)[] = new Array(candles.length).fill(null);
  const histogram: (number | null)[] = new Array(candles.length).fill(null);

  if (validMacdStart !== -1 && candles.length - validMacdStart >= signalPeriod) {
    const k = 2 / (signalPeriod + 1);
    let prevSig: number | null = null;

    for (let i = validMacdStart + signalPeriod - 1; i < candles.length; i++) {
      if (prevSig === null) {
        let sum = 0;
        for (let j = 0; j < signalPeriod; j++) {
          sum += macdLine[i - j] as number;
        }
        prevSig = sum / signalPeriod;
        signalLine[i] = prevSig;
      } else {
        const curSig: number = (macdLine[i] as number) * k + (prevSig as number) * (1 - k);
        prevSig = curSig;
        signalLine[i] = curSig;
      }
      if (macdLine[i] !== null && signalLine[i] !== null) {
        histogram[i] = (macdLine[i] as number) - (signalLine[i] as number);
      }
    }
  }

  return { macdLine, signalLine, histogram };
}

export function calculateBollingerBands(
  candles: Candle[],
  period = 20,
  multiplier = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const sma = calculateSMA(candles, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    const mid = sma[i];
    if (mid === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sumSq = 0;
    for (let j = 0; j < period; j++) {
      const diff = candles[i - j].close - mid;
      sumSq += diff * diff;
    }
    const stdDev = Math.sqrt(sumSq / period);
    upper.push(mid + multiplier * stdDev);
    lower.push(mid - multiplier * stdDev);
  }

  return { upper, middle: sma, lower };
}

/**
 * Calculates ADX (Average Directional Index) with +DI and -DI
 */
export function calculateADX(
  candles: Candle[],
  period = 14
): {
  adx: (number | null)[];
  plusDI: (number | null)[];
  minusDI: (number | null)[];
} {
  const count = candles.length;
  const adx: (number | null)[] = new Array(count).fill(null);
  const plusDI: (number | null)[] = new Array(count).fill(null);
  const minusDI: (number | null)[] = new Array(count).fill(null);

  if (count <= period * 2) {
    return { adx, plusDI, minusDI };
  }

  const tr: number[] = [0];
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];

  for (let i = 1; i < count; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];

    const currentTR = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    tr.push(currentTR);

    const upMove = cur.high - prev.high;
    const downMove = prev.low - cur.low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  // Smooth TR, +DM, -DM
  let smoothTR = 0;
  let smoothPlusDM = 0;
  let smoothMinusDM = 0;

  for (let i = 1; i <= period; i++) {
    smoothTR += tr[i];
    smoothPlusDM += plusDM[i];
    smoothMinusDM += minusDM[i];
  }

  const dxValues: { idx: number; val: number }[] = [];

  for (let i = period; i < count; i++) {
    if (i > period) {
      smoothTR = smoothTR - smoothTR / period + tr[i];
      smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
      smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];
    }

    const pDI = smoothTR === 0 ? 0 : (smoothPlusDM / smoothTR) * 100;
    const mDI = smoothTR === 0 ? 0 : (smoothMinusDM / smoothTR) * 100;

    plusDI[i] = Number(pDI.toFixed(2));
    minusDI[i] = Number(mDI.toFixed(2));

    const diSum = pDI + mDI;
    const diDiff = Math.abs(pDI - mDI);
    const dx = diSum === 0 ? 0 : (diDiff / diSum) * 100;
    dxValues.push({ idx: i, val: dx });
  }

  // Calculate smoothed ADX from DX values
  if (dxValues.length >= period) {
    let initialADX = 0;
    for (let i = 0; i < period; i++) {
      initialADX += dxValues[i].val;
    }
    initialADX = initialADX / period;
    adx[dxValues[period - 1].idx] = Number(initialADX.toFixed(2));

    let runningADX = initialADX;
    for (let i = period; i < dxValues.length; i++) {
      runningADX = (runningADX * (period - 1) + dxValues[i].val) / period;
      adx[dxValues[i].idx] = Number(runningADX.toFixed(2));
    }
  }

  return { adx, plusDI, minusDI };
}

/**
 * Calculates SuperTrend (ATR period = 10, multiplier = 3)
 */
export function calculateSuperTrend(
  candles: Candle[],
  period = 10,
  multiplier = 3
): {
  supertrend: (number | null)[];
  direction: ('BULLISH' | 'BEARISH' | null)[];
} {
  const count = candles.length;
  const supertrend: (number | null)[] = new Array(count).fill(null);
  const direction: ('BULLISH' | 'BEARISH' | null)[] = new Array(count).fill(null);

  if (count <= period) {
    return { supertrend, direction };
  }

  // Calculate True Range
  const tr: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < count; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    tr.push(
      Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      )
    );
  }

  // Simple / Wilder ATR
  const atr: number[] = new Array(count).fill(0);
  let atrSum = 0;
  for (let i = 0; i < period; i++) {
    atrSum += tr[i];
  }
  atr[period - 1] = atrSum / period;

  for (let i = period; i < count; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  let prevUpper = 0;
  let prevLower = 0;
  let currentDir: 'BULLISH' | 'BEARISH' = 'BULLISH';

  for (let i = period - 1; i < count; i++) {
    const cur = candles[i];
    const prevClose = i > 0 ? candles[i - 1].close : cur.close;
    const curAtr = atr[i];

    const hl2 = (cur.high + cur.low) / 2;
    let basicUpper = hl2 + multiplier * curAtr;
    let basicLower = hl2 - multiplier * curAtr;

    // Final Upper Band
    let finalUpper = basicUpper;
    if (i > period - 1) {
      if (basicUpper < prevUpper || prevClose > prevUpper) {
        finalUpper = basicUpper;
      } else {
        finalUpper = prevUpper;
      }
    }

    // Final Lower Band
    let finalLower = basicLower;
    if (i > period - 1) {
      if (basicLower > prevLower || prevClose < prevLower) {
        finalLower = basicLower;
      } else {
        finalLower = prevLower;
      }
    }

    // Determine SuperTrend value & flip
    if (i === period - 1) {
      currentDir = cur.close >= finalLower ? 'BULLISH' : 'BEARISH';
    } else {
      const prevST = supertrend[i - 1];
      if (prevST === prevUpper) {
        currentDir = cur.close > finalUpper ? 'BULLISH' : 'BEARISH';
      } else {
        currentDir = cur.close < finalLower ? 'BEARISH' : 'BULLISH';
      }
    }

    const stValue = currentDir === 'BULLISH' ? finalLower : finalUpper;
    supertrend[i] = Number(stValue.toFixed(2));
    direction[i] = currentDir;

    prevUpper = finalUpper;
    prevLower = finalLower;
  }

  return { supertrend, direction };
}

/**
 * Calculates Classical Intraday Pivot Points (P, R1, R2, R3, S1, S2, S3)
 */
export function calculateDailyPivotPoints(candles: Candle[]): PivotPoints {
  if (candles.length === 0) {
    return { pivot: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0 };
  }

  // Find recent session high, low, close (e.g. from preceding 40 candles)
  const sample = candles.slice(-50);
  let high = -Infinity;
  let low = Infinity;
  sample.forEach((c) => {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  });
  const close = candles[candles.length - 1].close;

  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);

  return {
    pivot: Number(pivot.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    r3: Number(r3.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    s3: Number(s3.toFixed(2)),
  };
}

/**
 * Converts price time-series into Renko Bricks based on box size
 */
export function generateRenkoBricks(candles: Candle[], customBoxSize?: number): RenkoBrick[] {
  if (candles.length === 0) return [];

  const lastClose = candles[candles.length - 1].close;
  // Default box size ~ 0.25% of spot price
  const boxSize =
    customBoxSize && customBoxSize > 0
      ? customBoxSize
      : Math.max(1, Math.round(lastClose * 0.0025 * 10) / 10);

  const bricks: RenkoBrick[] = [];
  let currentOpen = Math.floor(candles[0].open / boxSize) * boxSize;
  let currentClose = currentOpen + boxSize;

  bricks.push({
    index: 0,
    time: candles[0].time,
    open: currentOpen,
    close: currentClose,
    high: currentClose,
    low: currentOpen,
    type: 'UP',
  });

  for (let i = 1; i < candles.length; i++) {
    const candle = candles[i];
    const prevBrick = bricks[bricks.length - 1];

    if (prevBrick.type === 'UP') {
      // Upward continuation
      if (candle.close >= prevBrick.close + boxSize) {
        const steps = Math.floor((candle.close - prevBrick.close) / boxSize);
        for (let s = 1; s <= steps; s++) {
          const bOpen = prevBrick.close + (s - 1) * boxSize;
          const bClose = bOpen + boxSize;
          bricks.push({
            index: bricks.length,
            time: candle.time,
            open: bOpen,
            close: bClose,
            high: bClose,
            low: bOpen,
            type: 'UP',
          });
        }
      }
      // Downward reversal (requires 2 box sizes drop from top)
      else if (candle.close <= prevBrick.open - boxSize) {
        const steps = Math.floor((prevBrick.open - candle.close) / boxSize);
        for (let s = 1; s <= steps; s++) {
          const bOpen = prevBrick.open - (s - 1) * boxSize;
          const bClose = bOpen - boxSize;
          bricks.push({
            index: bricks.length,
            time: candle.time,
            open: bOpen,
            close: bClose,
            high: bOpen,
            low: bClose,
            type: 'DOWN',
          });
        }
      }
    } else {
      // Downward continuation
      if (candle.close <= prevBrick.close - boxSize) {
        const steps = Math.floor((prevBrick.close - candle.close) / boxSize);
        for (let s = 1; s <= steps; s++) {
          const bOpen = prevBrick.close - (s - 1) * boxSize;
          const bClose = bOpen - boxSize;
          bricks.push({
            index: bricks.length,
            time: candle.time,
            open: bOpen,
            close: bClose,
            high: bOpen,
            low: bClose,
            type: 'DOWN',
          });
        }
      }
      // Upward reversal (requires 2 box sizes jump from bottom)
      else if (candle.close >= prevBrick.open + boxSize) {
        const steps = Math.floor((candle.close - prevBrick.open) / boxSize);
        for (let s = 1; s <= steps; s++) {
          const bOpen = prevBrick.open + (s - 1) * boxSize;
          const bClose = bOpen + boxSize;
          bricks.push({
            index: bricks.length,
            time: candle.time,
            open: bOpen,
            close: bClose,
            high: bClose,
            low: bOpen,
            type: 'UP',
          });
        }
      }
    }
  }

  return bricks;
}

