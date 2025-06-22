import { useState, useEffect } from "react";
import PocketBase from "pocketbase";

const pb = new PocketBase("https://virtualdrive.pockethost.io");

const Homepage = () => {
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    item: "",
    customer_name: "",
    service_type: "direct", // direct or third_party

    // Direct revenue (full amount is yours)
    credited_amount: "",
    credited_mode: "cash",

    // Third-party services
    service_fee_amount: "", // your commission/fee
    service_fee_mode: "cash",
    thirdparty_amount: "", // amount to be paid to agency
    thirdparty_mode: "gpay",

    // Bank operations
    opening_bank_balance: "",
    deposit_amount: "",
    deposit_mode: "cash",

    // Wallet operations
    portal_payment: "",
    ed_wallet_gpay: "",

    // Expenses
    expense_self: "",
    expense_self_mode: "cash",
    expense_staff: "",
    expense_staff_mode: "cash",
    expense_enterprise: "",
    expense_enterprise_mode: "cash",
    expense_misc: "",
    expense_misc_mode: "cash",

    // Pending amounts
    receive_amount: "",
    receive_mode: "cash",
    give_amount: "",
    give_mode: "cash",
  });

  const [entries, setEntries] = useState([]);
  const [showBankBalance, setShowBankBalance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch entries from PocketBase
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const records = await pb.collection("daily_entries").getList(1, 50, {
        sort: "-entry_date,-created",
        filter: `entry_date >= "${
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        }"`, // Last 30 days
      });
      setEntries(records.items);
      setError("");
    } catch (err) {
      console.error("Error fetching entries:", err);
      setError("Failed to fetch entries. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // Check if we need to show opening bank balance (first entry of the day)
    const today = new Date().toISOString().split("T")[0];
    const selectedEntries = entries.filter((e) =>
      e.entry_date?.startsWith(today)
    );
    if (selectedEntries.length === 0) {
      setShowBankBalance(true);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare data for PocketBase with the exact field structure
      const data = {
        entry_date: form.entry_date,
        item: form.item,
        customer_name: form.customer_name,

        // Opening bank balance
        opening_bank_balance: Number(form.opening_bank_balance) || 0,
        opening_cash_balance: Number(form.opening_cash_balance) || 0,

        // Revenue fields based on service type
        ...(form.service_type === "direct"
          ? {
              [`credited_${form.credited_mode}`]:
                Number(form.credited_amount) || 0,
            }
          : {
              [`thirdparty_fee_${form.service_fee_mode}`]:
                Number(form.service_fee_amount) || 0,
              [`thirdparty_paid_${form.thirdparty_mode}`]:
                Number(form.thirdparty_amount) || 0,
            }),

        // Bank and wallet operations
        [`deposit_${form.deposit_mode}`]: Number(form.deposit_amount) || 0,
        portal_gpay: Number(form.portal_payment) || 0,
        ed_wallet_gpay: Number(form.ed_wallet_gpay) || 0,

        // Expenses
        [`expense_self_${form.expense_self_mode}`]:
          Number(form.expense_self) || 0,
        [`expense_staff_${form.expense_staff_mode}`]:
          Number(form.expense_staff) || 0,
        [`expense_enterprise_${form.expense_enterprise_mode}`]:
          Number(form.expense_enterprise) || 0,
        [`expense_misc_${form.expense_misc_mode}`]:
          Number(form.expense_misc) || 0,

        // Pending amounts
        [`receive_${form.receive_mode}`]: Number(form.receive_amount) || 0,
        [`give_${form.give_mode}`]: Number(form.give_amount) || 0,
      };

      // Create record in PocketBase
      await pb.collection("daily_entries").create(data);

      // Reset form
      setForm({
        entry_date: new Date().toISOString().split("T")[0],
        item: "",
        customer_name: "",
        service_type: "direct",
        credited_amount: "",
        credited_mode: "cash",
        service_fee_amount: "",
        service_fee_mode: "cash",
        thirdparty_amount: "",
        thirdparty_mode: "gpay",
        opening_bank_balance: "",
        deposit_amount: "",
        deposit_mode: "cash",
        portal_payment: "",
        ed_wallet_gpay: "",
        expense_self: "",
        expense_self_mode: "cash",
        expense_staff: "",
        expense_staff_mode: "cash",
        expense_enterprise: "",
        expense_enterprise_mode: "cash",
        expense_misc: "",
        expense_misc_mode: "cash",
        receive_amount: "",
        receive_mode: "cash",
        give_amount: "",
        give_mode: "cash",
        opening_cash_balance: "",
      });

      setShowBankBalance(false);
      await fetchEntries(); // Refresh entries
    } catch (err) {
      console.error("Error creating entry:", err);
      setError(`Failed to save entry: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Use selected entry date from the form
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
const totalRevenue =
  directRevenueCash + directRevenueGpay + serviceFeesCash + serviceFeesGpay;

// ✅ Third-party amount paid out from bank via GPay
const thirdpartyCash = selectedEntries.reduce(
  (sum, e) => sum + Number(e.thirdparty_paid_cash || 0),
  0
);
const thirdpartyGpay = selectedEntries.reduce(
  (sum, e) => sum + Number(e.thirdparty_paid_gpay || 0),
  0
);

// ✅ Deposits
const cashDeposited = selectedEntries.reduce(
  (sum, e) => sum + Number(e.deposit_cash || 0),
  0
);
const gpayDeposited = selectedEntries.reduce(
  (sum, e) => sum + Number(e.deposit_gpay || 0),
  0
);

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

// ✅ Wallets
const walletTopup = selectedEntries.reduce(
  (sum, e) => sum + Number(e.ed_wallet_gpay || 0),
  0
);
const portalUsed = selectedEntries.reduce(
  (sum, e) => sum + Number(e.portal_gpay || 0),
  0
);

// ✅ Final balances
const bankBalance =
  openingBalance +
  gpayDeposited +
  directRevenueGpay +
  serviceFeesGpay -
  thirdpartyGpay -
  gpayExpenses -
  walletTopup;

const cashInHand =
  openingCash +
  directRevenueCash +
  serviceFeesCash -
  cashExpenses -
  cashDeposited -
  thirdpartyCash;

const walletBalance = walletTopup - portalUsed;

// ✅ Pending
const pendingReceive = selectedEntries.reduce(
  (sum, e) => sum + Number(e.receive_cash || 0) + Number(e.receive_gpay || 0),
  0
);
const pendingGive = selectedEntries.reduce(
  (sum, e) => sum + Number(e.give_cash || 0) + Number(e.give_gpay || 0),
  0
);


  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">
        🏪 Akshaya Finance Tracker
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={() => setError("")}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 text-center">
          🔄 Loading...
        </div>
      )}

      <div className="bg-white shadow-lg p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              📅 Date
            </label>
            <input
              type="date"
              name="entry_date"
              value={form.entry_date}
              onChange={handleInputChange}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Item/Service */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              📝 Item/Service
            </label>
            <input
              type="text"
              name="item"
              value={form.item}
              onChange={handleInputChange}
              placeholder="e.g., Printing, Tax Payment"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              👤 Customer Name
            </label>
            <input
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleInputChange}
              placeholder="Customer name"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Service Type */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium mb-2 text-gray-700">
              🔄 Service Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="service_type"
                  value="direct"
                  checked={form.service_type === "direct"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-green-600 font-medium">
                  💰 Direct Revenue (Printing, Scanning, etc.)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="service_type"
                  value="third_party"
                  checked={form.service_type === "third_party"}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-orange-600 font-medium">
                  🏛️ Third-Party Service (Tax, Bills, etc.)
                </span>
              </label>
            </div>
          </div>

          {/* Direct Revenue Fields */}
          {form.service_type === "direct" && (
            <div>
              <label className="block text-sm font-medium mb-1 text-green-700">
                💰 Amount Received (Full Revenue)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="credited_amount"
                  value={form.credited_amount}
                  onChange={handleInputChange}
                  placeholder="₹"
                  className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <select
                  name="credited_mode"
                  value={form.credited_mode}
                  onChange={handleInputChange}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="cash">💵 Cash</option>
                  <option value="gpay">📱 GPay</option>
                </select>
              </div>
            </div>
          )}

          {/* Third-Party Service Fields */}
          {form.service_type === "third_party" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-green-700">
                  💰 Your Service Fee
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="service_fee_amount"
                    value={form.service_fee_amount}
                    onChange={handleInputChange}
                    placeholder="₹"
                    className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <select
                    name="service_fee_mode"
                    value={form.service_fee_mode}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="gpay">📱 GPay</option>
                  </select>
                </div>
              </div>

              <div>
  <label className="block text-sm font-medium mb-1 text-orange-700">
    🏛️ Third-Party Amount
  </label>
  <input
    type="number"
    name="thirdparty_amount"
    value={form.thirdparty_amount}
    onChange={handleInputChange}
    placeholder="₹ (via GPay)"
    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-orange-500"
  />
  <input type="hidden" name="thirdparty_mode" value="gpay" />
</div>
            </>
          )}

          {/* Opening Bank Balance (show only for first entry of day) */}
          {showBankBalance && (
            <div>
              <label className="block text-sm font-medium mb-1 text-blue-700">
                🏦 Opening Bank Balance
              </label>
              <input
                type="number"
                name="opening_bank_balance"
                value={form.opening_bank_balance}
                onChange={handleInputChange}
                placeholder="₹"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Opening Cash Balance
            </label>
            <input
              type="number"
              name="opening_cash_balance"
              value={form.opening_cash_balance || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border rounded"
              placeholder="e.g., 500"
            />
          </div>

          {/* Bank Deposit */}
          <div>
            <label className="block text-sm font-medium mb-1 text-blue-700">
              🏦 Bank Deposit
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="deposit_amount"
                value={form.deposit_amount}
                onChange={handleInputChange}
                placeholder="₹"
                className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                name="deposit_mode"
                value={form.deposit_mode}
                onChange={handleInputChange}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="gpay">📱 GPay</option>
              </select>
            </div>
          </div>

          {/* ED Wallet Top-up */}
          <div>
            <label className="block text-sm font-medium mb-1 text-purple-700">
              👛 ED Wallet Top-up
            </label>
            <input
              type="number"
              name="ed_wallet_gpay"
              value={form.ed_wallet_gpay}
              onChange={handleInputChange}
              placeholder="₹ (via GPay)"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Portal Payment */}
          <div>
            <label className="block text-sm font-medium mb-1 text-purple-700">
              🌐 Portal Payment
            </label>
            <input
              type="number"
              name="portal_payment"
              value={form.portal_payment}
              onChange={handleInputChange}
              placeholder="₹ (via Wallet)"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Expenses */}
          <div>
            <label className="block text-sm font-medium mb-1 text-red-700">
              💸 Expense - Self
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="expense_self"
                value={form.expense_self}
                onChange={handleInputChange}
                placeholder="₹"
                className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <select
                name="expense_self_mode"
                value={form.expense_self_mode}
                onChange={handleInputChange}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="gpay">📱 GPay</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-red-700">
              👥 Expense - Staff
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="expense_staff"
                value={form.expense_staff}
                onChange={handleInputChange}
                placeholder="₹"
                className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <select
                name="expense_staff_mode"
                value={form.expense_staff_mode}
                onChange={handleInputChange}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="gpay">📱 GPay</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-red-700">
              🏢 Expense - Enterprise
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="expense_enterprise"
                value={form.expense_enterprise}
                onChange={handleInputChange}
                placeholder="₹"
                className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <select
                name="expense_enterprise_mode"
                value={form.expense_enterprise_mode}
                onChange={handleInputChange}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="gpay">📱 GPay</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-red-700">
              📋 Expense - Misc
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="expense_misc"
                value={form.expense_misc}
                onChange={handleInputChange}
                placeholder="₹"
                className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500"
              />
              <select
                name="expense_misc_mode"
                value={form.expense_misc_mode}
                onChange={handleInputChange}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="gpay">📱 GPay</option>
              </select>
            </div>
          </div>

          {/* Pending amounts */}
          <div>
            <label className="block text-sm font-medium mb-1 text-yellow-700">
              📥 To Receive
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="receive_amount"
                value={form.receive_amount}
                onChange={handleInputChange}
                placeholder="₹"
                className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
              <select
                name="receive_mode"
                value={form.receive_mode}
                onChange={handleInputChange}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="gpay">📱 GPay</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-yellow-700">
              📤 To Give
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="give_amount"
                value={form.give_amount}
                onChange={handleInputChange}
                placeholder="₹"
                className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500"
              />
              <select
                name="give_mode"
                value={form.give_mode}
                onChange={handleInputChange}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-yellow-500"
              >
                <option value="cash">💵 Cash</option>
                <option value="gpay">📱 GPay</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-8 rounded-lg font-semibold transition duration-200 shadow-lg"
          >
            {loading ? "🔄 Saving..." : "💾 Save Entry"}
          </button>
        </div>
      </div>

      {/* Enhanced Summary Section */}
<div className="bg-gradient-to-r from-gray-50 to-blue-50 shadow-lg rounded-lg p-6">
  <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
    📊 Today's Financial Summary
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Revenue Section */}
    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
      <h3 className="font-semibold text-green-800 mb-3">
        💰 Revenue (Your Income)
      </h3>
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Direct Services:</span> ₹
          {directRevenueCash + directRevenueGpay}
        </p>
        <p>
          <span className="font-medium">Service Fees:</span> ₹
          {serviceFeesCash + serviceFeesGpay}
        </p>
        <p className="font-bold text-lg text-green-700 border-t pt-2">
          Total Revenue: ₹{totalRevenue}
        </p>
      </div>
    </div>

    {/* Cash Flow Section */}
    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
      <h3 className="font-semibold text-blue-800 mb-3">💵 Cash & Bank</h3>
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Opening Bank:</span> ₹{openingBalance}
        </p>
        <p>
          <span className="font-medium">Opening Cash:</span> ₹{openingCash}
        </p>
        <p>
          <span className="font-medium">Bank Balance:</span> ₹{bankBalance}
        </p>
        <p>
          <span className="font-medium">Cash in Hand:</span> ₹{cashInHand}
        </p>
        <p>
          <span className="font-medium">Wallet Balance:</span> ₹{walletBalance}
        </p>
      </div>
    </div>

    {/* Third-Party & Others */}
    <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
      <h3 className="font-semibold text-orange-800 mb-3">
        🏛️ Third-Party & Pending
      </h3>
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Third-Party Collected:</span> ₹
          {thirdpartyCash + thirdpartyGpay}
        </p>
        <p>
          <span className="font-medium">Total Expenses:</span> ₹
          {cashExpenses + gpayExpenses}
        </p>
        <p>
          <span className="font-medium">Pending to Receive:</span> ₹
          {pendingReceive}
        </p>
        <p>
          <span className="font-medium">Pending to Give:</span> ₹
          {pendingGive}
        </p>
      </div>
    </div>
  </div>

  {/* Quick Actions */}
  <div className="mt-6 flex justify-center gap-4">
    <button
      onClick={() => setShowBankBalance(!showBankBalance)}
      className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm"
    >
      {showBankBalance ? "Hide" : "Set"} Opening Balance
    </button>
    <button
      onClick={fetchEntries}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg text-sm"
    >
      {loading ? "🔄" : "🔄"} Refresh Data
    </button>
  </div>
</div>


      {/* Recent Entries */}
      {selectedEntries.length > 0 && (
        <div className="mt-6 bg-white shadow-lg rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            📝 Today's Entries ({selectedEntries.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedEntries.slice(0, 5).map((entry, index) => (
              <div
                key={entry.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
              >
                <span className="font-medium">{entry.item}</span>
                <span className="text-gray-600">{entry.customer_name}</span>
                <span className="font-semibold text-green-600">
                  {entry.service_type === "direct"
                    ? `₹${
                        (entry.credited_cash || 0) + (entry.credited_gpay || 0)
                      }`
                    : `₹${
                        (entry.service_fee_cash || 0) +
                        (entry.service_fee_gpay || 0)
                      } fee`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
