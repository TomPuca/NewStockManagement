import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Edit3, Trash2, Cpu, Bluetooth } from 'lucide-react';
import './EInkManager.css';

const EInkManager = () => {
  const [devices, setDevices] = useState([]);
  const [name, setName] = useState('');
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);
  
  const iframeRef = useRef(null);

  // 1. Fetch devices from Firestore (real-time stream)
  useEffect(() => {
    const q = query(collection(db, "eink_devices"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setDevices(data);
    }, (error) => {
      console.error("Error loading eink devices from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen for 'EINK_READY' message from the iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'EINK_READY') {
        setIframeReady(true);
        // Send initial list immediately when iframe signals ready
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'UPDATE_DEVICES',
            devices
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [devices]);

  // 3. Keep iframe select options in sync when device list changes
  useEffect(() => {
    if (iframeReady && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_DEVICES',
        devices
      }, '*');
    }
  }, [devices, iframeReady]);

  // 4. Create or Update device
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !filter.trim()) {
      alert("Please fill in both Device Name and Filter Code!");
      return;
    }

    const deviceData = {
      name: name.trim(),
      filter: filter.trim(),
      updatedAt: new Date()
    };

    try {
      if (editingId) {
        // Update
        const docRef = doc(db, "eink_devices", editingId);
        await updateDoc(docRef, deviceData);
        setEditingId(null);
      } else {
        // Add new
        await addDoc(collection(db, "eink_devices"), {
          ...deviceData,
          createdAt: new Date()
        });
      }
      // Reset form
      setName('');
      setFilter('');
    } catch (error) {
      console.error("Error saving device:", error);
      alert("Error saving data. Please try again!");
    }
  };

  // 5. Delete device
  const handleDelete = async (id, deviceName) => {
    if (window.confirm(`Are you sure you want to delete device "${deviceName}"?`)) {
      try {
        await deleteDoc(doc(db, "eink_devices", id));
      } catch (error) {
        console.error("Error deleting device:", error);
        alert("Error deleting data.");
      }
    }
  };

  // 6. Set Form for Edit
  const handleEdit = (device) => {
    setEditingId(device.id);
    setName(device.name);
    setFilter(device.filter);
  };

  // 7. Cancel Edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setFilter('');
  };

  return (
    <div className="eink-manager glass-panel animate-fade-in">
      <div className="eink-manager-header">
        <h2 className="premium-title">📟 E-Ink Device Controller</h2>
        <p className="subtitle">Connect and control your E-Paper tags via Web Bluetooth & Sync option list from Firebase</p>
      </div>

      <div className="eink-main-layout">
        {/* CRUD Management Panel */}
        <div className="eink-crud-panel suggestion-section">
          <h3 className="premium-title">
            {editingId ? '✏️ Edit Device' : '➕ Add New Device'}
          </h3>
          <form onSubmit={handleSubmit} className="eink-crud-form">
            <div className="form-group-eink">
              <div className="input-field-eink">
                <label><Cpu size={15} /> Device Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Office clock, Living room clock..." 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="premium-input-eink"
                  required
                />
              </div>
              <div className="input-field-eink">
                <label><Bluetooth size={15} /> Bluetooth Filter Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. DLG-CLOCK-77e4a9, DLG-CLOCK-797ec1..." 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="premium-input-eink"
                  required
                />
              </div>
              <div className="form-actions-eink">
                {editingId && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit} 
                    className="btn-cancel-edit-eink"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-save-eink">
                  {editingId ? 'Update 🛠️' : 'Save Firebase 🚀'}
                </button>
              </div>
            </div>
          </form>

          {/* List of saved devices */}
          <div className="eink-device-list-container">
            <h4 
              className="list-title toggle-title"
              onClick={() => setShowDeviceList(!showDeviceList)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none' }}
            >
              <span>{showDeviceList ? '▼' : '▶'} Saved Devices List ({devices.length})</span>
            </h4>
            {showDeviceList && (
              devices.length === 0 ? (
                <p className="no-devices-text">No devices saved yet. Enter details above to add!</p>
              ) : (
                <div className="device-table-wrapper">
                  <table className="device-table">
                    <thead>
                      <tr>
                        <th>Device Name</th>
                        <th>Filter Code</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devices.map((device) => (
                        <tr key={device.id} className={editingId === device.id ? 'row-editing' : ''}>
                          <td className="device-name-cell">{device.name}</td>
                          <td className="device-filter-cell"><code>{device.filter}</code></td>
                          <td className="device-actions-cell">
                            <button 
                              onClick={() => handleEdit(device)} 
                              className="action-icon-btn edit-icon"
                              title="Edit"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDelete(device.id, device.name)} 
                              className="action-icon-btn delete-icon"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

        {/* Bluetooth Tag Controller iframe */}
        <div className="eink-controller-panel">
          <div className="eink-iframe-container">
            <iframe 
              ref={iframeRef}
              src="./eink.html" 
              allow="bluetooth" 
              title="E-Ink Controller" 
              className="eink-iframe"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EInkManager;
