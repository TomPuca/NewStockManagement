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
│   └── SellModal.jsx / .css         # Sell confirmation popup
├── App.jsx / App.css                # Main layout with header & footer
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
| Profit/Loss  | Calculated: `(market - buy) x quantity`  |
| Change (%)   | Percentage change vs buy price           |
| Action       | "Sell" button to open sell popup         |

### 3. Sell History Table (`StockList.jsx` - Status 'B')
| Column       | Description                              |
|------------- |------------------------------------------|
| Code         | Stock code                               |
| Quantity     | Quantity sold                            |
| Buy Price    | Original purchase price                  |
| Sell Price   | Actual selling price                     |
| Profit/Loss  | `(sell - buy) x quantity`                |
| Change (%)   | Percentage profit/loss                   |

### 4. Sell Modal with Partial Sell (`SellModal.jsx`)
- Triggered by clicking "Sell" on any active stock
- Displays stock info: Code, Buy Price, Available Quantity
- Two validated inputs: **Sell Quantity** and **Sell Price**
- Validation: sell quantity must not exceed available holdings
- **Partial sell logic**:
  - `sellQty < totalQty` -> Creates new 'B' record for sold portion + updates original 'M' record with remaining quantity
  - `sellQty == totalQty` -> Updates original record to status 'B' directly

### 5. Responsive Design (`useDeviceType.js` hook)
- Custom hook detects device via `window.innerWidth`:
  - `< 768px` -> **Mobile**: Hides "Quantity" and "Profit/Loss" columns; compact padding
  - `768-1024px` -> **Tablet**: Standard layout
  - `> 1024px` -> **PC**: Full layout with all columns
- All components have dedicated `@media` breakpoints
- Sell modal buttons stack vertically on screens `< 480px`

### 6. Internationalization
- All UI text is in **English**
- Number formatting uses `en-US` locale

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
