import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Trash2, Edit3, Plus, ExternalLink, Image as ImageIcon, Link as LinkIcon, FileText, ZoomIn } from 'lucide-react';
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
    // Use the official/reliable thumbnail endpoint with standard query parameters to request high-res (1200px width)
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
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
  
  // Upload states
  const [useUpload, setUseUpload] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Lightbox preview state
  const [previewItem, setPreviewItem] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileUrl.trim() || !imageUrl.trim()) {
      alert("Please fill in both the 3D File Link and Image!");
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
      setUploadError('');
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
    // If it's already an ImgBB link, default to upload view for previewing, otherwise URL mode
    setUseUpload(item.imageUrl.includes('ibb.co') || item.imageUrl.includes('imgbb'));
    setUploadError('');
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
    setUploadError('');
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
              <div className="input-header-row">
                <label><ImageIcon size={16} /> 3D Image (Required)</label>
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
                      id="imgbb-upload-input"
                      disabled={uploadingImage}
                    />
                    <label htmlFor="imgbb-upload-input" className={`file-upload-label ${uploadingImage ? 'uploading' : ''}`}>
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
                  required={!useUpload}
                />
              )}
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
                <div 
                  className="model-image-link"
                  onClick={() => setPreviewItem(item)}
                  title="Click to zoom image"
                  style={{ cursor: 'pointer' }}
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
                      <ZoomIn size={24} className="overlay-icon" />
                      <span className="overlay-text">Zoom Image</span>
                    </div>
                  </div>
                </div>

                <div className="model-info">
                  <h4 className="model-title" title={item.title}>
                    {item.title}
                  </h4>
                  <div className="model-card-actions">
                    <a 
                      href={item.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="card-action-btn open-btn"
                      title="Open 3D File"
                    >
                      <ExternalLink size={14} /> Open
                    </a>
                    <button 
                      onClick={() => handleEdit(item)} 
                      className="card-action-btn edit-btn"
                      title="Edit model"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.title)} 
                      className="card-action-btn delete-btn"
                      title="Delete model"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                href={previewItem.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="lightbox-open-btn"
              >
                <ExternalLink size={18} /> Open 3D File Webpage
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreeDManager;
