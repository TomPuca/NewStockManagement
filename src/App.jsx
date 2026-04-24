import React, { useState } from 'react'
import StockForm from './components/StockForm'
import StockList from './components/StockList'
import SocketTest from './components/SocketTest'
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
          <>
            <StockForm />
            <StockList />
          </>
        ) : (
          <IncomeManager />
        )}
      </main>
      
      <footer className="app-footer">
        © 2026 Stock Portal • Premium Investment Tools
      </footer>
      <SocketTest />
    </div>
  )
}

export default App
