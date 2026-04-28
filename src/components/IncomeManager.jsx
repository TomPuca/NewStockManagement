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
  
  const currentMonthCount = new Date().getMonth() + 1; // 1 to 12
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
