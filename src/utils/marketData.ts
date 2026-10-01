import { Candle, SymbolInfo } from '../types/trading';

export const POPULAR_SYMBOLS: SymbolInfo[] = [
  {
    symbol: 'NIFTY 50',
    name: 'NIFTY 50 Index',
    exchange: 'NSE',
    category: 'Index',
    lastPrice: 24850.50,
    change24h: 95.10,
    changePercent24h: 0.38,
    volume: '3.12M',
    high24h: 24920.0,
    low24h: 24780.0,
    securityId: '13',
    lotSize: 25,
    tickSize: 0.05,
  },
  {
    symbol: 'NIFTY NEXT 50',
    name: 'NIFTY Next 50 Index (Junior Nifty)',
    exchange: 'NSE',
    category: 'Index',
    lastPrice: 70267.80,
    change24h: 5.15,
    changePercent24h: 0.01,
    volume: '5.04M',
    high24h: 70319.2,
    low24h: 70231.0,
    securityId: '17',
    lotSize: 10,
    tickSize: 0.05,
  },
  {
    symbol: 'SENSEX',
    name: 'BSE SENSEX Index',
    exchange: 'BSE',
    category: 'Index',
    lastPrice: 81450.40,
    change24h: -340.20,
    changePercent24h: -0.42,
    volume: '14.2M',
    high24h: 81890.0,
    low24h: 81320.0,
    securityId: '1',
    lotSize: 10,
    tickSize: 0.05,
  },
  {
    symbol: 'BANKNIFTY',
    name: 'Nifty Bank Index',
    exchange: 'NSE',
    category: 'Index',
    lastPrice: 55606.95,
    change24h: -941.95,
    changePercent24h: -1.67,
    volume: '118.5M',
    high24h: 56548.9,
    low24h: 55520.0,
    securityId: '25',
    lotSize: 15,
    tickSize: 0.05,
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    exchange: 'NSE',
    category: 'Indian Equity',
    lastPrice: 1236.8,
    change24h: -11.2,
    changePercent24h: -0.90,
    volume: '8.4M',
    high24h: 1258.0,
    low24h: 1232.0,
    securityId: '2885',
    lotSize: 1,
    tickSize: 0.05,
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    exchange: 'NSE',
    category: 'Indian Equity',
    lastPrice: 728.05,
    change24h: -9.2,
    changePercent24h: -1.25,
    volume: '15.8M',
    high24h: 742.0,
    low24h: 724.0,
    securityId: '1333',
    lotSize: 1,
    tickSize: 0.05,
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd',
    exchange: 'NSE',
    category: 'Indian Equity',
    lastPrice: 978.4,
    change24h: 18.2,
    changePercent24h: 1.89,
    volume: '14.1M',
    high24h: 986.5,
    low24h: 960.0,
    securityId: '3456',
    lotSize: 1,
    tickSize: 0.05,
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    exchange: 'NSE',
    category: 'Indian Equity',
    lastPrice: 1845.6,
    change24h: 12.1,
    changePercent24h: 0.66,
    volume: '6.2M',
    high24h: 1858.0,
    low24h: 1828.0,
    securityId: '1594',
    lotSize: 1,
    tickSize: 0.05,
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    category: 'Indian Equity',
    lastPrice: 4125.0,
    change24h: -15.5,
    changePercent24h: -0.37,
    volume: '3.1M',
    high24h: 4155.0,
    low24h: 4108.0,
    securityId: '11536',
    lotSize: 1,
    tickSize: 0.05,
  },
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin / Tether USD',
    exchange: 'CRYPTO',
    category: 'Crypto',
    lastPrice: 64820.0,
    change24h: 1840.0,
    changePercent24h: 2.92,
    volume: '34.8K BTC',
    high24h: 65400.0,
    low24h: 62800.0,
    securityId: 'BTCUSDT',
    lotSize: 0.001,
    tickSize: 0.1,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    category: 'US Tech',
    lastPrice: 124.8,
    change24h: 3.4,
    changePercent24h: 2.8,
    volume: '48.9M',
    high24h: 126.5,
    low24h: 121.2,
    securityId: 'NVDA',
    lotSize: 1,
    tickSize: 0.01,
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'NYSE',
    category: 'US Tech',
    lastPrice: 562.4,
    change24h: 2.8,
    changePercent24h: 0.5,
    volume: '42.3M',
    high24h: 564.1,
    low24h: 559.8,
    securityId: 'SPY',
    lotSize: 1,
    tickSize: 0.01,
  },
];

export function generateHistoricalCandles(
  basePrice: number,
  count = 120,
  timeframeMinutes = 15,
  change24h = -218.80
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const intervalMs = timeframeMinutes * 60 * 1000;
  const volatility = basePrice > 10000 ? 0.0012 : 0.0025;

  // The starting price (at market open 9:15 AM)
  const openPrice = basePrice - change24h;

  // Generate a realistic path from openPrice -> basePrice
  const closes: number[] = new Array(count + 1);
  closes[0] = openPrice;
  closes[count] = basePrice;

  // Linear trend from openPrice to basePrice plus intraday swings
  for (let i = 1; i < count; i++) {
    const progress = i / count;
    const trendPrice = openPrice + (basePrice - openPrice) * progress;
    // Morning peak (at ~20% of the session) followed by midday trough
    const intradayPattern = Math.sin(progress * Math.PI) * (change24h < 0 ? -basePrice * 0.003 : basePrice * 0.003);
    const noise = (Math.random() - 0.5) * volatility * basePrice;
    closes[i] = Number((trendPrice + intradayPattern + noise).toFixed(2));
  }

  for (let i = 0; i <= count; i++) {
    const time = now - (count - i) * intervalMs;
    const close = closes[i];
    const prevClose = i > 0 ? closes[i - 1] : openPrice;
    const open = Number(prevClose.toFixed(2));
    const spread = Math.abs(close - open);
    const wickBuffer = spread * 0.4 + basePrice * 0.0004;
    const high = Number((Math.max(open, close) + Math.random() * wickBuffer).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * wickBuffer).toFixed(2));

    const baseVol = basePrice > 10000 ? 2500 : 35000;
    const volume = Math.floor(baseVol * (0.8 + Math.random() * 1.2));

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });
  }

  // Ensure last candle strictly matches basePrice
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = basePrice;
    last.high = Math.max(last.high, basePrice);
    last.low = Math.min(last.low, basePrice);
  }

  return candles;
}

export function generateNextTickCandle(
  lastCandle: Candle,
  timeframeMinutes = 15,
  anchorPrice?: number
): {
  updatedCandle: Candle;
  isNewCandle: boolean;
} {
  const now = Date.now();
  const intervalMs = timeframeMinutes * 60 * 1000;
  const isNewCandle = now - lastCandle.time >= intervalMs;

  const volatility = 0.0002;
  let delta = (Math.random() - 0.50) * lastCandle.close * volatility;

  // Mean-reversion to true exchange anchor so synthetic ticks never drift from Upstox / NSE
  if (anchorPrice && anchorPrice > 0) {
    const deviation = lastCandle.close - anchorPrice;
    delta -= deviation * 0.18; // Pull back toward the authentic exchange tick
  }

  const newClose = Number((lastCandle.close + delta).toFixed(2));

  if (isNewCandle) {
    return {
      updatedCandle: {
        time: Math.floor(now / intervalMs) * intervalMs,
        open: lastCandle.close,
        high: Math.max(lastCandle.close, newClose),
        low: Math.min(lastCandle.close, newClose),
        close: newClose,
        volume: Math.floor(30 + Math.random() * 100),
      },
      isNewCandle: true,
    };
  } else {
    return {
      updatedCandle: {
        ...lastCandle,
        high: Math.max(lastCandle.high, newClose),
        low: Math.min(lastCandle.low, newClose),
        close: newClose,
        volume: lastCandle.volume + Math.floor(2 + Math.random() * 15),
      },
      isNewCandle: false,
    };
  }
}
