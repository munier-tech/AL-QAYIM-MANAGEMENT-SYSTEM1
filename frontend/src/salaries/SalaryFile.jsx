import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiSearch, FiDollarSign, FiUsers, FiPlus, FiCheck, FiX } from "react-icons/fi";
import { useSalaryStore } from "../store/salaryStore";
import useTeachersStore from "../store/teachersStore";

const SalaryFile = () => {
  // Period & lists
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [teachersWithSalaries, setTeachersWithSalaries] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Salary editing state
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [salaryForm, setSalaryForm] = useState({
    amount: "",
    bonus: "",
    deductions: "",
    note: "",
    paid: false,
  });

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, paid, unpaid, no-record

  const {
    createSalaryRecord,
    getAllTeachers,
    updateSalaryRecord,
    deleteSalaryRecord,
    loading: salaryLoading,
  } = useSalaryStore();

  const { fetchTeachers } = useTeachersStore();

  useEffect(() => {
    // preload teachers (optional global list)
    fetchTeachers().catch((err) => console.error("fetchTeachers error:", err));
  }, [fetchTeachers]);

  // Load teachers when month/year changes
  useEffect(() => {
    loadTeachersWithSalaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const loadTeachersWithSalaries = async () => {
    setLoadingTeachers(true);
    try {
      const response = await getAllTeachers(selectedMonth, selectedYear);
      setTeachersWithSalaries(response || []);
    } catch (error) {
      console.error("Error loading teachers:", error);
      setTeachersWithSalaries([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const calculateNetSalary = (amount, bonus = 0, deductions = 0) => {
    const a = parseFloat(amount || 0) || 0;
    const b = parseFloat(bonus || 0) || 0;
    const d = parseFloat(deductions || 0) || 0;
    const result = a + b - d;
    // show two decimals
    return Number.isNaN(result) ? 0 : Math.round(result * 100) / 100;
  };

  const handleCreateOrUpdateSalary = async (teacher) => {
    // ensure amount present and valid
    if (!salaryForm.amount || isNaN(parseFloat(salaryForm.amount))) {
      alert("Please fill in a valid salary amount");
      return;
    }

    try {
      const amount = parseFloat(salaryForm.amount);
      const bonus = parseFloat(salaryForm.bonus) || 0;
      const deductions = parseFloat(salaryForm.deductions) || 0;
      const totalAmount = calculateNetSalary(amount, bonus, deductions);

      const salaryData = {
        teacher: teacher._id,
        amount,
        bonus,
        deductions,
        totalAmount, // included for frontend consistency; backend also recalculates
        month: selectedMonth,
        year: selectedYear,
        note: salaryForm.note || "",
        paid: !!salaryForm.paid,
        paidDate: salaryForm.paid ? new Date().toISOString() : null,
      };

      if (teacher.salaryRecord) {
        // Update existing salary
        await updateSalaryRecord(teacher.salaryRecord._id, {
          amount: salaryData.amount,
          bonus: salaryData.bonus,
          deductions: salaryData.deductions,
          totalAmount: salaryData.totalAmount,
          note: salaryData.note,
          paid: salaryData.paid,
          paidDate: salaryData.paidDate,
        });
      } else {
        // Create new salary
        await createSalaryRecord(salaryData);
      }

      // Reset form and reload teachers
      setEditingTeacher(null);
      setSalaryForm({ amount: "", bonus: "", deductions: "", note: "", paid: false });
      await loadTeachersWithSalaries();
    } catch (error) {
      console.error("Error saving salary:", error);
      alert(error?.response?.data?.message || "Error saving salary");
    }
  };

  const handleEditSalary = (teacher) => {
    setEditingTeacher(teacher._id);
    if (teacher.salaryRecord) {
      setSalaryForm({
        amount: teacher.salaryRecord.amount?.toString() || "",
        bonus: teacher.salaryRecord.bonus?.toString() || "",
        deductions: teacher.salaryRecord.deductions?.toString() || "",
        note: teacher.salaryRecord.note || "",
        paid: !!teacher.salaryRecord.paid,
      });
    } else {
      setSalaryForm({
        amount: "",
        bonus: "",
        deductions: "",
        note: "",
        paid: false,
      });
    }
  };

  const handleDeleteSalary = async (salaryId) => {
    if (!confirm("Are you sure you want to delete this salary record?")) return;

    try {
      await deleteSalaryRecord(salaryId);
      await loadTeachersWithSalaries();
    } catch (error) {
      console.error("Error deleting salary:", error);
      alert(error?.response?.data?.message || "Error deleting salary");
    }
  };

  const togglePaymentStatus = async (teacher) => {
    if (!teacher.salaryRecord) return;

    try {
      await updateSalaryRecord(teacher.salaryRecord._id, {
        paid: !teacher.salaryRecord.paid,
        paidDate: !teacher.salaryRecord.paid ? new Date().toISOString() : null,
      });
      await loadTeachersWithSalaries();
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert(error?.response?.data?.message || "Error updating payment status");
    }
  };

  // Filter teachers based on search and status
  const filteredTeachers = teachersWithSalaries.filter((teacher) => {
    const matchesSearch = (teacher.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "paid") return matchesSearch && teacher.salaryRecord?.paid;
    if (filterStatus === "unpaid") return matchesSearch && teacher.salaryRecord && !teacher.salaryRecord.paid;
    if (filterStatus === "no-record") return matchesSearch && !teacher.salaryRecord;

    return matchesSearch;
  });

  const getMonthName = (monthNum) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return months[monthNum - 1];
  };

  const getStatusColor = (teacher) => {
    if (!teacher.salaryRecord) return "bg-gray-100 text-gray-800";
    if (teacher.salaryRecord.paid) return "bg-green-100 text-green-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusText = (teacher) => {
    if (!teacher.salaryRecord) return "No Record";
    if (teacher.salaryRecord.paid) return "Paid";
    return "Unpaid";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold">Individual Teacher Salary Management</h1>
          </div>
          <p className="mt-1 text-sm opacity-90">Set and manage individual teacher salaries with precise control.</p>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Select Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                min="2020"
                max="2030"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={loadTeachersWithSalaries}
                disabled={loadingTeachers}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loadingTeachers ? "Loading..." : "Load Teachers"}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Teachers</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="no-record">No Record</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teachers List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">
              Teacher Salaries - {getMonthName(selectedMonth)} {selectedYear}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? "s" : ""}
              {filterStatus !== "all" && ` (${filterStatus.replace("-", " ")})`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTeachers.map((teacher) => {
                  const isEditing = editingTeacher === teacher._id;
                  const displayAmount = isEditing ? salaryForm.amount : teacher.salaryRecord?.amount;
                  const displayBonus = isEditing ? salaryForm.bonus : teacher.salaryRecord?.bonus;
                  const displayDeductions = isEditing ? salaryForm.deductions : teacher.salaryRecord?.deductions;
                  const net = teacher.salaryRecord || isEditing
                    ? calculateNetSalary(displayAmount, displayBonus, displayDeductions)
                    : null;

                  return (
                    <tr key={teacher._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-sm text-gray-500">{teacher.subject || "N/A"}</div>
                      </td>

                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={salaryForm.amount}
                            onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Amount"
                          />
                        ) : (
                          <span className="text-gray-900">
                            {teacher.salaryRecord ? `$${teacher.salaryRecord.amount}` : "-"}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={salaryForm.bonus}
                            onChange={(e) => setSalaryForm({ ...salaryForm, bonus: e.target.value })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-gray-900">
                            {teacher.salaryRecord?.bonus ? `$${teacher.salaryRecord.bonus}` : "$0"}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={salaryForm.deductions}
                            onChange={(e) => setSalaryForm({ ...salaryForm, deductions: e.target.value })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="0"
                          />
                        ) : (
                          <span className="text-gray-900">
                            {teacher.salaryRecord?.deductions ? `$${teacher.salaryRecord.deductions}` : "$0"}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {net !== null ? `$${net}` : "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {isEditing ? (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={salaryForm.paid}
                              onChange={(e) => setSalaryForm({ ...salaryForm, paid: e.target.checked })}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm">Paid</span>
                          </label>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(teacher)}`}>
                            {getStatusText(teacher)}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleCreateOrUpdateSalary(teacher)}
                                disabled={salaryLoading}
                                className="p-1 text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTeacher(null);
                                  setSalaryForm({ amount: "", bonus: "", deductions: "", note: "", paid: false });
                                }}
                                className="p-1 text-gray-600 hover:text-gray-800"
                                title="Cancel"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditSalary(teacher)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title={teacher.salaryRecord ? "Edit Salary" : "Add Salary"}
                              >
                                {teacher.salaryRecord ? <FiEdit2 className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                              </button>

                              {teacher.salaryRecord && (
                                <>
                                  <button
                                    onClick={() => togglePaymentStatus(teacher)}
                                    className={`p-1 ${teacher.salaryRecord.paid ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
                                    title={teacher.salaryRecord.paid ? "Mark as Unpaid" : "Mark as Paid"}
                                  >
                                    {teacher.salaryRecord.paid ? <FiX className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
                                  </button>

                                  <button
                                    onClick={() => handleDeleteSalary(teacher.salaryRecord._id)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Delete Salary"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTeachers.length === 0 && !loadingTeachers && (
            <div className="text-center py-8 text-gray-500">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">No teachers found</p>
              <p className="text-sm">
                {searchQuery || filterStatus !== "all" ? "Try adjusting your search or filter criteria." : "Loading teachers..."}
              </p>
            </div>
          )}
        </div>

        {/* Note Input (when editing) */}
        {editingTeacher && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Additional Note</h3>
            <textarea
              value={salaryForm.note}
              onChange={(e) => setSalaryForm({ ...salaryForm, note: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows="3"
              placeholder="Optional note about this salary..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryFile;
