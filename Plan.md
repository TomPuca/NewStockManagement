# Stock Management System - Complete Plan

A premium React + Firebase stock portfolio management application with responsive design.

---

## Project Structure

```
src/
├── firebase.js                      # Firebase/Firestore initialization
├── hooks/
│   └── useDeviceType.js             # Custom hook: Mobile / Tablet / PC detection
├── components/
│   ├── StockForm.jsx / .css         # Stock entry form (add new stock)
│   ├── StockList.jsx / .css         # Active & Sold portfolio tables
│   ├── SellModal.jsx / .css         # Sell confirmation popup
│   ├── IncomeManager.jsx / .css     # Yearly income tracker & charts
│   └── SocketTest.jsx               # WebSocket Realtime connection tester
├── App.jsx / App.css                # Main layout with Header Tabs & Footer
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
| Column       | Description                              |
|------------- |------------------------------------------|
| Code         | Stock code (highlighted purple)          |
| Quantity     | Current quantity held                    |
| Buy Price    | Original purchase price                  |
| Market Price | Editable input for current market price  |
| Profit/Loss  | Calculated with fees/taxes: `(market - buy) * qty * 1000 - (buy + market) * qty * 2 - market * qty` |
| Change (%)   | Custom formula based on net profit over total investment |
| Action       | "Sell" button to open sell popup         |

### 3. Sell History Table (`StockList.jsx` - Status 'B')
| Column       | Description                              |
|------------- |------------------------------------------|
| Code         | Stock code                               |
| Quantity     | Quantity sold                            |
| Buy Price    | Original purchase price                  |
| Sell Price   | Actual selling price                     |
| Profit/Loss  | Calculated with fees/taxes: `(sell - buy) * qty * 1000 - (buy + sell) * qty * 2 - sell * qty` |
| Change (%)   | Custom formula based on net profit over total investment |

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

### 7. App Navigation (Tabs)
- The main layout includes dynamic Tab Navigation to switch between **📉 Stocks** and **💰 Income** without page reloads, maintaining state.

### 8. Income Tracker (`IncomeManager.jsx`)
- Complete income registration and visualization module.
- **Summary Header**: Displays total income for the current year, average monthly salary (Strictly calculated as `Total Income / 12`), and year-over-year profit difference (compared to last year's total).
- **Entry Form**: Input valid date and exact income amount to save to Firestore.
- **Visualizations**: 
  - A dynamic Bar Chart using the `recharts` library to render total accumulated income per month.
  - A 12-month summary grid table displaying figures for each month.
  - A history list sorting all individual income transactions by exact dates.

### 9. Real-time VPS WebSocket Integration (`SocketTest.jsx`)
- A discrete component that initializes a `socket.io-client` connection to the VPS live data feeds (`https://bgdatafeed.vps.com.vn/`).
- Registers specific stock symbols (e.g., `CEO`, `CTG`) via `regs` channel to monitor.
- Automatically receives real-time match blocks (`stock`) and board updates (`board`), logging them explicitly in the browser DevTools Console for verification with colorized formats.

---

## Design System

| Token            | Value                                            |
|------------------|--------------------------------------------------|
| Typography       | Inter (body) + Outfit (headings) via Google Fonts |
| Background       | Radial gradient: #1e1b4b to #0f172a              |
| Glass Effect     | backdrop-filter: blur(12px) + subtle borders      |
| Profit Color     | #4ade80 (green)                                   |
| Loss Color       | #f87171 (red)                                     |
| Accent Color     | #818cf8 (indigo)                                  |
| Animations       | slideUp (form), scaleUp (modal), fadeIn (status)  |

---

## Firestore Data Model

**Collection: `stocks`**

| Field          | Type      | Description                                    |
|----------------|-----------|------------------------------------------------|
| stockCode      | string    | Stock ticker symbol (e.g. VCB)                 |
| price          | number    | Purchase price (float)                         |
| quantity       | number    | Number of shares                               |
| purchaseDate   | timestamp | Date when stock was bought                     |
| sellingPrice   | number    | Selling price (0 until sold)                   |
| sellingDate    | timestamp | Date when stock was sold (null until sold)     |
| status         | string    | 'M' = Active (Buy), 'B' = Sold                |

**Collection: `incomes`**

| Field          | Type      | Description                                    |
|----------------|-----------|------------------------------------------------|
| date           | string    | Date of income (YYYY-MM-DD string format)      |
| amount         | number    | Amount received (Float)                        |
| timestamp      | timestamp | Server timestamp for chronological sorting     |

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

- [ ] Update Firebase credentials in `src/firebase.js` with real project keys
- [ ] Create GitHub repo and push code
- [ ] Enable GitHub Pages deployment (Settings > Pages > GitHub Actions)
- [ ] Optional: Add real-time market price API integration
- [ ] Optional: Add authentication for multi-user support
- [ ] Optional: Add date range filters for sell history
