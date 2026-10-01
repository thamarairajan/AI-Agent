import React, { useMemo, memo } from 'react';
import { ExternalLink } from 'lucide-react';

interface TradingViewWidgetEmbedProps {
  symbol: string;
  timeframe: string;
}

export const TradingViewWidgetEmbed: React.FC<TradingViewWidgetEmbedProps> = memo(({
  symbol,
  timeframe,
}) => {
  // Map instrument symbols to official TradingView ticker codes
  const getTradingViewSymbol = (sym: string): string => {
    const s = sym.toUpperCase();
    if (s.includes('NEXT 50') || s.includes('NIFTY NEXT 50') || s.includes('NIFTYJR')) return 'NSE:NIFTYJR';
    if (s.includes('NIFTY 50') || s === 'NIFTY') return 'NSE:NIFTY';
    if (s.includes('SENSEX')) return 'BSE:SENSEX';
    if (s.includes('BANKNIFTY') || s.includes('BANK NIFTY')) return 'NSE:BANKNIFTY';
    if (s.includes('RELIANCE')) return 'NSE:RELIANCE';
    if (s.includes('TATAMOTORS') || s.includes('TATA MOTORS')) return 'NSE:TATAMOTORS';
    if (s.includes('HDFCBANK') || s.includes('HDFC BANK')) return 'NSE:HDFCBANK';
    if (s.includes('INFY') || s.includes('INFOSYS')) return 'NSE:INFY';
    if (s.includes('TCS')) return 'NSE:TCS';
    if (s.includes('BTC')) return 'BINANCE:BTCUSDT';
    if (s.includes('NVDA')) return 'NASDAQ:NVDA';
    if (s.includes('SPY')) return 'AMEX:SPY';
    return `NSE:${sym}`;
  };

  const getTradingViewInterval = (tf: string): string => {
    switch (tf) {
      case '1m':
        return '1';
      case '5m':
        return '5';
      case '15m':
        return '15';
      case '1h':
        return '60';
      case '1D':
        return 'D';
      default:
        return '1';
    }
  };

  const tvSymbol = getTradingViewSymbol(symbol);
  const tvInterval = getTradingViewInterval(timeframe);

  // Build the sandboxed iframe URL directly for TradingView Advanced Chart widget
  const iframeSrc = useMemo(() => {
    const config = {
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: 'Asia/Kolkata',
      theme: 'light',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    };
    return `https://www.tradingview-widget.com/embed-widget/advanced-chart/?locale=en#${encodeURIComponent(
      JSON.stringify(config)
    )}`;
  }, [tvSymbol, tvInterval]);

  return (
    <div className="relative w-full h-full bg-[#fffdfa] flex flex-col overflow-hidden">
      {/* TradingView Top Direct Quick Link Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-100/90 border-b border-stone-200 text-xs text-stone-600 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            TradingView Live Feed
          </span>
          <span className="text-[11px] font-mono text-stone-600 bg-stone-200/80 px-1.5 py-0.5 rounded font-medium">
            Symbol: {tvSymbol} | Interval: {timeframe}
          </span>
        </div>
        <a
          href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-[11px] font-semibold transition-all hover:text-orange-600 shadow-2xs"
          title="Open this instrument directly on TradingView"
        >
          <span>Open Full TV</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Official Advanced Chart Clean Iframe (Isolated Sandbox) */}
      <div className="flex-1 w-full relative">
        <iframe
          key={`${tvSymbol}-${tvInterval}`}
          src={iframeSrc}
          title={`TradingView Chart ${tvSymbol}`}
          className="w-full h-full border-0"
          allow="transparency; fullscreen"
          loading="lazy"
        />
      </div>
    </div>
  );
});
