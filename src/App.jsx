import React from 'react'
import StockForm from './components/StockForm'
import StockList from './components/StockList'
import './App.css'

function App() {
  return (
    <div className="main-wrapper">
      <header className="app-header">
        <h1 className="main-title">Stock Management System</h1>
        <p className="main-subtitle">Track and manage your investment portfolio efficiently</p>
      </header>
      
      <main className="app-content">
        <StockForm />
        <StockList />
      </main>
      
      <footer className="app-footer">
        © 2026 Stock Portal • Premium Investment Tools
      </footer>
    </div>
  )
}

export default App
