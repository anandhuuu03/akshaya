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
    opening_cash_balance: "",
    opening_wallet_balance: "",
    deposit_amount: "",
    deposit_mode: "cash",

    // Wallet operations
    portal_payment: "",
    ed_wallet_gpay: "",

    opening_pan_wallet: "",
    pan_wallet_topup: "", // select 510 or 1020 via checkbox
    pan_operation_cash: "", // checkbox: 1 op = ₹250 via cash
    pan_operation_gpay: "", // checkbox: 1 op = ₹250 via gpay

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

  // Replace your handleInputChange function with this debugging version:

const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  // 🔍 DEBUG: Log input changes
  console.log("=== INPUT CHANGE DEBUG ===");
  console.log("Field name:", name);
  console.log("Raw input value:", value);
  console.log("Value type:", typeof value);
  console.log("Event target value:", e.target.value);
  console.log("Event target type:", e.target.type);
  
  // Check if there's any preprocessing happening
  if (name === 'credited_amount') {
    console.log("🔍 CREDITED AMOUNT CHANGE:");
    console.log("Current form value:", form.credited_amount);
    console.log("New value:", value);
    console.log("Character codes:", Array.from(value).map(char => char.charCodeAt(0)));
  }
  
  setForm((prevForm) => {
    const newForm = {
      ...prevForm,
      [name]: value,
    };
    
    // Log the updated form state
    if (name === 'credited_amount') {
      console.log("Updated form credited_amount:", newForm.credited_amount);
    }
    
    console.log("=== END INPUT DEBUG ===");
    return newForm;
  });
};

// Also, let's create a safer version without any potential issues:
const handleInputChangeSafe = (e) => {
  const { name, value } = e.target;
  
  setForm(prevForm => ({
    ...prevForm,
    [name]: String(value) // Ensure it's always a string
  }));
};

  // Add this debugging code in your handleSubmit function, right before creating the PocketBase record:

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    // 🔍 DEBUG: Log the raw form values
    console.log("=== DEBUGGING NUMBER CONVERSION ===");
    console.log("Raw form.credited_amount:", form.credited_amount);
    console.log("Type of form.credited_amount:", typeof form.credited_amount);
    console.log("parseInt result:", parseInt(form.credited_amount));
    console.log("Number result:", Number(form.credited_amount));
    
    // 🔍 Test different conversion methods
    const testValue = form.credited_amount;
    console.log("Original value:", testValue);
    console.log("parseInt(testValue):", parseInt(testValue));
    console.log("Number(testValue):", Number(testValue));
    console.log("Math.floor(Number(testValue)):", Math.floor(Number(testValue)));
    console.log("+ operator:", +testValue);
    
    // Prepare data for PocketBase with debugging
    const creditedAmount = parseInt(form.credited_amount) || 0;
    console.log("Final credited amount to be saved:", creditedAmount);

    const data = {
      entry_date: form.entry_date,
      item: form.item,
      customer_name: form.customer_name,

      // Opening bank balance
      opening_bank_balance: parseInt(form.opening_bank_balance) || 0,
      opening_cash_balance: parseInt(form.opening_cash_balance) || 0,
      opening_wallet_balance: parseInt(form.opening_wallet_balance) || 0,

      opening_pan_wallet: parseInt(form.opening_pan_wallet) || 0,
      pan_wallet_topup: parseInt(form.pan_wallet_topup) || 0,
      pan_operation_cash: parseInt(form.pan_operation_cash) || 0,
      pan_operation_gpay: parseInt(form.pan_operation_gpay) || 0,

      // Revenue fields based on service type
      ...(form.service_type === "direct"
        ? {
            [`credited_${form.credited_mode}`]: creditedAmount,
          }
        : {
            [`thirdparty_fee_${form.service_fee_mode}`]:
              parseInt(form.service_fee_amount) || 0,
            [`thirdparty_paid_${form.thirdparty_mode}`]:
              parseInt(form.thirdparty_amount) || 0,
          }),

      // Bank and wallet operations
      [`deposit_${form.deposit_mode}`]: parseInt(form.deposit_amount) || 0,
      portal_gpay: parseInt(form.portal_payment) || 0,
      ed_wallet_gpay: parseInt(form.ed_wallet_gpay) || 0,

      // Expenses
      [`expense_self_${form.expense_self_mode}`]:
        parseInt(form.expense_self) || 0,
      [`expense_staff_${form.expense_staff_mode}`]:
        parseInt(form.expense_staff) || 0,
      [`expense_enterprise_${form.expense_enterprise_mode}`]:
        parseInt(form.expense_enterprise) || 0,
      [`expense_misc_${form.expense_misc_mode}`]:
        parseInt(form.expense_misc) || 0,

      // Pending amounts
      [`receive_${form.receive_mode}`]: parseInt(form.receive_amount) || 0,
      [`give_${form.give_mode}`]: parseInt(form.give_amount) || 0,
    };

    // 🔍 DEBUG: Log the complete data object
    console.log("Complete data object to be sent:", data);
    console.log("Specific field being sent:", data[`credited_${form.credited_mode}`]);

    // Create record in PocketBase
    const savedRecord = await pb.collection("daily_entries").create(data);
    
    // 🔍 DEBUG: Log the saved record
    console.log("Record saved successfully:", savedRecord);
    console.log("Saved credited amount:", savedRecord[`credited_${form.credited_mode}`]);
    
    console.log("=== END DEBUGGING ===");

    // Reset form (rest of your code...)
    // To this:
give_mode: "cash",  // ✅ Correct field name

// Here's the corrected reset object:
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
  opening_cash_balance: "", // ✅ Add this missing field
  opening_wallet_balance: "", // ✅ Add this missing field
  deposit_amount: "",
  deposit_mode: "cash",
  portal_payment: "",
  ed_wallet_gpay: "",
  opening_pan_wallet: "", // ✅ Add this missing field
  pan_wallet_topup: "", // ✅ Add this missing field
  pan_operation_cash: "", // ✅ Add this missing field
  pan_operation_gpay: "", // ✅ Add this missing field
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
  give_mode: "cash", // ✅ Fixed field name
});

    setShowBankBalance(false);
    await fetchEntries();
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

  // PAN Wallet Operations
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

  // Add to overall revenue
  const totalRevenue =
    directRevenueCash +
    directRevenueGpay +
    serviceFeesCash +
    serviceFeesGpay +
    totalPanRevenue;

  // Update cash in hand
  const cashInHand =
    openingCash +
    directRevenueCash +
    serviceFeesCash +
    panRevenueCash -
    cashExpenses -
    cashDeposited -
    thirdpartyCash;

  // Update bank balance
  const bankBalance =
    openingBalance +
    gpayDeposited +
    directRevenueGpay +
    serviceFeesGpay +
    panRevenueGpay +
    cashDeposited -
    gpayExpenses -
    walletTopup -
    thirdpartyGpay -
    panWalletTopup; // pan wallet is always topped up from bank

  const openingWallet = Number(selectedEntries[0]?.opening_wallet_balance || 0); // ✅

  const walletBalance = openingWallet + walletTopup - portalUsed; // ✅ Include opening

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
            <>
              {/* Opening Bank Balance Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  🏦 Opening Bank Balance
                </label>
                <input
                  type="number"
                  name="opening_bank_balance"
                  value={form.opening_bank_balance}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter bank balance"
                />
              </div>

              {/* Opening Cash Balance Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  💵 Opening Cash Balance
                </label>
                <input
                  type="number"
                  name="opening_cash_balance"
                  value={form.opening_cash_balance}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter cash in hand"
                />
              </div>

              {/* ✅ New: Opening Wallet Balance Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  💳 Opening Wallet Balance
                </label>
                <input
                  type="number"
                  name="opening_wallet_balance"
                  value={form.opening_wallet_balance}
                  onChange={handleInputChange}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter wallet balance"
                />
              </div>
            </>
          )}

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
          <h3 className="text-lg font-semibold mt-6 mb-2">🪪 Pan Card Wallet</h3>

          {/* PAN Card Operations - Improved UI */}
          <div className="md:col-span-2 lg:col-span-3 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h3 className="text-lg font-semibold mb-4 text-indigo-800 flex items-center">
              🪪 PAN Card Operations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Opening Pan Wallet Balance - Only show if showBankBalance is true */}
              {showBankBalance && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-indigo-700">
                    💳 Opening PAN Wallet Balance
                  </label>
                  <input
                    type="number"
                    name="opening_pan_wallet"
                    value={form.opening_pan_wallet}
                    onChange={handleInputChange}
                    placeholder="₹510, ₹1020, etc."
                    className="w-full border border-indigo-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Pan Wallet Top-up */}
              <div>
                <label className="block text-sm font-medium mb-2 text-indigo-700">
                  💰 PAN Wallet Top-up (from Bank)
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-indigo-50">
                    <input
                      type="radio"
                      name="pan_wallet_topup"
                      value="510"
                      checked={form.pan_wallet_topup === "510"}
                      onChange={handleInputChange}
                      className="text-indigo-600"
                    />
                    <span className="font-medium">₹510 (5 coupons)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-indigo-50">
                    <input
                      type="radio"
                      name="pan_wallet_topup"
                      value="1020"
                      checked={form.pan_wallet_topup === "1020"}
                      onChange={handleInputChange}
                      className="text-indigo-600"
                    />
                    <span className="font-medium">₹1020 (10 coupons)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-indigo-50">
                    <input
                      type="radio"
                      name="pan_wallet_topup"
                      value=""
                      checked={form.pan_wallet_topup === ""}
                      onChange={handleInputChange}
                      className="text-indigo-600"
                    />
                    <span className="font-medium">No Top-up</span>
                  </label>
                </div>
              </div>

              {/* Pan Operations */}
              <div>
                <label className="block text-sm font-medium mb-2 text-indigo-700">
                  🔄 PAN Operations (₹250 each from customer)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                    <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                      💵 Cash:
                    </span>
                    <input
                      type="number"
                      name="pan_operation_cash"
                      value={form.pan_operation_cash}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-20 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 text-center"
                      min="0"
                    />
                    <span className="text-sm text-gray-600">operations</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                    <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                      📱 GPay:
                    </span>
                    <input
                      type="number"
                      name="pan_operation_gpay"
                      value={form.pan_operation_gpay}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-20 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-indigo-500 text-center"
                      min="0"
                    />
                    <span className="text-sm text-gray-600">operations</span>
                  </div>
                </div>

                {/* Live calculation display */}
                {(Number(form.pan_operation_cash) || 0) +
                  (Number(form.pan_operation_gpay) || 0) >
                  0 && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                    <div className="font-medium text-green-700">
                      Total Revenue: ₹
                      {250 *
                        ((Number(form.pan_operation_cash) || 0) +
                          (Number(form.pan_operation_gpay) || 0))}
                    </div>
                    <div className="text-green-600">
                      Wallet Deduction: ₹
                      {102 *
                        ((Number(form.pan_operation_cash) || 0) +
                          (Number(form.pan_operation_gpay) || 0))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                <span className="font-medium">Opening Bank:</span> ₹
                {openingBalance}
              </p>
              <p>
                <span className="font-medium">Opening Cash:</span> ₹
                {openingCash}
              </p>
              <p>
                <span className="font-medium">Bank Balance:</span> ₹
                {bankBalance}
              </p>
              <p>
                <span className="font-medium">Cash in Hand:</span> ₹{cashInHand}
              </p>
              <p>
                <span className="font-medium">Wallet Balance:</span> ₹
                {walletBalance}
              </p>
              <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <h3 className="font-semibold text-indigo-800 mb-3">
                  🪪 PAN Card Operations
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Opening PAN Wallet:</span> ₹
                    {openingPanWallet}
                  </p>
                  <p>
                    <span className="font-medium">Wallet Top-up:</span> ₹
                    {panWalletTopup}
                  </p>
                  <p>
                    <span className="font-medium">Operations Done:</span>{" "}
                    {panOperationCash + panOperationGpay}
                  </p>
                  <p>
                    <span className="font-medium">Revenue Collected:</span> ₹
                    {totalPanRevenue}
                  </p>
                  <p>
                    <span className="font-medium">Wallet Usage:</span> ₹
                    {totalPanUsage}
                  </p>
                  <p className="font-bold text-lg text-indigo-700 border-t pt-2">
                    PAN Wallet Balance: ₹{panWalletBalance}
                  </p>
                </div>
              </div>
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
