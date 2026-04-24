import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, Plus } from 'lucide-react';
import './IncomeManager.css';

const IncomeManager = () => {
  const [incomes, setIncomes] = useState([]);
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [amountInput, setAmountInput] = useState('');
  
  const currentYear = new Date().getFullYear();

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
  const currentYearIncomes = incomes.filter(inc => inc.date && inc.date.startsWith(currentYear.toString()));
  const previousYearIncomes = incomes.filter(inc => inc.date && inc.date.startsWith((currentYear - 1).toString()));

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
        <h2 className="summary-title">Total Income:</h2>
        <div className="summary-values">
          <span className="summary-total">{formatCurrency(totalCurrentYear)}</span>
          <span className="summary-avg">({formatCurrency(avgMonthlySalary)})</span>
          <span className={yoyDiff >= 0 ? 'summary-diff profit' : 'summary-diff loss'}>
            ({yoyDiff > 0 ? '+' : ''}{formatCurrency(yoyDiff)})
          </span>
        </div>
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
        <button className="btn-add" onClick={handleAdd}>
          <Plus size={18} /> Add
        </button>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <h3 className="section-subtitle">Total Income</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 30, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{fontSize: 12}} />
            <YAxis tickFormatter={(val) => '$' + (val / 1000000) + 'M'} width={80} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Bar dataKey="amount" fill="#fed7aa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
          {incomes.map(inc => (
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
