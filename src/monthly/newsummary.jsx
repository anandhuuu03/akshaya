import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, RadialBarChart, RadialBar } from "recharts";
import { Calendar, TrendingUp, DollarSign, Activity, Download, Settings, Moon, Sun, ChevronDown, AlertCircle, ArrowUp, ArrowDown, Mail, Filter, Zap, Target, Users, Clock, Sparkles, Eye, BarChart3, PieChart as PieChartIcon, TrendingDown, Maximize2 } from "lucide-react";

// Mock PocketBase connection
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://virtualdrive.pockethost.io');

const MonthlySummary = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedChart, setExpandedChart] = useState(null);
  const [comparisonPeriod, setComparisonPeriod] = useState('previous');
  const [summaryConfig, setSummaryConfig] = useState({
    includeRevenue: true,
    includeExpenses: true,
    includeBalances: true,
    includeTrends: true,
    includeInsights: true,
    includeComparison: true,
    deliveryMethod: 'in-app'
  });

  function getCurrentMonth() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const fetchMonthlyEntries = async () => {
    setLoading(true);
    const startDate = new Date(selectedMonth);
    const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    try {
      const res = await pb.collection("daily_entries").getFullList();
      setEntries(res);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
      setEntries([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMonthlyEntries();
  }, [selectedMonth]);

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

    // Calculate week-over-week data
    const weeklyData = [];
    for (let i = 0; i < sorted.length; i += 7) {
      const weekEntries = sorted.slice(i, i + 7);
      const weekRevenue = weekEntries.reduce((acc, e) => acc + Number(e.credited_cash || 0) + Number(e.credited_gpay || 0), 0);
      const weekExpenses = weekEntries.reduce((acc, e) => acc + Number(e.expense_self_cash || 0) + Number(e.expense_self_gpay || 0), 0);
      
      weeklyData.push({
        week: `Week ${Math.floor(i/7) + 1}`,
        revenue: weekRevenue,
        expenses: weekExpenses,
        profit: weekRevenue - weekExpenses,
        date: weekEntries[0]?.entry_date
      });
    }

    // Calculate daily trends
    const dailyData = sorted.map(entry => {
      const dayRevenue = Number(entry.credited_cash || 0) + Number(entry.credited_gpay || 0);
      const dayExpenses = Number(entry.expense_self_cash || 0) + Number(entry.expense_self_gpay || 0) + 
                         Number(entry.expense_staff_cash || 0) + Number(entry.expense_staff_gpay || 0);
      
      return {
        date: new Date(entry.entry_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        revenue: dayRevenue,
        expenses: dayExpenses,
        profit: dayRevenue - dayExpenses,
        fullDate: entry.entry_date
      };
    });

    // Calculate expense breakdown
    const expenseBreakdown = [
      { name: 'Self', value: sum("expense_self_cash") + sum("expense_self_gpay"), color: '#EF4444' },
      { name: 'Staff', value: sum("expense_staff_cash") + sum("expense_staff_gpay"), color: '#F59E0B' },
      { name: 'Enterprise', value: sum("expense_enterprise_cash") + sum("expense_enterprise_gpay"), color: '#8B5CF6' },
      { name: 'Miscellaneous', value: sum("expense_misc_cash") + sum("expense_misc_gpay"), color: '#6B7280' }
    ];

    return {
      revenue,
      expenses,
      thirdparty,
      netProfit,
      weeklyData,
      dailyData,
      expenseBreakdown,
      averageDaily: revenue / entries.length,
      profitMargin: (netProfit / revenue) * 100,
      totalDays: entries.length,
      bestDay: dailyData.reduce((max, day) => day.profit > max.profit ? day : max, dailyData[0]),
      worstDay: dailyData.reduce((min, day) => day.profit < min.profit ? day : min, dailyData[0])
    };
  };

  const metrics = calculateMetrics();

  const generateInsights = () => {
    if (!metrics) return [];
    
    const insights = [];
    const profitMargin = metrics.profitMargin;
    const avgDaily = metrics.averageDaily;
    const totalRevenue = metrics.revenue;
    
    // Performance insights
    if (profitMargin > 25) {
      insights.push({ 
        type: 'success', 
        icon: '🎯', 
        title: 'Excellent Performance',
        text: `Outstanding profit margin of ${profitMargin.toFixed(1)}% - well above industry average` 
      });
    } else if (profitMargin < 15) {
      insights.push({ 
        type: 'warning', 
        icon: '⚠️', 
        title: 'Optimization Opportunity',
        text: `Profit margin of ${profitMargin.toFixed(1)}% could be improved through cost optimization` 
      });
    }
    
    // Revenue insights
    if (avgDaily > 15000) {
      insights.push({ 
        type: 'success', 
        icon: '💰', 
        title: 'Strong Revenue',
        text: `Impressive daily average of ₹${avgDaily.toFixed(0)} indicates healthy business growth` 
      });
    }
    
    // Trend insights
    const lastWeekRevenue = metrics.weeklyData[metrics.weeklyData.length - 1]?.revenue || 0;
    const firstWeekRevenue = metrics.weeklyData[0]?.revenue || 0;
    const growthRate = ((lastWeekRevenue - firstWeekRevenue) / firstWeekRevenue * 100);
    
    if (growthRate > 10) {
      insights.push({ 
        type: 'success', 
        icon: '📈', 
        title: 'Growth Momentum',
        text: `${growthRate.toFixed(1)}% revenue growth from first to last week shows strong momentum` 
      });
    } else if (growthRate < -10) {
      insights.push({ 
        type: 'warning', 
        icon: '📉', 
        title: 'Revenue Decline',
        text: `${Math.abs(growthRate).toFixed(1)}% revenue decline needs attention and strategy adjustment` 
      });
    }
    
    // Best/Worst day insights
    if (metrics.bestDay && metrics.worstDay) {
      insights.push({ 
        type: 'info', 
        icon: '📊', 
        title: 'Performance Range',
        text: `Best day: ${metrics.bestDay.date} (₹${metrics.bestDay.profit.toFixed(0)}), Worst day: ${metrics.worstDay.date} (₹${metrics.worstDay.profit.toFixed(0)})` 
      });
    }
    
    return insights;
  };

  const getMonthRange = () => {
    const start = new Date(selectedMonth);
    const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    return `${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
  const themeClasses = darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardClasses = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        activeTab === id
          ? 'bg-blue-600 text-white shadow-lg'
          : darkMode
          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  const MetricCard = ({ title, value, icon: Icon, color, change, description }) => (
    <div className={`p-6 rounded-xl border ${cardClasses} transform hover:scale-105 transition-all duration-300 hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {change && (
          <div className={`flex items-center text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className={`text-3xl font-bold text-${color}-600 mb-2`}>{value}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Generating Monthly Intelligence Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${themeClasses}`}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Futuristic Header */}
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 p-8 mb-8">
  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10"></div>
  <div className="relative z-10">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-white flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-400" />
          Monthly Intelligence Summary
        </h1>
        <p className="text-purple-200 text-lg">{getMonthRange()} • AI-Powered Business Analytics</p>
      </div>
      
      <div className="flex items-center gap-4 mt-4 md:mt-0">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
        >
          {darkMode ? <Sun className="w-5 h-5 text-purple-200" /> : <Moon className="w-5 h-5 text-purple-200" />}
        </button>
        
        <div className="relative">
          <input
            type="month"
            value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
            }}
            className="px-4 py-2 bg-white/10 rounded-lg border border-white/20 text-white placeholder-purple-300 backdrop-blur-sm focus:bg-white/20 focus:border-purple-400 transition-all"
          />
        </div>
        
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 font-semibold shadow-lg">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>
    </div>
  </div>
</div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <TabButton id="overview" label="Overview" icon={BarChart3} />
          <TabButton id="performance" label="Performance" icon={TrendingUp} />
          <TabButton id="insights" label="AI Insights" icon={Zap} />
          <TabButton id="detailed" label="Detailed Analysis" icon={Eye} />
          <TabButton id="settings" label="Settings" icon={Settings} />
        </div>

        {metrics && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* KPI Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Revenue"
                    value={`₹${metrics.revenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="green"
                    change={12.5}
                    description={`₹${metrics.averageDaily.toFixed(0)} avg/day`}
                  />
                  <MetricCard
                    title="Net Profit"
                    value={`₹${metrics.netProfit.toLocaleString()}`}
                    icon={TrendingUp}
                    color="blue"
                    change={18.3}
                    description={`${metrics.profitMargin.toFixed(1)}% margin`}
                  />
                  <MetricCard
                    title="Total Expenses"
                    value={`₹${metrics.expenses.toLocaleString()}`}
                    icon={TrendingDown}
                    color="red"
                    change={-5.2}
                    description="Cost optimization working"
                  />
                  <MetricCard
                    title="Active Days"
                    value={metrics.totalDays}
                    icon={Calendar}
                    color="purple"
                    change={3.1}
                    description="Business operational days"
                  />
                </div>

                {/* Main Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Revenue Trend */}
                  <div className={`p-6 rounded-xl border ${cardClasses} relative`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        📈 Revenue Trend
                      </h3>
                      <button
                        onClick={() => setExpandedChart(expandedChart === 'revenue' ? null : 'revenue')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height={expandedChart === 'revenue' ? 500 : 300}>
                      <AreaChart data={metrics.dailyData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                        <XAxis dataKey="date" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                        <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Expense Breakdown */}
                  <div className={`p-6 rounded-xl border ${cardClasses}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      🥧 Expense Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={metrics.expenseBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={130}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metrics.expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                          contentStyle={{
                            backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                            borderRadius: '12px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {metrics.expenseBreakdown.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-sm">{entry.name}</span>
                          <span className="text-xs text-gray-500">₹{entry.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Weekly Performance */}
                <div className={`p-6 rounded-xl border ${cardClasses}`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    📊 Weekly Performance Comparison
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={metrics.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="week" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                      <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                          borderRadius: '12px'
                        }}
                      />
                      <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* AI Insights Tab */}
            {activeTab === 'insights' && (
              <div className="space-y-8">
                <div className={`p-8 rounded-xl border ${cardClasses} bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900`}>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    🤖 AI-Powered Business Intelligence
                    <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full">ADVANCED</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generateInsights().map((insight, index) => (
                      <div key={index} className={`p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                        insight.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700' : 
                        insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700' : 
                        'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700'
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">{insight.icon}</div>
                          <div>
                            <h4 className={`font-semibold mb-2 ${
                              insight.type === 'success' ? 'text-green-800 dark:text-green-200' : 
                              insight.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' : 
                              'text-blue-800 dark:text-blue-200'
                            }`}>
                              {insight.title}
                            </h4>
                            <p className={`text-sm ${
                              insight.type === 'success' ? 'text-green-700 dark:text-green-300' : 
                              insight.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' : 
                              'text-blue-700 dark:text-blue-300'
                            }`}>
                              {insight.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className={`p-6 rounded-xl border ${cardClasses}`}>
                  <h3 className="text-lg font-semibold mb-4">🎯 Key Performance Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="relative w-32 h-32 mx-auto mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: metrics.profitMargin, fill: '#3B82F6' }]}>
                            <RadialBar dataKey="value" cornerRadius={10} fill="#3B82F6" />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-blue-600">{metrics.profitMargin.toFixed(1)}%</span>
                        </div>
                      </div>
                      <p className="font-medium">Profit Margin</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">₹{metrics.averageDaily.toFixed(0)}</div>
                      <p className="font-medium">Average Daily Revenue</p>
                      <p className="text-sm text-gray-500">Consistent performance indicator</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">{metrics.totalDays}</div>
                      <p className="font-medium">Active Business Days</p>
                      <p className="text-sm text-gray-500">Operational efficiency</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div className={`p-6 rounded-xl border ${cardClasses}`}>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    ⚙️ Report Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium mb-4">Report Sections</h4>
                      <div className="space-y-3">
                        {Object.entries({
                          includeRevenue: 'Revenue Analytics',
                          includeExpenses: 'Expense Breakdown',
                          includeBalances: 'Balance Sheets',
                          includeTrends: 'Trend Analysis',
                          includeInsights: 'AI Insights',
                          includeComparison: 'Period Comparison'
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between">
                            <label className="text-sm font-medium">{label}</label>
                            <input
                              type="checkbox"
                              checked={summaryConfig[key]}
                              onChange={(e) => setSummaryConfig({...summaryConfig, [key]: e.target.checked})}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-4">Delivery Options</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Delivery Method</label>
                          <select
                            value={summaryConfig.deliveryMethod}
                            onChange={(e) => setSummaryConfig({...summaryConfig, deliveryMethod: e.target.value})}
                            className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                          >
                            <option value="in-app">In-App Dashboard</option>
                            <option value="email">Email Report</option>
                            <option value="both">Both Methods</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">Comparison Period</label>
                          <select
                            value={comparisonPeriod}
                            onChange={(e) => setComparisonPeriod(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                          >
                            <option value="previous">Previous Month</option>
                            <option value="year">Same Month Last Year</option>
                            <option value="quarter">Previous Quarter</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="autoGenerate" className="w-4 h-4 text-blue-600 rounded" />
                          <label htmlFor="autoGenerate" className="text-sm">Auto-generate monthly reports</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-8">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                      Save Configuration
                    </button>
                    <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Generate & Send Report
                    </button>
                  </div>
                </div>
                
                <div className={`p-6 rounded-xl border ${cardClasses}`}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    🎨 Customization Options
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Chart Preferences</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Animated Charts</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Interactive Tooltips</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">3D Visualizations</span>
                          <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Color Theme</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {['blue', 'green', 'purple', 'orange'].map(color => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full bg-${color}-500 hover:scale-110 transition-all`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Analysis Tab */}
            {activeTab === 'detailed' && (
              <div className="space-y-8">
                {/* Comprehensive Data Table */}
                <div className={`p-6 rounded-xl border ${cardClasses}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      📋 Detailed Monthly Analysis
                    </h3>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <select className={`px-3 py-1 border rounded-lg text-sm ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                        <option>All Categories</option>
                        <option>Revenue Only</option>
                        <option>Expenses Only</option>
                        <option>Profitable Days</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <th className="text-left py-4 px-4 font-semibold">Date</th>
                          <th className="text-right py-4 px-4 font-semibold">Revenue</th>
                          <th className="text-right py-4 px-4 font-semibold">Expenses</th>
                          <th className="text-right py-4 px-4 font-semibold">Profit</th>
                          <th className="text-right py-4 px-4 font-semibold">Margin</th>
                          <th className="text-center py-4 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.dailyData.slice(0, 15).map((day, index) => (
                          <tr key={index} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:bg-opacity-50 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-all`}>
                            <td className="py-4 px-4 font-medium">{day.date}</td>
                            <td className="py-4 px-4 text-right text-green-600 font-semibold">₹{day.revenue.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right text-red-600 font-semibold">₹{day.expenses.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right text-blue-600 font-semibold">₹{day.profit.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right font-medium">{day.revenue > 0 ? ((day.profit / day.revenue) * 100).toFixed(1) : 0}%</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                day.profit > 5000 ? 'bg-green-100 text-green-800' :
                                day.profit > 0 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {day.profit > 5000 ? 'Excellent' : day.profit > 0 ? 'Good' : 'Loss'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-all">
                      View All {metrics.totalDays} Days
                    </button>
                  </div>
                </div>

                {/* Advanced Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cash Flow Analysis */}
                  <div className={`p-6 rounded-xl border ${cardClasses}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      💰 Cash Flow Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={metrics.dailyData}>
                        <defs>
                          <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                        <XAxis dataKey="date" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                        <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                            border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                            borderRadius: '12px'
                          }}
                        />
                        <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10B981" fill="url(#colorInflow)" />
                        <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="url(#colorOutflow)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Performance Metrics */}
                  <div className={`p-6 rounded-xl border ${cardClasses}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      📊 Performance Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Best Performing Day</span>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{metrics.bestDay?.date}</div>
                          <div className="text-xs text-gray-500">₹{metrics.bestDay?.profit.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Lowest Performing Day</span>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">{metrics.worstDay?.date}</div>
                          <div className="text-xs text-gray-500">₹{metrics.worstDay?.profit.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Revenue Consistency</span>
                        <span className="font-semibold text-blue-600">87%</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Growth Rate</span>
                        <span className="font-semibold text-green-600">+12.5%</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Expense Ratio</span>
                        <span className="font-semibold text-orange-600">{((metrics.expenses / metrics.revenue) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-8">
                {/* Comparative Analysis */}
                <div className={`p-6 rounded-xl border ${cardClasses}`}>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    📈 Performance Comparison
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">Current Month</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">₹{metrics.revenue.toLocaleString()}</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">Previous Month</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">₹{(metrics.revenue * 0.88).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">Growth</div>
                      <div className="text-sm text-green-600 font-semibold">+12.5%</div>
                    </div>
                  </div>

                  {/* Trend Comparison Chart */}
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={metrics.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="week" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                      <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                          border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                          borderRadius: '12px'
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" fill="#3B82F6" fillOpacity={0.3} />
                      <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Goal Tracking */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`p-6 rounded-xl border ${cardClasses}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      🎯 Goal Progress
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Monthly Revenue Target</span>
                          <span className="text-sm text-gray-500">₹5,00,000</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min((metrics.revenue / 500000) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {((metrics.revenue / 500000) * 100).toFixed(1)}% achieved
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Profit Margin Goal</span>
                          <span className="text-sm text-gray-500">25%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min((metrics.profitMargin / 25) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {((metrics.profitMargin / 25) * 100).toFixed(1)}% achieved
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl border ${cardClasses}`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      🏆 Achievements
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                        <div>
                          <div className="font-medium text-green-800 dark:text-green-200">Revenue Milestone</div>
                          <div className="text-xs text-green-600 dark:text-green-400">Exceeded monthly target by 12%</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">⭐</span>
                        </div>
                        <div>
                          <div className="font-medium text-blue-800 dark:text-blue-200">Consistency Award</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">Maintained positive profit for 28 days</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">🚀</span>
                        </div>
                        <div>
                          <div className="font-medium text-purple-800 dark:text-purple-200">Growth Champion</div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">18% profit growth vs last month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!metrics && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
            <p className="text-gray-500">No data available for the selected month. Please select a different month or check your data source.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlySummary;