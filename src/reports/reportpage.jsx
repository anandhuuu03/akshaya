import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Edit3,
  Trash2,
} from "lucide-react";

import PocketBase from "pocketbase";
const pb = new PocketBase("https://virtualdrive.pockethost.io");

const DailyReport = () => {
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
  });
  const [entries, setEntries] = useState([]);
  const [dailyNotes, setDailyNotes] = useState("");
  const [editingEntry, setEditingEntry] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDataForDate();
  }, [form.entry_date]);

  const fetchDataForDate = async () => {
    setLoading(true);
    try {
      const res = await pb.collection("daily_entries").getFullList({
        sort: "created",
        filter: `entry_date >= "${form.entry_date} 00:00:00" && entry_date <= "${form.entry_date} 23:59:59"`,
      });
      setEntries(res);
    } catch (error) {
      console.error("Error fetching data:", error);
      setEntries([]);
    }
    setLoading(false);
  };

  // Get selected date entries sorted chronologically
  const selectedDate = form.entry_date;
  const selectedEntries = entries
    .filter((e) => e.entry_date?.startsWith(selectedDate))
    .sort((a, b) => new Date(a.created) - new Date(b.created));

  // Opening Balances
  const openingBalance = Number(selectedEntries[0]?.opening_bank_balance || 0);
  const openingCash = Number(selectedEntries[0]?.opening_cash_balance || 0);

  // ✅ Total direct service revenue (as before)
  const directRevenueCash = selectedEntries.reduce(
    (sum, e) => sum + Number(e.credited_cash || 0),
    0
  );
  const directRevenueGpay = selectedEntries.reduce(
    (sum, e) => sum + Number(e.credited_gpay || 0),
    0
  );

  // ✅ Total third-party revenue collected from customer (this is now FULL amount received)
  const serviceFeesCash = selectedEntries.reduce(
    (sum, e) => sum + Number(e.thirdparty_fee_cash || 0),
    0
  );
  const serviceFeesGpay = selectedEntries.reduce(
    (sum, e) => sum + Number(e.thirdparty_fee_gpay || 0),
    0
  );

  // ✅ Total revenue is now full amount received from customer

  // ✅ Third-party amount paid out from bank via GPay
  const thirdpartyCash = selectedEntries.reduce(
    (sum, e) => sum + Number(e.thirdparty_paid_cash || 0),
    0
  );
  const thirdpartyGpay = selectedEntries.reduce(
    (sum, e) => sum + Number(e.thirdparty_paid_gpay || 0),
    0
  );
  const totalThirdparty = thirdpartyCash + thirdpartyGpay;

  // ✅ Deposits
  const cashDeposited = selectedEntries.reduce(
    (sum, e) => sum + Number(e.deposit_cash || 0),
    0
  );
  const gpayDeposited = selectedEntries.reduce(
    (sum, e) => sum + Number(e.deposit_gpay || 0),
    0
  );
  const totalDeposits = cashDeposited + gpayDeposited;

  // ✅ Expenses
  const cashExpenses = selectedEntries.reduce(
    (sum, e) =>
      sum +
      Number(e.expense_self_cash || 0) +
      Number(e.expense_staff_cash || 0) +
      Number(e.expense_enterprise_cash || 0) +
      Number(e.expense_misc_cash || 0),
    0
  );
  const gpayExpenses = selectedEntries.reduce(
    (sum, e) =>
      sum +
      Number(e.expense_self_gpay || 0) +
      Number(e.expense_staff_gpay || 0) +
      Number(e.expense_enterprise_gpay || 0) +
      Number(e.expense_misc_gpay || 0),
    0
  );
  const totalExpenses = cashExpenses + gpayExpenses;

  // ✅ Wallets
  const walletTopup = selectedEntries.reduce(
    (sum, e) => sum + Number(e.ed_wallet_gpay || 0),
    0
  );
  const portalUsed = selectedEntries.reduce(
    (sum, e) => sum + Number(e.portal_gpay || 0),
    0
  );
  // PAN Wallet Operations (ADD THIS SECTION)
  const openingPanWallet = Number(selectedEntries[0]?.opening_pan_wallet || 0);
  const panWalletTopup = selectedEntries.reduce(
    (sum, e) => sum + Number(e.pan_wallet_topup || 0),
    0
  );
  const panOperationCash = selectedEntries.reduce(
    (sum, e) => sum + Number(e.pan_operation_cash || 0),
    0
  );
  const panOperationGpay = selectedEntries.reduce(
    (sum, e) => sum + Number(e.pan_operation_gpay || 0),
    0
  );

  // Total deductions from PAN Wallet (₹102 per operation)
  const totalPanUsage = (panOperationCash + panOperationGpay) * 102;

  // PAN Wallet balance
  const panWalletBalance = openingPanWallet + panWalletTopup - totalPanUsage;

  // Update revenue: customers paid ₹250 per pan operation
  const totalPanRevenue = (panOperationCash + panOperationGpay) * 250;
  const panRevenueCash = panOperationCash * 250;
  const panRevenueGpay = panOperationGpay * 250;

  // Get opening wallet balance (ADD THIS)
  const openingWallet = Number(selectedEntries[0]?.opening_wallet_balance || 0);

  const totalRevenue =
    directRevenueCash +
    directRevenueGpay +
    serviceFeesCash +
    serviceFeesGpay +
    totalPanRevenue;

  // ✅ Final balances
  const bankBalance =
    openingBalance +
    gpayDeposited +
    directRevenueGpay +
    serviceFeesGpay +
    panRevenueGpay + // Add PAN GPay revenue
    cashDeposited -
    gpayExpenses -
    walletTopup -
    thirdpartyGpay -
    panWalletTopup;

  const cashInHand =
    openingCash +
    directRevenueCash +
    serviceFeesCash +
    panRevenueCash + // Add PAN cash revenue
    -cashExpenses -
    cashDeposited -
    thirdpartyCash;

  const walletBalance = openingWallet + walletTopup - portalUsed;

  // ✅ Pending
  const pendingReceive = selectedEntries.reduce(
    (sum, e) => sum + Number(e.receive_cash || 0) + Number(e.receive_gpay || 0),
    0
  );
  const pendingGive = selectedEntries.reduce(
    (sum, e) => sum + Number(e.give_cash || 0) + Number(e.give_gpay || 0),
    0
  );
  const netPending = pendingReceive - pendingGive;

  // Net profit calculation
  const netProfit = directRevenueCash + directRevenueGpay + serviceFeesCash + 
                  serviceFeesGpay + totalPanRevenue - 
                  (totalExpenses + portalUsed + thirdpartyGpay + thirdpartyCash + totalPanUsage);

  // Date navigation
  const navigateDate = (direction) => {
    const currentDate = new Date(form.entry_date);
    currentDate.setDate(currentDate.getDate() + direction);
    setForm({ ...form, entry_date: currentDate.toISOString().split("T")[0] });
  };

  const goToToday = () => {
    setForm({ ...form, entry_date: new Date().toISOString().split("T")[0] });
  };

  // Profitability indicator
  const getProfitabilityStatus = () => {
    if (netProfit > 0)
      return {
        icon: CheckCircle,
        text: "Profit Day",
        color: "text-green-600 bg-green-50",
      };
    if (netProfit === 0)
      return {
        icon: AlertTriangle,
        text: "Break-even",
        color: "text-yellow-600 bg-yellow-50",
      };
    return { icon: XCircle, text: "Loss Day", color: "text-red-600 bg-red-50" };
  };

  // Mismatch checker
  const getMismatches = () => {
    const mismatches = [];
    if (walletBalance < 0) {
      mismatches.push("Negative wallet balance detected");
    }
    if (cashInHand < 0) {
      mismatches.push("Negative cash in hand - check calculations");
    }
    if (bankBalance < 0) {
      mismatches.push("Negative bank balance detected");
    }
    if (panWalletBalance < 0) {
      mismatches.push("Negative PAN wallet balance detected");
    }
    return mismatches;
  };

  // Category-wise summary
  const getCategorySummary = () => {
    const categories = {};
    selectedEntries.forEach((entry) => {
      const item = entry.item || "Miscellaneous";
      const totalAmount =
        (entry.credited_cash || 0) +
        (entry.credited_gpay || 0) +
        (entry.thirdparty_fee_cash || 0) +
        (entry.thirdparty_fee_gpay || 0);
      if (categories[item]) {
        categories[item] += totalAmount;
      } else {
        categories[item] = totalAmount;
      }
    });

    // Add PAN operations as a separate category
    const totalPanOps = panOperationCash + panOperationGpay;
    if (totalPanOps > 0) {
      categories["PAN Operations"] = totalPanRevenue;
    }

    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  };

  // Expense category summary
  const getExpenseSummary = () => {
    return [
      {
        category: "Self",
        cash: selectedEntries.reduce(
          (sum, e) => sum + Number(e.expense_self_cash || 0),
          0
        ),
        gpay: selectedEntries.reduce(
          (sum, e) => sum + Number(e.expense_self_gpay || 0),
          0
        ),
      },
      {
        category: "Staff",
        cash: selectedEntries.reduce(
          (sum, e) => sum + Number(e.expense_staff_cash || 0),
          0
        ),
        gpay: selectedEntries.reduce(
          (sum, e) => sum + Number(e.expense_staff_gpay || 0),
          0
        ),
      },
      {
        category: "Enterprise",
        cash: selectedEntries.reduce(
          (sum, e) => sum + Number(e.expense_enterprise_cash || 0),
          0
        ),
        gpay: selectedEntries.reduce(
          (sum, e) => sum + Number(e.expense_enterprise_gpay || 0),
          0
        ),
      },
      {
        category: "Miscellaneous",
        cash: selectedEntries.reduce(
          (sum, e) => sum + Number(e.expense_misc_cash || 0),
          0
        ),
        gpay: selectedEntries.reduce(
          (sum, e) => sum + Number(e.expense_misc_gpay || 0),
          0
        ),
      },
    ];
  };

  const profitStatus = getProfitabilityStatus();
  const mismatches = getMismatches();
  const categorySummary = getCategorySummary();
  const expenseSummary = getExpenseSummary();

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (selectedEntries.length === 0) {
      alert("No data to export");
      return;
    }

    const csvData = selectedEntries.map((entry) => ({
      Item: entry.item || "",
      Customer: entry.customer_name || "",
      "Cash Credited": entry.credited_cash || 0,
      "GPay Credited": entry.credited_gpay || 0,
      "Cash Deposited": entry.deposit_cash || 0,
      "GPay Deposited": entry.deposit_gpay || 0,
      "Portal Payment": entry.portal_gpay || 0,
      "Wallet Topup": entry.ed_wallet_gpay || 0,
      "Third Party Cash": entry.thirdparty_paid_cash || 0,
      "Third Party GPay": entry.thirdparty_paid_gpay || 0,
      "Service Fee Cash": entry.thirdparty_fee_cash || 0,
      "Service Fee GPay": entry.thirdparty_fee_gpay || 0,
      "Opening Bank Balance": entry.opening_bank_balance || 0,
      "Opening Cash Balance": entry.opening_cash_balance || 0,
      "Opening Wallet Balance": entry.opening_wallet_balance || 0,
      "Opening PAN Wallet": entry.opening_pan_wallet || 0,
      "PAN Wallet Topup": entry.pan_wallet_topup || 0,
      "PAN Operations Cash": entry.pan_operation_cash || 0,
      "PAN Operations GPay": entry.pan_operation_gpay || 0,
      "Receive Cash": entry.receive_cash || 0,
      "Receive GPay": entry.receive_gpay || 0,
      "Give Cash": entry.give_cash || 0,
      "Give GPay": entry.give_gpay || 0,
      Date: entry.entry_date || "",
    }));

    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-report-${selectedDate}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Daily Report Dashboard
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <FileText size={16} />
              Print
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate(-1)}
            className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <input
            type="date"
            value={form.entry_date}
            onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => navigateDate(1)}
            className="flex items-center gap-1 px-3 py-2 border rounded hover:bg-gray-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            Today
          </button>
        </div>

        {/* Entry count indicator */}
        <div className="mt-3 text-sm text-gray-600">
          Found {selectedEntries.length} entries for {selectedDate}
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

      {/* Opening Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-purple-800 font-semibold">
            Opening Bank Balance
          </div>
          <div className="text-2xl font-bold text-purple-900">
            ₹{openingBalance}
          </div>
          <div className="text-sm text-purple-600">
            Starting balance for the day
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="text-indigo-800 font-semibold">
            Opening Cash Balance
          </div>
          <div className="text-2xl font-bold text-indigo-900">
            ₹{openingCash}
          </div>
          <div className="text-sm text-indigo-600">Cash in hand at start</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-emerald-800 font-semibold">
            Opening Wallet Balance
          </div>
          <div className="text-2xl font-bold text-emerald-900">
            ₹{openingWallet}
          </div>
          <div className="text-sm text-emerald-600">
            ED wallet starting balance
          </div>
        </div>
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <div className="text-cyan-800 font-semibold">Opening PAN Wallet</div>
          <div className="text-2xl font-bold text-cyan-900">
            ₹{openingPanWallet}
          </div>
          <div className="text-sm text-cyan-600">
            PAN service wallet balance
          </div>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 font-semibold">Total Revenue</div>
          <div className="text-2xl font-bold text-green-900">
            ₹{totalRevenue}
          </div>
          <div className="text-sm text-green-600">Direct + Service Fees</div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-semibold">Total Expenses</div>
          <div className="text-2xl font-bold text-red-900">
            ₹{totalExpenses}
          </div>
          <div className="text-sm text-red-600">All expense categories</div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-800 font-semibold">
            Third Party Payments
          </div>
          <div className="text-2xl font-bold text-yellow-900">
            ₹{totalThirdparty}
          </div>
          <div className="text-sm text-yellow-600">
            Cash: ₹{thirdpartyCash} | GPay: ₹{thirdpartyGpay}
          </div>
        </div>

        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="text-pink-800 font-semibold">Total Deposits</div>
          <div className="text-2xl font-bold text-pink-900">
            ₹{totalDeposits}
          </div>
          <div className="text-sm text-pink-600">
            Cash: ₹{cashDeposited} | GPay: ₹{gpayDeposited}
          </div>
        </div>
      </div>

      {/* Current Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800 font-semibold">
            Current Bank Balance
          </div>
          <div className="text-2xl font-bold text-blue-900">₹{bankBalance}</div>
          <div className="text-sm text-blue-600">
            Including all transactions
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-orange-800 font-semibold">
            Current Cash in Hand
          </div>
          <div className="text-2xl font-bold text-orange-900">
            ₹{cashInHand}
          </div>
          <div className="text-sm text-orange-600">
            After all cash transactions
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="text-teal-800 font-semibold">Wallet Balance</div>
          <div className="text-2xl font-bold text-teal-900">
            ₹{walletBalance}
          </div>
          <div className="text-sm text-teal-600">
            Topup: ₹{walletTopup} | Used: ₹{portalUsed}
          </div>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <div className="text-violet-800 font-semibold">
            Current PAN Wallet
          </div>
          <div className="text-2xl font-bold text-violet-900">
            ₹{panWalletBalance}
          </div>
          <div className="text-sm text-violet-600">
            Topup: ₹{panWalletTopup} | Used: ₹{totalPanUsage}
          </div>
        </div>
      </div>

      {/* Detailed Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Direct Revenue (Cash)</span>
              <span className="font-semibold text-green-600">
                ₹{directRevenueCash}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Direct Revenue (GPay)</span>
              <span className="font-semibold text-green-600">
                ₹{directRevenueGpay}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Service Fees (Cash)</span>
              <span className="font-semibold text-blue-600">
                ₹{serviceFeesCash}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Service Fees (GPay)</span>
              <span className="font-semibold text-blue-600">
                ₹{serviceFeesGpay}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>PAN Revenue (Cash)</span>
              <span className="font-semibold text-purple-600">
                ₹{panRevenueCash}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>PAN Revenue (GPay)</span>
              <span className="font-semibold text-purple-600">
                ₹{panRevenueGpay}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="font-semibold">Total Revenue</span>
              <span className="font-bold text-green-700">₹{totalRevenue}</span>
            </div>
          </div>
        </div>

        {/* Service-wise Income */}
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
            {expenseSummary.map((expense) => (
              <div key={expense.category} className="space-y-1">
                <div className="font-medium text-gray-700">
                  {expense.category}
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cash: ₹{expense.cash}</span>
                  <span>GPay: ₹{expense.gpay}</span>
                  <span className="font-semibold">
                    Total: ₹{expense.cash + expense.gpay}
                  </span>
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
              <span className="font-semibold text-green-600">
                ₹
                {selectedEntries.reduce(
                  (sum, e) => sum + Number(e.receive_cash || 0),
                  0
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>To Receive (GPay)</span>
              <span className="font-semibold text-green-600">
                ₹
                {selectedEntries.reduce(
                  (sum, e) => sum + Number(e.receive_gpay || 0),
                  0
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>To Give (Cash)</span>
              <span className="font-semibold text-red-600">
                ₹
                {selectedEntries.reduce(
                  (sum, e) => sum + Number(e.give_cash || 0),
                  0
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>To Give (GPay)</span>
              <span className="font-semibold text-red-600">
                ₹
                {selectedEntries.reduce(
                  (sum, e) => sum + Number(e.give_gpay || 0),
                  0
                )}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Net Pending</span>
                <span
                  className={
                    netPending >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  ₹{Math.abs(netPending)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Day Summary */}
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-center">
          Final Day Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-gray-600 font-medium">Net Profit/Loss</div>
            <div
              className={`text-3xl font-bold ${
                netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹{Math.abs(netProfit)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Revenue - (Portal + Expenses + Third Party)
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-gray-600 font-medium">Cash Position</div>
            <div
              className={`text-3xl font-bold ${
                cashInHand >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹{Math.abs(cashInHand)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Available Cash</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-gray-600 font-medium">Bank Position</div>
            <div
              className={`text-3xl font-bold ${
                bankBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹{Math.abs(bankBalance)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Current Bank Balance
            </div>
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
        <button
          onClick={() => {
            // Add functionality to save notes to database
            console.log("Saving notes:", dailyNotes);
            alert("Notes saved successfully!");
          }}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Notes
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
