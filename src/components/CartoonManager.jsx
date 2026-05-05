import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import './CartoonManager.css';

const CartoonManager = () => {
  const [cartoons, setCartoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updateTime, setUpdateTime] = useState(new Date().toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }));

  const fetchLatestEpisodes = useCallback(async (data) => {
    if (refreshing) return;
    setRefreshing(true);
    
    // We now rely directly on the data fetched from Firestore (via onSnapshot)
    // which already contains the 'latest', 'subtitle', and 'status' fields.
    setCartoons([...data]);
    setUpdateTime(new Date().toLocaleString('vi-VN'));
    
    setRefreshing(false);
    setLoading(false);
  }, [refreshing]);


  // Handle first load and real-time updates from Firestore
  useEffect(() => {
    const q = query(collection(db, "cartoons"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setCartoons(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Separate effect to trigger the initial scrape only once when data first arrives
  const initialFetchDone = React.useRef(false);
  useEffect(() => {
    if (!loading && cartoons.length > 0 && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchLatestEpisodes(cartoons);
    }
  }, [loading, cartoons.length, fetchLatestEpisodes]);

  const handleUpdateWatched = async (id, newWatchedValue) => {
    const newWatched = parseInt(newWatchedValue);
    if (isNaN(newWatched)) return;

    try {
      const docRef = doc(db, "cartoons", id);
      await updateDoc(docRef, { 
        watched: newWatched,
        lastUpdated: new Date()
      });
      // Local state will be updated by onSnapshot
    } catch (error) {
      console.error("Error updating watched episode:", error);
    }
  };

  const handleToggleAlert = async (id, currentStatus) => {
    try {
      const docRef = doc(db, "cartoons", id);
      await updateDoc(docRef, { 
        alertEnabled: !currentStatus 
      });
    } catch (error) {
      console.error("Error toggling alert:", error);
    }
  };

  const getStatusColor = (item) => {
    const diff = (item.latest || 0) - item.watched;
    if (diff <= 0 && item.latest > 0) return 'status-completed';
    if (diff <= 3 && diff > 0) return 'status-near';
    return 'status-pending';
  };

  const getStatusText = (item) => {
    if (!item.latest) return 'Checking...';
    const diff = item.latest - item.watched;
    if (diff <= 0) return 'Finished';
    return `${diff} eps left`;
  };

  const finishedCartoons = cartoons.filter(c => c.latest > 0 && c.watched >= c.latest);
  const nearlyFinishedCartoons = cartoons.filter(c => {
    if (!c.latest) return false;
    const diff = c.latest - c.watched;
    return diff > 0 && diff <= 3;
  });

  if (loading && !refreshing) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <span>Initializing Cartoon Library...</span>
      </div>
    );
  }

  return (
    <div className="cartoon-manager glass-panel animate-fade-in">
      <div className="cartoon-header">
        <div className="header-left">
          <h2 className="premium-title">🎬 Cartoon Tracking</h2>
          <div className="update-status">
            <span className={`status-dot ${refreshing ? 'pulse' : ''}`}></span>
            <span className="update-timer">Checked: {updateTime}</span>
          </div>
        </div>
        <button 
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`} 
          onClick={() => fetchLatestEpisodes(cartoons)}
          disabled={refreshing}
        >
          {refreshing ? '⌛ Updating...' : '🔄 Refresh Status'}
        </button>
      </div>

      <div className="cartoon-grid">
        {cartoons.map((item) => (
          <div key={item.id} className={`cartoon-card ${getStatusColor(item)}`}>
            <div className="card-top">
              <div className="title-group">
                <h3 className="cartoon-title" title={item.title}>{item.title}</h3>
                {item.subtitle && <p className="cartoon-subtitle">{item.subtitle}</p>}
              </div>
              <div className="badge-group">
                {item.status && <span className="info-badge">{item.status}</span>}
                <span className={`status-badge ${getStatusColor(item)}`}>
                  {getStatusText(item)}
                </span>
              </div>
            </div>
            
            <div className="card-stats">
              <div className="stat-box">
                <span className="stat-label">WATCHED</span>
                <div className="watched-input-wrapper">
                  <input 
                    type="number" 
                    value={item.watched} 
                    onChange={(e) => handleUpdateWatched(item.id, e.target.value)}
                    className="watched-input"
                  />
                  <div className="input-controls">
                    <button onClick={() => handleUpdateWatched(item.id, item.watched + 1)}>+</button>
                    <button onClick={() => handleUpdateWatched(item.id, Math.max(0, item.watched - 1))}>-</button>
                  </div>
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-label">LATEST</span>
                <span className="stat-value">{item.latest || '...'}</span>
              </div>
            </div>

            <div className="card-extra">
              <label 
                className={`alert-toggle ${item.alertEnabled ? 'active' : ''}`}
                title={item.alertEnabled ? 'Alerts ON' : 'Alerts OFF'}
              >
                <input 
                  type="checkbox" 
                  checked={item.alertEnabled || false} 
                  onChange={() => handleToggleAlert(item.id, item.alertEnabled)} 
                />
                <span className="alert-icon">{item.alertEnabled ? '🔔' : '🔕'}</span>
                <span className="alert-text">Monitor Updates</span>
              </label>
            </div>

            <div className="card-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${Math.min(100, (item.watched / (item.latest || 1)) * 100)}%` }}
              ></div>
            </div>

            <div className="card-actions">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="btn-watch">
                Open in Hoathinh3D 🚀
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="suggestions-container">
        <div className="suggestion-section">
          <h3 className="suggestion-title finished">✅ Finished Watching</h3>
          <div className="suggestion-list">
            {finishedCartoons.length > 0 ? (
              finishedCartoons.map(c => (
                <div key={c.id} className="suggestion-item finished">
                  🌟 <strong>{c.title}</strong> - All caught up!
                </div>
              ))
            ) : (
              <p className="no-data">No completed series yet.</p>
            )}
          </div>
        </div>

        <div className="suggestion-section">
          <h3 className="suggestion-title pending">🔥 Nearly Finished</h3>
          <div className="suggestion-list">
            {nearlyFinishedCartoons.length > 0 ? (
              nearlyFinishedCartoons.map(c => (
                <div key={c.id} className="suggestion-item pending">
                  ⚡ <strong>{c.title}</strong> is almost done! Only {c.latest - c.watched} left.
                </div>
              ))
            ) : (
              <p className="no-data">No series near completion.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartoonManager;
