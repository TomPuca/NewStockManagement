import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Plus, X } from 'lucide-react';
import StockChartPopup from './StockChartPopup';
import './Realtime.css';

const Realtime = () => {
  const [stockList, setStockList] = useState(() => {
    const saved = localStorage.getItem('stockid');
    try {
      return saved ? JSON.parse(saved) : ["FPT", "CEO", "CTG"];
    } catch {
      return ["FPT", "CEO", "CTG"];
    }
  });
  
  const [stockData, setStockData] = useState([]);
  const [matchHistory, setMatchHistory] = useState({});
  const [newStock, setNewStock] = useState('');
  const [socketStatus, setSocketStatus] = useState('Disconnected');
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('stockid', JSON.stringify(stockList));
    fetchInitialData();
    setupWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [stockList]);

  const fetchInitialData = async () => {
    if (stockList.length === 0) {
      setStockData([]);
      return;
    }
    try {
      const response = await fetch(`https://bgapidatafeed.vps.com.vn/getliststockdata/${stockList.join(",")}`);
      const body = await response.json();
      if (body !== undefined) {
        setStockData(body);
      }
    } catch (error) {
      console.error("Failed to fetch stock data:", error);
    }
  };

  const setupWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    const socket = io("https://bgdatafeed.vps.com.vn/", {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketStatus('Connected');
      if (stockList.length > 0) {
        const msg = JSON.stringify({ action: "join", list: stockList.join(",") });
        socket.emit("regs", msg);
      }
    });

    socket.on('disconnect', () => setSocketStatus('Disconnected'));

    socket.on('board', (response) => {
      const item = response.data || response;
      if (!item || !item.sym) return;

      setStockData(prev => prev.map(s => {
        if (s.sym === item.sym) {
          // VPS Socket Logic:
          // side === 'B' -> g1, g2, g3 are Bids (state g1, g2, g3)
          // side === 'S' -> g1, g2, g3 are Asks (state g4, g5, g6)
          const update = { ...item };
          if (item.side === 'S') {
            update.g4 = item.g1;
            update.g5 = item.g2;
            update.g6 = item.g3;
            // Remove the temporary g1-g3 from update object so they don't overwrite bids
            delete update.g1;
            delete update.g2;
            delete update.g3;
          }
          return { ...s, ...update, lastUpdate: Date.now() };
        }
        return s;
      }));
    });

    socket.on('stock', (response) => {
      // console.log(response)
      const item = response.data || response;
      if (!item || !item.sym) return;
      
      // Also update the main stockData price if it's a match
      setStockData(prev => prev.map(s => {
        if (s.sym === item.sym) {
          return { 
            ...s, 
            lastPrice: item.lastPrice || s.lastPrice,
            lastVolume: item.lastVol || s.lastVolume,
            lot: item.totalVol || s.lot,
            ot: item.change || s.ot,
            changePc: item.changePc || s.changePc,
            lastUpdate: Date.now()
          };
        }
        return s;
      }));

      setMatchHistory(prev => {
        const prevHist = prev[item.sym] || [];
        let clClass = 'yellow';
        if (item.cl === 'd' || item.cl === 'r' || item.side === 'S') clClass = 'red';
        else if (item.cl === 'i' || item.cl === 'g' || item.side === 'B') clClass = 'green';
        else if (item.cl === 'c') clClass = 'purple';
        else if (item.cl === 'f') clClass = 'cyan';
        
        const newMatch = {
          vol: formatVol(item.lastVol || 0),
          price: item.lastPrice,
          colorClass: clClass,
          id: Math.random().toString(36).substr(2, 9)
        };
        
        return {
          ...prev,
          [item.sym]: [newMatch, ...prevHist].slice(0, 50)
        };
      });
    });
  };

  const handleAddStock = (e) => {
    e.preventDefault();
    const code = newStock.trim().toUpperCase();
    if (code && !stockList.includes(code)) {
      setStockList([...stockList, code]);
      setNewStock('');
    }
  };

  const handleRemoveStock = (code) => {
    setStockList(stockList.filter(s => s !== code));
  };

  const formatVol = (val) => {
    if (val === undefined || val === null) return '0';
    const formatted = new Intl.NumberFormat('en-US').format(val * 10);
    return formatted.substring(0, formatted.length - 1);
  };

  const parseG = (gStr) => {
    if (!gStr) return { price: '0', volRaw: '0', vol: '0', colorClass: 'yellow' };
    const parts = gStr.split('|').map(s => s.trim());
    const volStr = parts[1] || "0";
    return {
      price: parts[0] || '0',
      volRaw: volStr,
      vol: formatVol(parseFloat(volStr)),
      colorClass: parts[2] === 'd' ? 'red' : parts[2] === 'i' ? 'green' : parts[2] === 'e' ? 'yellow' : parts[2] === 'c' ? 'purple' : parts[2] === 'f' ? 'cyan' : 'yellow'
    };
  };

  const getColorClassByPrice = (price, refPrice) => {
    if (!price || !refPrice) return 'yellow';
    const p = parseFloat(price);
    const r = parseFloat(refPrice);
    if (p > r) return 'green';
    if (p < r) return 'red';
    return 'yellow';
  };

  return (
    <div className="realtime-board">
      <div className="board-header">
        <h2>Realtime Price Board</h2>
        <div className="connection-status">
          <span className={`status-dot ${socketStatus === 'Connected' ? 'connected' : 'disconnected'}`}></span>
          {socketStatus}
        </div>
      </div>
      
      <form className="stock-add-form" onSubmit={handleAddStock}>
        <input 
          type="text" 
          className="form-input"
          style={{ paddingLeft: '16px' }}
          placeholder="Add Symbol (e.g. VNM, TCB)" 
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
        />
        <button type="submit" className="add-button" style={{ marginTop: 0, width: 'auto' }}>
          <Plus size={18} /> Add
        </button>
      </form>

      <div className="board-grid">
        {stockData.map((stock) => {
          const mainColor = getColorClassByPrice(stock.lastPrice, stock.r);
          const g1 = parseG(stock.g1);
          const g2 = parseG(stock.g2);
          const g3 = parseG(stock.g3);
          const g4 = parseG(stock.g4);
          const g5 = parseG(stock.g5);
          const g6 = parseG(stock.g6);

          return (
            <div className="stock-card" key={stock.sym}>
              <button className="btn-remove-stock" onClick={() => handleRemoveStock(stock.sym)}><X size={14}/></button>
              
              <div className="box-left">
                <div 
                  className={`sym-code ${mainColor}`} 
                  onClick={() => setSelectedSymbol(stock.sym)}
                  style={{ cursor: 'pointer', textDecoration: 'underline decoration-dotted' }}
                >
                  {stock.sym}
                </div>
                <div className={mainColor}><span className="flash-item" key={`${stock.sym}-ot-${stock.ot}`}>{stock.ot !== undefined && stock.ot !== null ? stock.ot : '0.00'}</span></div>
                <div className={mainColor}><span className="flash-item" key={`${stock.sym}-lp-${stock.lastPrice}`}>{stock.lastPrice !== undefined && stock.lastPrice !== null ? stock.lastPrice : '0.00'}</span></div>
                <div className={mainColor}><span className="flash-item" key={`${stock.sym}-lv-${stock.lastVolume}`}>{stock.lastVolume !== undefined && stock.lastVolume !== null ? formatVol(stock.lastVolume) : '0'}</span></div>
                <div className={mainColor}><span className="flash-item" key={`${stock.sym}-cp-${stock.changePc}`}>{stock.changePc !== undefined && stock.changePc !== null ? stock.changePc + '%' : '0.00%'}</span></div>
                <div className={mainColor}><span className="flash-item" key={`${stock.sym}-lot-${stock.lot}`}>{stock.lot !== undefined && stock.lot !== null ? formatVol(stock.lot) : '0'}</span></div>
              </div>

              <div className="box-middle">
                <div className="box-header">
                  <span>Volume</span>
                  <span>Bid</span>
                </div>
                <div className="box-row">
                  <span className={`${g1.colorClass} flash-item`} key={`${stock.sym}-g1v-${parseFloat(g1.volRaw)}`}>{g1.vol}</span>
                  <span className={`${g1.colorClass} flash-item`} key={`${stock.sym}-g1p-${parseFloat(g1.price)}`}>{g1.price}</span>
                </div>
                <div className="box-row">
                  <span className={`${g2.colorClass} flash-item`} key={`${stock.sym}-g2v-${parseFloat(g2.volRaw)}`}>{g2.vol}</span>
                  <span className={`${g2.colorClass} flash-item`} key={`${stock.sym}-g2p-${parseFloat(g2.price)}`}>{g2.price}</span>
                </div>
                <div className="box-row">
                  <span className={`${g3.colorClass} flash-item`} key={`${stock.sym}-g3v-${parseFloat(g3.volRaw)}`}>{g3.vol}</span>
                  <span className={`${g3.colorClass} flash-item`} key={`${stock.sym}-g3p-${parseFloat(g3.price)}`}>{g3.price}</span>
                </div>
                <div className="box-row min-max-row">
                  <span>Min</span>
                  <span className={getColorClassByPrice(stock.lowPrice, stock.r)}>{stock.lowPrice || '0.00'}</span>
                </div>
              </div>

              <div className="box-right">
                <div className="box-header">
                  <span>Volume</span>
                  <span>Ask</span>
                </div>
                <div className="box-row">
                  <span className={`${g4.colorClass} flash-item`} key={`${stock.sym}-g4v-${parseFloat(g4.volRaw)}`}>{g4.vol}</span>
                  <span className={`${g4.colorClass} flash-item`} key={`${stock.sym}-g4p-${parseFloat(g4.price)}`}>{g4.price}</span>
                </div>
                <div className="box-row">
                  <span className={`${g5.colorClass} flash-item`} key={`${stock.sym}-g5v-${parseFloat(g5.volRaw)}`}>{g5.vol}</span>
                  <span className={`${g5.colorClass} flash-item`} key={`${stock.sym}-g5p-${parseFloat(g5.price)}`}>{g5.price}</span>
                </div>
                <div className="box-row">
                  <span className={`${g6.colorClass} flash-item`} key={`${stock.sym}-g6v-${parseFloat(g6.volRaw)}`}>{g6.vol}</span>
                  <span className={`${g6.colorClass} flash-item`} key={`${stock.sym}-g6p-${parseFloat(g6.price)}`}>{g6.price}</span>
                </div>
                <div className="box-row min-max-row">
                  <span>Max</span>
                  <span className={getColorClassByPrice(stock.highPrice, stock.r)}>{stock.highPrice || '0.00'}</span>
                </div>
              </div>

              {/* Lịch sử khớp lệnh */}
              <div className="box-history custom-scrollbar">
                <div className="box-header">
                  <span>Vol Match</span>
                  <span>Price</span>
                </div>
                <div className="history-scroll-area">
                  {(matchHistory[stock.sym] || []).map(match => (
                    <div className="box-row" key={match.id}>
                      <span className={match.colorClass}>{match.vol}</span>
                      <span className={match.colorClass}>{match.price}</span>
                    </div>
                  ))}
                  {(!matchHistory[stock.sym] || matchHistory[stock.sym].length === 0) && (
                    <div className="empty-history">Waiting...</div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
        {stockData.length === 0 && <div className="no-data">No stocks added or connecting...</div>}
      </div>
      
      {selectedSymbol && (
        <StockChartPopup 
          symbol={selectedSymbol} 
          onClose={() => setSelectedSymbol(null)} 
        />
      )}
    </div>
  );
};

export default Realtime;
