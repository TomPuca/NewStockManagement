import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { TrendingUp, DollarSign, Layers, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react';
import './StockForm.css';

const StockForm = () => {
  const [stockCode, setStockCode] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  // Handle stock code change (uppercase)
  const handleStockCodeChange = (e) => {
    setStockCode(e.target.value.toUpperCase());
  };

  // Handle price change: only float characters allowed, block others
  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Allow only digits and a single dot
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  // Handle quantity change: only integers, auto-format with commas
  const handleQuantityChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || /^\d*$/.test(rawValue)) {
      // Format with commas
      const formatted = rawValue === '' ? '' : Number(rawValue).toLocaleString('en-US');
      setQuantity(formatted);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stockCode || !price || !quantity) {
      setStatus({ 
        loading: false, 
        message: 'Please fill in all fields!', 
        type: 'error' 
      });
      return;
    }

    setStatus({ loading: true, message: 'Saving...', type: '' });

    try {
      const stockData = {
        stockCode,
        price: parseFloat(price),
        quantity: parseInt(quantity.replace(/,/g, '')),
        purchaseDate: serverTimestamp(),
        sellingPrice: 0,
        sellingDate: null,
        status: 'M'
      };

      await addDoc(collection(db, "stocks"), stockData);

      setStatus({ 
        loading: false, 
        message: 'Stock saved successfully!', 
        type: 'success' 
      });
      
      // Reset form
      setStockCode('');
      setPrice('');
      setQuantity('');

      // Clear message after 3 seconds
      setTimeout(() => setStatus({ loading: false, message: '', type: '' }), 3000);

    } catch (error) {
      console.error("Error adding document: ", error);
      setStatus({ 
        loading: false, 
        message: 'Error saving data. Please try again.', 
        type: 'error' 
      });
    }
  };

  return (
    <div className="stock-form-container">
      <h2 className="form-title premium-title">Stock Portal</h2>
      <p className="form-subtitle">Enter your stock transaction details</p>
      
      <form style={{ width: '310px' }} onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="input-label">Stock Code</label>
          <div className="input-wrapper">
            <TrendingUp size={20} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. VCB, FPT, HPG..."
              value={stockCode}
              onChange={handleStockCodeChange}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Buy Price</label>
          <div className="input-wrapper">
            <DollarSign size={20} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="0.00"
              value={price}
              onChange={handlePriceChange}
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Total Quantity</label>
          <div className="input-wrapper">
            <Layers size={20} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="0"
              value={quantity}
              onChange={handleQuantityChange}
              inputMode="numeric"
            />
          </div>
        </div>

        <button type="submit" className="add-button" disabled={status.loading}>
          {status.loading ? (
            'Processing...'
          ) : (
            <>
              <PlusCircle size={20} />
              Add Stock
            </>
          )}
        </button>

        {status.message && (
          <div className={`status-message status-${status.type}`}>
            {status.type === 'success' ? <CheckCircle size={16} inline /> : <AlertCircle size={16} inline />}
            <span style={{ marginLeft: '8px' }}>{status.message}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default StockForm;
