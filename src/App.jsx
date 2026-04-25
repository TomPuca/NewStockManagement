import React, { useState } from 'react'
import StockForm from './components/StockForm'
import ProfitCalculator from './components/ProfitCalculator'
import StockList from './components/StockList'
import Realtime from './components/Realtime'
import IncomeManager from './components/IncomeManager'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('stocks');

  return (
    <div className="main-wrapper">
      <header className="app-header">
        <div className="header-container">
          <div>
            <h1 className="main-title">Stock Management System</h1>
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
          </div>
        </div>
      </header>
      
      <main className="app-content">
        {activeTab === 'stocks' ? (
          <div className="stocks-dashboard-layout">
            <div className="stocks-left-panel">
              <Realtime />
            </div>
            <div className="stocks-right-panel">
              <div className="forms-wrapper">
                <StockForm />
                <ProfitCalculator />
              </div>
              <StockList />
            </div>
          </div>
        ) : (
          <IncomeManager />
        )}
      </main>
      
      <footer className="app-footer">
        © 2026 Stock Portal • Premium Investment Tools
      </footer>
    </div>
  )
}

export default App
