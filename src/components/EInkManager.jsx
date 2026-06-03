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
      alert("Vui lòng điền đầy đủ Tên thiết bị và Mã lọc!");
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
      alert("Lỗi khi lưu dữ liệu. Vui lòng thử lại!");
    }
  };

  // 5. Delete device
  const handleDelete = async (id, deviceName) => {
    if (window.confirm(`Bạn có chắc muốn xoá thiết bị "${deviceName}"?`)) {
      try {
        await deleteDoc(doc(db, "eink_devices", id));
      } catch (error) {
        console.error("Error deleting device:", error);
        alert("Lỗi khi xoá dữ liệu.");
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
        {/* Left column: Bluetooth Tag Controller iframe */}
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

        {/* Right column: CRUD Management Panel */}
        <div className="eink-crud-panel suggestion-section">
          <h3 className="suggestion-title premium-title">
            {editingId ? '✏️ Chỉnh sửa thiết bị' : '➕ Thêm thiết bị mới'}
          </h3>
          <form onSubmit={handleSubmit} className="eink-crud-form">
            <div className="form-group-eink">
              <div className="input-field-eink">
                <label><Cpu size={15} /> Tên thiết bị</label>
                <input 
                  type="text" 
                  placeholder="e.g. Đồng hồ cơ quan trên, Đồng hồ phòng khách..." 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="premium-input-eink"
                  required
                />
              </div>
              <div className="input-field-eink">
                <label><Bluetooth size={15} /> Mã lọc Bluetooth</label>
                <input 
                  type="text" 
                  placeholder="e.g. DLG-CLOCK-77e4a9, DLG-CLOCK-797ec1..." 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="premium-input-eink"
                  required
                />
              </div>
            </div>
            
            <div className="form-actions-eink">
              {editingId && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit} 
                  className="btn-cancel-edit-eink"
                >
                  Huỷ
                </button>
              )}
              <button type="submit" className="btn-save-eink">
                {editingId ? 'Cập nhật 🛠️' : 'Lưu Firebase 🚀'}
              </button>
            </div>
          </form>

          {/* List of saved devices */}
          <div className="eink-device-list-container">
            <h4 className="list-title">Danh sách thiết bị đã lưu ({devices.length})</h4>
            {devices.length === 0 ? (
              <p className="no-devices-text">Chưa có thiết bị nào được lưu. Nhập dữ liệu ở trên để thêm!</p>
            ) : (
              <div className="device-table-wrapper">
                <table className="device-table">
                  <thead>
                    <tr>
                      <th>Tên Thiết Bị</th>
                      <th>Mã Lọc</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>Hành động</th>
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
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            onClick={() => handleDelete(device.id, device.name)} 
                            className="action-icon-btn delete-icon"
                            title="Xoá"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EInkManager;
