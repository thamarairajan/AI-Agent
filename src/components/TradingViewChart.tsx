import React, { useEffect, useRef, useState } from 'react';
import { Candle, PriceAlert, SymbolInfo, TradeSignal } from '../types/trading';
import {
  calculateADX,
  calculateBollingerBands,
  calculateDailyPivotPoints,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA,
  calculateSuperTrend,
  generateRenkoBricks,
} from '../utils/indicators';
import { isSymbolMarketOpen } from '../utils/strategyEngine';
import {
  Activity,
  BarChart2,
  Bell,
  ChevronDown,
  Layers,
  Maximize2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { TradingViewWidgetEmbed } from './TradingViewWidgetEmbed';

interface TradingViewChartProps {
  candles: Candle[];
  symbolInfo: SymbolInfo;
  activeSignal?: TradeSignal | null;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  onSymbolSelect: (symbol: SymbolInfo) => void;
  allSymbols: SymbolInfo[];
  onOpenAutoTradeModal?: () => void;
  priceAlerts?: PriceAlert[];
  onOpenAlertsWatchdog?: () => void;
  onOpenPriceCalibrator?: () => void;
  onCalibratePrice?: (price: number) => void;
  upstoxConnected?: boolean;
  dhanConnected?: boolean;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  candles,
  symbolInfo,
  activeSignal,
  timeframe,
  onTimeframeChange,
  onSymbolSelect,
  allSymbols,
  onOpenAutoTradeModal,
  priceAlerts = [],
  onOpenAlertsWatchdog,
  onOpenPriceCalibrator,
  onCalibratePrice,
  upstoxConnected = false,
  dhanConnected = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [quickDhanPrice, setQuickDhanPrice] = useState<string>('');

  useEffect(() => {
    setQuickDhanPrice(symbolInfo.lastPrice ? symbolInfo.lastPrice.toString() : '');
  }, [symbolInfo.symbol, symbolInfo.lastPrice]);

  const handleQuickDhanMatch = () => {
    const val = parseFloat(quickDhanPrice);
    if (!isNaN(val) && val > 0 && onCalibratePrice) {
      onCalibratePrice(val);
    }
  };

  // Handle container resize & orientation changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight || 460,
        });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', updateDimensions);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Indicators toggle state
  const [viewMode, setViewMode] = useState<'TRADINGVIEW_LIVE' | 'QUANT_CANVAS'>(() => {
    const saved = localStorage.getItem('ai_trader_chart_view_mode');
    return (saved as any) || 'TRADINGVIEW_LIVE';
  });

  useEffect(() => {
    localStorage.setItem('ai_trader_chart_view_mode', viewMode);
  }, [viewMode]);

  const [showEMA9, setShowEMA9] = useState(true);
  const [showEMA21, setShowEMA21] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showPivots, setShowPivots] = useState(false);
  const [chartType, setChartType] = useState<'CANDLE' | 'RENKO'>('CANDLE');
  const [subChart, setSubChart] = useState<'NONE' | 'RSI' | 'MACD' | 'ADX'>('RSI');

  const getTradingViewSymbol = (sym: string): string => {
    const s = sym.toUpperCase();
    if (s.includes('NEXT 50') || s.includes('NIFTY NEXT 50') || s.includes('NIFTYJR')) return 'NSE:NIFTYJR';
    if (s.includes('NIFTY 50')) return 'NSE:NIFTY';
    if (s.includes('BANKNIFTY')) return 'NSE:BANKNIFTY';
    if (sym.includes('RELIANCE')) return 'NSE:RELIANCE';
    if (sym.includes('TATAMOTORS')) return 'NSE:TATAMOTORS';
    if (sym.includes('HDFCBANK')) return 'NSE:HDFCBANK';
    if (sym.includes('INFY')) return 'NSE:INFY';
    if (sym.includes('TCS')) return 'NSE:TCS';
    if (sym.includes('BTC')) return 'BINANCE:BTCUSDT';
    if (sym.includes('NVDA')) return 'NASDAQ:NVDA';
    if (sym.includes('SPY')) return 'AMEX:SPY';
    return `NSE:${sym}`;
  };

  const getTradingViewInterval = (tf: string): string => {
    if (tf === '1m') return '1';
    if (tf === '5m') return '5';
    if (tf === '15m') return '15';
    if (tf === '1h') return '60';
    if (tf === '1D') return 'D';
    return '15';
  };

  // Chart rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth || dimensions.width || 360;
    const height = container.clientHeight || dimensions.height || 460;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Layout dimensions
    const rightMargin = 75; // for price axis
    const bottomMargin = 26; // for time axis
    const subChartHeight = subChart === 'NONE' ? 0 : 110;
    const mainChartHeight = height - bottomMargin - subChartHeight;
    const chartWidth = width - rightMargin;

    // Background
    ctx.fillStyle = '#fffdfa'; // clean light cream white
    ctx.fillRect(0, 0, width, height);

    // Visible candle slice (maintain professional resolution like TradingView)
    const targetSlots = Math.max(45, Math.floor(chartWidth / 14));
    const visibleCount = Math.min(candles.length, targetSlots);
    const visibleCandles = candles.slice(-visibleCount);

    // Calculate Price Min/Max for main chart
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    if (activeSignal && activeSignal.symbol === symbolInfo.symbol) {
      if (activeSignal.stopLoss < minPrice) minPrice = activeSignal.stopLoss;
      if (activeSignal.targetPrice > maxPrice) maxPrice = activeSignal.targetPrice;
    }

    // Add 4% padding on price axis
    const pricePadding = (maxPrice - minPrice) * 0.05 || 1;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice || 1;

    // Helper to map Price -> Y coordinate
    const getY = (price: number) => {
      return mainChartHeight - ((price - minPrice) / priceRange) * (mainChartHeight - 20) - 10;
    };

    // Helper to map Index -> X coordinate
    // Ensure natural candle width (never monstrous rectangles even if few candles)
    const slotCount = Math.max(visibleCount, 40);
    const candleWidth = Math.min(18, Math.max(4, chartWidth / slotCount));
    const stepX = visibleCount < 40 ? candleWidth * 1.5 : chartWidth / visibleCount;
    const startX = visibleCount < 40 ? chartWidth - (visibleCount * stepX) : 0;
    const getX = (index: number) => startX + index * stepX + candleWidth / 2;

    // 1. Grid Lines (Horizontal Price)
    ctx.strokeStyle = '#fed7aa'; // light orange-200
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);

    const priceSteps = 6;
    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + (priceRange / priceSteps) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price label on right axis
      ctx.fillStyle = '#78716c'; // stone-500
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(p >= 1000 ? p.toFixed(1) : p.toFixed(2), chartWidth + 6, y + 3);
    }

    ctx.setLineDash([]); // Reset line dash

    // 2. Volume Bars in lower 20% of main chart
    const volHeightMax = mainChartHeight * 0.22;
    visibleCandles.forEach((c, idx) => {
      const x = getX(idx);
      const isUp = c.close >= c.open;
      const vHeight = maxVol > 0 ? (c.volume / maxVol) * volHeightMax : 0;
      const vY = mainChartHeight - vHeight;

      ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(x - candleWidth * 0.35, vY, candleWidth * 0.7, vHeight);
    });

    // 3. Technical Indicator Overlays
    const fullIndexOffset = candles.length - visibleCount;

    if (showBollinger) {
      const bb = calculateBollingerBands(candles, 20, 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.beginPath();
      // Draw upper band
      for (let i = 0; i < visibleCount; i++) {
        const fullIdx = fullIndexOffset + i;
        const val = bb.upper[fullIdx];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      // Draw lower band backwards for fill
      for (let i = visibleCount - 1; i >= 0; i--) {
        const fullIdx = fullIndexOffset + i;
        const val = bb.lower[fullIdx];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Lines
      const drawIndicatorLine = (data: (number | null)[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleCount; i++) {
          const val = data[fullIndexOffset + i];
          if (val !== null) {
            const x = getX(i);
            const y = getY(val);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      };
      drawIndicatorLine(bb.upper, 'rgba(56, 189, 248, 0.4)');
      drawIndicatorLine(bb.lower, 'rgba(56, 189, 248, 0.4)');
      drawIndicatorLine(bb.middle, 'rgba(56, 189, 248, 0.6)');
    }

    // EMA 9 (Yellow)
    if (showEMA9) {
      const ema9 = calculateEMA(candles, 9);
      ctx.strokeStyle = '#eab308'; // yellow-500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCount; i++) {
        const val = ema9[fullIndexOffset + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // EMA 21 (Cyan/Sky)
    if (showEMA21) {
      const ema21 = calculateEMA(candles, 21);
      ctx.strokeStyle = '#06b6d4'; // cyan-500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCount; i++) {
        const val = ema21[fullIndexOffset + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // SMA 50 (Purple)
    if (showSMA50) {
      const sma50 = calculateSMA(candles, 50);
      ctx.strokeStyle = '#a855f7'; // purple-500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCount; i++) {
        const val = sma50[fullIndexOffset + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // 4. Candlesticks (Bodies and Wicks) or Renko Bricks
    if (chartType === 'CANDLE') {
      visibleCandles.forEach((c, idx) => {
        const x = getX(idx);
        const isUp = c.close >= c.open;
        const color = isUp ? '#22c55e' : '#ef4444'; // green-500 : red-500

        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Candle Body
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(2, Math.abs(closeY - openY));
        const bodyWidth = Math.min(16, Math.max(3, candleWidth * 0.75));

        ctx.fillStyle = color;
        ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
      });
    } else {
      // Renko Bricks View
      const renkoBricks = generateRenkoBricks(candles);
      const visibleBricks = renkoBricks.slice(-visibleCount);
      const brickWidth = Math.max(4, candleWidth * 0.75);

      visibleBricks.forEach((b, idx) => {
        const x = getX(idx);
        const isUp = b.type === 'UP';
        const color = isUp ? '#10b981' : '#f43f5e';

        const topY = getY(Math.max(b.open, b.close));
        const botY = getY(Math.min(b.open, b.close));
        const brickH = Math.max(3, botY - topY);

        ctx.fillStyle = color;
        ctx.fillRect(x - brickWidth / 2, topY, brickWidth, brickH);
        ctx.strokeStyle = isUp ? '#059669' : '#e11d48';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - brickWidth / 2, topY, brickWidth, brickH);
      });
    }

    // 4b. SuperTrend Overlay
    if (showSupertrend) {
      const st = calculateSuperTrend(candles, 10, 3);
      for (let i = 1; i < visibleCount; i++) {
        const fullIdx = fullIndexOffset + i;
        const prevFullIdx = fullIdx - 1;
        const v = st.supertrend[fullIdx];
        const prevV = st.supertrend[prevFullIdx];
        const dir = st.direction[fullIdx];

        if (v !== null && prevV !== null) {
          const x1 = getX(i - 1);
          const y1 = getY(prevV);
          const x2 = getX(i);
          const y2 = getY(v);

          ctx.strokeStyle = dir === 'BULLISH' ? '#10b981' : '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Flip signal dot
          if (st.direction[prevFullIdx] !== dir) {
            ctx.fillStyle = dir === 'BULLISH' ? '#10b981' : '#f43f5e';
            ctx.beginPath();
            ctx.arc(x2, y2, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 4c. Classical Daily Pivot Points
    if (showPivots) {
      const pp = calculateDailyPivotPoints(candles);
      const drawPivotLine = (val: number, label: string, color: string) => {
        const y = getY(val);
        if (y >= 0 && y <= mainChartHeight) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(chartWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = color;
          ctx.font = 'bold 8.5px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${label} ${val.toFixed(1)}`, chartWidth + 4, y + 3);
        }
      };
      drawPivotLine(pp.r2, 'R2', '#34d399');
      drawPivotLine(pp.r1, 'R1', '#6ee7b7');
      drawPivotLine(pp.pivot, 'PP', '#fbbf24');
      drawPivotLine(pp.s1, 'S1', '#fca5a5');
      drawPivotLine(pp.s2, 'S2', '#f87171');
    }

    // 5. Active Signal Overlays (Entry, SL, Target lines)
    if (activeSignal && activeSignal.symbol === symbolInfo.symbol) {
      // Entry Line
      const entryY = getY(activeSignal.entryPrice);
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartWidth, entryY);
      ctx.stroke();

      // Entry badge
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(chartWidth + 2, entryY - 9, rightMargin - 4, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillText(`ENTRY ${activeSignal.entryPrice.toFixed(1)}`, chartWidth + 5, entryY + 3);

      // Stop Loss Line (Red)
      const slY = getY(activeSignal.stopLoss);
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, slY);
      ctx.lineTo(chartWidth, slY);
      ctx.stroke();

      // SL badge
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(chartWidth + 2, slY - 9, rightMargin - 4, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SL ${activeSignal.stopLoss.toFixed(1)}`, chartWidth + 5, slY + 3);

      // Target Profit Line (Green)
      const tpY = getY(activeSignal.targetPrice);
      ctx.strokeStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(0, tpY);
      ctx.lineTo(chartWidth, tpY);
      ctx.stroke();

      // TP badge
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(chartWidth + 2, tpY - 9, rightMargin - 4, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`TP ${activeSignal.targetPrice.toFixed(1)}`, chartWidth + 5, tpY + 3);

      ctx.setLineDash([]);
    }

    // 5.5. Active Watchdog Alerts Overlays (Amber Dash Lines)
    if (priceAlerts && priceAlerts.length > 0) {
      priceAlerts
        .filter((a) => a.symbol === symbolInfo.symbol && a.status === 'ACTIVE')
        .forEach((alert) => {
          const alertY = getY(alert.triggerPrice);
          if (alertY >= 0 && alertY <= mainChartHeight) {
            ctx.strokeStyle = '#f59e0b'; // amber-500
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(0, alertY);
            ctx.lineTo(chartWidth, alertY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Alert badge on axis
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(chartWidth + 2, alertY - 8, rightMargin - 4, 16);
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 8.5px Inter, sans-serif';
            ctx.fillText(`🔔 ₹${alert.triggerPrice.toFixed(1)}`, chartWidth + 4, alertY + 3);
          }
        });
    }

    // 6. Current Price Pulsing Line
    const lastCandle = visibleCandles[visibleCandles.length - 1];
    if (lastCandle) {
      const currentY = getY(lastCandle.close);
      const isUp = lastCandle.close >= lastCandle.open;
      const currentPriceColor = isUp ? '#22c55e' : '#ef4444';

      ctx.strokeStyle = currentPriceColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(chartWidth, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current Price pill on axis
      ctx.fillStyle = currentPriceColor;
      ctx.fillRect(chartWidth + 2, currentY - 10, rightMargin - 4, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(
        lastCandle.close >= 1000 ? lastCandle.close.toFixed(1) : lastCandle.close.toFixed(2),
        chartWidth + 6,
        currentY + 4
      );
    }

    // 7. Time Axis at Bottom of Main Chart
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mainChartHeight);
    ctx.lineTo(width, mainChartHeight);
    ctx.stroke();

    const timeStep = Math.max(5, Math.floor(visibleCount / 6));
    for (let i = 0; i < visibleCount; i += timeStep) {
      const c = visibleCandles[i];
      const x = getX(i);
      const date = new Date(c.time);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, mainChartHeight + 14);
    }

    // 8. Sub-chart (RSI or MACD)
    if (subChart === 'RSI') {
      const subTop = mainChartHeight + bottomMargin;
      const subH = subChartHeight - bottomMargin;

      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, subTop, width, subH);

      // Dividers
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(0, subTop, width, subH);

      // Overbought 70, Oversold 30 lines
      const rsiY = (val: number) => subTop + subH - (val / 100) * subH;

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, rsiY(70));
      ctx.lineTo(chartWidth, rsiY(70));
      ctx.stroke();

      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, rsiY(30));
      ctx.lineTo(chartWidth, rsiY(30));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#64748b';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('70', chartWidth + 6, rsiY(70) + 3);
      ctx.fillText('30', chartWidth + 6, rsiY(30) + 3);

      // RSI Line
      const rsiVals = calculateRSI(candles, 14);
      ctx.strokeStyle = '#a855f7'; // purple-500
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < visibleCount; i++) {
        const val = rsiVals[fullIndexOffset + i];
        if (val !== null) {
          const x = getX(i);
          const y = rsiY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();

      // Title
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      const lastRsi = rsiVals[rsiVals.length - 1];
      ctx.fillText(`RSI (14): ${lastRsi ? lastRsi.toFixed(1) : '--'}`, 10, subTop + 16);
    } else if (subChart === 'MACD') {
      const subTop = mainChartHeight + bottomMargin;
      const subH = subChartHeight - bottomMargin;

      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, subTop, width, subH);

      const macdData = calculateMACD(candles);
      const visibleHist = macdData.histogram.slice(-visibleCount);
      let maxHist = 0.01;
      visibleHist.forEach((v) => {
        if (v !== null && Math.abs(v) > maxHist) maxHist = Math.abs(v);
      });

      const macdY = (val: number) => subTop + subH / 2 - (val / (maxHist * 1.3)) * (subH / 2);

      // Zero line
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, subTop + subH / 2);
      ctx.lineTo(chartWidth, subTop + subH / 2);
      ctx.stroke();

      // Histogram
      visibleCandles.forEach((_, idx) => {
        const hVal = macdData.histogram[fullIndexOffset + idx];
        if (hVal !== null) {
          const x = getX(idx);
          const y = macdY(hVal);
          const zeroY = subTop + subH / 2;
          ctx.fillStyle = hVal >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
          ctx.fillRect(x - candleWidth * 0.3, Math.min(y, zeroY), candleWidth * 0.6, Math.abs(y - zeroY));
        }
      });

      // Title
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('MACD (12, 26, 9)', 10, subTop + 16);
    } else if (subChart === 'ADX') {
      const subTop = mainChartHeight + bottomMargin;
      const subH = subChartHeight - bottomMargin;

      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, subTop, width, subH);

      const adxData = calculateADX(candles, 14);
      const adxY = (val: number) => subTop + subH - (val / 75) * subH;

      // 25 Level line (Trend strength threshold)
      const y25 = adxY(25);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, y25);
      ctx.lineTo(chartWidth, y25);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 8.5px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('25 Strong', chartWidth + 4, y25 + 3);

      // Helper to draw lines
      const drawAdxLine = (arr: (number | null)[], color: string, lineWidth = 1.5) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleCount; i++) {
          const val = arr[fullIndexOffset + i];
          if (val !== null) {
            const x = getX(i);
            const y = adxY(Math.min(75, Math.max(0, val)));
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      };

      drawAdxLine(adxData.plusDI, '#10b981', 1.2); // Green +DI
      drawAdxLine(adxData.minusDI, '#f43f5e', 1.2); // Red -DI
      drawAdxLine(adxData.adx, '#fbbf24', 2.2); // Gold ADX

      // Title & Reading
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      const lastAdx = adxData.adx[adxData.adx.length - 1];
      const isStrong = (lastAdx || 0) >= 25;
      ctx.fillText(
        `ADX (14): ${lastAdx ? lastAdx.toFixed(1) : '--'} [${isStrong ? 'TRENDING' : 'CHOPPY/RANGE'}]  Gold: ADX | Green: +DI | Red: -DI`,
        10,
        subTop + 16
      );
    }

    // 9. Interactive Crosshair and Hover
    if (crosshairPos && crosshairPos.x < chartWidth && crosshairPos.y < height) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshairPos.x, 0);
      ctx.lineTo(crosshairPos.x, height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, crosshairPos.y);
      ctx.lineTo(chartWidth, crosshairPos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [
    candles,
    symbolInfo,
    activeSignal,
    timeframe,
    showEMA9,
    showEMA21,
    showSMA50,
    showBollinger,
    showSupertrend,
    showPivots,
    chartType,
    subChart,
    crosshairPos,
    dimensions.width,
    dimensions.height,
  ]);

  // Handle Mouse and Touch Hover
  const updateCrosshairAndHover = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setCrosshairPos({ x, y });

    const rightMargin = 75;
    const chartWidth = canvas.clientWidth - rightMargin;
    if (x >= 0 && x < chartWidth && candles.length > 0) {
      const visibleCount = Math.min(candles.length, Math.max(30, Math.floor(chartWidth / 9)));
      const visibleCandles = candles.slice(-visibleCount);
      const candleWidth = chartWidth / visibleCount;
      const idx = Math.floor(x / candleWidth);
      if (idx >= 0 && idx < visibleCandles.length) {
        setHoveredCandle(visibleCandles[idx]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    updateCrosshairAndHover(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      updateCrosshairAndHover(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseLeave = () => {
    setCrosshairPos(null);
    setHoveredCandle(null);
  };

  const handleTouchEnd = () => {
    setCrosshairPos(null);
    setHoveredCandle(null);
  };

  const displayCandle = hoveredCandle || candles[candles.length - 1];

  return (
    <div
      id="tradingview-chart-container"
      ref={containerRef}
      className="relative flex flex-col h-full w-full bg-white border border-orange-200/90 rounded-2xl overflow-hidden shadow-xl shadow-orange-500/5"
    >
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-[#fffbf5] border-b border-orange-200 gap-2 z-10 backdrop-blur-md">
        {/* Symbol Dropdown & Asset details */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              id="symbol-select-dropdown"
              onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-orange-50 border border-orange-200 rounded-xl text-sm font-bold text-stone-900 transition-all shadow-xs cursor-pointer"
            >
              <span>{symbolInfo.symbol}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 font-mono font-bold">
                {symbolInfo.exchange}
              </span>
              <ChevronDown className="w-4 h-4 text-stone-500" />
            </button>

            {symbolDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border-2 border-orange-200 rounded-2xl shadow-2xl py-2 z-50 max-h-80 overflow-y-auto">
                <div className="px-3 py-1 text-xs font-bold text-orange-950 uppercase tracking-wider">
                  Select Instrument / Index
                </div>
                {allSymbols.map((item) => (
                  <button
                    key={item.symbol}
                    id={`symbol-item-${item.symbol.replace(/\s+/g, '')}`}
                    onClick={() => {
                      onSymbolSelect(item);
                      setSymbolDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-orange-50 transition-colors cursor-pointer ${
                      item.symbol === symbolInfo.symbol ? 'bg-orange-100/70 text-orange-950 font-bold' : 'text-stone-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-stone-900">{item.symbol}</div>
                      <div className="text-[10px] text-stone-500">{item.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-stone-900 font-bold">₹{item.lastPrice.toLocaleString()}</div>
                      <div
                        className={`text-[10px] flex items-center justify-end font-bold ${
                          item.change24h >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {item.change24h >= 0 ? '+' : ''}
                        {item.changePercent24h}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Real-time Price Ticker */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-black font-mono text-stone-900 tracking-tight">
              ₹{symbolInfo.lastPrice.toLocaleString()}
            </span>
            <span
              className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                symbolInfo.change24h >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {symbolInfo.change24h >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-1" />
              )}
              {symbolInfo.change24h >= 0 ? '+' : ''}
              {symbolInfo.change24h} ({symbolInfo.changePercent24h}%)
            </span>

            {/* Real-time Data Source Badge */}
            {!isSymbolMarketOpen(symbolInfo) ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-100 border border-stone-300 text-stone-700 text-[10px] font-bold" title="Exchange Closed: Real market wakes at 09:15 AM IST. Price locked at today's closing LTP.">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Market Closed
              </span>
            ) : upstoxConnected ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                Upstox Live
              </span>
            ) : dhanConnected ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Dhan Live
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                NSE Live
              </span>
            )}

            {/* Inline Quick Dhan / Live Exchange Match Pill */}
            <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-full pl-2 pr-1 py-0.5 shadow-2xs">
              <span className="text-[10px] text-stone-600 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline">Dhan:</span>
              </span>
              <input
                type="number"
                step="0.05"
                value={quickDhanPrice}
                onChange={(e) => setQuickDhanPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickDhanMatch();
                }}
                placeholder="23228.01"
                className="w-20 bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
                title="Enter live price from your Dhan app to match terminal 100%"
              />
              <button
                type="button"
                onClick={handleQuickDhanMatch}
                className="px-2 py-0.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-bold shadow-2xs cursor-pointer transition-colors"
                title="Apply exact Dhan App market tick instantly"
              >
                Match
              </button>
              {onOpenPriceCalibrator && (
                <button
                  type="button"
                  id="sync-dhan-price-btn"
                  onClick={onOpenPriceCalibrator}
                  className="p-1 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Open Advanced Live Sync Modal"
                >
                  <Zap className="w-3.5 h-3.5 text-orange-500 fill-current" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* OHLCV Live HUD */}
        {displayCandle && (
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-stone-600">
            <span>
              O: <strong className="text-stone-900">{displayCandle.open}</strong>
            </span>
            <span>
              H: <strong className="text-emerald-600">{displayCandle.high}</strong>
            </span>
            <span>
              L: <strong className="text-rose-600">{displayCandle.low}</strong>
            </span>
            <span>
              C: <strong className="text-stone-900">{displayCandle.close}</strong>
            </span>
            <span>
              Vol: <strong className="text-orange-600">{displayCandle.volume.toLocaleString()}</strong>
            </span>
          </div>
        )}

        {/* Controls: Timeframes & Indicators */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar max-w-full">
          {/* Chart Engine Switcher: Live TradingView vs AI Quant Bracket */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0">
            <button
              id="chart-mode-tv-live"
              onClick={() => setViewMode('TRADINGVIEW_LIVE')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-[11px] rounded-md font-bold transition-all cursor-pointer ${
                viewMode === 'TRADINGVIEW_LIVE'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Official Real-Time TradingView Chart"
            >
              <BarChart2 className="w-3 h-3" />
              <span>TV Live</span>
            </button>
            <button
              id="chart-mode-quant-canvas"
              onClick={() => setViewMode('QUANT_CANVAS')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-[11px] rounded-md font-bold transition-all cursor-pointer ${
                viewMode === 'QUANT_CANVAS'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="AI Quant Bracket Chart with SuperTrend & Pivots"
            >
              <Activity className="w-3 h-3" />
              <span>AI Quant Overlay</span>
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0">
            {['1m', '5m', '15m', '1h', '1D'].map((tf) => (
              <button
                key={tf}
                id={`tf-btn-${tf}`}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Style: Candle vs Renko */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0">
            <button
              onClick={() => setChartType('CANDLE')}
              className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-md font-bold transition-all cursor-pointer ${
                chartType === 'CANDLE'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Standard Japanese Candlesticks"
            >
              Candles
            </button>
            <button
              onClick={() => setChartType('RENKO')}
              className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-md font-bold transition-all cursor-pointer ${
                chartType === 'RENKO'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Renko Bricks (Filters Market Noise)"
            >
              Renko
            </button>
          </div>

          {/* Indicator toggles */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-orange-200 shrink-0 shadow-xs">
            <button
              onClick={() => setShowSupertrend(!showSupertrend)}
              className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-lg font-mono font-bold transition-all cursor-pointer ${
                showSupertrend
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Supertrend (10, 3) Trend Follower"
            >
              ST 📈
            </button>
            <button
              onClick={() => setShowPivots(!showPivots)}
              className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-lg font-mono font-bold transition-all cursor-pointer ${
                showPivots
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Classical Intraday Pivot Points (P, R1, R2, S1, S2)"
            >
              Pivots
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-lg font-mono hidden sm:inline font-bold ${
                showBollinger ? 'bg-orange-100 text-orange-800 border border-orange-300' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Bollinger Bands (20,2)"
            >
              BB
            </button>
            <button
              onClick={() =>
                setSubChart(
                  subChart === 'RSI'
                    ? 'MACD'
                    : subChart === 'MACD'
                    ? 'ADX'
                    : subChart === 'ADX'
                    ? 'NONE'
                    : 'RSI'
                )
              }
              className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-lg font-mono font-bold transition-all cursor-pointer ${
                subChart !== 'NONE'
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Cycle Sub-Charts: RSI -> MACD -> ADX -> None"
            >
              {subChart === 'NONE' ? '+ Osc' : subChart}
            </button>
          </div>

          {/* Quick Watchdog Trigger */}
          {onOpenAlertsWatchdog && (
            <button
              id="chart-alerts-watchdog-btn"
              onClick={onOpenAlertsWatchdog}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-orange-50 text-stone-700 border border-orange-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
              title="Manage Watchdog Alerts for this instrument"
            >
              <Bell className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Watchdog</span>
              {priceAlerts.filter((a) => a.symbol === symbolInfo.symbol && a.status === 'ACTIVE').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-orange-500 text-white text-[9px] font-black">
                  {priceAlerts.filter((a) => a.symbol === symbolInfo.symbol && a.status === 'ACTIVE').length}
                </span>
              )}
            </button>
          )}

          {onOpenAutoTradeModal && (
            <button
              id="chart-auto-trade-btn"
              onClick={onOpenAutoTradeModal}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl text-[11px] sm:text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
              title="Place Auto-Trade Bracket Order with Entry, Stop-Loss and Target"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Auto-Trade Bracket</span>
              <span className="sm:hidden">Auto</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile OHLC Bar */}
      {displayCandle && (
        <div className="flex lg:hidden items-center justify-between px-3 py-1 bg-orange-50/70 border-b border-orange-200 text-[10px] font-mono text-stone-600 overflow-x-auto no-scrollbar shrink-0">
          <span>O: <strong className="text-stone-900">{displayCandle.open}</strong></span>
          <span>H: <strong className="text-emerald-600">{displayCandle.high}</strong></span>
          <span>L: <strong className="text-rose-600">{displayCandle.low}</strong></span>
          <span>C: <strong className="text-stone-900">{displayCandle.close}</strong></span>
          <span>Vol: <strong className="text-orange-600">{displayCandle.volume.toLocaleString()}</strong></span>
        </div>
      )}

      {/* Main Chart Body */}
      {viewMode === 'TRADINGVIEW_LIVE' ? (
        <div className="relative flex-1 w-full h-full bg-[#fffbf5] overflow-hidden">
          <TradingViewWidgetEmbed
            key={`${symbolInfo.symbol}-${timeframe}`}
            symbol={symbolInfo.symbol}
            timeframe={timeframe}
          />

          {/* Floating Active Trade Pill in Live TV mode */}
          {activeSignal && activeSignal.symbol === symbolInfo.symbol && (
            <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2 bg-white/95 border-2 border-orange-400 rounded-2xl px-3.5 py-2 backdrop-blur-md shadow-2xl text-xs text-stone-800">
              <span
                className={`font-black px-2 py-0.5 rounded-lg text-[11px] ${
                  activeSignal.action === 'BUY'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                AI {activeSignal.action}
              </span>
              <div className="text-stone-700 font-mono text-[11px] font-semibold">
                Entry: <strong className="text-stone-950">₹{activeSignal.entryPrice}</strong> | SL: <strong className="text-rose-600">₹{activeSignal.stopLoss}</strong> | TP: <strong className="text-emerald-600">₹{activeSignal.targetPrice}</strong>
              </div>
              {onOpenAutoTradeModal && (
                <button
                  onClick={onOpenAutoTradeModal}
                  className="ml-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[10px] font-black shadow-sm cursor-pointer"
                >
                  Auto-Execute
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative flex-1 w-full overflow-hidden cursor-crosshair bg-[#fffdfa]">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchMove}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="absolute inset-0 w-full h-full touch-none"
          />

          {/* Floating Active Trade Pill if signal exists */}
          {activeSignal && activeSignal.symbol === symbolInfo.symbol && (
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-white/95 border-2 border-orange-400 rounded-2xl px-3.5 py-2 backdrop-blur-md shadow-xl text-xs text-stone-800">
              <span
                className={`font-black px-2 py-0.5 rounded-lg text-[11px] ${
                  activeSignal.action === 'BUY'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                AI {activeSignal.action}
              </span>
              <div className="text-stone-700 font-mono font-semibold">
                Entry: <strong className="text-stone-950">₹{activeSignal.entryPrice}</strong> | SL: <strong className="text-rose-600">₹{activeSignal.stopLoss}</strong> | TP: <strong className="text-emerald-600">₹{activeSignal.targetPrice}</strong>
              </div>
              <span className="text-[10px] text-orange-700 font-bold border-l border-orange-200 pl-2">
                R:R 1:{activeSignal.riskRewardRatio}
              </span>
              {onOpenAutoTradeModal && (
                <button
                  onClick={onOpenAutoTradeModal}
                  className="ml-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-[10px] font-black shadow-sm cursor-pointer"
                >
                  Auto-Execute Setup
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
