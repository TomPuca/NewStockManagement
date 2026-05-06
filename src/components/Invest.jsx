import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { TrendingUp } from 'lucide-react';
import './Invest.css';

const Invest = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
            Mã chứng khoán tăng trưởng theo từng sàn (Tháng) 
            {globalUpdateDate !== "-" && <span className="update-timestamp"> — Cập nhật: {globalUpdateDate}</span>}
          </p>
        </div>
      </div>
      
      <div className="floor-grid">
        {['HOSE', 'HNX', 'UPCOM'].map(floor => (
          <div key={floor} className="floor-column">
            <div className="floor-header">
              <span className="floor-name">{floor}</span>
              <span className="count-badge">{filteredItems(floor).length} mã</span>
            </div>
            
            <div className="floor-table-wrapper">
              {filteredItems(floor).length > 0 ? (
                <table className="mini-table compact">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>GIÁ ĐẦU</th>
                      <th>GIÁ CUỐI</th>
                      <th>+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems(floor).map(item => (
                      <tr key={item.id}>
                        <td className="stock-code-cell">{item.stockCode}</td>
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
    </div>
  );
};

export default Invest;
