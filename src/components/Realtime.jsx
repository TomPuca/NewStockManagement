import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { Plus, X } from 'lucide-react';
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

    socket.on('board', (data) => console.log("%c[BOARD UPDATE]", "color: orange;", data));
    socket.on('stock', (response) => {
      const item = response.data || response;
      if (!item || !item.sym) return;
      
      setMatchHistory(prev => {
        const prevHist = prev[item.sym] || [];
        let clClass = 'yellow';
        if (item.cl === 'd' || item.cl === 'r' || item.side === 'S') clClass = 'red';
        else if (item.cl === 'i' || item.cl === 'g' || item.side === 'B') clClass = 'green';
        else if (item.cl === 'c') clClass = 'purple';
        else if (item.cl === 'f') clClass = 'cyan';
        
        const newMatch = {
          vol: new Intl.NumberFormat('en-US').format(item.lastVol || 0),
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

  const parseG = (gStr) => {
    if (!gStr) return { price: 0, vol: 0, color: '' };
    const parts = gStr.split('|');
    // Volume returned from API usually needs comma formatting, the raw volume is passed as string.
    // Example: "73.4|4540|d"
    const volStr = parts[1] || "0";
    const formattedVol = new Intl.NumberFormat('en-US').format(parseFloat(volStr) / 10).replace('.', ','); // format as 45,40 or 4,540
    return {
      price: parts[0] || '0',
      volRaw: parts[1] || '0',
      vol: new Intl.NumberFormat('en-US').format(parseFloat(volStr)),
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
                <div className={`sym-code ${mainColor}`}>{stock.sym}</div>
                <div className={mainColor}>{stock.ot !== undefined && stock.ot !== null ? stock.ot : '0.00'}</div>
                <div className={mainColor}>{stock.lastPrice !== undefined && stock.lastPrice !== null ? stock.lastPrice : '0.00'}</div>
                <div className={mainColor}>{stock.lastVolume !== undefined && stock.lastVolume !== null ? new Intl.NumberFormat('en-US').format(stock.lastVolume) : '0'}</div>
                <div className={mainColor}>{stock.changePc !== undefined && stock.changePc !== null ? stock.changePc + '%' : '0.00%'}</div>
                <div className={mainColor}>{stock.lot !== undefined && stock.lot !== null ? new Intl.NumberFormat('en-US').format(stock.lot) : '0'}</div>
              </div>

              <div className="box-middle">
                <div className="box-header">
                  <span>Volume</span>
                  <span>Bid</span>
                </div>
                <div className="box-row">
                  <span className={g1.colorClass}>{g1.vol}</span>
                  <span className={g1.colorClass}>{g1.price}</span>
                </div>
                <div className="box-row">
                  <span className={g2.colorClass}>{g2.vol}</span>
                  <span className={g2.colorClass}>{g2.price}</span>
                </div>
                <div className="box-row">
                  <span className={g3.colorClass}>{g3.vol}</span>
                  <span className={g3.colorClass}>{g3.price}</span>
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
                  <span className={g4.colorClass}>{g4.vol}</span>
                  <span className={g4.colorClass}>{g4.price}</span>
                </div>
                <div className="box-row">
                  <span className={g5.colorClass}>{g5.vol}</span>
                  <span className={g5.colorClass}>{g5.price}</span>
                </div>
                <div className="box-row">
                  <span className={g6.colorClass}>{g6.vol}</span>
                  <span className={g6.colorClass}>{g6.price}</span>
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
    </div>
  );
};

export default Realtime;
