import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, CheckCircle, XCircle, FileText, Download, Edit3, Trash2 } from 'lucide-react';
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://virtualdrive.pockethost.io');

const DailyReport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyEntries, setDailyEntries] = useState([]);
  const [dailyNotes, setDailyNotes] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDataForDate();
  }, [selectedDate]);

  const fetchDataForDate = async () => {
    setLoading(true);
    try {
      const res = await pb.collection('daily_entries').getFullList({
        sort: 'entry_date',
        filter: `entry_date >= "${selectedDate} 00:00:00" && entry_date <= "${selectedDate} 23:59:59"`
      });
      setDailyEntries(res);
    } catch (error) {
      console.error('Error fetching data:', error);
      setDailyEntries([]);
    }
    setLoading(false);
  };

  // Calculation functions
  const sum = (field) => dailyEntries.reduce((total, entry) => total + Number(entry[field] || 0), 0);
  
  const cashDeposited = sum('deposit_cash');
  const gpayDeposited = sum('deposit_gpay');
  const cashCollected = sum('credited_cash');
  const gpayCollected = sum('credited_gpay');
  const walletTopup = sum('ed_wallet_gpay');
  const portalUsed = sum('portal_gpay');

  // Expense calculations
  const cashExpenses = sum('expense_self_cash') + sum('expense_staff_cash') + sum('expense_enterprise_cash') + sum('expense_misc_cash');
  const gpayExpenses = sum('expense_self_gpay') + sum('expense_staff_gpay') + sum('expense_enterprise_gpay') + sum('expense_misc_gpay');
  const totalExpenses = cashExpenses + gpayExpenses;

  // Balance calculations
  const bankBalance = gpayDeposited + gpayCollected - (gpayExpenses + walletTopup);
  const cashInHand = cashCollected - cashExpenses - cashDeposited;
  const walletBalance = walletTopup - portalUsed;
  
  // Income and profit calculations
  const totalCustomerCollection = cashCollected + gpayCollected;
  const netProfit = totalCustomerCollection - (portalUsed + totalExpenses);
  
  // Pending amounts
  const pendingToReceive = sum('receive_cash') + sum('receive_gpay');
  const pendingToGive = sum('give_cash') + sum('give_gpay');

  // Date navigation
  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + direction);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Profitability indicator
  const getProfitabilityStatus = () => {
    if (netProfit > 0) return { icon: CheckCircle, text: 'Profit Day', color: 'text-green-600 bg-green-50' };
    if (netProfit === 0) return { icon: AlertTriangle, text: 'Break-even', color: 'text-yellow-600 bg-yellow-50' };
    return { icon: XCircle, text: 'Loss Day', color: 'text-red-600 bg-red-50' };
  };

  // Mismatch checker
  const getMismatches = () => {
    const mismatches = [];
    if (gpayDeposited < gpayCollected) {
      mismatches.push('GPay deposit is less than GPay credited - possible missing entries');
    }
    if (walletBalance < 0) {
      mismatches.push('Negative wallet balance detected');
    }
    return mismatches;
  };

  // Category-wise summary
  const getCategorySummary = () => {
    const categories = {};
    dailyEntries.forEach(entry => {
      const item = entry.item || 'Miscellaneous';
      const totalAmount = (entry.credited_cash || 0) + (entry.credited_gpay || 0);
      if (categories[item]) {
        categories[item] += totalAmount;
      } else {
        categories[item] = totalAmount;
      }
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  };

  // Expense category summary
  const getExpenseSummary = () => {
    return [
      { category: 'Self', cash: sum('expense_self_cash'), gpay: sum('expense_self_gpay') },
      { category: 'Staff', cash: sum('expense_staff_cash'), gpay: sum('expense_staff_gpay') },
      { category: 'Enterprise', cash: sum('expense_enterprise_cash'), gpay: sum('expense_enterprise_gpay') },
      { category: 'Miscellaneous', cash: sum('expense_misc_cash'), gpay: sum('expense_misc_gpay') }
    ];
  };

  // Running balance calculation
  const getRunningBalance = () => {
    let runningCash = 0;
    let runningBank = 0;
    let runningWallet = 0;
    
    return dailyEntries.map(entry => {
      runningCash += (entry.credited_cash || 0) - (entry.expense_self_cash || 0) - (entry.expense_staff_cash || 0) - (entry.expense_enterprise_cash || 0) - (entry.expense_misc_cash || 0) - (entry.deposit_cash || 0);
      runningBank += (entry.deposit_gpay || 0) + (entry.credited_gpay || 0) - (entry.expense_self_gpay || 0) - (entry.expense_staff_gpay || 0) - (entry.expense_enterprise_gpay || 0) - (entry.expense_misc_gpay || 0) - (entry.ed_wallet_gpay || 0);
      runningWallet += (entry.ed_wallet_gpay || 0) - (entry.portal_gpay || 0);
      
      return {
        ...entry,
        runningCash,
        runningBank,
        runningWallet
      };
    });
  };

  const profitStatus = getProfitabilityStatus();
  const mismatches = getMismatches();
  const categorySummary = getCategorySummary();
  const expenseSummary = getExpenseSummary();
  const runningBalanceData = getRunningBalance();

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvData = dailyEntries.map(entry => ({
      Item: entry.item,
      Customer: entry.customer_name,
      'Cash Credited': entry.credited_cash || 0,
      'GPay Credited': entry.credited_gpay || 0,
      'Cash Deposited': entry.deposit_cash || 0,
      'GPay Deposited': entry.deposit_gpay || 0,
      'Portal Payment': entry.portal_gpay || 0,
      'Wallet Topup': entry.ed_wallet_gpay || 0,
      Date: entry.entry_date
    }));
    
    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${selectedDate}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Daily Report Dashboard</h1>
          <div className="flex gap-2">
            <button onClick={handlePrintReport} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <FileText size={16} />
              Print
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigateDate(-1)} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50">
            <ChevronLeft size={16} />
            Previous
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button onClick={() => navigateDate(1)} className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50">
            Next
            <ChevronRight size={16} />
          </button>
          <button onClick={goToToday} className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900">
            Today
          </button>
        </div>
      </div>

      {/* Profitability Status & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-lg p-4 ${profitStatus.color} border`}>
          <div className="flex items-center gap-2">
            <profitStatus.icon size={20} />
            <span className="font-semibold">{profitStatus.text}</span>
            <span className="ml-auto font-bold">₹{Math.abs(netProfit)}</span>
          </div>
        </div>
        
        {mismatches.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={20} />
              <span className="font-semibold">Alerts</span>
            </div>
            <ul className="mt-2 text-sm text-red-600">
              {mismatches.map((mismatch, index) => (
                <li key={index}>• {mismatch}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 font-semibold">Total Income</div>
          <div className="text-2xl font-bold text-green-900">₹{totalCustomerCollection}</div>
          <div className="text-sm text-green-600">Cash: ₹{cashCollected} | GPay: ₹{gpayCollected}</div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-semibold">Total Expenses</div>
          <div className="text-2xl font-bold text-red-900">₹{totalExpenses}</div>
          <div className="text-sm text-red-600">Cash: ₹{cashExpenses} | GPay: ₹{gpayExpenses}</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800 font-semibold">Bank Balance</div>
          <div className="text-2xl font-bold text-blue-900">₹{bankBalance}</div>
          <div className="text-sm text-blue-600">Deposited: ₹{gpayDeposited}</div>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-orange-800 font-semibold">Cash in Hand</div>
          <div className="text-2xl font-bold text-orange-900">₹{cashInHand}</div>
          <div className="text-sm text-orange-600">Deposited: ₹{cashDeposited}</div>
        </div>
      </div>

      {/* Detailed Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Mode Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Mode Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Collections (Cash)</span>
              <span className="font-semibold text-green-600">₹{cashCollected}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Collections (GPay)</span>
              <span className="font-semibold text-green-600">₹{gpayCollected}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Deposits (Cash)</span>
              <span className="font-semibold text-blue-600">₹{cashDeposited}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Deposits (GPay)</span>
              <span className="font-semibold text-blue-600">₹{gpayDeposited}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Wallet Topup</span>
              <span className="font-semibold text-orange-600">₹{walletTopup}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Portal Usage</span>
              <span className="font-semibold text-red-600">₹{portalUsed}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="font-semibold">Wallet Balance</span>
              <span className="font-bold text-orange-700">₹{walletBalance}</span>
            </div>
          </div>
        </div>

        {/* Category-wise Income */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Service-wise Income</h3>
          <div className="space-y-2">
            {categorySummary.map(([category, amount]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="truncate">{category}</span>
                <span className="font-semibold">₹{amount}</span>
              </div>
            ))}
            {categorySummary.length === 0 && (
              <p className="text-gray-500 text-center">No services recorded</p>
            )}
          </div>
        </div>

        {/* Expense Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Expense Summary</h3>
          <div className="space-y-3">
            {expenseSummary.map(expense => (
              <div key={expense.category} className="space-y-1">
                <div className="font-medium text-gray-700">{expense.category}</div>
                <div className="flex justify-between text-sm">
                  <span>Cash: ₹{expense.cash}</span>
                  <span>GPay: ₹{expense.gpay}</span>
                  <span className="font-semibold">Total: ₹{expense.cash + expense.gpay}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Amounts */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Pending Amounts</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>To Receive (Cash)</span>
              <span className="font-semibold text-green-600">₹{sum('receive_cash')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>To Receive (GPay)</span>
              <span className="font-semibold text-green-600">₹{sum('receive_gpay')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>To Give (Cash)</span>
              <span className="font-semibold text-red-600">₹{sum('give_cash')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>To Give (GPay)</span>
              <span className="font-semibold text-red-600">₹{sum('give_gpay')}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Net Pending</span>
                <span className={pendingToReceive - pendingToGive >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ₹{Math.abs(pendingToReceive - pendingToGive)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Calculations */}
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-center">Final Day Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-gray-600 font-medium">Net Profit/Loss</div>
            <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(netProfit)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Income - (Portal + Expenses)
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-gray-600 font-medium">Cash Position</div>
            <div className={`text-3xl font-bold ${cashInHand >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(cashInHand)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Available Cash</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-gray-600 font-medium">Digital Balance</div>
            <div className={`text-3xl font-bold ${bankBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(bankBalance)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Bank + Wallet</div>
          </div>
        </div>
      </div>



      {/* Daily Notes */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Notes</h3>
        <textarea
          value={dailyNotes}
          onChange={(e) => setDailyNotes(e.target.value)}
          placeholder="Add notes about today's activities, observations, or reminders..."
          className="w-full h-24 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Save Notes
        </button>
      </div>
    </div>
  );
};

export default DailyReport;