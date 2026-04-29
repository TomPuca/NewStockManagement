import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { X } from 'lucide-react';
import './StockChartPopup.css';

const StockChartPopup = ({ symbol, position, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1Y'); // 1Y, 3M, 1M, 1W

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const to = Math.floor(Date.now() / 1000);
        let from;
        
        switch (timeRange) {
          case '1W': from = to - (7 * 24 * 60 * 60); break;
          case '1M': from = to - (30 * 24 * 60 * 60); break;
          case '3M': from = to - (90 * 24 * 60 * 60); break;
          case '1Y': 
          default: from = to - (365 * 24 * 60 * 60); break;
        }

        const url = `https://dchart-api.vndirect.com.vn/dchart/history?resolution=1D&symbol=${symbol}&from=${from}&to=${to}`;
        
        const response = await fetch(url);
        const body = await response.json();
        
        if (body && body.s === 'ok') {
          const formatted = body.t.map((time, index) => ({
            date: new Date(time * 1000).toLocaleDateString('vi-VN'),
            price: body.c[index],
            open: body.o[index],
            high: body.h[index],
            low: body.l[index]
          }));
          setData(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch stock history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [symbol, timeRange]);

  const getStats = () => {
    if (!data.length) return null;
    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const current = prices[prices.length - 1];
    
    // Calculate ratios
    const ratioFromMin = ((current - min) / min * 100).toFixed(2);
    const ratioToMax = ((current - max) / max * 100).toFixed(2);

    return { min, max, current, ratioFromMin, ratioToMax };
  };

  const stats = getStats();

  return (
    <div className="chart-popup-overlay" onClick={onClose}>
      <div className="chart-popup-content" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <div className="popup-title">
            <div className="title-row">
              <span className="popup-symbol">{symbol}</span>
              {stats && (
                <div className="stat-item current inline">
                  <span className="stat-value">{stats.current.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="popup-tag-group">
              <span className="popup-tag">Lịch sử {timeRange === '1Y' ? '1 năm' : timeRange === '3M' ? '3 tháng' : timeRange === '1M' ? '1 tháng' : '1 tuần'}</span>
              <div className="time-range-selector">
                {['1Y', '3M', '1M', '1W'].map(range => (
                  <button 
                    key={range}
                    className={`range-btn ${timeRange === range ? 'active' : ''}`}
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {stats && (
            <div className="popup-stats-grid">
              <div className="stat-item">
                <span className="stat-label">Thấp nhất</span>
                <span className="stat-value">{stats.min.toLocaleString()}</span>
                <span className="stat-ratio positive">+{stats.ratioFromMin}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cao nhất</span>
                <span className="stat-value">{stats.max.toLocaleString()}</span>
                <span className="stat-ratio negative">{stats.ratioToMax}%</span>
              </div>
            </div>
          )}
          
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="popup-body">
          {loading ? (
            <div className="loading-state">Đang tải biểu đồ...</div>
          ) : (
            <div className="popup-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    hide={true}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    orientation="right"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '13px'
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#818cf8" 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockChartPopup;
