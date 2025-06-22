import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Save, Edit3, Calendar, Search, Filter, DollarSign, CreditCard, Building, User, ArrowRight, Check, X, Eye, EyeOff } from "lucide-react";

// Mock PocketBase for demo - replace with actual import
import PocketBase from 'pocketbase';
const pb = new PocketBase('https://virtualdrive.pockethost.io');

const EditHistory = () => {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // table, card, detail
  const [expandedSections, setExpandedSections] = useState({});
  const [visibleColumns, setVisibleColumns] = useState({});

  // Field categories for better organization
  const fieldCategories = {
    basic: {
      title: "Basic Info",
      icon: User,
      fields: ["item", "customer_name", "entry_date"],
      color: "blue"
    },
    cash: {
      title: "Cash Transactions",
      icon: DollarSign,
      fields: ["deposit_cash", "credited_cash", "expense_self_cash", "expense_staff_cash", 
               "expense_enterprise_cash", "expense_misc_cash", "receive_cash", "give_cash", 
               "opening_cash_balance", "thirdparty_paid_cash", "thirdparty_fee_cash"],
      color: "green"
    },
    digital: {
      title: "Digital Payments",
      icon: CreditCard,
      fields: ["ed_wallet_gpay", "portal_gpay", "deposit_gpay", "credited_gpay", 
               "expense_self_gpay", "expense_staff_gpay", "expense_enterprise_gpay", 
               "expense_misc_gpay", "receive_gpay", "give_gpay", "thirdparty_paid_gpay", "thirdparty_fee_gpay"],
      color: "purple"
    },
    banking: {
      title: "Bank Balance",
      icon: Building,
      fields: ["opening_bank_balance", "closing_bank_balance"],
      color: "indigo"
    }
  };

  const fetchFilteredEntries = async () => {
    setLoading(true);
    try {
      let filter = "";
      if (startDate && endDate) {
        filter = `entry_date >= '${startDate}' && entry_date <= '${endDate}'`;
      }
      const res = await pb.collection("daily_entries").getFullList({
        sort: "-entry_date",
        filter
      });
      setEntries(res);
      setFilteredEntries(res);
      
      // Initialize visible columns
      if (res.length > 0) {
        const initialVisible = {};
        Object.keys(fieldCategories).forEach(category => {
          initialVisible[category] = true;
        });
        setVisibleColumns(initialVisible);
      }
    } catch (err) {
      console.error("Error fetching entries:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFilteredEntries();
  }, []);

  useEffect(() => {
    const filtered = entries.filter(entry => {
      if (!searchTerm) return true;
      return Object.values(entry).some(value => 
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredEntries(filtered);
  }, [searchTerm, entries]);

  const handleFieldChange = (id, field, value) => {
    setEntries(prev => prev.map(entry => (
      entry.id === id ? { ...entry, [field]: value } : entry
    )));
    setFilteredEntries(prev => prev.map(entry => (
      entry.id === id ? { ...entry, [field]: value } : entry
    )));
  };

  const saveEntry = async (entry) => {
    setEditingId(entry.id);
    try {
      const update = { ...entry };
      delete update.id;
      delete update.collectionId;
      delete update.collectionName;
      delete update.created;
      delete update.updated;

      await pb.collection("daily_entries").update(entry.id, update);
      setSuccessMessage("Entry updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error updating entry:", err);
      alert("Update failed.");
    }
    setEditingId(null);
  };

  const formatFieldName = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleColumnVisibility = (category) => {
    setVisibleColumns(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200 text-blue-800",
      green: "bg-green-50 border-green-200 text-green-800",
      purple: "bg-purple-50 border-purple-200 text-purple-800",
      indigo: "bg-indigo-50 border-indigo-200 text-indigo-800"
    };
    return colors[color] || colors.blue;
  };

  // Card View Component
  const EntryCard = ({ entry }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{entry.item}</h3>
            <p className="text-indigo-100">{entry.customer_name}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100 text-sm">Date</p>
            <p className="font-medium">{entry.entry_date}</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {Object.entries(fieldCategories).map(([categoryKey, category]) => (
          <div key={categoryKey} className={`border rounded-lg ${getColorClasses(category.color)}`}>
            <button
              onClick={() => toggleSection(`${entry.id}-${categoryKey}`)}
              className="w-full p-3 flex items-center justify-between hover:bg-opacity-80 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <category.icon className="w-4 h-4" />
                <span className="font-medium">{category.title}</span>
              </div>
              {expandedSections[`${entry.id}-${categoryKey}`] ? 
                <ChevronUp className="w-4 h-4" /> : 
                <ChevronDown className="w-4 h-4" />
              }
            </button>
            
            {expandedSections[`${entry.id}-${categoryKey}`] && (
              <div className="border-t border-current border-opacity-20 p-3 space-y-2 bg-white bg-opacity-50">
                {category.fields.map(field => (
                  <div key={field} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex-1">
                      {formatFieldName(field)}
                    </label>
                    <input
                      type={field.includes('date') ? 'date' : 'text'}
                      value={entry[field] ?? ""}
                      onChange={e => handleFieldChange(entry.id, field, e.target.value)}
                      className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        
        <button 
          onClick={() => saveEntry(entry)}
          disabled={editingId === entry.id}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-400 disabled:to-green-400 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {editingId === entry.id ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Edit3 className="w-8 h-8 mr-3 text-indigo-600" />
                Finance Entry Editor
              </h1>
              <p className="text-gray-600 mt-1">Manage and edit your financial records with ease</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                {filteredEntries.length} entries
              </div>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center">
              <Check className="w-5 h-5 mr-2" />
              {successMessage}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input 
                type="text" 
                placeholder="Search entries..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
              <select 
                value={viewMode} 
                onChange={e => setViewMode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="card">Card View</option>
                <option value="table">Table View</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={fetchFilteredEntries} 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Filter className="w-4 h-4 mr-2" />
                    Apply
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Column Visibility Controls for Table View */}
          {viewMode === "table" && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <EyeOff className="w-4 h-4 mr-1" />
                Show/Hide Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(fieldCategories).map(([categoryKey, category]) => (
                  <button
                    key={categoryKey}
                    onClick={() => toggleColumnVisibility(categoryKey)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      visibleColumns[categoryKey] 
                        ? `${getColorClasses(category.color)} border-current` 
                        : 'bg-gray-100 text-gray-500 border-gray-300'
                    }`}
                  >
                    <category.icon className="w-3 h-3 inline mr-1" />
                    {category.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading entries...</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
            <p className="text-gray-600">Try adjusting your filters or date range.</p>
          </div>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEntries.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.entries(fieldCategories).map(([categoryKey, category]) => 
                      visibleColumns[categoryKey] && category.fields.map(field => (
                        <th key={field} className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-l-2 ${
                          category.color === 'blue' ? 'border-blue-400' :
                          category.color === 'green' ? 'border-green-400' :
                          category.color === 'purple' ? 'border-purple-400' :
                          'border-indigo-400'
                        }`}>
                          <div className="flex items-center space-x-1">
                            <category.icon className="w-3 h-3" />
                            <span>{formatFieldName(field)}</span>
                          </div>
                        </th>
                      ))
                    )}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.map((entry, index) => (
                    <tr key={entry.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      {Object.entries(fieldCategories).map(([categoryKey, category]) => 
                        visibleColumns[categoryKey] && category.fields.map(field => (
                          <td key={field} className="px-4 py-3 whitespace-nowrap">
                            <input
                              type={field.includes('date') ? 'date' : 'text'}
                              value={entry[field] ?? ""}
                              onChange={e => handleFieldChange(entry.id, field, e.target.value)}
                              className="w-full min-w-[120px] border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                              disabled={editingId && editingId !== entry.id}
                            />
                          </td>
                        ))
                      )}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button 
                          onClick={() => saveEntry(entry)}
                          disabled={editingId === entry.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                        >
                          {editingId === entry.id ? (
                            <>
                              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        {filteredEntries.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex flex-wrap justify-between items-center text-sm text-gray-600">
              <div>Showing {filteredEntries.length} of {entries.length} entries</div>
              <div className="flex items-center space-x-4">
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditHistory;