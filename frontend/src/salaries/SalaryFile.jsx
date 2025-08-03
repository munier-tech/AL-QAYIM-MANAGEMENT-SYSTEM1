import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiSearch, FiXCircle, FiDollarSign, FiUsers, FiCalendar, FiCheck, FiX } from "react-icons/fi";
import { useSalaryStore } from "../store/salaryStore";
import useTeachersStore from "../store/teachersStore";

const SalaryFile = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [formData, setFormData] = useState({
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonus: "",
    deductions: "",
    note: "",
  });

  const [individualSalaryData, setIndividualSalaryData] = useState({
    teacher: null,
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonus: "",
    deductions: "",
    note: "",
  });

  const [viewData, setViewData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [teachersWithSalaries, setTeachersWithSalaries] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [createMode, setCreateMode] = useState("all"); // "all" or "individual"
  
  // New state for bulk operations
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(""); // "mark_paid" or "mark_unpaid"
  const [showBulkActions, setShowBulkActions] = useState(false);

  const {
    createSalaryRecord,
    createAllTeachersSalaries,
    getAllTeachers,
    getAllSalaryRecords,
    updateSalaryRecord,
    deleteSalaryRecord,
    getSalaryStatistics,
    bulkUpdateSalaryPaymentStatus,
    loading: salaryLoading,
  } = useSalaryStore();

  const {
    teachers,
    fetchTeachers,
    loading: teachersLoading,
  } = useTeachersStore();

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(teacherSearchQuery.toLowerCase())
  );

  const selectTeacher = (teacher) => {
    setTeacherSearchQuery(teacher.name);
    setShowTeacherDropdown(false);
    setIndividualSalaryData({ ...individualSalaryData, teacher });
  };

  const handleAllTeachersSalaryCreate = async (e) => {
    e.preventDefault();
    if (!formData.amount) {
      alert("Please fill in the salary amount.");
      return;
    }

    const payload = {
      amount: parseFloat(formData.amount),
      month: parseInt(formData.month),
      year: parseInt(formData.year),
      bonus: formData.bonus ? parseFloat(formData.bonus) : 0,
      deductions: formData.deductions ? parseFloat(formData.deductions) : 0,
      note: formData.note,
    };

    await createAllTeachersSalaries(payload);
    
    // Reset form after successful creation
    setFormData({
      amount: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      bonus: "",
      deductions: "",
      note: "",
    });
  };

  const handleIndividualSalaryCreate = async (e) => {
    e.preventDefault();
    if (!individualSalaryData.teacher || !individualSalaryData.amount) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      teacher: individualSalaryData.teacher._id,
      amount: parseFloat(individualSalaryData.amount),
      month: parseInt(individualSalaryData.month),
      year: parseInt(individualSalaryData.year),
      bonus: individualSalaryData.bonus ? parseFloat(individualSalaryData.bonus) : 0,
      deductions: individualSalaryData.deductions ? parseFloat(individualSalaryData.deductions) : 0,
      note: individualSalaryData.note,
    };

    await createSalaryRecord(payload);
    
    // Reset form after successful creation
    setIndividualSalaryData({
      teacher: null,
      amount: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      bonus: "",
      deductions: "",
      note: "",
    });
    setTeacherSearchQuery("");
  };

  const handleViewSalaries = async () => {
    setLoadingRecords(true);
    try {
      const response = await getAllTeachers(viewData.month, viewData.year);
      setTeachersWithSalaries(response || []);
    } catch (error) {
      console.error("Error fetching teachers with salaries:", error);
      setTeachersWithSalaries([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handlePaymentToggle = async (salaryRecord) => {
    try {
      await updateSalaryRecord(salaryRecord._id, {
        paid: !salaryRecord.paid,
        paidDate: !salaryRecord.paid ? new Date().toISOString() : null,
      });
      
      // Refresh the data
      handleViewSalaries();
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  // Handle bulk teacher selection
  const handleTeacherSelection = (teacherId, salaryRecordId) => {
    const newSelected = new Set(selectedTeachers);
    const selectionKey = `${teacherId}-${salaryRecordId}`;
    
    if (newSelected.has(selectionKey)) {
      newSelected.delete(selectionKey);
    } else {
      newSelected.add(selectionKey);
    }
    
    setSelectedTeachers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Handle select all/none
  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      const allSelectable = new Set();
      teachersWithSalaries.forEach(teacher => {
        if (teacher.salaryRecord) {
          allSelectable.add(`${teacher._id}-${teacher.salaryRecord._id}`);
        }
      });
      setSelectedTeachers(allSelectable);
      setShowBulkActions(allSelectable.size > 0);
    } else {
      setSelectedTeachers(new Set());
      setShowBulkActions(false);
    }
  };

  // Handle bulk payment status update
  const handleBulkPaymentUpdate = async (markAsPaid) => {
    try {
      const salaryUpdates = [];
      
      selectedTeachers.forEach(selectionKey => {
        const [teacherId, salaryRecordId] = selectionKey.split('-');
        salaryUpdates.push({
          salaryId: salaryRecordId,
          paid: markAsPaid,
          paidDate: markAsPaid ? new Date().toISOString() : null
        });
      });

      if (salaryUpdates.length === 0) {
        alert("No teachers selected for bulk update.");
        return;
      }

      await bulkUpdateSalaryPaymentStatus(salaryUpdates);
      
      // Clear selections and refresh data
      setSelectedTeachers(new Set());
      setShowBulkActions(false);
      setBulkAction("");
      
      alert(`Successfully updated payment status for ${salaryUpdates.length} teachers.`);
      
    } catch (error) {
      console.error("Error bulk updating payment status:", error);
      alert("Error updating payment status. Please try again.");
    }
  };

  const getMonthName = (monthNum) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNum - 1];
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
            <h1 className="text-3xl font-bold">Teacher Salary Management</h1>
          </div>
          <p className="mt-1 text-sm opacity-90">Manage and track teacher salaries with ease.</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-100">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === "create"
                  ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                  : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiDollarSign className="w-4 h-4" />
                <span>Create Salaries</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === "view"
                  ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                  : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiSearch className="w-4 h-4" />
                <span>View Salaries</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* Create Salary Tab Content */}
            {activeTab === "create" && (
              <div className="space-y-6">
                {/* Create Mode Toggle */}
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setCreateMode("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      createMode === "all"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FiUsers className="w-4 h-4 inline mr-2" />
                    Create for All Teachers
                  </button>
                  <button
                    onClick={() => setCreateMode("individual")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      createMode === "individual"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Create for Individual
                  </button>
                </div>

                {createMode === "all" ? (
                  <form onSubmit={handleAllTeachersSalaryCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Base Salary Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base Salary Amount ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter base salary amount..."
                          required
                        />
                      </div>

                      {/* Bonus */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bonus ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.bonus}
                          onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter bonus amount..."
                        />
                      </div>

                      {/* Deductions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deductions ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.deductions}
                          onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter deductions amount..."
                        />
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Month *
                        </label>
                        <select
                          value={formData.month}
                          onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {getMonthName(i + 1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year *
                        </label>
                        <input
                          type="number"
                          min="2020"
                          max="2030"
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>

                      {/* Note */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Note
                        </label>
                        <textarea
                          value={formData.note}
                          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          rows="3"
                          placeholder="Optional note..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={salaryLoading || !formData.amount}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        salaryLoading || !formData.amount ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"
                      } bg-green-600 text-white`}
                    >
                      {salaryLoading ? "Creating..." : "Create Salaries for All Teachers"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleIndividualSalaryCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Teacher Selection */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Teacher *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={teacherSearchQuery}
                            onChange={(e) => {
                              setTeacherSearchQuery(e.target.value);
                              setShowTeacherDropdown(true);
                            }}
                            onFocus={() => setShowTeacherDropdown(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Search for a teacher..."
                            required
                          />
                          {teacherSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setTeacherSearchQuery("");
                                setIndividualSalaryData({ ...individualSalaryData, teacher: null });
                                setShowTeacherDropdown(false);
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <FiXCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {showTeacherDropdown && filteredTeachers.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredTeachers.map((teacher) => (
                              <div
                                key={teacher._id}
                                onClick={() => selectTeacher(teacher)}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium">{teacher.name}</div>
                                <div className="text-sm text-gray-500">
                                  Subject: {teacher.subject}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Salary Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Salary Amount ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={individualSalaryData.amount}
                          onChange={(e) => setIndividualSalaryData({ ...individualSalaryData, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter salary amount..."
                          required
                        />
                      </div>

                      {/* Bonus */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bonus ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={individualSalaryData.bonus}
                          onChange={(e) => setIndividualSalaryData({ ...individualSalaryData, bonus: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter bonus amount..."
                        />
                      </div>

                      {/* Deductions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deductions ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={individualSalaryData.deductions}
                          onChange={(e) => setIndividualSalaryData({ ...individualSalaryData, deductions: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter deductions amount..."
                        />
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Month *
                        </label>
                        <select
                          value={individualSalaryData.month}
                          onChange={(e) => setIndividualSalaryData({ ...individualSalaryData, month: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {getMonthName(i + 1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Year */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year *
                        </label>
                        <input
                          type="number"
                          min="2020"
                          max="2030"
                          value={individualSalaryData.year}
                          onChange={(e) => setIndividualSalaryData({ ...individualSalaryData, year: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          required
                        />
                      </div>

                      {/* Note */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Note
                        </label>
                        <textarea
                          value={individualSalaryData.note}
                          onChange={(e) => setIndividualSalaryData({ ...individualSalaryData, note: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          rows="3"
                          placeholder="Optional note..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={salaryLoading || !individualSalaryData.teacher}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        salaryLoading || !individualSalaryData.teacher ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"
                      } bg-green-600 text-white`}
                    >
                      {salaryLoading ? "Creating..." : "Create Salary Record"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* View Salary Tab Content */}
            {activeTab === "view" && (
              <div className="space-y-6">
                {/* Search Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      value={viewData.month}
                      onChange={(e) => setViewData({ ...viewData, month: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {getMonthName(i + 1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      min="2020"
                      max="2030"
                      value={viewData.year}
                      onChange={(e) => setViewData({ ...viewData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleViewSalaries}
                      disabled={loadingRecords}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                        loadingRecords ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"
                      } bg-green-600 text-white`}
                    >
                      {loadingRecords ? "Loading..." : "Search Salaries"}
                    </button>
                  </div>
                </div>

                {/* Results */}
                {teachersWithSalaries.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Salary Records for {getMonthName(viewData.month)} {viewData.year}
                        </h3>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="selectAllTeachers"
                                checked={selectedTeachers.size > 0 && selectedTeachers.size === teachersWithSalaries.filter(t => t.salaryRecord).length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <label htmlFor="selectAllTeachers" className="text-sm text-gray-700">
                                Select All ({teachersWithSalaries.filter(t => t.salaryRecord).length})
                              </label>
                            </div>
                            <div className="flex items-center space-x-3 text-xs">
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-green-100 rounded-full border border-green-300"></div>
                                <span className="text-green-700">
                                  Paid: {teachersWithSalaries.filter(t => t.salaryRecord?.paid).length}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-red-100 rounded-full border border-red-300"></div>
                                <span className="text-red-700">
                                  Unpaid: {teachersWithSalaries.filter(t => t.salaryRecord && !t.salaryRecord.paid).length}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-gray-100 rounded-full border border-gray-300"></div>
                                <span className="text-gray-700">
                                  No Record: {teachersWithSalaries.filter(t => !t.salaryRecord).length}
                                </span>
                              </div>
                            </div>
                          </div>
                          {showBulkActions && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">
                                {selectedTeachers.size} selected
                              </span>
                              <button
                                onClick={() => handleBulkPaymentUpdate(true)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium hover:bg-green-200 transition-colors"
                              >
                                <FiCheck className="w-3 h-3 inline mr-1" />
                                Mark Paid
                              </button>
                              <button
                                onClick={() => handleBulkPaymentUpdate(false)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                              >
                                <FiX className="w-3 h-3 inline mr-1" />
                                Mark Unpaid
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <input
                                type="checkbox"
                                checked={selectedTeachers.size > 0 && selectedTeachers.size === teachersWithSalaries.filter(t => t.salaryRecord).length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Teacher
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Base Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Bonus
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Deductions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {teachersWithSalaries.map((teacherData) => (
                            <tr key={teacherData._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {teacherData.salaryRecord && (
                                  <input
                                    type="checkbox"
                                    checked={selectedTeachers.has(`${teacherData._id}-${teacherData.salaryRecord._id}`)}
                                    onChange={() => handleTeacherSelection(teacherData._id, teacherData.salaryRecord._id)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                  />
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {teacherData.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {teacherData.subject}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {teacherData.salaryRecord ? `$${teacherData.salaryRecord.amount}` : 'No salary set'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {teacherData.salaryRecord ? `$${teacherData.salaryRecord.bonus || 0}` : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {teacherData.salaryRecord ? `$${teacherData.salaryRecord.deductions || 0}` : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {teacherData.salaryRecord ? `$${teacherData.salaryRecord.totalAmount}` : '-'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {teacherData.salaryRecord ? (
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    teacherData.salaryRecord.paid
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {teacherData.salaryRecord.paid ? 'Paid' : 'Unpaid'}
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                    No Record
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {teacherData.salaryRecord && (
                                  <button
                                    onClick={() => handlePaymentToggle(teacherData.salaryRecord)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                      teacherData.salaryRecord.paid
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  >
                                    Mark as {teacherData.salaryRecord.paid ? 'Unpaid' : 'Paid'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : !loadingRecords ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No teachers found</p>
                    <p className="text-sm">
                      Click "Search Salaries" to view teacher salary records for the selected period.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryFile;