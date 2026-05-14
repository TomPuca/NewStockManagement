import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { sendTelegramMessage } from '../services/telegramService';
import './Invest.css';

const Invest = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });

  const showTooltip = (e, text) => {
    if (!text) return;
    setTooltip({ visible: true, text, x: e.clientX + 12, y: e.clientY - 8 });
  };
  const hideTooltip = () => setTooltip(t => ({ ...t, visible: false }));
  const moveTooltip = (e) => {
    if (tooltip.visible) setTooltip(t => ({ ...t, x: e.clientX + 12, y: e.clientY - 8 }));
  };

  useEffect(() => {
    // Temporarily removing orderBy to check if it's an indexing issue
    const q = query(collection(db, "invest_growth"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        const item = doc.data();
        let formattedDate = "-";
        if (item.updated_at) {
          // Handle Firestore Timestamp vs plain string/number
          formattedDate = item.updated_at.toDate ? item.updated_at.toDate().toLocaleString() : String(item.updated_at);
        }

        data.push({ 
          id: doc.id, 
          stockCode: String(item.code || "N/A"), 
          companyName: String(item.companyName || item.company_name || ""),
          growthRatio: Number(item.growth_rate || 0),
          startPrice: Number(item.start_price || 0),
          endPrice: Number(item.end_price || 0),
          floor: String(item.floor || "-"),
          updatedAt: formattedDate
        });
      });
      // Manual sort since we removed orderBy
      data.sort((a, b) => b.growthRatio - a.growthRatio);
      setItems(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const handleManualRefresh = async () => {
    try {
      // 1. First send the telegram notice (as before)
      await sendTelegramMessage("🔄 *Yêu cầu cập nhật dữ liệu /invest ...*");
      
      // 2. Trigger via Firestore (This is the reliable way for a server script to catch it)
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const triggerRef = doc(db, "commands", "invest_refresh");
      await setDoc(triggerRef, {
        request_time: serverTimestamp(),
        status: "pending"
      });
      
      // alert("Đã gửi yêu cầu cập nhật! Server sẽ xử lý trong giây lát.");
    } catch (error) {
      console.error("Refresh request failed:", error);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loader"></div>
      <span>Loading Growth Data...</span>
    </div>
  );

  const filteredItems = (floorName) => 
    items.filter(item => item.floor === floorName);

  // Get update date from any available item
  const globalUpdateDate = items.length > 0 ? items[0].updatedAt : "-";

  return (
    <div className="invest-manager animate-fade-in">
      <div className="invest-header">
        <div className="header-left">
          <h2 className="section-title">
            <TrendingUp size={28} /> Growth Stocks
            <span className="badge badge-active">MONTHLY</span>
          </h2>
          <p className="subtitle">
            High-growth stocks categorized by exchange
            {globalUpdateDate !== "-" && <span className="update-timestamp"> — Updated: {globalUpdateDate}</span>}
            <button className="invest-refresh-btn" onClick={handleManualRefresh} title="Request data refresh via /invest command">
              <RefreshCw size={14} />
            </button>
          </p>
        </div>
      </div>
      
      <div className="floor-grid">
        {['HOSE', 'HNX', 'UPCOM'].map(floor => (
          <div key={floor} className="floor-column">
            <div className="floor-header">
              <span className="floor-name">{floor}</span>
              <span className="count-badge">{filteredItems(floor).length} symbols</span>
            </div>
            
            <div className="floor-table-wrapper">
              {filteredItems(floor).length > 0 ? (
                <table className="mini-table compact">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Open</th>
                      <th>Close</th>
                      <th>+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems(floor).map(item => (
                      <tr key={item.id}>
                        <td className="stock-code-cell">
                          <span
                            className="stock-tooltip-trigger"
                            onMouseEnter={(e) => showTooltip(e, item.companyName)}
                            onMouseLeave={hideTooltip}
                            onMouseMove={moveTooltip}
                          >
                            {item.stockCode}
                          </span>
                        </td>
                        <td className="price-cell-small">{item.startPrice.toLocaleString()}</td>
                        <td className="price-cell-main">{item.endPrice.toLocaleString()}</td>
                        <td className="profit font-compact">+{item.growthRatio}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-mini">No {floor} data</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Tooltip via Portal */}
      {tooltip.visible && tooltip.text && ReactDOM.createPortal(
        <div
          className="invest-tooltip"
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          {tooltip.text}
        </div>,
        document.body
      )}
    </div>
  );
};

export default Invest;
