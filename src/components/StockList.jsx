import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { History, ShoppingBag } from 'lucide-react';
import SellModal from './SellModal';
import useDeviceType from '../hooks/useDeviceType';
import './StockList.css';

const StockList = () => {
  const [stocks, setStocks] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [sellingStock, setSellingStock] = useState(null);
  const { isMobile } = useDeviceType();

  useEffect(() => {
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

  const handleMarketPriceChange = (id, value) => {
    setMarketPrices(prev => ({ ...prev, [id]: value }));
  };

  const executeSell = async (quantityToSell, sellingPrice) => {
    if (!sellingStock) return;

    try {
      const stockRef = doc(db, "stocks", sellingStock.id);
      const isPartialSell = quantityToSell < sellingStock.quantity;

      if (isPartialSell) {
        // 1. Create new record for the sold portion (Status B)
        await addDoc(collection(db, "stocks"), {
          stockCode: sellingStock.stockCode,
          price: sellingStock.price,
          quantity: quantityToSell,
          purchaseDate: sellingStock.purchaseDate, // Keep original purchase date
          sellingPrice: sellingPrice,
          sellingDate: serverTimestamp(),
          status: 'B'
        });

        // 2. Update existing record with remaining quantity (Status M)
        await updateDoc(stockRef, {
          quantity: sellingStock.quantity - quantityToSell
        });
      } else {
        // Full sell: Just update the existing record
        await updateDoc(stockRef, {
          status: 'B',
          sellingPrice: sellingPrice,
          sellingDate: serverTimestamp(),
          quantity: quantityToSell // Just in case, though it should be the same
        });
      }

      setSellingStock(null);
    } catch (error) {
      console.error("Error executing sell: ", error);
      alert("Error executing sell transaction.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const activeStocks = stocks.filter(s => s.status === 'M');
  const soldStocks = stocks.filter(s => s.status === 'B');

  return (
    <div className="stock-list-wrapper">
      {/* Active Stocks Section */}
      <div className="list-section">
        <div className="section-header">
          <h3 className="section-title">
            <ShoppingBag size={24} color="#818cf8" />
            Active Holdings
          </h3>
          <span className="badge badge-active">{activeStocks.length} Mã</span>
        </div>
        
        <div className="table-container">
          {activeStocks.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  {!isMobile && <th>Quantity</th>}
                  <th>Buy Price</th>
                  <th>Market Price</th>
                  {!isMobile && <th>Profit/Loss</th>}
                  <th>Change (%)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeStocks.map(stock => {
                  const currentPrice = parseFloat(marketPrices[stock.id]) || 0;
                  const profitLoss = currentPrice > 0
                    ? (currentPrice * 1000 - stock.price * 1000) * stock.quantity
                      - (stock.price + currentPrice) * stock.quantity * 2
                      - currentPrice * stock.quantity
                    : 0;
                  const profitRatio = currentPrice > 0 ? (profitLoss / (stock.price * 1000 * stock.quantity)) * 100 : 0;
                  
                  return (
                    <tr key={stock.id}>
                      <td className="stock-code-cell">{stock.stockCode}</td>
                      {!isMobile && <td>{stock.quantity.toLocaleString()}</td>}
                      <td>{formatCurrency(stock.price)}</td>
                      <td style={{ width: isMobile ? '80px' : '120px' }}>
                        <input 
                          type="number" 
                          className="market-price-input"
                          placeholder="Price..."
                          value={marketPrices[stock.id] || ''}
                          onChange={(e) => handleMarketPriceChange(stock.id, e.target.value)}
                        />
                      </td>
                      {!isMobile && (
                        <td className={profitLoss >= 0 ? 'profit' : 'loss'}>
                          {currentPrice > 0 ? formatCurrency(Math.round(profitLoss)) : '-'}
                        </td>
                      )}
                      <td className={profitRatio >= 0 ? 'profit' : 'loss'}>
                        {currentPrice > 0 ? `${profitRatio.toFixed(2)}%` : '-'}
                      </td>
                      <td>
                        <button className="sell-btn" onClick={() => setSellingStock(stock)}>Sell</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No stocks in your portfolio yet.</div>
          )}
        </div>
      </div>


      {/* Sold Stocks Section */}
      <div className="list-section">
        <div className="section-header">
          <h3 className="section-title">
            <History size={24} color="#94a3b8" />
            Sell History
          </h3>
          <span className="badge badge-sold">{soldStocks.length} Mã</span>
        </div>
        
        <div className="table-container">
          {soldStocks.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  {!isMobile && <th>Quantity</th>}
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  {!isMobile && <th>Profit/Loss</th>}
                  <th>Change (%)</th>
                </tr>
              </thead>
              <tbody>
                {soldStocks.map(stock => {
                  const profitLoss = (stock.sellingPrice * 1000 - stock.price * 1000) * stock.quantity
                    - (stock.price + stock.sellingPrice) * stock.quantity * 2
                    - stock.sellingPrice * stock.quantity;
                  const profitRatio = (profitLoss / (stock.price * 1000 * stock.quantity)) * 100;
                  
                  return (
                    <tr key={stock.id}>
                      <td className="stock-code-cell">{stock.stockCode}</td>
                      {!isMobile && <td>{stock.quantity.toLocaleString()}</td>}
                      <td>{formatCurrency(stock.price)}</td>
                      <td>{formatCurrency(stock.sellingPrice)}</td>
                      {!isMobile && (
                        <td className={profitLoss >= 0 ? 'profit' : 'loss'}>
                          {formatCurrency(Math.round(profitLoss))}
                        </td>
                      )}
                      <td className={profitRatio >= 0 ? 'profit' : 'loss'}>
                        {profitRatio.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No sell transactions yet.</div>
          )}
        </div>
      </div>


      {/* Sell Modal */}
      {sellingStock && (
        <SellModal 
          stock={sellingStock}
          onConfirm={executeSell}
          onCancel={() => setSellingStock(null)}
        />
      )}
    </div>
  );
};

export default StockList;
