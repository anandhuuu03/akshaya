// src/Homepage.jsx
import { useState, useEffect } from "react";
import { pb } from "../Pocketbase";

const Homepage = () => {
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    item: "",
    customer_name: "",
    credited_amount: "",
    credited_mode: "cash",
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
  });

  const [entries, setEntries] = useState([]);

  const fetchEntries = async () => {
    try {
      const res = await pb.collection("daily_entries").getFullList({ sort: "-entry_date" });
      setEntries(res);
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        entry_date: form.entry_date,
        item: form.item,
        customer_name: form.customer_name,
        [`credited_${form.credited_mode}`]: Number(form.credited_amount) || 0,
        [`deposit_${form.deposit_mode}`]: Number(form.deposit_amount) || 0,
        portal_payment: Number(form.portal_payment) || 0,
        ed_wallet_gpay: Number(form.ed_wallet_gpay) || 0,
        [`expense_self_${form.expense_self_mode}`]: Number(form.expense_self) || 0,
        [`expense_staff_${form.expense_staff_mode}`]: Number(form.expense_staff) || 0,
        [`expense_enterprise_${form.expense_enterprise_mode}`]: Number(form.expense_enterprise) || 0,
        [`expense_misc_${form.expense_misc_mode}`]: Number(form.expense_misc) || 0,
        [`receive_${form.receive_mode}`]: Number(form.receive_amount) || 0,
        [`give_${form.give_mode}`]: Number(form.give_amount) || 0,
      };

      await pb.collection("daily_entries").create(data);
      
      // Reset form
      setForm({
        entry_date: new Date().toISOString().split("T")[0],
        item: "",
        customer_name: "",
        credited_amount: "",
        credited_mode: "cash",
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
      });

      await fetchEntries();
    } catch (err) {
      console.error("Error creating entry:", err);
    }
  };

  // Calculate summary values
  const cashDeposited = entries.reduce((sum, e) => sum + Number(e.deposit_cash || 0), 0);
  const gpayDeposited = entries.reduce((sum, e) => sum + Number(e.deposit_gpay || 0), 0);
  const cashCollected = entries.reduce((sum, e) => sum + Number(e.credited_cash || 0), 0);
  const gpayCollected = entries.reduce((sum, e) => sum + Number(e.credited_gpay || 0), 0);
  const walletTopup = entries.reduce((sum, e) => sum + Number(e.ed_wallet_gpay || 0), 0);
  const portalUsed = entries.reduce((sum, e) => sum + Number(e.portal_payment || 0), 0);

  const bankExpenses = entries.reduce((sum, e) =>
    sum +
    Number(e.expense_self_gpay || 0) + Number(e.expense_staff_gpay || 0) +
    Number(e.expense_enterprise_gpay || 0) + Number(e.expense_misc_gpay || 0) +
    Number(e.ed_wallet_gpay || 0), 0);

  const cashExpenses = entries.reduce((sum, e) =>
    sum +
    Number(e.expense_self_cash || 0) + Number(e.expense_staff_cash || 0) +
    Number(e.expense_enterprise_cash || 0) + Number(e.expense_misc_cash || 0), 0);

  const bankBalance = gpayDeposited + gpayCollected - bankExpenses;
  const cashInHand = cashCollected - cashExpenses - cashDeposited;
  const walletBalance = walletTopup - portalUsed;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4 text-center">Akshaya Finance Tracker</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded grid grid-cols-2 gap-4">
        {/* Date */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Date</label>
          <input 
            type="date" 
            name="entry_date" 
            value={form.entry_date} 
            onChange={handleInputChange} 
            className="w-full border p-2 rounded" 
          />
        </div>

        {/* Item / Service */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Item / Service</label>
          <input
            type="text"
            name="item"
            value={form.item}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Customer Name */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Customer Name</label>
          <input
            type="text"
            name="customer_name"
            value={form.customer_name}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Amount Received */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Amount Received</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="credited_amount"
              value={form.credited_amount}
              onChange={handleInputChange}
              className="flex-1 border p-2 rounded"
            />
            <select
              name="credited_mode"
              value={form.credited_mode}
              onChange={handleInputChange}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
        </div>

        {/* Bank Deposit */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Bank Deposit</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="deposit_amount"
              value={form.deposit_amount}
              onChange={handleInputChange}
              className="flex-1 border p-2 rounded"
            />
            <select
              name="deposit_mode"
              value={form.deposit_mode}
              onChange={handleInputChange}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
        </div>

        {/* ED Wallet Top-up */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">ED Wallet Top-up (GPay)</label>
          <input
            type="text"
            name="ed_wallet_gpay"
            value={form.ed_wallet_gpay}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Portal Payment */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Portal Payment (via Wallet)</label>
          <input
            type="text"
            name="portal_payment"
            value={form.portal_payment}
            onChange={handleInputChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Expense - Self */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Expense - Self</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="expense_self"
              value={form.expense_self}
              onChange={handleInputChange}
              className="flex-1 border p-2 rounded"
            />
            <select
              name="expense_self_mode"
              value={form.expense_self_mode}
              onChange={handleInputChange}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
        </div>

        {/* Expense - Staff */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Expense - Staff</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="expense_staff"
              value={form.expense_staff}
              onChange={handleInputChange}
              className="flex-1 border p-2 rounded"
            />
            <select
              name="expense_staff_mode"
              value={form.expense_staff_mode}
              onChange={handleInputChange}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
        </div>

        {/* Expense - Enterprise */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Expense - Enterprise</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="expense_enterprise"
              value={form.expense_enterprise}
              onChange={handleInputChange}
              className="flex-1 border p-2 rounded"
            />
            <select
              name="expense_enterprise_mode"
              value={form.expense_enterprise_mode}
              onChange={handleInputChange}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
        </div>

        {/* Expense - Misc */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">Expense - Misc</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="expense_misc"
              value={form.expense_misc}
              onChange={handleInputChange}
              className="flex-1 border p-2 rounded"
            />
            <select
              name="expense_misc_mode"
              value={form.expense_misc_mode}
              onChange={handleInputChange}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
        </div>

        {/* To Receive */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">To Receive</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="receive_amount"
              value={form.receive_amount}
              onChange={handleInputChange}
              className="flex-1 border p-2 rounded"
            />
            <select
              name="receive_mode"
              value={form.receive_mode}
              onChange={handleInputChange}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
        </div>

        {/* To Give */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium mb-1">To Give</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="give_amount"
              value={form.give_amount}
              onChange={handleInputChange}
              className="flex-1 border p-2 rounded"
            />
            <select
              name="give_mode"
              value={form.give_mode}
              onChange={handleInputChange}
              className="border p-2 rounded"
            >
              <option value="cash">Cash</option>
              <option value="gpay">GPay</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="col-span-2 text-center">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded">
            Save Entry
          </button>
        </div>
      </form>

      {/* Summary Section */}
      <div className="bg-gray-100 shadow rounded p-4 my-6">
        <h2 className="text-lg font-semibold mb-3">🧾 Daily Summary & Tally Sheet</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p><strong>Cash Deposited:</strong> ₹{cashDeposited}</p>
            <p><strong>GPay Deposited:</strong> ₹{gpayDeposited}</p>
            <p><strong>Cash Collected:</strong> ₹{cashCollected}</p>
            <p><strong>GPay Collected:</strong> ₹{gpayCollected}</p>
            <p><strong>Total Customer Collection:</strong> ₹{cashCollected + gpayCollected}</p>
          </div>
          <div className="space-y-1">
            <p><strong>Bank Balance:</strong> ₹{bankBalance}</p>
            <p><strong>Wallet Balance:</strong> ₹{walletBalance}</p>
            <p><strong>Cash in Hand:</strong> ₹{cashInHand}</p>
            <p><strong>Total Expenses:</strong> ₹{bankExpenses + cashExpenses}</p>
            <p><strong>Pending to Receive:</strong> ₹{entries.reduce((t, e) => t + Number(e.receive_cash || 0) + Number(e.receive_gpay || 0), 0)}</p>
            <p><strong>Pending to Give:</strong> ₹{entries.reduce((t, e) => t + Number(e.give_cash || 0) + Number(e.give_gpay || 0), 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;