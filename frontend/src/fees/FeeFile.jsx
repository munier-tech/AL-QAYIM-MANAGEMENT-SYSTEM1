import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiSearch, FiXCircle, FiDollarSign, FiUsers, FiCalendar, FiPlus, FiCheck, FiX, FiFamily } from "react-icons/fi";
import { useFeeStore } from "../store/feeStore";
import { useFamilyFeeStore } from "../store/familyFeeStore";
import useStudentsStore from "../store/studentsStore";
import useClassesStore from "../store/classesStore";

const FeeFile = () => {
  const [activeTab, setActiveTab] = useState("individual");
  
  // Individual fee management state
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [classStudents, setClassStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Fee editing state
  const [editingStudent, setEditingStudent] = useState(null);
  const [feeForm, setFeeForm] = useState({
    amount: "",
    dueDate: "",
    note: "",
    paid: false
  });

  // Family fee state
  const [familyFees, setFamilyFeesLocal] = useState([]);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [familyForm, setFamilyForm] = useState({
    familyName: "",
    students: [],
    totalAmount: "",
    dueDate: "",
    note: ""
  });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [payingStudents, setPayingStudents] = useState(new Set());

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, paid, unpaid, no-record

  const {
    createFeeRecord,
    getStudentsByClass,
    updateFeeRecord,
    deleteFeeRecord,
    getAllFeeRecords,
    loading: feeLoading,
  } = useFeeStore();

  const {
    familyFees: storeFamilyFees,
    createFamilyFee,
    getAllFamilyFees,
    updateFamilyFee,
    processFamilyFeePayment,
    deleteFamilyFee,
    loading: familyFeeLoading,
  } = useFamilyFeeStore();

  const { students, fetchStudents } = useStudentsStore();
  const { classes, fetchClasses } = useClassesStore();

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  // Load students when class/month/year changes
  useEffect(() => {
    if (selectedClass && activeTab === "individual") {
      loadClassStudents();
    }
  }, [selectedClass, selectedMonth, selectedYear, activeTab]);

  // Load family fees when family tab is active
  useEffect(() => {
    if (activeTab === "family") {
      loadFamilyFees();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  const loadClassStudents = async () => {
    if (!selectedClass) return;
    
    setLoadingStudents(true);
    try {
      const response = await getStudentsByClass(
        selectedClass._id,
        selectedMonth,
        selectedYear
      );
      setClassStudents(response || []);
    } catch (error) {
      console.error("Error loading students:", error);
      setClassStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadFamilyFees = async () => {
    try {
      const filters = {
        month: selectedMonth,
        year: selectedYear
      };
      const response = await getAllFamilyFees(filters);
      setFamilyFeesLocal(response || []);
    } catch (error) {
      console.error("Error loading family fees:", error);
      setFamilyFeesLocal([]);
    }
  };

  const handleCreateOrUpdateFee = async (student) => {
    if (!feeForm.amount || !feeForm.dueDate) {
      alert("Please fill in amount and due date");
      return;
    }

    try {
      const feeData = {
        student: student._id,
        amount: parseFloat(feeForm.amount),
        month: selectedMonth,
        year: selectedYear,
        dueDate: feeForm.dueDate,
        note: feeForm.note,
        paid: feeForm.paid,
        paidDate: feeForm.paid ? new Date().toISOString() : null
      };

      if (student.feeRecord) {
        // Update existing fee
        await updateFeeRecord(student.feeRecord._id, {
          amount: feeData.amount,
          dueDate: feeData.dueDate,
          note: feeData.note,
          paid: feeData.paid,
          paidDate: feeData.paidDate
        });
      } else {
        // Create new fee
        await createFeeRecord(feeData);
      }

      // Reset form and reload
      setEditingStudent(null);
      setFeeForm({ amount: "", dueDate: "", note: "", paid: false });
      await loadClassStudents();
    } catch (error) {
      console.error("Error creating/updating fee:", error);
      alert("Failed to save fee record");
    }
  };

  const handleDeleteFee = async (feeId) => {
    if (!confirm("Are you sure you want to delete this fee record?")) return;

    try {
      await deleteFeeRecord(feeId);
      await loadClassStudents();
    } catch (error) {
      console.error("Error deleting fee:", error);
      alert("Failed to delete fee record");
    }
  };

  const handleTogglePayment = async (student) => {
    if (!student.feeRecord) return;

    try {
      await updateFeeRecord(student.feeRecord._id, {
        paid: !student.feeRecord.paid,
        paidDate: !student.feeRecord.paid ? new Date().toISOString() : null
      });
      await loadClassStudents();
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  // Family fee functions
  const handleCreateFamilyFee = async () => {
    if (!familyForm.familyName || selectedStudents.length === 0 || !familyForm.totalAmount || !familyForm.dueDate) {
      alert("Please fill in all required fields and select at least one student");
      return;
    }

    try {
      const familyData = {
        familyName: familyForm.familyName,
        students: selectedStudents.map(studentId => ({
          student: studentId,
          isPaying: payingStudents.has(studentId)
        })),
        totalAmount: parseFloat(familyForm.totalAmount),
        month: selectedMonth,
        year: selectedYear,
        dueDate: familyForm.dueDate,
        note: familyForm.note
      };

      await createFamilyFee(familyData);
      
      // Reset form
      setFamilyForm({
        familyName: "",
        students: [],
        totalAmount: "",
        dueDate: "",
        note: ""
      });
      setSelectedStudents([]);
      setPayingStudents(new Set());
      setShowFamilyForm(false);
      
      await loadFamilyFees();
    } catch (error) {
      console.error("Error creating family fee:", error);
      alert("Failed to create family fee record");
    }
  };

  const handleProcessFamilyPayment = async (familyFee) => {
    const paidAmount = prompt(`Enter payment amount (Total: $${familyFee.totalAmount}):`);
    if (!paidAmount) return;

    const amount = parseFloat(paidAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await processFamilyFeePayment(familyFee._id, {
        paidAmount: amount,
        paymentMethod: 'cash',
        note: `Payment processed on ${new Date().toLocaleDateString()}`
      });
      await loadFamilyFees();
    } catch (error) {
      console.error("Error processing family payment:", error);
      alert("Failed to process payment");
    }
  };

  const handleDeleteFamilyFee = async (familyFeeId) => {
    if (!confirm("Are you sure you want to delete this family fee record?")) return;

    try {
      await deleteFamilyFee(familyFeeId);
      await loadFamilyFees();
    } catch (error) {
      console.error("Error deleting family fee:", error);
      alert("Failed to delete family fee record");
    }
  };

  // Filter students based on search and status
  const filteredStudents = classStudents.filter(student => {
    const matchesSearch = student.fullname.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "paid") return matchesSearch && student.feeRecord?.paid;
    if (filterStatus === "unpaid") return matchesSearch && student.feeRecord && !student.feeRecord.paid;
    if (filterStatus === "no-record") return matchesSearch && !student.feeRecord;
    
    return matchesSearch;
  });

  const getMonthName = (monthNum) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNum - 1];
  };

  const getStatusColor = (student) => {
    if (!student.feeRecord) return "bg-gray-100 text-gray-800";
    if (student.feeRecord.paid) return "bg-green-100 text-green-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusText = (student) => {
    if (!student.feeRecord) return "No Record";
    if (student.feeRecord.paid) return "Paid";
    return "Unpaid";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold">Student Fee Management</h1>
          </div>
          <p className="mt-1 text-sm opacity-90">Manage individual and family student fees with precise control.</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-100">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("individual")}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "individual"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FiUsers className="w-4 h-4 mr-2" />
              Individual Fees
            </button>
            <button
              onClick={() => setActiveTab("family")}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "family"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FiFamily className="w-4 h-4 mr-2" />
              Family Fees
            </button>
          </div>
        </div>

        {/* Individual Fee Tab */}
        {activeTab === "individual" && (
          <>
            {/* Class and Period Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Select Class and Period</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select
                    value={selectedClass?._id || ""}
                    onChange={(e) => {
                      const cls = classes.find(c => c._id === e.target.value);
                      setSelectedClass(cls);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={loadClassStudents}
                    disabled={!selectedClass || loadingStudents}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingStudents ? "Loading..." : "Load Students"}
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            {selectedClass && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Students</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="no-record">No Record</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Students List */}
            {selectedClass && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">
                    {selectedClass.name} - {getMonthName(selectedMonth)} {selectedYear}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredStudents.length} students found
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {student.fullname.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.fullname}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {student.studentId}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student)}`}>
                              {getStatusText(student)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.feeRecord ? `$${student.feeRecord.amount}` : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.feeRecord 
                              ? new Date(student.feeRecord.dueDate).toLocaleDateString()
                              : "-"
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditingStudent(student);
                                  if (student.feeRecord) {
                                    setFeeForm({
                                      amount: student.feeRecord.amount.toString(),
                                      dueDate: student.feeRecord.dueDate.split('T')[0],
                                      note: student.feeRecord.note || "",
                                      paid: student.feeRecord.paid
                                    });
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FiEdit2 className="w-4 h-4" />
                              </button>
                              
                              {student.feeRecord && (
                                <>
                                  <button
                                    onClick={() => handleTogglePayment(student)}
                                    className={`${
                                      student.feeRecord.paid 
                                        ? "text-red-600 hover:text-red-900" 
                                        : "text-green-600 hover:text-green-900"
                                    }`}
                                  >
                                    {student.feeRecord.paid ? <FiX className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteFee(student.feeRecord._id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fee Form Modal */}
            {editingStudent && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {editingStudent.feeRecord ? "Edit" : "Create"} Fee Record
                    </h3>
                    <button
                      onClick={() => {
                        setEditingStudent(null);
                        setFeeForm({ amount: "", dueDate: "", note: "", paid: false });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiXCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student: {editingStudent.fullname}
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={feeForm.amount}
                        onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter amount"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={feeForm.dueDate}
                        onChange={(e) => setFeeForm({ ...feeForm, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Note (Optional)
                      </label>
                      <textarea
                        value={feeForm.note}
                        onChange={(e) => setFeeForm({ ...feeForm, note: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Add any notes..."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="paid"
                        checked={feeForm.paid}
                        onChange={(e) => setFeeForm({ ...feeForm, paid: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="paid" className="ml-2 block text-sm text-gray-900">
                        Mark as paid
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setEditingStudent(null);
                        setFeeForm({ amount: "", dueDate: "", note: "", paid: false });
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCreateOrUpdateFee(editingStudent)}
                      disabled={feeLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {feeLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Family Fee Tab */}
        {activeTab === "family" && (
          <>
            {/* Period Selection for Family Fees */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Select Period</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setShowFamilyForm(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Create Family Fee
                  </button>
                </div>
              </div>
            </div>

            {/* Family Fees List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  Family Fees - {getMonthName(selectedMonth)} {selectedYear}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {familyFees.length} family fee records found
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Family Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
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
                    {familyFees.map((familyFee) => (
                      <tr key={familyFee._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {familyFee.familyName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {familyFee.students.map((student) => (
                              <div key={student.student._id} className="flex items-center justify-between mb-1">
                                <span>{student.student.firstName} {student.student.lastName}</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  student.isPaying 
                                    ? "bg-blue-100 text-blue-800" 
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                  {student.isPaying ? "Paying" : "Covered"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${familyFee.totalAmount}
                          {familyFee.paid && (
                            <div className="text-xs text-green-600">
                              Paid: ${familyFee.paidAmount}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            familyFee.paid 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          }`}>
                            {familyFee.paid ? "Paid" : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {!familyFee.paid && (
                              <button
                                onClick={() => handleProcessFamilyPayment(familyFee)}
                                className="text-green-600 hover:text-green-900"
                                title="Process Payment"
                              >
                                <FiDollarSign className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFamilyFee(familyFee._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Family Fee Form Modal */}
            {showFamilyForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Create Family Fee Record</h3>
                    <button
                      onClick={() => {
                        setShowFamilyForm(false);
                        setFamilyForm({
                          familyName: "",
                          students: [],
                          totalAmount: "",
                          dueDate: "",
                          note: ""
                        });
                        setSelectedStudents([]);
                        setPayingStudents(new Set());
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiXCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Family Name
                      </label>
                      <input
                        type="text"
                        value={familyForm.familyName}
                        onChange={(e) => setFamilyForm({ ...familyForm, familyName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter family name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Students
                      </label>
                      <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                        {students.map((student) => (
                          <div key={student._id} className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`student-${student._id}`}
                                checked={selectedStudents.includes(student._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudents([...selectedStudents, student._id]);
                                  } else {
                                    setSelectedStudents(selectedStudents.filter(id => id !== student._id));
                                    setPayingStudents(prev => {
                                      const newSet = new Set(prev);
                                      newSet.delete(student._id);
                                      return newSet;
                                    });
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`student-${student._id}`} className="ml-2 text-sm text-gray-900">
                                {student.firstName} {student.lastName} - {student.studentId}
                              </label>
                            </div>
                            {selectedStudents.includes(student._id) && (
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`paying-${student._id}`}
                                  checked={payingStudents.has(student._id)}
                                  onChange={(e) => {
                                    const newSet = new Set(payingStudents);
                                    if (e.target.checked) {
                                      newSet.add(student._id);
                                    } else {
                                      newSet.delete(student._id);
                                    }
                                    setPayingStudents(newSet);
                                  }}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`paying-${student._id}`} className="ml-1 text-xs text-green-600">
                                  Paying
                                </label>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Select students and mark which ones will pay (others will be covered by family payment)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={familyForm.totalAmount}
                        onChange={(e) => setFamilyForm({ ...familyForm, totalAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter total amount for family"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={familyForm.dueDate}
                        onChange={(e) => setFamilyForm({ ...familyForm, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Note (Optional)
                      </label>
                      <textarea
                        value={familyForm.note}
                        onChange={(e) => setFamilyForm({ ...familyForm, note: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Add any notes..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowFamilyForm(false);
                        setFamilyForm({
                          familyName: "",
                          students: [],
                          totalAmount: "",
                          dueDate: "",
                          note: ""
                        });
                        setSelectedStudents([]);
                        setPayingStudents(new Set());
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateFamilyFee}
                      disabled={familyFeeLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {familyFeeLoading ? "Creating..." : "Create Family Fee"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeeFile;