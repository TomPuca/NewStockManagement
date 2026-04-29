import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import './PortfolioSummary.css';

const PortfolioSummary = ({ realtimePrices = {} }) => {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "stocks"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const stocksData = [];
      querySnapshot.forEach((doc) => {
        stocksData.push({ id: doc.id, ...doc.data() });
      });
      setStocks(stocksData);
    });
    return () => unsubscribe();
  }, []);

  const activeStocks = stocks.filter(s => s.status === 'M');

  const stats = activeStocks.reduce((acc, stock) => {
    const livePrice = realtimePrices[stock.stockCode];
    const currentPrice = livePrice || 0;
    
    const invested = stock.price * 1000 * stock.quantity;
    const profit = currentPrice > 0
      ? (currentPrice * 1000 - stock.price * 1000) * stock.quantity
        - (stock.price + currentPrice) * stock.quantity * 2
        - currentPrice * stock.quantity
      : 0;
    
    return {
      totalInvested: acc.totalInvested + invested,
      totalProfit: acc.totalProfit + profit
    };
  }, { totalInvested: 0, totalProfit: 0 });

  const totalRatio = stats.totalInvested > 0 
    ? (stats.totalProfit / stats.totalInvested) * 100 
    : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US').format(Math.round(amount));
  };

  return (
    <div className="portfolio-summary-card">
      <div className="summary-header">
        <span className="summary-label">OVERALL PORTFOLIO</span>
      </div>
      
      <div className="summary-grid">
        <div className="summary-box">
          <span className="box-label">Invested</span>
          <span className="box-value">{formatCurrency(stats.totalInvested)}</span>
        </div>
        
        <div className="summary-box">
          <span className="box-label">P/L</span>
          <span className={`box-value ${stats.totalProfit >= 0 ? 'profit' : 'loss'}`}>
            {stats.totalProfit > 0 ? '+' : ''}{formatCurrency(stats.totalProfit)}
          </span>
        </div>
        
        <div className="summary-box">
          <span className="box-label">Return</span>
          <span className={`box-value ${stats.totalProfit >= 0 ? 'profit' : 'loss'}`}>
            {stats.totalProfit >= 0 ? '+' : ''}{totalRatio.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
