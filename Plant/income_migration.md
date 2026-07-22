# Hướng dẫn di chuyển trang Income (Quản lý Thu nhập) sang dự án mới

Tài liệu này chứa toàn bộ thông tin cần thiết để chuyển tính năng **Income (Quản lý Thu nhập)** từ dự án hiện tại sang một dự án khác. Tài liệu bao gồm cấu hình Firebase, cấu trúc dữ liệu Firestore, mã nguồn React (JSX), mã nguồn CSS, và hướng dẫn tích hợp.

---

## 1. Tham số Cấu hình Firebase (Firebase Configuration)

Dự án hiện tại sử dụng cấu hình Firebase bên dưới. Bạn có thể sử dụng lại hoặc thay thế bằng thông số Firebase của dự án mới.

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDl0oKQRCOHexa-EloSX_pJFN-lkSqibtc",
  authDomain: "stockrealtime-5c049.firebaseapp.com",
  databaseURL: "https://stockrealtime-5c049.firebaseio.com",
  projectId: "stockrealtime-5c049",
  storageBucket: "stockrealtime-5c049.appspot.com",
  messagingSenderId: "144010414262",
  appId: "1:144010414262:web:322dbb3aa4889756587e17",
  measurementId: "G-J2YJH55K7K",
};
```

---

## 2. Cấu trúc Database Firestore (Firestore Schema)

Trang Income lưu trữ dữ liệu trong collection tên là `incomes`. Mỗi document trong collection này đại diện cho một giao dịch thu nhập với các trường thông tin sau:

### Collection: `incomes`

| Tên trường (Field) | Kiểu dữ liệu (Type) | Mô tả | Định dạng ví dụ |
| :--- | :--- | :--- | :--- |
| `id` | `String` | ID tự động sinh ra bởi Firestore | `"xY789abcDeF..."` |
| `date` | `String` | Ngày nhận khoản thu nhập (định dạng YYYY-MM-DD) | `"2026-07-14"` |
| `amount` | `Number` | Số tiền thu nhập | `50000000` (50 triệu VND) |
| `timestamp` | `Timestamp` | Thời gian tạo bản ghi trên server Firebase | `serverTimestamp()` |

> **Quy tắc bảo mật Firestore (Firestore Security Rules):**
> Đảm bảo collection `incomes` được cấu hình quyền đọc/ghi phù hợp (ví dụ: chỉ cho phép user đã đăng nhập đọc/ghi dữ liệu của chính họ).

---

## 3. Thư viện Phụ thuộc (Dependencies)

Để trang Income hoạt động ổn định ở dự án mới, hãy cài đặt các thư viện sau:

```bash
npm install firebase recharts lucide-react react
```

- **firebase**: Giao tiếp với database Firestore.
- **recharts**: Vẽ biểu đồ thu nhập hàng tháng (cột).
- **lucide-react**: Các icon UI (Calendar, DollarSign, Plus).

---

## 4. Mã nguồn Component React (`IncomeManager.jsx`)

Tạo file `src/components/IncomeManager.jsx` với nội dung sau:

```jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Calendar, DollarSign, Plus } from 'lucide-react';
import './IncomeManager.css';

const IncomeManager = () => {
  const [incomes, setIncomes] = useState([]);
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [amountInput, setAmountInput] = useState('');
  
  const realCurrentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(realCurrentYear);

  const years = [];
  for (let y = realCurrentYear; y >= 2022; y--) {
    years.push(y);
  }

  useEffect(() => {
    const q = query(collection(db, 'incomes'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIncomes(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/,/g, '');
    if (val === '' || /^\d*$/.test(val)) {
      setAmountInput(val);
    }
  };

  const handleAdd = async () => {
    if (!dateInput || !amountInput) return;
    try {
      await addDoc(collection(db, 'incomes'), {
        date: dateInput,
        amount: parseFloat(amountInput),
        timestamp: serverTimestamp()
      });
      setAmountInput('');
    } catch (error) {
      console.error("Error adding income:", error);
    }
  };

  // Calculations
  const currentYearIncomes = incomes.filter(inc => inc.date && inc.date.startsWith(selectedYear.toString()));
  const previousYearIncomes = incomes.filter(inc => inc.date && inc.date.startsWith((selectedYear - 1).toString()));

  const totalCurrentYear = currentYearIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const totalPreviousYear = previousYearIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  
  const avgMonthlySalary = totalCurrentYear / 12;
  const yoyDiff = totalCurrentYear - totalPreviousYear;

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US').format(Math.round(amount));

  // Chart & Table Data Preparation
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const monthlyData = monthNames.map((name, index) => {
    const monthIndexStr = (index + 1).toString().padStart(2, '0');
    const monthIncomes = currentYearIncomes.filter(inc => inc.date.substring(5, 7) === monthIndexStr);
    const sum = monthIncomes.reduce((acc, inc) => acc + inc.amount, 0);
    return { name, amount: sum };
  });

  return (
    <div className="income-manager">
      {/* Header Summary */}
      <div className="income-summary">
        <h2 className="summary-title premium-title">Total Income:</h2>
        <div className="summary-values">
          <span className="summary-total">{formatCurrency(totalCurrentYear)}</span>
          <span className="summary-avg">({formatCurrency(avgMonthlySalary)})</span>
          <span className={yoyDiff >= 0 ? 'summary-diff profit' : 'summary-diff loss'}>
            ({yoyDiff > 0 ? '+' : ''}{formatCurrency(yoyDiff)})
          </span>
        </div>
      </div>

      {/* Year Selector */}
      <div className="year-selector">
        {years.map(y => (
          <button 
            key={y} 
            className={`year-btn ${selectedYear === y ? 'active' : ''}`}
            onClick={() => setSelectedYear(y)}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="income-form">
        <div className="input-wrapper">
          <Calendar size={18} />
          <input 
            type="date" 
            className="form-input" 
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
          />
        </div>
        <div className="input-wrapper">
          <DollarSign size={18} />
          <input 
            type="text" 
            className="form-input"
            placeholder="Income amount..."
            value={amountInput ? formatCurrency(amountInput) : ''}
            onChange={handleAmountChange}
          />
        </div>
        <button className="add-button" onClick={handleAdd} style={{ width: 'auto', marginTop: 0 }}>
          <Plus size={18} /> Add
        </button>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <h3 className="section-subtitle">Total Income</h3>
        <div style={{ width: '100%', height: '320px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyData} 
              margin={{ top: 20, right: 30, left: 30, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                interval={0}
                tick={{fontSize: 10, fill: '#94a3b8'}}
                height={60}
                stroke="#475569"
              />
              <YAxis 
                tickFormatter={(val) => (val / 1000000).toFixed(0) + 'M'} 
                width={50} 
                tick={{fontSize: 11, fill: '#94a3b8'}}
                stroke="#475569"
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)} 
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
              />
              {avgMonthlySalary > 0 && (
                <ReferenceLine 
                  y={avgMonthlySalary} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  label={{ position: 'top', value: `Avg: ${formatCurrency(avgMonthlySalary)}`, fill: '#fbbf24', fontSize: 10 }} 
                />
              )}
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => {
                  const monthColors = [
                    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', 
                    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#6366f1', '#a855f7'
                  ];
                  return <Cell key={`cell-${index}`} fill={monthColors[index % monthColors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="monthly-table-grid">
        <div className="half-table">
          <table>
            <tbody>
              {monthlyData.slice(0, 6).map(item => (
                <tr key={item.name}>
                  <th>{item.name}</th>
                  <td className="amount-cell">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="half-table">
          <table>
            <tbody>
              {monthlyData.slice(6, 12).map(item => (
                <tr key={item.name}>
                  <th>{item.name}</th>
                  <td className="amount-cell">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* History List */}
      <div className="history-list">
        <div className="history-grid">
          {currentYearIncomes.map(inc => (
            <div className="history-item" key={inc.id}>
              <span className="history-date">
                {inc.date ? new Date(inc.date).toLocaleDateString('en-GB') : ''}
              </span>
              <span className="history-amount amount-cell">{formatCurrency(inc.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IncomeManager;
```

---

## 5. File Styles (`IncomeManager.css`)

Tạo file `src/components/IncomeManager.css` với nội dung sau:

```css
.income-manager {
  width: 100%;
  max-width: 1440px;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 30px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Header */
.income-summary {
  display: flex;
  align-items: baseline;
  gap: 15px;
  flex-wrap: wrap;
}

.summary-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.summary-values {
  display: flex;
  align-items: baseline;
  gap: 12px;
  font-size: 1.3rem;
  font-weight: 700;
}

.summary-total {
  font-size: 1.5rem;
}

.summary-avg {
  color: #ef4444; /* Matches the red in the image example */
}

.summary-diff {
  font-size: 1.1rem;
}

.summary-diff.profit {
  color: #4ade80;
}

.summary-diff.loss {
  color: #f87171;
}

/* Year Selector */
.year-selector {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: -10px;
}

.year-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.year-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.year-btn.active {
  background: var(--primary, #3b82f6);
  color: white;
  border-color: var(--primary, #3b82f6);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* Form */
.income-form {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

/* Chart */
.chart-container {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 30px;
  min-height: 400px;
}

/* Table */
.monthly-table-grid {
  display: flex;
  gap: 30px;
  background: rgba(255, 255, 255, 0.02);
  padding: 25px;
  border-radius: 16px;
  margin-bottom: 20px;
}

.half-table {
  flex: 1;
}

.half-table table {
  width: 100%;
  border-collapse: collapse;
}

.half-table th, .half-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.half-table th {
  font-weight: 600;
}

.amount-cell {
  text-align: right !important;
  color: #3b82f6; /* Blue matched with image */
  font-weight: 500;
}

/* History */
.history-list {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Mobile Breakpoints */
@media (max-width: 768px) {
  .income-summary {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
  
  .summary-title {
    font-size: 1.2rem;
  }

  .summary-values {
    flex-direction: column;
    align-items: center;
    gap: 5px;
    font-size: 1.1rem;
  }

  .summary-total {
    font-size: 1.4rem;
  }

  .monthly-table-grid {
    flex-direction: column;
    gap: 10px;
  }
}
```

---

## 6. Biến CSS và Thiết lập Môi trường UI (Global CSS Variables)

Mã CSS của `IncomeManager.css` sử dụng các CSS variables dùng chung của dự án. Để giao diện hiển thị đúng chuẩn Glassmorphism và tối màu (Dark mode) như phiên bản gốc, hãy khai báo các biến này trong file CSS global (ví dụ: `src/index.css` hoặc `src/App.css`):

```css
:root {
  --primary: #3b82f6;
  --glass-bg: rgba(30, 41, 59, 0.7); /* Màu nền bán trong suốt */
  --text-muted: #94a3b8;
}
```

---

## 7. Tích hợp Component vào Dự án Mới

Để hiển thị trang `IncomeManager`, hãy import và sử dụng nó trong Router hoặc Component hiển thị chính (ví dụ: `App.jsx`):

```jsx
import React, { useState } from 'react';
import IncomeManager from './components/IncomeManager';

function App() {
  const [activeTab, setActiveTab] = useState('income');

  return (
    <div className="app-container">
      {activeTab === 'income' && <IncomeManager />}
    </div>
  );
}
```
