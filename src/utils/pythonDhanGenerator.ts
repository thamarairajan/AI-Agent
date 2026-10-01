import { DhanOrderPayload, TradeSignal } from '../types/trading';

export function generateDhanPythonScript(signal: TradeSignal, clientId = 'DHAN_CLIENT_1001'): string {
  const transactionType = signal.action === 'BUY' ? 'dhan.BUY' : 'dhan.SELL';
  const orderType = 'dhan.MARKET';
  const productType = 'dhan.INTRA';
  const segment = signal.symbol.includes('NIFTY') ? 'dhan.FNO' : 'dhan.NSE';

  return `"""
AI Algorithmic Trading Agent: ${signal.strategyName}
Symbol: ${signal.symbol} | Action: ${signal.action}
Target: ₹${signal.targetPrice} | Stop-Loss: ₹${signal.stopLoss} (R:R 1:${signal.riskRewardRatio})
Target Broker: DhanHQ Python SDK (v2.0)
"""

import time
import datetime
import pandas as pd
import numpy as np
from dhanhq import dhanhq

# 1. Initialize Dhan Client
CLIENT_ID = "${clientId}"
ACCESS_TOKEN = "YOUR_DHAN_ACCESS_TOKEN_JWT"

dhan = dhanhq(CLIENT_ID, ACCESS_TOKEN)

# 2. Risk Management Rules
MAX_CAPITAL_PER_TRADE = 50000  # In INR
RISK_PERCENT = 1.5             # 1.5% max account risk
SECURITY_ID = "${signal.dhanOrderPayload.securityId}"
SYMBOL = "${signal.symbol}"

def calculate_position_size(entry_price, stop_loss):
    risk_per_share = abs(entry_price - stop_loss)
    if risk_per_share == 0:
        return 1
    qty = int((MAX_CAPITAL_PER_TRADE * (RISK_PERCENT / 100)) / risk_per_share)
    return max(1, qty)

def get_live_market_data(security_id):
    """Fetch 15-minute OHLCV candles from Dhan API"""
    data = dhan.historical_minute_charts(
        symbol=SYMBOL,
        exchange_segment="NSE_EQ",
        instrument_type="EQUITY",
        expiry_code=0,
        from_date=(datetime.date.today() - datetime.timedelta(days=5)).strftime("%Y-%m-%d"),
        to_date=datetime.date.today().strftime("%Y-%m-%d")
    )
    df = pd.DataFrame(data.get('data', []))
    return df

def execute_dhan_order(action, qty, entry_price, sl_price, target_price):
    """
    Places Bracket / Intraday Order on Dhan API
    Endpoint: https://api.dhan.co/v2/orders
    """
    print(f"[*] Placing {action} order for {qty} shares of {SYMBOL}...")
    
    order_payload = {
        "dhanClientId": CLIENT_ID,
        "correlationId": f"ai_bot_{int(time.time())}",
        "transactionType": "${signal.action}",
        "exchangeSegment": "${signal.dhanOrderPayload.exchangeSegment}",
        "productType": "${signal.dhanOrderPayload.productType}",
        "orderType": "MARKET",
        "validity": "DAY",
        "securityId": SECURITY_ID,
        "quantity": qty,
        "price": 0,
        "triggerPrice": 0,
        "afterMarketOrder": False
    }
    
    try:
        response = dhan.place_order(
            tag="AI_AGENT",
            transaction_type=${transactionType},
            exchange_segment=${segment},
            product_type=${productType},
            order_type=${orderType},
            validity='DAY',
            security_id=SECURITY_ID,
            quantity=qty,
            price=0,
            trigger_price=0
        )
        print("[+] Order Placed Successfully:", response)
        
        # Place Stop-Loss Order
        sl_order = dhan.place_order(
            tag="AI_AGENT_SL",
            transaction_type=dhan.SELL if action == "BUY" else dhan.BUY,
            exchange_segment=${segment},
            product_type=${productType},
            order_type=dhan.SL_M,
            validity='DAY',
            security_id=SECURITY_ID,
            quantity=qty,
            price=0,
            trigger_price=sl_price
        )
        print(f"[+] Stop-loss armed at ₹{sl_price}:", sl_order)
        return response
    except Exception as e:
        print("[-] Order execution failed:", str(e))
        return None

if __name__ == "__main__":
    current_price = ${signal.entryPrice}
    target = ${signal.targetPrice}
    stop_loss = ${signal.stopLoss}
    quantity = ${signal.dhanOrderPayload.quantity || 25}
    
    print(f"=== AI Trading Bot Triggered: {SYMBOL} ===")
    print(f"Action: {signal.action} @ ₹{current_price} | SL: ₹{stop_loss} | Target: ₹{target}")
    print(f"Signal Strategy: ${signal.strategyName}")
    
    # Trigger execution
    execute_dhan_order("${signal.action}", quantity, current_price, stop_loss, target)
`;
}

export function buildDefaultDhanPayload(
  symbol: string,
  securityId: string,
  action: 'BUY' | 'SELL',
  currentPrice: number,
  quantity = 1
): DhanOrderPayload {
  const isIndex = symbol.includes('NIFTY') || symbol.includes('BANKNIFTY');
  return {
    transactionType: action,
    exchangeSegment: isIndex ? 'NSE_FNO' : 'NSE_EQ',
    productType: 'INTRADAY',
    orderType: 'MARKET',
    validity: 'DAY',
    securityId: securityId || '13',
    quantity: quantity,
    price: 0,
    triggerPrice: 0,
    afterMarketOrder: false,
  };
}
