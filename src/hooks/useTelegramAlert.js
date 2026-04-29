import { useState, useEffect, useRef } from 'react';
import { sendTelegramMessage, formatProfitAlert } from '../services/telegramService';

/**
 * Hook to monitor stock profits and send notifications if thresholds are met.
 */
export const useTelegramAlert = (stocks, livePrices, threshold = 5.0) => {
  // Track stocks that have already sent a notification to avoid spamming
  // Format: { symbol: lastNotifiedProfitRange }
  const notifiedStocks = useRef(new Set());

  useEffect(() => {
    if (!stocks || stocks.length === 0) return;

    stocks.forEach(stock => {
      // Only monitor active stocks
      if (stock.status !== 'M') return;

      const livePrice = livePrices[stock.stockCode];
      if (!livePrice) return;

      // Calculate profit (using same logic as StockList)
      const currentPrice = livePrice;
      const profitAmount = (currentPrice * 1000 - stock.price * 1000) * stock.quantity
        - (stock.price + currentPrice) * stock.quantity * 2
        - currentPrice * stock.quantity;
      
      const profitRatio = (profitAmount / (stock.price * 1000 * stock.quantity)) * 100;

      const notificationKey = `${stock.id}_${stock.stockCode}`;

      if (profitRatio >= threshold) {
        if (!notifiedStocks.current.has(notificationKey)) {
          // Trigger Notification
          const message = formatProfitAlert(stock.stockCode, profitRatio, livePrice, Math.round(profitAmount));
          sendTelegramMessage(message);
          
          // Mark as notified
          notifiedStocks.current.add(notificationKey);
          console.log(`Telegram Alert sent for ${stock.stockCode}: ${profitRatio.toFixed(2)}%`);
        }
      } else {
        // Reset if it drops below threshold - allows re-notifying if it goes back up later
        if (notifiedStocks.current.has(notificationKey)) {
          notifiedStocks.current.delete(notificationKey);
        }
      }
    });
  }, [stocks, livePrices, threshold]);
};
