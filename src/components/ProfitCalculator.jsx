import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp } from 'lucide-react';
import './ProfitCalculator.css';

const ProfitCalculator = () => {
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  const calculateProfit = () => {
    if (!buyPrice || !sellPrice) return null;
    
    const b = parseFloat(buyPrice);
    const s = parseFloat(sellPrice);
    const amount = 1000; // Expected symbolic volume
    
    if (isNaN(b) || isNaN(s)) return null;

    // Fixed formula matched with StockList:
    const netProfit = (s * 1000 - b * 1000) * amount - (b + s) * amount * 2 - s * amount;
    const initialInvestment = b * 1000 * amount;
    const changePercentage = (netProfit / initialInvestment) * 100;

    return { netProfit, changePercentage };
  };

  const result = calculateProfit();
  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';

  return (
    <div className="profit-calculator-container">
      <div className="calculator-header">
        <h2 className="form-title">
          <Calculator size={32} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
          Estimator
        </h2>
        <p className="form-subtitle">Calculate projected margins instantly</p>
      </div>

      <div className="calc-form">
        <div className="input-group">
          <label className="input-label">Buy Price</label>
          <div className="input-wrapper">
            <DollarSign size={20} />
            <input 
              type="number" 
              className="form-input"
              placeholder="Ex: 70.5" 
              value={buyPrice} 
              onChange={e => setBuyPrice(e.target.value)} 
              step="0.1"
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Expected Sell Price</label>
          <div className="input-wrapper">
            <TrendingUp size={20} />
            <input 
              type="number" 
              className="form-input"
              placeholder="Ex: 75" 
              value={sellPrice} 
              onChange={e => setSellPrice(e.target.value)} 
              step="0.1"
            />
          </div>
        </div>
      </div>

      <div className="calc-result">
        <div className="result-row">
          <span className="result-label">Est. Profit:</span>
          {result ? (
            <span className={`result-value ${result.netProfit >= 0 ? 'status-success' : 'status-error'}`}>
              {result.netProfit > 0 ? '+' : ''}{formatCurrency(result.netProfit)}
            </span>
          ) : (
            <span className="result-value-empty">--</span>
          )}
        </div>
        <div className="result-row">
          <span className="result-label">Return Rate:</span>
          {result ? (
            <span className={`result-value ${result.changePercentage >= 0 ? 'status-success' : 'status-error'}`}>
              {result.changePercentage > 0 ? '+' : ''}{result.changePercentage.toFixed(2)}%
            </span>
          ) : (
            <span className="result-value-empty">--</span>
          )}
        </div>
      </div>
      <div className="calc-note">
        * Calculation implicitly assumes a standard trade volume of <strong>1,000 shares</strong>.
      </div>
    </div>
  );
};

export default ProfitCalculator;
