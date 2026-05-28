import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Trash2, Edit3, Plus, ExternalLink, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import './3DManager.css';

const FALLBACK_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300' fill='none'><rect width='400' height='300' fill='%231e293b'/><path d='M200 70 L280 110 L280 190 L200 230 L120 190 L120 110 Z' stroke='%23818cf8' stroke-width='4' fill='none'/><path d='M200 70 L200 150 L280 110 M200 150 L120 110 M200 150 L200 230' stroke='%23818cf8' stroke-width='4'/><text x='50%25' y='80%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='14'>Image not available</text></svg>";

/**
 * Converts various image link formats to a directly embeddable URL.
 * 
 * Supported conversions:
 * - Google Drive share/view link  → direct thumbnail URL (via googleusercontent CDN)
 * - Google Drive open link        → direct thumbnail URL
 * - All other URLs                → returned as-is
 */
const convertImageUrl = (url) => {
  if (!url) return FALLBACK_SVG;

  // Match Google Drive file IDs from common link patterns:
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  const driveFileMatch = url.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/
  );

  if (driveFileMatch && driveFileMatch[1]) {
    const fileId = driveFileMatch[1];
    // Use the lh3.googleusercontent.com CDN for reliable embedding
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
};

const ThreeDManager = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Fetch 3D files from Firestore
  useEffect(() => {
    const q = query(collection(db, "gold_3d_files"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // console.log("3D Print Files fetched from Firestore:", data);
      setItems(data);
      setLoading(false);
    }, (error) => {
      // console.error("Firestore Error in ThreeDManager:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileUrl.trim() || !imageUrl.trim()) {
      alert("Please fill in both the 3D File Link and Image Link!");
      return;
    }

    const itemData = {
      title: title.trim() || "Untitled 3D Model",
      fileUrl: fileUrl.trim(),
      imageUrl: imageUrl.trim(),
      updatedAt: new Date()
    };

    try {
      if (editingId) {
        // Update existing item
        const docRef = doc(db, "gold_3d_files", editingId);
        await updateDoc(docRef, itemData);
        setEditingId(null);
      } else {
        // Add new item
        await addDoc(collection(db, "gold_3d_files"), {
          ...itemData,
          createdAt: new Date()
        });
      }
      // Reset form
      setTitle('');
      setFileUrl('');
      setImageUrl('');
    } catch (error) {
      // console.error("Error saving 3D file:", error);
      alert("An error occurred while saving. Please try again.");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setFileUrl(item.fileUrl);
    setImageUrl(item.imageUrl);
    // Scroll form into view on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "gold_3d_files", id));
      } catch (error) {
        // console.error("Error deleting 3D file:", error);
        alert("An error occurred while deleting. Please try again.");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setFileUrl('');
    setImageUrl('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <span>Loading 3D Print Library...</span>
      </div>
    );
  }

  return (
    <div className="three-d-manager glass-panel animate-fade-in">
      <div className="three-d-manager-header">
        <h2 className="premium-title">📐 3D Print Library</h2>
        <p className="subtitle">Manage and store your 3D printing model files</p>
      </div>

      {/* Input Form */}
      <div className="add-3d-section suggestion-section">
        <h3 className="suggestion-title premium-title">
          {editingId ? '✏️ Update Model' : '➕ Add New 3D Model'}
        </h3>
        <form onSubmit={handleSubmit} className="add-3d-form">
          <div className="form-group-3d">
            <div className="input-field">
              <label><FileText size={16} /> Model Name (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Eiffel Tower, Phone Stand, Cable Clip..." 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="premium-input"
              />
            </div>
            <div className="input-field">
              <label><LinkIcon size={16} /> 3D File Link (Required)</label>
              <input 
                type="url" 
                placeholder="https://..." 
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="premium-input"
                required
              />
            </div>
            <div className="input-field full-width">
              <label><ImageIcon size={16} /> 3D Image Link (Required)</label>
              <input 
                type="url" 
                placeholder="https://... (direct image link or Google Drive link)" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="premium-input"
                required
              />
            </div>
          </div>
          
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
            <button type="submit" className="btn-add-3d">
              {editingId ? 'Save Changes 🛠️' : 'Add to Library 🚀'}
            </button>
          </div>
        </form>
      </div>

      {/* Display Grid */}
      <div className="models-grid-section">
        <h3 className="section-subtitle">📦 Model Library ({items.length})</h3>
        {items.length === 0 ? (
          <div className="empty-state">
            <p className="no-data">No 3D models saved yet. Add your first model using the form above!</p>
          </div>
        ) : (
          <div className="models-grid">
            {items.map((item) => (
              <div key={item.id} className="model-card">
                <a 
                  href={item.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="model-image-link"
                  title="Click to open 3D file"
                >
                  <div className="model-image-container">
                    <img 
                      src={convertImageUrl(item.imageUrl)} 
                      alt={item.title} 
                      className="model-image"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_SVG;
                      }}
                    />
                    <div className="image-overlay">
                      <ExternalLink size={24} className="overlay-icon" />
                      <span className="overlay-text">Open 3D File</span>
                    </div>
                  </div>
                </a>

                <div className="model-info">
                  <h4 className="model-title" title={item.title}>
                    {item.title}
                  </h4>
                  <div className="model-card-actions">
                    <button 
                      onClick={() => handleEdit(item)} 
                      className="card-action-btn edit-btn"
                      title="Edit model"
                    >
                      <Edit3 size={16} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.title)} 
                      className="card-action-btn delete-btn"
                      title="Delete model"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreeDManager;
