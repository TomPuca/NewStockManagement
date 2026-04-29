import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './VnIndexChart.css';

const VnIndexChart = () => {
  const [data, setData] = useState([]);
  const [indexInfo, setIndexInfo] = useState(null);

  const fetchVnIndex = async () => {
    try {
      // 1. Fetch PLOT_LINE for current index info
      // const plotResponse = await fetch('https://bgapidatafeed.vps.com.vn/getlistindexdetail/10,02,11,03');
      const plotResponse = await fetch('https://bgapidatafeed.vps.com.vn/getlistindexdetail/10');
      const plotBody = await plotResponse.json();
      
      if (plotBody && plotBody.length > 0) {
        // Find VN-INDEX (mc: "10")
        const vnIndexData = plotBody.find(idx => idx.mc === "10") || plotBody[0];
        const [chg, pct] = vnIndexData.ot.split('|');
        
        setIndexInfo({
          idx: vnIndexData.cIndex,
          ref: vnIndexData.oIndex,
          chg: chg,
          pct: pct,
          time: vnIndexData.time,
        });
      }

      // 2. Fetch CHART_DATA for historical chart
      const chartResponse = await fetch('https://histdatafeed.vps.com.vn/tradingview/historiesnearest?symbols=VNINDEX&props=o,v,t&resolution=1');
      const chartBody = await chartResponse.json();

      if (chartBody && chartBody.VNINDEX) {
        const vnData = chartBody.VNINDEX;
        
        // Helper to generate full continuous time slots for the day
        const generateTimeSlots = () => {
          const slots = [];
          // Morning: 9:00 (540m) - 11:30 (690m)
          for (let i = 540; i <= 690; i++) {
            const h = Math.floor(i / 60).toString().padStart(2, '0');
            const m = (i % 60).toString().padStart(2, '0');
            slots.push(`${h}:${m}`);
          }
          // Afternoon: 13:00 (780m) - 14:46 (886m)
          for (let i = 780; i <= 886; i++) {
            const h = Math.floor(i / 60).toString().padStart(2, '0');
            const m = (i % 60).toString().padStart(2, '0');
            slots.push(`${h}:${m}`);
          }
          return slots;
        };

        const timeline = generateTimeSlots();
        
        // Map available data to timeline for easy lookup
        const historyMap = {};
        vnData.t.forEach((timestamp, index) => {
          const date = new Date(timestamp * 1000);
          const hh = date.getHours().toString().padStart(2, '0');
          const mm = date.getMinutes().toString().padStart(2, '0');
          historyMap[`${hh}:${mm}`] = vnData.o[index];
        });

        // Create full chart data with nulls for future time points
        const fullDataArr = timeline.map(timeStr => ({
          time: timeStr,
          value: historyMap[timeStr] || null
        }));

        setData(fullDataArr);
      }
    } catch (error) {
      console.error("Failed to fetch VNIndex data:", error);
    }
  };

  useEffect(() => {
    fetchVnIndex();
    const interval = setInterval(fetchVnIndex, 60000); // 1 minute interval
    return () => clearInterval(interval);
  }, []);

  const getColor = () => {
    if (!indexInfo || !indexInfo.ref) return 'var(--text-muted)';
    const current = parseFloat(indexInfo.idx);
    const ref = parseFloat(indexInfo.ref);
    
    if (current > ref) return '#4ade80'; // green
    if (current < ref) return '#f87171'; // red
    return '#fbbf24'; // yellow
  };

  return (
    <div className="vnindex-chart-card">
      <div className="chart-header">
        <div className="index-main">
          <span className="index-name">VN-INDEX</span>
          <span className="index-value" style={{ color: getColor() }}>
            {indexInfo?.idx?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="index-stats" style={{ color: getColor() }}>
          <span>
            {indexInfo && parseFloat(indexInfo.idx) > parseFloat(indexInfo.ref) ? '+' : ''}
            {indexInfo && parseFloat(indexInfo.idx) < parseFloat(indexInfo.ref) ? '-' : ''}
            {indexInfo ? Math.abs(parseFloat(indexInfo.idx) - parseFloat(indexInfo.ref)).toFixed(2) : ''}
          </span>
          <span>({indexInfo?.pct})</span>
        </div>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getColor()} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={getColor()} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              hide={true} 
            />
            <YAxis 
              domain={([dataMin, dataMax]) => {
                const ref = indexInfo?.ref || dataMin;
                const min = Math.min(dataMin, ref) - 1;
                const max = Math.max(dataMax, ref) + 1;
                return [min, max];
              }}
              hide={true} 
            />
            <Tooltip 
              contentStyle={{ 
                background: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <ReferenceLine 
              y={indexInfo?.ref} 
              stroke="#fbbf24" 
              strokeDasharray="3 3"
              label={{ 
                position: 'central', 
                value: indexInfo?.ref ? indexInfo.ref.toLocaleString('en-US', { minimumFractionDigits: 1 }) : '', 
                fill: '#fbbf24', 
                fontSize: 10,
                fontWeight: 'bold',
                dy: -10
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={getColor()} 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VnIndexChart;
