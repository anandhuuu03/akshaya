import { useState, useEffect } from "react";
import { pb } from "../Pocketbase";

const Homepage = () => {
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    item: "", 
    customer_name: "",

    // service
    credited_amount: "", 
    credited_mode: "cash",

    // bank deposit
    deposit_amount: "", 
    deposit_mode: "cash",

    // portal and ed-wallet (GPay only)
    portal_gpay: "", 
    ed_wallet_gpay: "",

    // expenses
    expense_self: "", expense_self_mode: "cash",
    expense_staff: "", expense_staff_mode: "cash",
    expense_enterprise: "", expense_enterprise_mode: "cash",
    expense_misc: "", expense_misc_mode: "cash",

    // pending
    receive_amount: "", receive_mode: "cash",
    give_amount: "", give_mode: "cash",
  });

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await pb.collection("daily_entries").getFullList({ 
        sort: "-entry_date",
        filter: `entry_date >= "${new Date().toISOString().split('T')[0]}"` // Today's entries
      });
      setEntries(res);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const data = {
        entry_date: form.entry_date,
        item: form.item,
        customer_name: form.customer_name,

        // Initialize all possible fields to 0
        credited_cash: 0,
        credited_gpay: 0,
        deposit_cash: 0,
        deposit_gpay: 0,
        portal_gpay: Number(form.portal_gpay) || 0,
        ed_wallet_gpay: Number(form.ed_wallet_gpay) || 0,
        expense_self_cash: 0,
        expense_self_gpay: 0,
        expense_staff_cash: 0,
        expense_staff_gpay: 0,
        expense_enterprise_cash: 0,
        expense_enterprise_gpay: 0,
        expense_misc_cash: 0,
        expense_misc_gpay: 0,
        receive_cash: 0,
        receive_gpay: 0,
        give_cash: 0,
        give_gpay: 0,
      };

      // Set values based on selected modes
      if (form.credited_amount) {
        data[`credited_${form.credited_mode}`] = Number(form.credited_amount);
      }
      if (form.deposit_amount) {
        data[`deposit_${form.deposit_mode}`] = Number(form.deposit_amount);
      }
      if (form.expense_self) {
        data[`expense_self_${form.expense_self_mode}`] = Number(form.expense_self);
      }
      if (form.expense_staff) {
        data[`expense_staff_${form.expense_staff_mode}`] = Number(form.expense_staff);
      }
      if (form.expense_enterprise) {
        data[`expense_enterprise_${form.expense_enterprise_mode}`] = Number(form.expense_enterprise);
      }
      if (form.expense_misc) {
        data[`expense_misc_${form.expense_misc_mode}`] = Number(form.expense_misc);
      }
      if (form.receive_amount) {
        data[`receive_${form.receive_mode}`] = Number(form.receive_amount);
      }
      if (form.give_amount) {
        data[`give_${form.give_mode}`] = Number(form.give_amount);
      }

      await pb.collection("daily_entries").create(data);
      
      // Reset form
      setForm({ 
        ...form, 
        item: "", 
        customer_name: "", 
        credited_amount: "", 
        deposit_amount: "", 
        portal_gpay: "", 
        ed_wallet_gpay: "", 
        expense_self: "", 
        expense_staff: "", 
        expense_enterprise: "", 
        expense_misc: "", 
        receive_amount: "", 
        give_amount: "" 
      });
      
      // Refresh entries
      await fetchEntries();
    } catch (err) {
      console.error("Error saving entry:", err);
      alert("Error saving entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate financial summary with corrected logic
  const calculateSummary = () => {
    const summary = entries.reduce((acc, entry) => {
      // Customer collections (actual revenue)
      acc.totalCashCollected += Number(entry.credited_cash || 0);
      acc.totalGpayCollected += Number(entry.credited_gpay || 0);

      // Deposits (money movement, not revenue)
      acc.totalCashDeposited += Number(entry.deposit_cash || 0);
      acc.totalGpayDeposited += Number(entry.deposit_gpay || 0);

      // Total expenses
      acc.totalExpenses += Number(entry.portal_gpay || 0);
      acc.totalExpenses += Number(entry.ed_wallet_gpay || 0);
      acc.totalExpenses += Number(entry.expense_self_cash || 0) + Number(entry.expense_self_gpay || 0);
      acc.totalExpenses += Number(entry.expense_staff_cash || 0) + Number(entry.expense_staff_gpay || 0);
      acc.totalExpenses += Number(entry.expense_enterprise_cash || 0) + Number(entry.expense_enterprise_gpay || 0);
      acc.totalExpenses += Number(entry.expense_misc_cash || 0) + Number(entry.expense_misc_gpay || 0);

      // Pending amounts
      acc.pendingReceivables += Number(entry.receive_cash || 0) + Number(entry.receive_gpay || 0);
      acc.pendingPayables += Number(entry.give_cash || 0) + Number(entry.give_gpay || 0);

      return acc;
    }, {
      totalCashCollected: 0,
      totalGpayCollected: 0,
      totalCashDeposited: 0,
      totalGpayDeposited: 0,
      totalExpenses: 0,
      pendingReceivables: 0,
      pendingPayables: 0,
    });

    // CORRECTED CALCULATIONS:
    
    // Cash in Hand = Cash collected from customers - Cash expenses
    // (Cash deposits don't affect cash in hand as they go to bank)
    const cashInHand = entries.reduce((sum, e) => 
      sum + 
      Number(e.credited_cash || 0) - 
      Number(e.expense_self_cash || 0) - 
      Number(e.expense_staff_cash || 0) - 
      Number(e.expense_enterprise_cash || 0) - 
      Number(e.expense_misc_cash || 0), 0
    );

    // Bank Balance = Deposits + GPay collections - GPay expenses
    const bankBalance = entries.reduce((sum, e) => 
      sum + 
      Number(e.deposit_cash || 0) +        // Cash deposited to bank
      Number(e.deposit_gpay || 0) +        // GPay deposited to bank  
      Number(e.credited_gpay || 0) -       // GPay from customers
      Number(e.portal_gpay || 0) -         // Portal payments (debited)
      Number(e.ed_wallet_gpay || 0) -      // ED wallet top-ups
      Number(e.expense_self_gpay || 0) -   // GPay expenses
      Number(e.expense_staff_gpay || 0) -
      Number(e.expense_enterprise_gpay || 0) -
      Number(e.expense_misc_gpay || 0), 0
    );

    // Calculate tally
    const totalRevenue = summary.totalCashCollected + summary.totalGpayCollected; // Only customer collections
    const netPosition = cashInHand + bankBalance;
    const expectedPosition = totalRevenue - summary.totalExpenses;
    const isTallied = Math.abs(netPosition - expectedPosition) < 0.01;

    return { 
      ...summary, 
      cashInHand, 
      bankBalance, 
      totalRevenue, 
      netPosition, 
      expectedPosition, 
      isTallied 
    };
  };

  const summary = calculateSummary();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💼 Akshaya Finance Tracker</h1>
          <p className="text-gray-600">Daily Transaction Management System</p>
          <p className="text-sm text-gray-500 mt-1">
            Today: {formatDate(new Date().toISOString().split('T')[0])}
          </p>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Entry Form */}
          <div className="xl:col-span-2">
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                📝 Daily Entry Form
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Date and Service Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">📅 Date</label>
                      <input
                        type="date"
                        name="entry_date"
                        value={form.entry_date}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">🛠️ Item / Service</label>
                      <input
                        type="text"
                        name="item"
                        value={form.item}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter details"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">👤 Customer Name</label>
                      <input
                        type="text"
                        name="customer_name"
                        value={form.customer_name}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter details"
                      />
                    </div>
                  </div>

                  {/* Revenue Section */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-green-700 mb-4">💰 Revenue & Deposits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Amount Received from Customer</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="credited_amount"
                            value={form.credited_amount}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <select
                            name="credited_mode"
                            value={form.credited_mode}
                            onChange={handleChange}
                            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="gpay">GPay</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Bank Deposit Made</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="deposit_amount"
                            value={form.deposit_amount}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <select
                            name="deposit_mode"
                            value={form.deposit_mode}
                            onChange={handleChange}
                            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="gpay">GPay</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portal Payments */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-red-700 mb-4">🏦 Portal & ED Wallet (GPay Only)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Portal Payment</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="portal_gpay"
                            value={form.portal_gpay}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <div className="border border-gray-300 p-3 rounded-lg bg-gray-100 text-gray-600">
                            GPay
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">ED Wallet Top-up</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="ed_wallet_gpay"
                            value={form.ed_wallet_gpay}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <div className="border border-gray-300 p-3 rounded-lg bg-gray-100 text-gray-600">
                            GPay
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-orange-700 mb-4">💸 Expenses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Self Expense</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="expense_self"
                            value={form.expense_self}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <select
                            name="expense_self_mode"
                            value={form.expense_self_mode}
                            onChange={handleChange}
                            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="gpay">GPay</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Staff Expense</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="expense_staff"
                            value={form.expense_staff}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <select
                            name="expense_staff_mode"
                            value={form.expense_staff_mode}
                            onChange={handleChange}
                            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="gpay">GPay</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Enterprise Expense</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="expense_enterprise"
                            value={form.expense_enterprise}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <select
                            name="expense_enterprise_mode"
                            value={form.expense_enterprise_mode}
                            onChange={handleChange}
                            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="gpay">GPay</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Miscellaneous Expense</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="expense_misc"
                            value={form.expense_misc}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <select
                            name="expense_misc_mode"
                            value={form.expense_misc_mode}
                            onChange={handleChange}
                            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="gpay">GPay</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pending */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-purple-700 mb-4">⏰ Pending Transactions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Amount to Receive</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="receive_amount"
                            value={form.receive_amount}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <select
                            name="receive_mode"
                            value={form.receive_mode}
                            onChange={handleChange}
                            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="gpay">GPay</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Amount to Give</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="give_amount"
                            value={form.give_amount}
                            onChange={handleChange}
                            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                          <select
                            name="give_mode"
                            value={form.give_mode}
                            onChange={handleChange}
                            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="gpay">GPay</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-6">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-8 rounded-lg font-semibold transition-colors duration-200 shadow-lg"
                    >
                      {loading ? '⏳ Saving...' : '💾 Save Entry'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="space-y-6">
            {/* Daily Summary */}
            
<div className="bg-white shadow-lg rounded-xl p-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
    📊 Daily Summary - Detailed Breakdown
  </h2>
  
  {/* Revenue Section */}
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-green-700 mb-3 border-b border-green-200 pb-1">
      💰 Revenue Collection
    </h3>
    <div className="bg-green-50 p-4 rounded-lg space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-gray-700">Cash from Customers:</span>
        <div className="text-right">
          <span className="font-bold text-green-600">₹{summary.totalCashCollected.toFixed(2)}</span>
          <div className="text-xs text-gray-500">
            ({entries.filter(e => Number(e.credited_cash) > 0).length} transactions)
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-700">GPay from Customers:</span>
        <div className="text-right">
          <span className="font-bold text-green-600">₹{summary.totalGpayCollected.toFixed(2)}</span>
          <div className="text-xs text-gray-500">
            ({entries.filter(e => Number(e.credited_gpay) > 0).length} transactions)
          </div>
        </div>
      </div>
      <hr className="border-green-200" />
      <div className="flex justify-between items-center font-bold">
        <span className="text-green-800">Total Revenue Earned:</span>
        <span className="text-green-800 text-lg">₹{summary.totalRevenue.toFixed(2)}</span>
      </div>
    </div>
  </div>

  {/* Bank Deposits Section */}
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-blue-700 mb-3 border-b border-blue-200 pb-1">
      🏦 Bank Deposits (Money Movement)
    </h3>
    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-gray-700">Cash Deposited:</span>
        <div className="text-right">
          <span className="font-bold text-blue-600">₹{summary.totalCashDeposited.toFixed(2)}</span>
          <div className="text-xs text-gray-500">
            ({entries.filter(e => Number(e.deposit_cash) > 0).length} deposits)
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-700">GPay Deposited:</span>
        <div className="text-right">
          <span className="font-bold text-blue-600">₹{summary.totalGpayDeposited.toFixed(2)}</span>
          <div className="text-xs text-gray-500">
            ({entries.filter(e => Number(e.deposit_gpay) > 0).length} deposits)
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-600 italic mt-2 p-2 bg-blue-100 rounded">
        💡 Note: Deposits are money movements to bank, not revenue
      </div>
    </div>
  </div>

  {/* Expenses Breakdown */}
  <div className="mb-4">
    <h3 className="text-lg font-semibold text-red-700 mb-3 border-b border-red-200 pb-1">
      💸 Expenses Breakdown
    </h3>
    <div className="bg-red-50 p-4 rounded-lg space-y-2">
      {[
        { label: 'Portal Payments', cash: 0, gpay: entries.reduce((sum, e) => sum + Number(e.portal_gpay || 0), 0) },
        { label: 'ED Wallet Top-ups', cash: 0, gpay: entries.reduce((sum, e) => sum + Number(e.ed_wallet_gpay || 0), 0) },
        { label: 'Self Expenses', cash: entries.reduce((sum, e) => sum + Number(e.expense_self_cash || 0), 0), gpay: entries.reduce((sum, e) => sum + Number(e.expense_self_gpay || 0), 0) },
        { label: 'Staff Expenses', cash: entries.reduce((sum, e) => sum + Number(e.expense_staff_cash || 0), 0), gpay: entries.reduce((sum, e) => sum + Number(e.expense_staff_gpay || 0), 0) },
        { label: 'Enterprise Expenses', cash: entries.reduce((sum, e) => sum + Number(e.expense_enterprise_cash || 0), 0), gpay: entries.reduce((sum, e) => sum + Number(e.expense_enterprise_gpay || 0), 0) },
        { label: 'Miscellaneous', cash: entries.reduce((sum, e) => sum + Number(e.expense_misc_cash || 0), 0), gpay: entries.reduce((sum, e) => sum + Number(e.expense_misc_gpay || 0), 0) }
      ].map((expense, index) => {
        const total = expense.cash + expense.gpay;
        if (total === 0) return null;
        return (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-700">{expense.label}:</span>
            <div className="text-right">
              <span className="font-semibold text-red-600">₹{total.toFixed(2)}</span>
              <div className="text-xs text-gray-500">
                {expense.cash > 0 && `Cash: ₹${expense.cash.toFixed(2)}`}
                {expense.cash > 0 && expense.gpay > 0 && ' | '}
                {expense.gpay > 0 && `GPay: ₹${expense.gpay.toFixed(2)}`}
              </div>
            </div>
          </div>
        );
      }).filter(Boolean)}
      <hr className="border-red-200" />
      <div className="flex justify-between items-center font-bold">
        <span className="text-red-800">Total Expenses:</span>
        <span className="text-red-800 text-lg">₹{summary.totalExpenses.toFixed(2)}</span>
      </div>
    </div>
  </div>
</div>
            {/* Current Position */}
           
<div className="bg-white shadow-lg rounded-xl p-6">
  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
    💰 Current Position - Detailed Calculations
  </h2>
  
  {/* Cash in Hand Calculation */}
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-blue-700 mb-3 border-b border-blue-200 pb-1">
      💵 Cash in Hand Calculation
    </h3>
    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-green-700">+ Cash from Customers:</span>
          <span className="font-semibold text-green-700">₹{summary.totalCashCollected.toFixed(2)}</span>
        </div>
        {[
          { label: 'Self Cash Expenses', amount: entries.reduce((sum, e) => sum + Number(e.expense_self_cash || 0), 0) },
          { label: 'Staff Cash Expenses', amount: entries.reduce((sum, e) => sum + Number(e.expense_staff_cash || 0), 0) },
          { label: 'Enterprise Cash Expenses', amount: entries.reduce((sum, e) => sum + Number(e.expense_enterprise_cash || 0), 0) },
          { label: 'Misc Cash Expenses', amount: entries.reduce((sum, e) => sum + Number(e.expense_misc_cash || 0), 0) }
        ].map((item, index) => {
          if (item.amount === 0) return null;
          return (
            <div key={index} className="flex justify-between">
              <span className="text-red-700">- {item.label}:</span>
              <span className="font-semibold text-red-700">₹{item.amount.toFixed(2)}</span>
            </div>
          );
        }).filter(Boolean)}
      </div>
      <hr className="border-blue-200" />
      <div className="flex justify-between items-center font-bold text-lg">
        <span className="text-blue-800">Cash in Hand:</span>
        <span className="text-blue-800">₹{summary.cashInHand.toFixed(2)}</span>
      </div>
      <div className="text-xs text-gray-600 italic p-2 bg-blue-100 rounded">
        💡 Formula: Cash Collected - Cash Expenses (deposits don't affect hand cash)
      </div>
    </div>
  </div>

  {/* Bank Balance Calculation */}
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-green-700 mb-3 border-b border-green-200 pb-1">
      🏦 Bank Balance Calculation
    </h3>
    <div className="bg-green-50 p-4 rounded-lg space-y-2">
      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-green-700">+ Cash Deposits:</span>
          <span className="font-semibold text-green-700">₹{summary.totalCashDeposited.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">+ GPay Deposits:</span>
          <span className="font-semibold text-green-700">₹{summary.totalGpayDeposited.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-700">+ GPay from Customers:</span>
          <span className="font-semibold text-green-700">₹{summary.totalGpayCollected.toFixed(2)}</span>
        </div>
        {[
          { label: 'Portal GPay Payments', amount: entries.reduce((sum, e) => sum + Number(e.portal_gpay || 0), 0) },
          { label: 'ED Wallet GPay', amount: entries.reduce((sum, e) => sum + Number(e.ed_wallet_gpay || 0), 0) },
          { label: 'Self GPay Expenses', amount: entries.reduce((sum, e) => sum + Number(e.expense_self_gpay || 0), 0) },
          { label: 'Staff GPay Expenses', amount: entries.reduce((sum, e) => sum + Number(e.expense_staff_gpay || 0), 0) },
          { label: 'Enterprise GPay Expenses', amount: entries.reduce((sum, e) => sum + Number(e.expense_enterprise_gpay || 0), 0) },
          { label: 'Misc GPay Expenses', amount: entries.reduce((sum, e) => sum + Number(e.expense_misc_gpay || 0), 0) }
        ].map((item, index) => {
          if (item.amount === 0) return null;
          return (
            <div key={index} className="flex justify-between">
              <span className="text-red-700">- {item.label}:</span>
              <span className="font-semibold text-red-700">₹{item.amount.toFixed(2)}</span>
            </div>
          );
        }).filter(Boolean)}
      </div>
      <hr className="border-green-200" />
      <div className="flex justify-between items-center font-bold text-lg">
        <span className="text-green-800">Bank Balance:</span>
        <span className="text-green-800">₹{summary.bankBalance.toFixed(2)}</span>
      </div>
      <div className="text-xs text-gray-600 italic p-2 bg-green-100 rounded">
        💡 Formula: All Deposits + GPay Collections - All GPay Expenses
      </div>
    </div>
  </div>

  {/* Pending Transactions */}
  <div className="mb-4">
    <h3 className="text-lg font-semibold text-purple-700 mb-3 border-b border-purple-200 pb-1">
      ⏰ Pending Transactions
    </h3>
    <div className="bg-purple-50 p-4 rounded-lg space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-green-700">Amount to Receive:</span>
        <div className="text-right">
          <span className="font-bold text-green-600">₹{summary.pendingReceivables.toFixed(2)}</span>
          <div className="text-xs text-gray-500">
            ({entries.filter(e => (Number(e.receive_cash || 0) + Number(e.receive_gpay || 0)) > 0).length} pending)
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-red-700">Amount to Give:</span>
        <div className="text-right">
          <span className="font-bold text-red-600">₹{summary.pendingPayables.toFixed(2)}</span>
          <div className="text-xs text-gray-500">
            ({entries.filter(e => (Number(e.give_cash || 0) + Number(e.give_gpay || 0)) > 0).length} pending)
          </div>
        </div>
      </div>
      <hr className="border-purple-200" />
      <div className="flex justify-between items-center font-bold">
        <span className="text-purple-800">Net Pending:</span>
        <span className={`text-purple-800 ${(summary.pendingReceivables - summary.pendingPayables) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ₹{(summary.pendingReceivables - summary.pendingPayables).toFixed(2)}
        </span>
      </div>
    </div>
  </div>

  {/* Total Position */}
  <div className="bg-gray-100 p-4 rounded-lg">
    <div className="flex justify-between items-center font-bold text-lg">
      <span className="text-gray-800">Total Current Position:</span>
      <span className="text-gray-800">₹{summary.netPosition.toFixed(2)}</span>
    </div>
    <div className="text-xs text-gray-600 italic mt-1">
      Cash in Hand + Bank Balance = Your total liquid assets
    </div>
  </div>
</div>
            {/* Tally Check */}
            
<div className={`shadow-lg rounded-xl p-6 ${summary.isTallied ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
  <h2 className="text-xl font-semibold mb-4 flex items-center">
    {summary.isTallied ? '✅ Tally Verification' : '❌ Tally Verification'}
  </h2>
  
  {/* Tally Logic Explanation */}
  <div className="mb-4">
    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b border-gray-300 pb-1">
      🧮 Tally Logic
    </h3>
    <div className="bg-white p-4 rounded-lg border space-y-3">
      <div className="text-sm">
        <div className="font-semibold text-gray-700 mb-2">Expected Position Calculation:</div>
        <div className="pl-4 space-y-1">
          <div className="flex justify-between">
            <span className="text-green-700">Total Revenue Earned:</span>
            <span className="font-semibold text-green-700">₹{summary.totalRevenue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-700">Total Expenses Made:</span>
            <span className="font-semibold text-red-700">₹{summary.totalExpenses.toFixed(2)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between font-bold">
            <span className="text-blue-700">Expected Net Position:</span>
            <span className="text-blue-700">₹{summary.expectedPosition.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="text-sm">
        <div className="font-semibold text-gray-700 mb-2">Actual Position Calculation:</div>
        <div className="pl-4 space-y-1">
          <div className="flex justify-between">
            <span className="text-blue-700">Cash in Hand:</span>
            <span className="font-semibold text-blue-700">₹{summary.cashInHand.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Bank Balance:</span>
            <span className="font-semibold text-green-700">₹{summary.bankBalance.toFixed(2)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between font-bold">
            <span className="text-blue-700">Actual Net Position:</span>
            <span className="text-blue-700">₹{summary.netPosition.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Tally Result */}
  <div className="space-y-3">
    <div className="flex justify-between text-lg font-semibold">
      <span>Expected vs Actual:</span>
      <span className={summary.isTallied ? 'text-green-600' : 'text-red-600'}>
        ₹{Math.abs(summary.netPosition - summary.expectedPosition).toFixed(2)} difference
      </span>
    </div>
    
    <div className={`p-4 rounded-lg text-center font-bold text-lg ${summary.isTallied ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {summary.isTallied ? '✅ BOOKS ARE PERFECTLY TALLIED!' : '❌ BOOKS ARE NOT TALLIED!'}
    </div>
    
    <div className="text-sm text-center">
      {summary.isTallied ? (
        <div className="text-green-700">
          🎉 Excellent! Your entries are accurate and all money is accounted for.
          <br />
          <span className="text-xs">Revenue - Expenses = Cash + Bank Balance</span>
        </div>
      ) : (
        <div className="text-red-700">
          ⚠️ There's a discrepancy in your entries. Please review:
          <br />
          <span className="text-xs">Check all amounts, payment modes, and ensure no transactions are missed</span>
        </div>
      )}
    </div>

    {/* Troubleshooting Hints */}
    {!summary.isTallied && (
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-sm text-yellow-800">
          <div className="font-semibold mb-2">💡 Troubleshooting Tips:</div>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Verify all customer payment amounts and modes (Cash/GPay)</li>
            <li>Check if bank deposits match actual deposits made</li>
            <li>Ensure expense amounts and payment modes are correct</li>
            <li>Confirm portal and ED wallet payments are accurate</li>
            <li>Double-check pending receivables and payables</li>
          </ul>
        </div>
      </div>
    )}
  </div>
</div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;