const BOT_TOKEN = "7804030450:AAHTS8ODqePuvQTM43tEKnSZRXNyo7yLCfI";
const CHAT_ID = "5420629538";

/**
 * Sends a formatted message to a Telegram channel/user.
 * @param {string} message - Markdown formatted string
 */
export const sendTelegramMessage = async (message) => {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.description);
    }
    return data;
  } catch (error) {
    console.error("Telegram Notification Error:", error);
    return null;
  }
};

/**
 * Formats a stock profit alert message.
 */
export const formatProfitAlert = (symbol, profit, price, profitAmount) => {
  const emoji = profit >= 5 ? "🚀" : "📈";
  const formattedProfit = profitAmount.toLocaleString('en-US');
  
  return `${emoji} *STOCK PROFIT ALERT* \n\n` +
         `📦 Symbol: *${symbol}*\n` +
         `💹 Price: *${price}*\n` +
         `🔥 Profit: *+${profit.toFixed(2)}%*\n` +
         `💰 Net P/L: *+${formattedProfit} VNĐ*\n\n` +
         `_Sent from Stock Management System_`;
};
