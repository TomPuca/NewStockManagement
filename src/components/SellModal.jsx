import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Layers } from 'lucide-react';
import './SellModal.css';

const SellModal = ({ stock, onConfirm, onCancel }) => {
  const [sellQty, setSellQty] = useState(stock.quantity ? stock.quantity.toString() : '');
  const [sellPrice, setSellPrice] = useState('');
  const [error, setError] = useState('');
  const sellPriceRef = useRef(null);

  useEffect(() => {
    if (sellPriceRef.current) {
      sellPriceRef.current.focus();
    }
  }, []);

  const handleQtyChange = (e) => {
    const val = e.target.value.replace(/,/g, '');
    if (val === '' || /^\d*$/.test(val)) {
      setSellQty(val);
      setError('');
    }
  };

  const handlePriceChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setSellPrice(val);
      setError('');
    }
  };

  const handleConfirm = () => {
    const qty = parseInt(sellQty);
    const price = parseFloat(sellPrice);

    if (!qty || qty <= 0) {
      setError('Please enter a valid quantity!');
      return;
    }
    if (qty > stock.quantity) {
      setError(`Sell quantity cannot exceed ${stock.quantity}!`);
      return;
    }
    if (!price || price <= 0) {
      setError('Please enter a valid sell price!');
      return;
    }

    onConfirm(qty, price);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Sell Stock</h3>
          <p className="form-subtitle">Confirm your sell transaction details</p>
        </div>

        <div className="modal-info">
          <div className="info-item">
            <span className="info-label">Stock Code:</span>
            <span className="info-value" style={{ color: '#818cf8' }}>{stock.stockCode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Buy Price:</span>
            <span className="info-value">{new Intl.NumberFormat('en-US').format(stock.price)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Available Qty:</span>
            <span className="info-value">{stock.quantity.toLocaleString()}</span>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Sell Quantity</label>
          <div className="input-wrapper">
            <Layers size={18} />
            <input 
              type="text" 
              className="form-input" 
              placeholder={`Max: ${stock.quantity}`}
              value={sellQty}
              onChange={handleQtyChange}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Sell Price</label>
          <div className="input-wrapper">
            <DollarSign size={18} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="0.00"
              value={sellPrice}
              onChange={handlePriceChange}
              ref={sellPriceRef}
            />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button className="modal-btn btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="modal-btn btn-ok" onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default SellModal;
