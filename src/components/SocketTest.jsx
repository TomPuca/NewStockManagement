import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketTest = () => {
  const [status, setStatus] = useState('Disconnected');

  useEffect(() => {
    // Initialize socket connection to VPS websocket
    const socket = io("https://bgdatafeed.vps.com.vn/", {
      transports: ['websocket'], // Use WebSocket transport layer directly
    });

    socket.on('connect', () => {
      setStatus('Connected');
      console.log("%c[Socket.IO] Connected to VPS Realtime Server", "color: green; font-weight: bold;");

      // Register the stock symbols we want to listen to (CEO, CTG)
      const msg = '{"action":"join","list":"CEO,CTG"}';
      socket.emit("regs", msg);
      // console.log("%c[Socket.IO] Sent Registration:", "color: blue;", msg);
    });

    socket.on('disconnect', () => {
      setStatus('Disconnected');
      // console.log("%c[Socket.IO] Disconnected", "color: red;");
    });

    // Listen for board updates (order book changes)
    socket.on('board', (zdata) => {
      if (zdata && zdata.data) {
        // console.log("%c[BOARD UPDATE]", "color: orange;", zdata.data);
      }
    });

    // Listen for stock matches (price changes)
    socket.on('stock', (zdata) => {
      if (zdata && zdata.data) {
        console.log("%c[STOCK MATCH]", "color: purple; font-weight: bold;", zdata.data);
      }
    });

    // Listen for index updates
    socket.on('index', (zdata) => {
      if (zdata && zdata.data) {
        // console.log("%c[INDEX UPDATE]", "color: teal;", zdata.data);
      }
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: status === 'Connected' ? '#4ade80' : '#f87171', padding: '5px 10px', borderRadius: '5px', fontSize: '12px', zIndex: 9999 }}>
      Socket Status: {status} (CEO, CTG)
    </div>
  );
};

export default SocketTest;
