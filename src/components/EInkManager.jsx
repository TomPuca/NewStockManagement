import React from 'react';
import './EInkManager.css';

const EInkManager = () => {
  return (
    <div className="eink-manager glass-panel animate-fade-in">
      <div className="eink-manager-header">
        <h2 className="premium-title">📟 E-Ink Device Controller</h2>
        <p className="subtitle">Connect and control your E-Paper tags via Web Bluetooth</p>
      </div>
      <div className="eink-iframe-container">
        <iframe 
          src="./eink.html" 
          allow="bluetooth" 
          title="E-Ink Controller" 
          className="eink-iframe"
        />
      </div>
    </div>
  );
};

export default EInkManager;
