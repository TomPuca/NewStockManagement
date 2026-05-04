import React, { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import StockForm from './components/StockForm'
import ProfitCalculator from './components/ProfitCalculator'
import StockList from './components/StockList'
import Realtime from './components/Realtime'
import IncomeManager from './components/IncomeManager'
import VnIndexChart from './components/VnIndexChart'
import PortfolioSummary from './components/PortfolioSummary'
import GoldPriceCard from './components/GoldPriceCard'
import CartoonManager from './components/CartoonManager'
import StockChartPopup from './components/StockChartPopup'
import { migrateCartoonData } from './temp/migrateCartoons'
import { useTelegramAlert } from './hooks/useTelegramAlert'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('stocks');
  const [selectedChart, setSelectedChart] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [stocks, setStocks] = useState([]);

  // Fetch stocks at App level for global features (like Telegram Alerts)
  useEffect(() => {
    // Run migration only once if collection is empty
    migrateCartoonData();

    const q = query(collection(db, "stocks"), orderBy("purchaseDate", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const stocksData = [];
      querySnapshot.forEach((doc) => {
        stocksData.push({ id: doc.id, ...doc.data() });
      });
      setStocks(stocksData);
    });
    return () => unsubscribe();
  }, []);

  // Monitor stocks and notify via Telegram
  useTelegramAlert(stocks, livePrices, 5.0);

  const handleCloseChart = () => setSelectedChart(null);
  
  const handlePriceUpdate = (symbol, price) => {
    setLivePrices(prev => ({ ...prev, [symbol]: price }));
  };

  return (
    <div className="main-wrapper">
      <header className="app-header">
        <div className="header-container">
          <div>
            <h1 className="main-title premium-title">Stock Management System</h1>
            <p className="main-subtitle">Track and manage your investment portfolio efficiently</p>
          </div>
          
          <div className="tab-menu">
            <button 
              className={`tab-btn ${activeTab === 'stocks' ? 'active' : ''}`}
              onClick={() => setActiveTab('stocks')}
            >
              📈 Stocks
            </button>
            <button 
              className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
              onClick={() => setActiveTab('income')}
            >
              💰 Income
            </button>
            <button 
              className={`tab-btn ${activeTab === 'cartoon' ? 'active' : ''}`}
              onClick={() => setActiveTab('cartoon')}
            >
              🎬 Cartoon
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-content">
        {activeTab === 'stocks' ? (
          <div className="stocks-dashboard-layout">
            <div className="stocks-left-panel">
              <Realtime 
                onSymbolClick={(symbol) => setSelectedChart({ symbol })} 
                onPriceUpdate={handlePriceUpdate}
              />
            </div>
            <div className="stocks-right-panel">
              <div className="index-summary-row">
                <VnIndexChart />
                <div className="summary-widgets-column">
                  <PortfolioSummary stocks={stocks} realtimePrices={livePrices} />
                  <GoldPriceCard />
                </div>
              </div>
              <div className="forms-wrapper">
                <StockForm />
                <ProfitCalculator />
              </div>
              <StockList stocks={stocks} realtimePrices={livePrices} />
            </div>
          </div>
        ) : activeTab === 'income' ? (
          <IncomeManager />
        ) : (
          <CartoonManager />
        )}
      </main>
      
      <footer className="app-footer">
        © 2026 Stock Portal • Premium Investment Tools
      </footer>
      
      {selectedChart && (
        <StockChartPopup 
          symbol={selectedChart.symbol} 
          onClose={handleCloseChart} 
        />
      )}
    </div>
  )
}

export default App
