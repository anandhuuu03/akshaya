import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Calendar, TrendingUp, DollarSign, Activity, Download, Settings, Moon, Sun, ChevronDown, AlertCircle, ArrowUp, ArrowDown, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

// Mock PocketBase connection (replace with actual PocketBase import)
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://virtualdrive.pockethost.io');

const WeeklyReport = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeek());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    includeRevenue: true,
    includeExpenses: true,
    includeBalances: true,
    includeTrends: true,
    includeInsights: true,
    includePanOperations: true
  });

  function getCurrentWeek() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek;
  }

  const fetchWeeklyEntries = async () => {
    setLoading(true);
    const startDate = new Date(selectedWeek);
    const endDate = new Date(selectedWeek);
    endDate.setDate(startDate.getDate() + 6);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    try {
      const res = await pb.collection("daily_entries").getFullList({
        filter: `entry_date >= "${startDateStr}" && entry_date <= "${endDateStr}"`
      });
      setEntries(res);
    } catch (error) {
      console.error("Error fetching weekly data:", error);
      setEntries([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWeeklyEntries();
  }, [selectedWeek]);

  // Calculate comprehensive metrics with new PAN operations
  const calculateMetrics = () => {
    if (!entries.length) return null;

    const sorted = [...entries].sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
    const sum = (key) => entries.reduce((acc, e) => acc + Number(e[key] || 0), 0);

    // Direct service revenue
    const directRevenueCash = sum("credited_cash");
    const directRevenueGpay = sum("credited_gpay");

    // Third-party service fees (full amount received from customer)
    const serviceFeesCash = sum("thirdparty_fee_cash");
    const serviceFeesGpay = sum("thirdparty_fee_gpay");

    // PAN operations revenue
    const panOperationCash = sum("pan_operation_cash");
    const panOperationGpay = sum("pan_operation_gpay");
    const totalPanRevenue = (panOperationCash + panOperationGpay) * 250; // ₹250 per operation

    // Total revenue (updated calculation)
    const totalRevenue = directRevenueCash + directRevenueGpay + serviceFeesCash + serviceFeesGpay + totalPanRevenue;

    // Expenses
    const cashExpenses = sum("expense_self_cash") + sum("expense_staff_cash") + sum("expense_enterprise_cash") + sum("expense_misc_cash");
    const gpayExpenses = sum("expense_self_gpay") + sum("expense_staff_gpay") + sum("expense_enterprise_gpay") + sum("expense_misc_gpay");
    const totalExpenses = cashExpenses + gpayExpenses;

    // Third-party payments
    const thirdpartyCash = sum("thirdparty_paid_cash");
    const thirdpartyGpay = sum("thirdparty_paid_gpay");
    const totalThirdparty = thirdpartyCash + thirdpartyGpay;

    // PAN wallet operations cost
    const totalPanUsage = (panOperationCash + panOperationGpay) * 102; // ₹102 per operation

    // Portal and wallet usage
    const portalUsed = sum("portal_gpay");
    const walletTopup = sum("ed_wallet_gpay");

    // Net profit calculation (updated)
    const netProfit = totalRevenue - (totalExpenses + portalUsed + totalThirdparty + totalPanUsage);

    // Daily breakdown with updated calculations
    const dailyData = sorted.map(entry => {
      const dailyDirectRevenue = Number(entry.credited_cash || 0) + Number(entry.credited_gpay || 0);
      const dailyServiceFees = Number(entry.thirdparty_fee_cash || 0) + Number(entry.thirdparty_fee_gpay || 0);
      const dailyPanOps = Number(entry.pan_operation_cash || 0) + Number(entry.pan_operation_gpay || 0);
      const dailyPanRevenue = dailyPanOps * 250;
      const dailyTotalRevenue = dailyDirectRevenue + dailyServiceFees + dailyPanRevenue;
      
      const dailyExpenses = Number(entry.expense_self_cash || 0) + Number(entry.expense_self_gpay || 0) + 
                           Number(entry.expense_staff_cash || 0) + Number(entry.expense_staff_gpay || 0) +
                           Number(entry.expense_enterprise_cash || 0) + Number(entry.expense_enterprise_gpay || 0) +
                           Number(entry.expense_misc_cash || 0) + Number(entry.expense_misc_gpay || 0);
      
      const dailyThirdparty = Number(entry.thirdparty_paid_cash || 0) + Number(entry.thirdparty_paid_gpay || 0);
      const dailyPanCost = dailyPanOps * 102;
      const dailyPortal = Number(entry.portal_gpay || 0);
      
      const dailyProfit = dailyTotalRevenue - (dailyExpenses + dailyThirdparty + dailyPanCost + dailyPortal);

      return {
        date: new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: entry.entry_date,
        revenue: dailyTotalRevenue,
        directRevenue: dailyDirectRevenue,
        serviceFees: dailyServiceFees,
        panRevenue: dailyPanRevenue,
        expenses: dailyExpenses,
        thirdparty: dailyThirdparty,
        panCost: dailyPanCost,
        profit: dailyProfit,
        panOperations: dailyPanOps
      };
    });

    // Weekly balances (using last day's data)
    const lastEntry = sorted[sorted.length - 1];
    const weeklyBalances = {
      bankBalance: Number(lastEntry?.opening_bank_balance || 0),
      cashInHand: Number(lastEntry?.opening_cash_balance || 0),
      walletBalance: Number(lastEntry?.opening_wallet_balance || 0),
      panWalletBalance: Number(lastEntry?.opening_pan_wallet || 0)
    };

    return {
      totalRevenue,
      directRevenue: directRevenueCash + directRevenueGpay,
      serviceFees: serviceFeesCash + serviceFeesGpay,
      panRevenue: totalPanRevenue,
      totalExpenses,
      totalThirdparty,
      totalPanUsage,
      portalUsed,
      netProfit,
      dailyData,
      weeklyBalances,
      panOperationsCount: panOperationCash + panOperationGpay,
      avgDailyRevenue: totalRevenue / 7,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    };
  };

  const metrics = calculateMetrics();
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const getWeekRange = () => {
    const start = new Date(selectedWeek);
    const end = new Date(selectedWeek);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const generateInsights = () => {
    if (!metrics) return [];
    
    const insights = [];
    const { profitMargin, avgDailyRevenue, panOperationsCount, netProfit } = metrics;
    
    // Profitability insights
    if (profitMargin > 20) {
      insights.push({ 
        type: 'positive', 
        icon: CheckCircle,
        text: `Excellent profit margin of ${profitMargin.toFixed(1)}%` 
      });
    } else if (profitMargin < 10) {
      insights.push({ 
        type: 'warning', 
        icon: AlertTriangle,
        text: `Low profit margin of ${profitMargin.toFixed(1)}% - consider cost optimization` 
      });
    }
    
    // Revenue insights
    if (avgDailyRevenue > 10000) {
      insights.push({ 
        type: 'positive', 
        icon: TrendingUp,
        text: `Strong daily average revenue of ₹${avgDailyRevenue.toFixed(0)}` 
      });
    }
    
    // PAN operations insights
    if (panOperationsCount > 0) {
      const panProfit = metrics.panRevenue - metrics.totalPanUsage;
      const panMargin = (panProfit / metrics.panRevenue) * 100;
      insights.push({ 
        type: panMargin > 50 ? 'positive' : 'info', 
        icon: Activity,
        text: `${panOperationsCount} PAN operations with ${panMargin.toFixed(1)}% margin` 
      });
    }
    
    // Overall performance
    if (netProfit > 0) {
      insights.push({ 
        type: 'positive', 
        icon: CheckCircle,
        text: `Profitable week with ₹${netProfit.toFixed(0)} net profit` 
      });
    } else if (netProfit < 0) {
      insights.push({ 
        type: 'warning', 
        icon: XCircle,
        text: `Loss of ₹${Math.abs(netProfit).toFixed(0)} - review expenses` 
      });
    }
    
    return insights;
  };

  const getRevenueBreakdown = () => {
    if (!metrics) return [];
    return [
      { name: 'Direct Services', value: metrics.directRevenue, color: '#10B981' },
      { name: 'Service Fees', value: metrics.serviceFees, color: '#3B82F6' },
      { name: 'PAN Operations', value: metrics.panRevenue, color: '#8B5CF6' }
    ].filter(item => item.value > 0);
  };

  const getCostBreakdown = () => {
    if (!metrics) return [];
    return [
      { name: 'Expenses', value: metrics.totalExpenses, color: '#EF4444' },
      { name: 'Third Party', value: metrics.totalThirdparty, color: '#F59E0B' },
      { name: 'PAN Costs', value: metrics.totalPanUsage, color: '#EC4899' },
      { name: 'Portal Usage', value: metrics.portalUsed, color: '#6B7280' }
    ].filter(item => item.value > 0);
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction * 7));
    setSelectedWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(getCurrentWeek());
  };

  const handleExportCSV = () => {
    if (!metrics || !metrics.dailyData.length) {
      alert("No data to export");
      return;
    }

    const csvData = metrics.dailyData.map(day => ({
      Date: day.fullDate,
      'Total Revenue': day.revenue,
      'Direct Revenue': day.directRevenue,
      'Service Fees': day.serviceFees,
      'PAN Revenue': day.panRevenue,
      'PAN Operations': day.panOperations,
      'Total Expenses': day.expenses,
      'Third Party': day.thirdparty,
      'PAN Costs': day.panCost,
      'Net Profit': day.profit
    }));

    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-report-${getWeekRange().replace(/\//g, '-')}.csv`;
    a.click();
  };

  const themeClasses = darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardClasses = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading weekly report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`${cardClasses} rounded-lg border p-6 mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8 text-blue-500" />
                Weekly Business Report
              </h1>
              <p className="text-gray-500 mt-1">{getWeekRange()}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Week Navigation */}
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <ArrowDown className="h-4 w-4 rotate-90" />
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                Current Week
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <ArrowUp className="h-4 w-4 rotate-90" />
              </button>
              
              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg border ${cardClasses} hover:bg-gray-100 transition-colors`}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {!metrics ? (
          <div className={`${cardClasses} rounded-lg border p-8 text-center`}>
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-gray-500">No entries found for the selected week period.</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className={`${cardClasses} rounded-lg border p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{metrics.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className={`${cardClasses} rounded-lg border p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Net Profit</p>
                    <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{metrics.netProfit.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className={`h-8 w-8 ${metrics.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </div>
              
              <div className={`${cardClasses} rounded-lg border p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Profit Margin</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.profitMargin.toFixed(1)}%</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className={`${cardClasses} rounded-lg border p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">PAN Operations</p>
                    <p className="text-2xl font-bold text-purple-600">{metrics.panOperationsCount}</p>
                  </div>
                  <Settings className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Insights */}
            {generateInsights().length > 0 && (
              <div className={`${cardClasses} rounded-lg border p-6 mb-6`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Weekly Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {generateInsights().map((insight, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        insight.type === 'positive' ? 'bg-green-50 text-green-800 border border-green-200' :
                        insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                        'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      <insight.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{insight.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Daily Trend */}
              <div className={`${cardClasses} rounded-lg border p-6`}>
                <h3 className="text-lg font-semibold mb-4">Daily Performance Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="profit" stackId="2" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Breakdown */}
              <div className={`${cardClasses} rounded-lg border p-6`}>
                <h3 className="text-lg font-semibold mb-4">Revenue Sources</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getRevenueBreakdown()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getRevenueBreakdown().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className={`${cardClasses} rounded-lg border p-6`}>
              <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">PAN Ops</th>
                      <th className="text-right p-2">Expenses</th>
                      <th className="text-right p-2">Profit</th>
                      <th className="text-right p-2">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.dailyData.map((day, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{day.date}</td>
                        <td className="p-2 text-right">₹{day.revenue.toLocaleString()}</td>
                        <td className="p-2 text-right">{day.panOperations}</td>
                        <td className="p-2 text-right">₹{day.expenses.toLocaleString()}</td>
                        <td className={`p-2 text-right font-medium ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{day.profit.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">
                          {day.revenue > 0 ? ((day.profit / day.revenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WeeklyReport;