import React, { useState, useEffect } from 'react'
import { db, auth } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
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
import Invest from './components/Invest'
import Login from './components/Login'
import ThreeDManager from './components/3DManager'
import EInkManager from './components/EInkManager'
import { useTelegramAlert } from './hooks/useTelegramAlert'
import './App.css'

const ALLOWED_EMAIL = 'hung1504@gmail.com';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stocks');
  const [selectedChart, setSelectedChart] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [stocks, setStocks] = useState([]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email === ALLOWED_EMAIL) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch stocks at App level for global features (like Telegram Alerts)
  useEffect(() => {
    if (!user) return; // Don't fetch if not authenticated
    const q = query(collection(db, "stocks"), orderBy("purchaseDate", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const stocksData = [];
      querySnapshot.forEach((doc) => {
        stocksData.push({ id: doc.id, ...doc.data() });
      });
      setStocks(stocksData);
    });
    return () => unsubscribe();
  }, [user]);

  // Monitor stocks and notify via Telegram
  useTelegramAlert(stocks, livePrices, 5.0);

  const handleCloseChart = () => setSelectedChart(null);
  
  const handlePriceUpdate = (symbol, price) => {
    setLivePrices(prev => ({ ...prev, [symbol]: price }));
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  // --- Render States ---

  // 1. Auth is still initializing — show full-page loading spinner
  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  // 2. Not authenticated — show login screen
  if (!user) {
    return <Login />;
  }

  // 3. Authenticated & authorized — show the full app
  return (
    <div className="main-wrapper">
      <header className="app-header">
        <div className="header-container">
          <div className="header-top-row">
            <div className="header-branding">
              <h1 className="main-title premium-title">Stock Management System</h1>
              <p className="main-subtitle">Track and manage your investment portfolio efficiently</p>
            </div>
            
            {/* User profile & sign-out */}
            <div className="header-user">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User avatar'}
                  className="header-avatar"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="header-display-name">
                {user.displayName || user.email}
              </span>
              <button
                id="sign-out-btn"
                className="header-signout-btn"
                onClick={handleSignOut}
                title="Sign Out"
              >
                ↩ Sign Out
              </button>
            </div>
          </div>
          
          <div className="header-bottom-row">
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
              <button 
                className={`tab-btn ${activeTab === 'gold' ? 'active' : ''}`}
                onClick={() => setActiveTab('gold')}
              >
                📐 3D Print
              </button>
              <button 
                className={`tab-btn ${activeTab === 'invest' ? 'active' : ''}`}
                onClick={() => setActiveTab('invest')}
              >
                🚀 Invest
              </button>
              <button 
                className={`tab-btn ${activeTab === 'eink' ? 'active' : ''}`}
                onClick={() => setActiveTab('eink')}
              >
                📟 E-Ink
              </button>
            </div>
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
        ) : activeTab === 'cartoon' ? (
          <CartoonManager />
        ) : activeTab === 'gold' ? (
          <ThreeDManager />
        ) : activeTab === 'invest' ? (
          <Invest />
        ) : (
          <EInkManager />
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

