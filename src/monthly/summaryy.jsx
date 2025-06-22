import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Calendar, TrendingUp, DollarSign, Activity, Download, Settings, Moon, Sun, ChevronDown, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";

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
    includeInsights: true
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

  // Calculate metrics
  const calculateMetrics = () => {
    if (!entries.length) return null;

    const sorted = [...entries].sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
    const sum = (key) => entries.reduce((acc, e) => acc + Number(e[key] || 0), 0);

    const revenue = sum("credited_cash") + sum("credited_gpay") + sum("thirdparty_fee_cash") + sum("thirdparty_fee_gpay");
    const expenses = sum("expense_self_cash") + sum("expense_staff_cash") + sum("expense_enterprise_cash") + 
                    sum("expense_misc_cash") + sum("expense_self_gpay") + sum("expense_staff_gpay") + 
                    sum("expense_enterprise_gpay") + sum("expense_misc_gpay");
    const thirdparty = sum("thirdparty_paid_gpay") + sum("thirdparty_paid_cash");
    const netProfit = revenue - expenses - thirdparty;

    return {
      revenue,
      expenses,
      thirdparty,
      netProfit,
      dailyData: sorted.map(entry => ({
        date: new Date(entry.entry_date).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: Number(entry.credited_cash || 0) + Number(entry.credited_gpay || 0),
        expenses: Number(entry.expense_self_cash || 0) + Number(entry.expense_self_gpay || 0),
        profit: (Number(entry.credited_cash || 0) + Number(entry.credited_gpay || 0)) - 
                (Number(entry.expense_self_cash || 0) + Number(entry.expense_self_gpay || 0))
      }))
    };
  };

  const metrics = calculateMetrics();
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const getWeekRange = () => {
    const start = new Date(selectedWeek);
    const end = new Date(selectedWeek);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const generateInsights = () => {
    if (!metrics) return [];
    
    const insights = [];
    const avgDaily = metrics.revenue / 7;
    const profitMargin = (metrics.netProfit / metrics.revenue) * 100;
    
    if (profitMargin > 20) {
      insights.push({ type: 'positive', text: `Excellent profit margin of ${profitMargin.toFixed(1)}%` });
    } else if (profitMargin < 10) {
      insights.push({ type: 'warning', text: `Low profit margin of ${profitMargin.toFixed(1)}% - consider cost optimization` });
    }
    
    if (avgDaily > 10000) {
      insights.push({ type: 'positive', text: `Strong daily average revenue of ₹${avgDaily.toFixed(0)}` });
    }
    
    return insights;
  };

  const pieData = metrics ? [
    { name: 'Revenue', value: metrics.revenue, color: '#10B981' },
    { name: 'Expenses', value: metrics.expenses, color: '#EF4444' },
    { name: 'Third Party', value: metrics.thirdparty, color: '#F59E0B' }
  ] : [];

  const themeClasses = darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardClasses = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`min-h-screen transition-all duration-500 ${themeClasses}`}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📊 Weekly Intelligence Report
            </h1>
            <p className="text-gray-500">Week of {getWeekRange()}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="relative">
              <input
                type="date"
                value={selectedWeek.toISOString().split('T')[0]}
                onChange={(e) => setSelectedWeek(new Date(e.target.value))}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : metrics ? (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`p-6 rounded-xl border ${cardClasses} transform hover:scale-105 transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{metrics.revenue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500">+12.5%</span>
                  <span className="text-gray-500 ml-1">vs last week</span>
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${cardClasses} transform hover:scale-105 transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">₹{metrics.expenses.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-500">+5.2%</span>
                  <span className="text-gray-500 ml-1">vs last week</span>
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${cardClasses} transform hover:scale-105 transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Net Profit</p>
                    <p className="text-2xl font-bold text-blue-600">₹{metrics.netProfit.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500">+18.3%</span>
                  <span className="text-gray-500 ml-1">vs last week</span>
                </div>
              </div>

              <div className={`p-6 rounded-xl border ${cardClasses} transform hover:scale-105 transition-all duration-300`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Profit Margin</p>
                    <p className="text-2xl font-bold text-purple-600">{((metrics.netProfit / metrics.revenue) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500">+2.1%</span>
                  <span className="text-gray-500 ml-1">vs last week</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Trend Chart */}
              <div className={`p-6 rounded-xl border ${cardClasses}`}>
                <h3 className="text-lg font-semibold mb-4">📈 Daily Performance Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.dailyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="date" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                    <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px'
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Financial Breakdown */}
              <div className={`p-6 rounded-xl border ${cardClasses}`}>
                <h3 className="text-lg font-semibold mb-4">💰 Financial Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-sm">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className={`p-6 rounded-xl border ${cardClasses}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                🤖 AI-Powered Insights
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">BETA</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generateInsights().map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg flex items-start gap-3 ${
                    insight.type === 'positive' ? 'bg-green-50 border border-green-200' : 
                    insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <AlertCircle className={`w-5 h-5 mt-0.5 ${
                      insight.type === 'positive' ? 'text-green-600' : 
                      insight.type === 'warning' ? 'text-yellow-600' : 
                      'text-blue-600'
                    }`} />
                    <p className={`text-sm ${
                      insight.type === 'positive' ? 'text-green-800' : 
                      insight.type === 'warning' ? 'text-yellow-800' : 
                      'text-blue-800'
                    }`}>
                      {insight.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Metrics Table */}
            <div className={`p-6 rounded-xl border ${cardClasses}`}>
              <h3 className="text-lg font-semibold mb-4">📋 Detailed Weekly Metrics</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="text-left py-3 px-4 font-medium">Day</th>
                      <th className="text-right py-3 px-4 font-medium">Revenue</th>
                      <th className="text-right py-3 px-4 font-medium">Expenses</th>
                      <th className="text-right py-3 px-4 font-medium">Profit</th>
                      <th className="text-right py-3 px-4 font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.dailyData.map((day, index) => (
                      <tr key={index} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:bg-opacity-50 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                        <td className="py-3 px-4 font-medium">{day.date}</td>
                        <td className="py-3 px-4 text-right text-green-600">₹{day.revenue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-red-600">₹{day.expenses.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right text-blue-600">₹{day.profit.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">{day.revenue > 0 ? ((day.profit / day.revenue) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No data available for the selected week.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyReport;