import React, { useState, useEffect } from 'react';
import './GoldPriceCard.css';

const GoldPriceCard = () => {
  const [phuQuY, setPhuQuY] = useState({ buy: '...', sell: '...' });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchGoldPrice = async () => {
    try {
      const timestamp = new Date().getTime();
      const targetUrl = `https://phuquygroup.vn/?_=${timestamp}`;
      
      // Use AllOrigins proxy to bypass CORS in both DEV and PROD (GitHub Pages)
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await fetch(proxyUrl);
      const data = await response.json();
      const html = data.contents;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const rows = Array.from(doc.querySelectorAll('tr'));
      
      console.log("--- PHU QUY DATA ANALYSIS ---");
      console.log("Source URL:", targetUrl);

      let found = false;
      rows.forEach((row, index) => {
        const cols = Array.from(row.querySelectorAll('td, th')).map(c => c.textContent.trim());
        if (cols.length >= 3) {
          const name = cols[0];
          // Log candidate rows for debugging
          if (name.includes('Nhẫn')) {
            console.log(`Matching Row #${index}:`, cols);
          }

          if (name === 'Nhẫn tròn Phú Quý 999.9') {
            setPhuQuY({ buy: cols[1], sell: cols[2] });
            found = true;
          }
        }
      });

      if (found) {
        setLastUpdate(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      } else {
        console.warn("Could not find 'Nhẫn tròn Phú Quý 999.9' in the response.");
      }
    } catch (error) {
      console.error("Phu Quy Gold fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoldPrice();
    const interval = setInterval(fetchGoldPrice, 60000); // Update every 1 minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gold-price-card">
      {/* <div className="gold-header">
        <span className="gold-label">GOLD</span>
        <span className="gold-update">1m</span>
      </div> */}
      
      <div className="gold-content">
        <div className="gold-item">
          <div className="gold-info">
            <span className="gold-name">Phú Quý 999.9</span>
          </div>
          <div className="gold-values">
            <div className="gold-box buy">
              <span className="box-label">MUA</span>
              <span className="box-value">{phuQuY.buy}</span>
            </div>
            <div className="gold-box sell">
              <span className="box-label">BÁN</span>
              <span className="box-value">{phuQuY.sell}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="gold-footer">
        {lastUpdate}
      </div>
    </div>
  );
};

export default GoldPriceCard;
