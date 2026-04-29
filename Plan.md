# Stock Management System - Complete Plan

A premium React + Firebase stock portfolio management application with responsive design.

---

## Project Structure

```
src/
├── firebase.js                      # Firebase/Firestore initialization
├── hooks/
│   ├── useDeviceType.js             # Custom hook: Mobile / Tablet / PC detection
│   └── useTelegramAlert.js          # Monitoring logic for profit notifications
├── services/
│   └── telegramService.js           # Telegram Bot API communication
├── components/
│   ├── StockForm.jsx / .css         # Stock entry form (add new stock)
│   ├── StockList.jsx / .css         # Active & Sold portfolio tables
│   ├── SellModal.jsx / .css         # Sell confirmation popup
│   ├── ProfitCalculator.jsx / .css  # Quick margin/profit estimator
│   ├── IncomeManager.jsx / .css     # Yearly income tracker & charts
│   ├── Realtime.jsx / .css          # Professional 4-column Realtime Price Board
│   ├── VnIndexChart.jsx / .css      # Compact market trend widget
│   ├── PortfolioSummary.jsx / .css  # Real-time account health summary
│   ├── GoldPriceCard.jsx / .css     # Real-time gold price tracker (Worker-based)
│   └── StockChartPopup.jsx / .css   # Multi-timeframe historical popup
├── App.jsx / App.css                # Main layout & Global Price State
└── index.css                        # Global design system (dark theme)
```

---

## Features

### 1. Stock Entry Form (`StockForm.jsx`)

- **Stock Code**: Auto-converts input to uppercase
- **Buy Price**: Float-only input, blocks all non-numeric characters via regex
- **Total Quantity**: Integer-only with auto thousand-separator formatting (e.g. `1,000,000`)
- **Add Stock** button saves to Firestore with:
  - `purchaseDate`: Server timestamp (date of entry)
  - `status`: `'M'` (Mua/Buy)
  - `sellingPrice`: `0` (updated when sold)
  - `sellingDate`: `null` (updated when sold)

### 2. Active Holdings Table (`StockList.jsx` - Status 'M')

| Column       | Description                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------- |
| Code         | Stock code (highlighted purple)                                                                     |
| Quantity     | Current quantity held                                                                               |
| Buy Price    | Original purchase price                                                                             |
| Market Price | Editable input for current market price                                                             |
| Profit/Loss  | Calculated with fees/taxes: `(market - buy) * qty * 1000 - (buy + market) * qty * 2 - market * qty` |
| Change (%)   | Custom formula based on net profit over total investment                                            |
| Action       | "Sell" button to open sell popup                                                                    |

### 3. Sell History Table (`StockList.jsx` - Status 'B')

| Column      | Description                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| Code        | Stock code                                                                                    |
| Quantity    | Quantity sold                                                                                 |
| Buy Price   | Original purchase price                                                                       |
| Sell Price  | Actual selling price                                                                          |
| Profit/Loss | Calculated with fees/taxes: `(sell - buy) * qty * 1000 - (buy + sell) * qty * 2 - sell * qty` |
| Change (%)  | Custom formula based on net profit over total investment                                      |

**Advance Features**:

- "Advance" toggle checkbox displays an "Action" column with a Delete button (Trash icon)
- Clicking Delete triggers a `window.confirm` dialog and then deletes the document from Firestore.
- Success is confirmed via a Toast Notification fixed at the bottom right that disappears after 3 seconds.

### 4. Sell Modal with Partial Sell (`SellModal.jsx`)

- Triggered by clicking "Sell" on any active stock
- Displays stock info: Code, Buy Price, Available Quantity
- Two validated inputs: **Sell Quantity** and **Sell Price**
- **UX Improvements**:
  - Auto-fills **Sell Quantity** with the maximum available holdings by default.
  - Auto-focuses on the **Sell Price** input immediately upon opening.
- Validation: sell quantity must not exceed available holdings
- **Partial sell logic**:
  - `sellQty < totalQty` -> Creates new 'B' record for sold portion + updates original 'M' record with remaining quantity
  - `sellQty == totalQty` -> Updates original record to status 'B' directly

### 13. Advanced Portfolio Analytics (`StockList.jsx`)

- **Real-time Market Price Synchronization**:
  - Implemented a unified data flow where socket matches received in `Realtime.jsx` are emitted to the global `App` state.
  - `StockList.jsx` consumes these `livePrices` to automatically overwrite manual inputs for active symbols.
  - **Auto-P/L Calculation**: Profit/Loss and Change (%) metrics update instantly as market ticks occur, without requiring page refreshes or manual price entry.
- **Visual Feedback**:
  - Symbols with active real-time data feature a **Live Price Badge** with a soft pulse animation (`pulse-border`) to distinguish authoritative market data from manual estimations.
- **Transaction Logic**:
  - Supports partial sells (creating new 'B' status records) and full liquidations.
  - Integrated "Advance" mode for secure deletion of historical records.
  - `sellQty == totalQty` -> Updates original record to status 'B' directly

### 5. Responsive Design (`useDeviceType.js` hook)

- Custom hook detects device via `window.innerWidth`:
  - `< 768px` -> **Mobile**: Stacked layout, hides "Quantity" and "Profit/Loss" columns; compact padding.
  - `768-1024px` -> **Tablet**: Stacked layout with standard padding.
  - `> 1024px` -> **PC**: Side-by-side row layout (Form on the left, Tables on the right).
- All components have dedicated `@media` breakpoints.
- Sell modal buttons stack vertically on screens `< 480px`.

### 6. Internationalization

- All UI text is in **English**
- Number formatting uses `en-US` locale

### 7. App Navigation & Portfolio Architecture

- Main layout includes Tab Navigation to switch between **📉 Stocks** and **💰 Income**.
- **Centralized Data Flow**: Portfolio data is fetched at the root (`App.jsx`) and passed down to sub-components (`StockList`, `PortfolioSummary`). This architecture enables global monitoring services like Telegram alerts to operate independently of the active view.
- **Stocks Dashboard**: Split into a fixed Left Panel (Realtime Board) and dynamic Right Panel (Index, Summary, Forms, Tables).

### 8. Profit Estimator (`ProfitCalculator.jsx`)

- Placed horizontally adjacent to `StockForm`.
- Includes inputs for **Buy Price** and **Expected Sell Price** with fast 0.1 increment arrows.
- Live-calculates **Net Profit (VNĐ)** and **Return Rate (%)**.
- All calculations inherently assume a standardized block of 1,000 shares for simplified margin checking.

### 9. Income Tracker (`IncomeManager.jsx`)

- Complete income registration and visualization module.
- **Yearly Filtering**: Dynamic top filter tabs (e.g. 2024, 2025...) instantly isolates chart data, history items, and summarized values to specific fiscal years.
- **Summary Header**: Displays total income for the selected year, average monthly salary (`Total Income / 12`), and year-over-year profit difference.
- **Visualizations**:
  - Dynamic `recharts` Bar Chart generating unique rich colors for each respective month column, overlaid with a distinct Average Salary `ReferenceLine`.
  - A 12-month summary grid table tracking aggregated figures.
  - History list logging exact receipt dates/amounts.

### 10. Real-time VPS Price Board (`Realtime.jsx`)

- Comprehensive replacement of initial socket tests, functioning as a complete trading board.
- Initializes with REST fetch data (`getliststockdata`) tracking a customizable `localStorage` saved watchlist (e.g., FPT, CEO).
- Real-time event updates via socket.io-client binding directly to UI state updates.
- **Advanced Side-Mapping Logic**: Intelligent handling of socket payloads where `g1-g3` variables are remapped to `g4-g6` (Ask side) when the update `side` is 'S'.
- **Interactive Stock History Popup**:
  - Clicking a stock symbol triggers a global callback (`onSymbolClick`) to open the **StockChartPopup** at the App level.
  - Fetches daily history from VNDirect (`dchart-api`).
  - **Multi-Timeframe Analysis**: Users can pivot between 1 Year, 3 Months, 1 Month, and 1 Week views.
  - **Dynamic Recalculation**: Key metrics (Year-Low, Year-High, and current ratios) update instantly to reflect the selected time horizon.
  - Displays high-fidelity Area Chart with **advanced header stats**: Current Price (inline with symbol), historical extremes, and growth/drawdown percentages.
  - Implemented as a **Global Modal** with `z-index: 9999` and center-screen positioning for maximum visibility.

### 11. Market Overview Chart (`VnIndexChart.jsx`)

- **Dual API Source Strategy**:
  - Uses `PLOT_LINE` (VPS) for real-time header stats (Index, Change, Reference).
  - Uses `CHART_DATA` (VPS/TradingView) for 1-minute historical resolution.
- **Improved Indicator Logic**:
  - Sign (+/-) and Color (Green/Red) are calculated by comparing current `idx` vs `ref` price, ensuring 100% accuracy Regardless of API string formatting.
- **High-Fidelity Visual Markers**:
  - **Reference Line**: Displays a yellow dashed line at the opening index level with a centered numeric label.
    centered numeric label, allowing instant comparison between NOW and REF values.
- **Fixed Trading Timeline**: Displays a constant horizontal axis representing full trading hours (09:00-11:30 and 13:00-14:46).

### 12. Global Portfolio Widget (`PortfolioSummary.jsx`)

- **Top-Level Visibility**: Positioned adjacent to `VnIndexChart` for instant account health checks.
- **Metric Suite**: Displays **Invested Capital**, **Total P/L**, and **Return Rate %**.
- **Real-time Sync**: Bound to the same global `livePrices` state as the main board, reflecting market fluctuations instantly.
- **Slim Profile**: Designed as a horizontal data strip to occupy minimal vertical space.

### 12. Telegram Notification System (`useTelegramAlert.js`)

- **Automated Alerts**: Monitors active holdings in real-time. Sends a message when any stock's profit exceeds a predefined threshold (default: **+5.0%**).
- **Service Integration**: Communicates with the Telegram Bot API via a dedicated `telegramService` module.
- **Deduplication Logic**: Uses a session-based cache (`notifiedStocks`) to ensure only one message is sent per "breakout" event, preventing repetitive spam during market fluctuations.
- **Reset Mechanism**: If a stock falls back below the threshold, its notification state is reset, allowing for future alerts if it rallies again.

### 14. Real-time Gold Price Tracker (`GoldPriceCard.jsx`)

- **Specialized Data Source**: Fetches real-time prices for **Nhẫn tròn Phú Quý 999.9** via a custom Cloudflare Worker (`gold.hung1504.workers.dev`).
- **Smart Scraping Logic**: Parses pre-processed JSON data from the worker, matching exact product names to ensure authoritative pricing.
- **Architecture**:
  - **Local Development**: Uses Vite's built-in proxy server to bypass CORS restrictions.
  - **Production (GitHub Pages)**: Employs a serverless worker strategy to ensure stable connectivity without needing a dedicated backend.
- **UI Integration**:
  - Positioned as a stacked widget below the Portfolio Summary.
  - Balanced vertical height using `flex: 1` to perfectly split the right-panel header space.
  - Features a luxury gold-accented design consistent with the overall glassmorphism theme.

### 13. Design System & Aesthetics

- **Core Theme**: Premium Dark Glassmorphism with `backdrop-filter: blur(12px)`.
- **Global Layers**: Managed `z-index` hierarchy ensuring charts and modals always appear above utility forms and static elements.
- **Premium Typography**:
  - **Rainbow Titles (`.premium-title`)**: A unified utility class for high-impact headers (e.g., Stock Portal, Income Manager) using a high-end three-color gradient.
  - Responsive font scaling for mobile sessions, ensuring complex financial labels (like Total Income) wrap gracefully on small screens.
- **Color Palette**:
  - Green/Cyan: Bullish/Ceiling
  - Red/Purple: Bearish/Floor
  - Yellow: Reference/Unchanged
- **Unified Components**:
  - `Active Holdings` & `Sold History` utilize the same gradient header style (`#818cf8` to `#c084fc`) and consistent table layouts as the `StockForm` portal.
  - Interactive elements (buttons, inputs) feature subtle glow effects and smooth transitions.

---

## Design System

| Token        | Value                                             |
| ------------ | ------------------------------------------------- |
| Typography   | Inter (body) + Outfit (headings) via Google Fonts |
| Background   | Radial gradient: #1e1b4b to #0f172a               |
| Glass Effect | backdrop-filter: blur(12px) + subtle borders      |
| Profit Color | #4ade80 (green)                                   |
| Loss Color   | #f87171 (red)                                     |
| Accent Color | #818cf8 (indigo)                                  |
| Animations   | slideUp (form), scaleUp (modal), fadeIn (status)  |

---

## Firestore Data Model

**Collection: `stocks`**

| Field        | Type      | Description                                |
| ------------ | --------- | ------------------------------------------ |
| stockCode    | string    | Stock ticker symbol (e.g. VCB)             |
| price        | number    | Purchase price (float)                     |
| quantity     | number    | Number of shares                           |
| purchaseDate | timestamp | Date when stock was bought                 |
| sellingPrice | number    | Selling price (0 until sold)               |
| sellingDate  | timestamp | Date when stock was sold (null until sold) |
| status       | string    | 'M' = Active (Buy), 'B' = Sold             |

**Collection: `incomes`**

| Field     | Type      | Description                                |
| --------- | --------- | ------------------------------------------ |
| date      | string    | Date of income (YYYY-MM-DD string format)  |
| amount    | number    | Amount received (Float)                    |
| timestamp | timestamp | Server timestamp for chronological sorting |

---

## Deployment

### GitHub Pages (via GitHub Actions)

Workflow file: `.github/workflows/deploy.yml`

**Automatic deployment on every push to `main`:**

1. Checkout code
2. Install dependencies (npm ci)
3. Build production bundle (npm run build)
4. Upload dist/ to GitHub Pages

### Setup Steps:

1. Create repo `NewStockManagement` on GitHub (Public)
2. Push code: `git push -u origin main`
3. Go to **Settings > Pages > Source** > Select **GitHub Actions**
4. The workflow auto-deploys on each push

### Vite Config:

- `base: './'` configured in `vite.config.js` for correct asset paths on GitHub Pages

---

## How to Run Locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## TODO / Next Steps

- [x] Update Firebase credentials in `src/firebase.js` with real project keys
- [x] Create GitHub repo and push code
- [x] Enable GitHub Pages deployment (Settings > Pages > GitHub Actions)
- [x] Add real-time market price API integration
- [x] Integrate Telegram Bot alerts for target profits
- [x] Add real-time gold price tracker (Phu Quy 999.9)
- [ ] Optional: Add authentication for multi-user support
- [ ] Optional: Add date range filters for sell history
