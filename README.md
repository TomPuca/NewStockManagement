# Stock Management System

A premium real-time stock portfolio management dashboard built with React + Firebase.

🌐 **Live Demo**: [tompuca.github.io/NewStockManagement](https://tompuca.github.io/NewStockManagement/)

---

## Features

### 📈 Stocks Dashboard
- **Real-time Price Board** — Live VPS WebSocket feed with 4-column bid/ask display
  - **Live Min/Max Tracking** — Dynamically updates session high/low bounds from real-time trade matches
  - **Drag-and-drop reordering** — Hold the symbol name to drag cards up/down
  - **Up/Down buttons** — Hover to reveal arrow controls for precise reordering
  - Order persisted in `localStorage`
- **VN-Index Chart** — 1-minute resolution area chart with reference & live price markers
- **Portfolio Summary** — Real-time invested capital, P/L and return rate widget
- **Gold Price Tracker** — Live Phú Quý 999.9 buy/sell prices via Cloudflare Worker
- **Active Holdings Table** — Auto-synced market prices, profit/loss with live badge
- **Partial Sell Support** — Sell any portion of holdings via confirmation modal
- **Stock History Popup** — Multi-timeframe (1W/1M/3M/1Y) candlestick-area chart
- **Profit Calculator** — Quick net profit & return rate estimator
- **Growth Stocks (Invest)** — Monthly high-growth stock explorer by exchange floor
  - **Company Name Tooltip** — Hover any symbol to see the full company name (via Firestore `companyName`, rendered with React Portal for correct positioning)

### 💰 Income Tracker
- Yearly income registration with bar chart visualization
- Year-over-year comparison and average monthly salary calculation

### 🎬 Cartoon Tracker
- Track anime/cartoon viewing progress synced to Firestore
- Drag to reorder, update watched episodes inline
- Auto-suggestions for shows nearly caught up (< 3 episodes behind)

### 🔔 Telegram Alerts
- Per-stock profit threshold alerts sent via Telegram Bot
- Anti-spam deduplication — one alert per breakout event

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + Vite |
| Styling | Vanilla CSS (Glassmorphism dark theme) |
| Database | Firebase Firestore |
| Real-time | VPS WebSocket (socket.io-client) |
| Charts | Recharts |
| Gold Data | Cloudflare Worker scraping Phú Quy Group |
| Deployment | GitHub Pages via GitHub Actions |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (with CORS proxy for gold price)
npm run dev

# Build for production
npm run build
```

---

## Project Structure

```
src/
├── firebase.js                      # Firebase/Firestore initialization
├── hooks/
│   ├── useDeviceType.js             # Mobile / Tablet / PC detection
│   └── useTelegramAlert.js          # Profit monitoring & notifications
├── services/
│   └── telegramService.js           # Telegram Bot API
├── components/
│   ├── Realtime.jsx / .css          # Real-time Price Board with drag-and-drop
│   ├── StockList.jsx / .css         # Active & Sold portfolio tables
│   ├── StockForm.jsx / .css         # Stock entry form
│   ├── SellModal.jsx / .css         # Sell confirmation popup
│   ├── ProfitCalculator.jsx / .css  # Margin estimator
│   ├── IncomeManager.jsx / .css     # Yearly income tracker
│   ├── CartoonManager.jsx / .css    # Anime tracking dashboard
│   ├── VnIndexChart.jsx / .css      # VN-Index trend widget
│   ├── PortfolioSummary.jsx / .css  # Account health summary
│   ├── GoldPriceCard.jsx / .css     # Live gold price widget
│   └── StockChartPopup.jsx / .css   # Historical chart popup
├── App.jsx / App.css                # Main layout & global state
└── index.css                        # Global design system (dark theme)
```

---

## Deployment

Deployed automatically to GitHub Pages on every push to `main` via GitHub Actions.

See `.github/workflows/deploy.yml` for the workflow configuration.
