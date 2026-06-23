import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Bell, BellOff, Trash2, Edit3, Image as ImageIcon, Link as LinkIcon, FileText, ZoomIn, ExternalLink } from 'lucide-react';
import './CartoonManager.css';

const FALLBACK_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450' fill='none'><rect width='300' height='450' fill='%231e293b'/><rect x='80' y='150' width='140' height='105' rx='8' stroke='%23818cf8' stroke-width='4' fill='none'/><path d='M140 185 L170 202.5 L140 220 Z' fill='%23818cf8'/><path d='M120 150 L100 130 M180 150 L200 130' stroke='%23818cf8' stroke-width='4' stroke-linecap='round'/><text x='50%25' y='65%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='16'>No Cover Image</text></svg>";

const convertImageUrl = (url) => {
  if (!url) return FALLBACK_SVG;

  const driveFileMatch = url.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/
  );

  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }

  return url;
};

const CartoonManager = () => {
  const [cartoons, setCartoons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newCartoon, setNewCartoon] = useState({
    title: '',
    link: '',
    watched: 0,
    alertEnabled: false
  });
  const [editingId, setEditingId] = useState(null);
  
  // Image Upload / Link states
  const [imageUrl, setImageUrl] = useState('');
  const [useUpload, setUseUpload] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Lightbox preview state
  const [previewItem, setPreviewItem] = useState(null);
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
      
      // Sort: alertEnabled true first, then alphabetically by title
      const sortedData = data.sort((a, b) => {
        if (a.alertEnabled === b.alertEnabled) {
          return (a.title || "").localeCompare(b.title || "");
        }
        return a.alertEnabled ? -1 : 1;
      });

      setCartoons(sortedData);
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError("Please select a valid image file!");
      return;
    }

    setUploadingImage(true);
    setUploadError('');

    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    if (!apiKey || apiKey === 'your_imgbb_api_key_here') {
      setUploadError("ImgBB API key not configured. Add VITE_IMGBB_API_KEY to your .env file!");
      setUploadingImage(false);
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setImageUrl(result.data.url);
      } else {
        setUploadError(result.error?.message || "Failed to upload image.");
      }
    } catch (err) {
      console.error("ImgBB Upload error:", err);
      setUploadError("Upload failed. Please check your internet connection.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setNewCartoon({
      title: item.title,
      link: item.link || '',
      watched: item.watched || 0,
      alertEnabled: item.alertEnabled || false
    });
    setImageUrl(item.imageUrl || '');
    setUseUpload(true);
    setUploadError('');
    
    // Scroll form into view
    const formElement = document.querySelector('.add-cartoon-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteDoc(doc(db, "cartoons", id));
      } catch (error) {
        console.error("Error deleting cartoon:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewCartoon({ title: '', link: '', watched: 0, alertEnabled: false });
    setImageUrl('');
    setUploadError('');
    setUseUpload(true);
  };

  const handleAddCartoon = async (e) => {
    e.preventDefault();
    if (!newCartoon.title || !newCartoon.link) return;

    try {
      const cartoonData = {
        title: newCartoon.title.trim(),
        link: newCartoon.link.trim(),
        watched: parseInt(newCartoon.watched) || 0,
        alertEnabled: newCartoon.alertEnabled,
        imageUrl: imageUrl.trim(),
        lastUpdated: new Date()
      };

      if (editingId) {
        // If the title (which is document ID) changed, create new document and delete old one
        if (editingId !== newCartoon.title) {
          const oldCartoon = cartoons.find(c => c.id === editingId);
          await setDoc(doc(db, "cartoons", newCartoon.title), {
            ...cartoonData,
            latest: oldCartoon?.latest || 0,
            status: oldCartoon?.status || "",
            subtitle: oldCartoon?.subtitle || "",
          });
          await deleteDoc(doc(db, "cartoons", editingId));
        } else {
          // Just update the existing document
          const docRef = doc(db, "cartoons", editingId);
          await updateDoc(docRef, {
            ...cartoonData,
            // Keep scrape attributes intact
            latest: cartoons.find(c => c.id === editingId)?.latest || 0,
            status: cartoons.find(c => c.id === editingId)?.status || "",
            subtitle: cartoons.find(c => c.id === editingId)?.subtitle || "",
          });
        }
        setEditingId(null);
      } else {
        // Use the film title as the document ID
        await setDoc(doc(db, "cartoons", newCartoon.title), {
          ...cartoonData,
          latest: 0,
          status: "",
          subtitle: "",
        });
      }
      setNewCartoon({ title: '', link: '', watched: 0, alertEnabled: false });
      setImageUrl('');
      setUploadError('');
      setUseUpload(true);
    } catch (error) {
      console.error("Error saving cartoon:", error);
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
            <div 
              className="cartoon-image-container"
              onClick={() => setPreviewItem(item)}
              title="Click to zoom image"
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={convertImageUrl(item.imageUrl)} 
                alt={item.title} 
                className="cartoon-image"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_SVG;
                }}
              />
              <div className="cartoon-image-overlay">
                <ZoomIn size={24} className="overlay-icon" />
                <span className="overlay-text">Zoom Image</span>
              </div>
            </div>

            <div className="cartoon-info">
              <div className="card-top">
                <div className="title-group">
                  <h3 className="cartoon-title" title={item.title}>
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="title-link">
                      {item.title}
                    </a>
                    <span 
                      className={`cartoon-alert-icon ${item.alertEnabled ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAlert(item.id, item.alertEnabled);
                      }}
                    >
                      {item.alertEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                    </span>
                  </h3>
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

              <div className="card-progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${Math.min(100, (item.watched / (item.latest || 1)) * 100)}%` }}
                ></div>
              </div>

              <div className="cartoon-card-actions">
                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="card-action-btn open-btn"
                  title="Open cartoon website"
                >
                  <ExternalLink size={14} /> Open
                </a>
                <button 
                  onClick={() => handleEdit(item)} 
                  className="card-action-btn edit-btn"
                  title="Edit cartoon"
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(item.id, item.title)} 
                  className="card-action-btn delete-btn"
                  title="Delete cartoon"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
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

      <div className="add-cartoon-section suggestion-section">
        <h3 className="suggestion-title premium-title">
          {editingId ? '✏️ Update Cartoon' : '➕ Add New Cartoon'}
        </h3>
        <form onSubmit={handleAddCartoon} className="add-cartoon-form">
          <div className="form-group-cartoon">
            <div className="input-field">
              <label><FileText size={16} /> Cartoon Title</label>
              <input 
                type="text" 
                placeholder="e.g. Mục Thần Ký" 
                value={newCartoon.title}
                onChange={(e) => setNewCartoon({...newCartoon, title: e.target.value})}
                className="premium-input"
                required
              />
            </div>
            <div className="input-field">
              <label><LinkIcon size={16} /> Hoathinh3D URL</label>
              <input 
                type="url" 
                placeholder="https://..." 
                value={newCartoon.link}
                onChange={(e) => setNewCartoon({...newCartoon, link: e.target.value})}
                className="premium-input"
                required
              />
            </div>
            <div className="input-field full-width">
              <div className="input-header-row">
                <label><ImageIcon size={16} /> Cover Image</label>
                <div className="upload-toggle-buttons">
                  <button 
                    type="button" 
                    className={`toggle-mode-btn ${useUpload ? 'active' : ''}`}
                    onClick={() => { setUseUpload(true); setUploadError(''); }}
                  >
                    Upload File
                  </button>
                  <button 
                    type="button" 
                    className={`toggle-mode-btn ${!useUpload ? 'active' : ''}`}
                    onClick={() => { setUseUpload(false); setUploadError(''); }}
                  >
                    Image URL
                  </button>
                </div>
              </div>

              {useUpload ? (
                <div className="image-upload-wrapper">
                  <div className="file-input-container">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="hidden-file-input"
                      id="cartoon-imgbb-upload-input"
                      disabled={uploadingImage}
                    />
                    <label htmlFor="cartoon-imgbb-upload-input" className={`file-upload-label ${uploadingImage ? 'uploading' : ''}`}>
                      {uploadingImage ? '⏳ Uploading to ImgBB...' : '📸 Choose Image / Take Photo'}
                    </label>
                  </div>
                  
                  {uploadError && <span className="upload-error-msg">⚠️ {uploadError}</span>}
                  
                  {imageUrl && (
                    <div className="upload-preview-container">
                      <img src={imageUrl} alt="Uploaded preview" className="upload-preview-image" />
                      <span className="upload-success-badge">✓ Image loaded successfully</span>
                    </div>
                  )}
                </div>
              ) : (
                <input 
                  type="url" 
                  placeholder="https://... (direct image link or Google Drive link)" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="premium-input"
                />
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="input-with-label">
              <span>Initially Watched:</span>
              <input 
                type="number" 
                value={newCartoon.watched}
                onChange={(e) => setNewCartoon({...newCartoon, watched: parseInt(e.target.value) || 0})}
                className="premium-input small"
              />
            </div>
            <label className={`alert-toggle ${newCartoon.alertEnabled ? 'active' : ''}`}>
              <input 
                type="checkbox" 
                checked={newCartoon.alertEnabled} 
                onChange={() => setNewCartoon({...newCartoon, alertEnabled: !newCartoon.alertEnabled})} 
              />
              <span className="cartoon-alert-icon">
                {newCartoon.alertEnabled ? <Bell size={16} /> : <BellOff size={16} />}
              </span>
              <span className="alert-text">Alerts</span>
            </label>
            <div className="form-actions">
              {editingId && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit} 
                  className="btn-cancel-edit"
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-add-cartoon">
                {editingId ? 'Save Changes 🛠️' : 'Add to Library 🚀'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lightbox / Image Preview Modal */}
      {previewItem && (
        <div className="image-lightbox" onClick={() => setPreviewItem(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setPreviewItem(null)}>
              &times;
            </button>
            <div className="lightbox-image-wrapper">
              <img 
                src={convertImageUrl(previewItem.imageUrl)} 
                alt={previewItem.title} 
                className="lightbox-image"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_SVG;
                }}
              />
            </div>
            <div className="lightbox-info">
              <h4 className="lightbox-title">{previewItem.title}</h4>
              <a 
                href={previewItem.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="lightbox-open-btn"
              >
                <ExternalLink size={18} /> Open Website
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartoonManager;
