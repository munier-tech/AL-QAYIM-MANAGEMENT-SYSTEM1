import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiSearch, FiXCircle, FiDollarSign, FiUsers, FiCalendar } from "react-icons/fi";
import { useFeeStore } from "../store/feeStore";
import useStudentsStore from "../store/studentsStore";
import useClassesStore from "../store/classesStore";

const FeeFile = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [formData, setFormData] = useState({
    selectedClass: null,
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    dueDate: "",
    note: "",
  });

  const [individualFeeData, setIndividualFeeData] = useState({
    student: null,
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    dueDate: "",
    note: "",
  });

  const [viewData, setViewData] = useState({
    selectedClass: null,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [classStudents, setClassStudents] = useState([]);
  const [feeRecords, setFeeRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [createMode, setCreateMode] = useState("class"); // "class" or "individual"

  const {
    createFeeRecord,
    createClassFees,
    getStudentsByClass,
    getAllFeeRecords,
    updateFeeRecord,
    deleteFeeRecord,
    getFeeStatistics,
    loading: feeLoading,
  } = useFeeStore();

  const {
    students,
    fetchStudents,
    loading: studentsLoading,
  } = useStudentsStore();

  const {
    classes,
    fetchClasses,
    loading: classesLoading,
  } = useClassesStore();

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [fetchStudents, fetchClasses]);

  // Filter students based on search query
  const filteredStudents = students.filter(
    (student) =>
      student.fullname.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const selectStudent = (student) => {
    setStudentSearchQuery(student.fullname);
    setShowStudentDropdown(false);
    setIndividualFeeData({ ...individualFeeData, student });
  };

  const handleClassFeeCreate = async (e) => {
    e.preventDefault();
    if (!formData.selectedClass || !formData.amount || !formData.dueDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      classId: formData.selectedClass._id,
      amount: parseFloat(formData.amount),
      month: parseInt(formData.month),
      year: parseInt(formData.year),
      dueDate: formData.dueDate,
      note: formData.note,
    };

    await createClassFees(payload);
    
    // Reset form after successful creation
    setFormData({
      selectedClass: null,
      amount: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      dueDate: "",
      note: "",
    });
  };

  const handleIndividualFeeCreate = async (e) => {
    e.preventDefault();
    if (!individualFeeData.student || !individualFeeData.amount || !individualFeeData.dueDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      student: individualFeeData.student._id,
      amount: parseFloat(individualFeeData.amount),
      month: parseInt(individualFeeData.month),
      year: parseInt(individualFeeData.year),
      dueDate: individualFeeData.dueDate,
      note: individualFeeData.note,
    };

    await createFeeRecord(payload);
    
    // Reset form after successful creation
    setIndividualFeeData({
      student: null,
      amount: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      dueDate: "",
      note: "",
    });
    setStudentSearchQuery("");
  };

  const handleViewFees = async () => {
    if (!viewData.selectedClass) {
      alert("Please select a class to view fees.");
      return;
    }

    setLoadingRecords(true);
    try {
      const response = await getStudentsByClass(
        viewData.selectedClass._id,
        viewData.month,
        viewData.year
      );
      setClassStudents(response || []);
    } catch (error) {
      console.error("Error fetching class students with fees:", error);
      setClassStudents([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handlePaymentToggle = async (feeRecord) => {
    try {
      await updateFeeRecord(feeRecord._id, {
        paid: !feeRecord.paid,
        paidDate: !feeRecord.paid ? new Date().toISOString() : null,
      });
      
      // Refresh the data
      handleViewFees();
    } catch (error) {
      console.error("Error updating payment status:", error);
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
          <p className="mt-1 text-sm opacity-90">Manage and track student fees with ease.</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-100">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === "create"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiDollarSign className="w-4 h-4" />
                <span>Create Fees</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("view")}
              className={`px-6 py-4 font-medium text-sm transition-colors ${
                activeTab === "view"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiSearch className="w-4 h-4" />
                <span>View Fees</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* Create Fee Tab Content */}
            {activeTab === "create" && (
              <div className="space-y-6">
                {/* Create Mode Toggle */}
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setCreateMode("class")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      createMode === "class"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FiUsers className="w-4 h-4 inline mr-2" />
                    Create for Class
                  </button>
                  <button
                    onClick={() => setCreateMode("individual")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      createMode === "individual"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Create for Individual
                  </button>
                </div>

                {createMode === "class" ? (
                  <form onSubmit={handleClassFeeCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Class Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Class *
                        </label>
                        <select
                          value={formData.selectedClass?._id || ""}
                          onChange={(e) => {
                            const selectedClass = classes.find(c => c._id === e.target.value);
                            setFormData({ ...formData, selectedClass });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Select a class</option>
                          {classes.map((cls) => (
                            <option key={cls._id} value={cls._id}>
                              {cls.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fee Amount ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter fee amount..."
                          required
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date *
                        </label>
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                          placeholder="Optional note..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={feeLoading || !formData.selectedClass}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        feeLoading || !formData.selectedClass ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"
                      } bg-blue-600 text-white`}
                    >
                      {feeLoading ? "Creating..." : "Create Fees for Class"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleIndividualFeeCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Student Selection */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Student *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={studentSearchQuery}
                            onChange={(e) => {
                              setStudentSearchQuery(e.target.value);
                              setShowStudentDropdown(true);
                            }}
                            onFocus={() => setShowStudentDropdown(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search for a student..."
                            required
                          />
                          {studentSearchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setStudentSearchQuery("");
                                setIndividualFeeData({ ...individualFeeData, student: null });
                                setShowStudentDropdown(false);
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <FiXCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {showStudentDropdown && filteredStudents.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredStudents.map((student) => (
                              <div
                                key={student._id}
                                onClick={() => selectStudent(student)}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium">{student.fullname}</div>
                                <div className="text-sm text-gray-500">
                                  Class: {student.class?.name || 'Not assigned'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fee Amount ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={individualFeeData.amount}
                          onChange={(e) => setIndividualFeeData({ ...individualFeeData, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter fee amount..."
                          required
                        />
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Month *
                        </label>
                        <select
                          value={individualFeeData.month}
                          onChange={(e) => setIndividualFeeData({ ...individualFeeData, month: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          value={individualFeeData.year}
                          onChange={(e) => setIndividualFeeData({ ...individualFeeData, year: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Due Date *
                        </label>
                        <input
                          type="date"
                          value={individualFeeData.dueDate}
                          onChange={(e) => setIndividualFeeData({ ...individualFeeData, dueDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      {/* Note */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Note
                        </label>
                        <textarea
                          value={individualFeeData.note}
                          onChange={(e) => setIndividualFeeData({ ...individualFeeData, note: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                          placeholder="Optional note..."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={feeLoading || !individualFeeData.student}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        feeLoading || !individualFeeData.student ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"
                      } bg-blue-600 text-white`}
                    >
                      {feeLoading ? "Creating..." : "Create Fee Record"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* View Fee Tab Content */}
            {activeTab === "view" && (
              <div className="space-y-6">
                {/* Search Controls */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Class *
                    </label>
                    <select
                      value={viewData.selectedClass?._id || ""}
                      onChange={(e) => {
                        const selectedClass = classes.find(c => c._id === e.target.value);
                        setViewData({ ...viewData, selectedClass });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a class</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      value={viewData.month}
                      onChange={(e) => setViewData({ ...viewData, month: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleViewFees}
                      disabled={loadingRecords || !viewData.selectedClass}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                        loadingRecords || !viewData.selectedClass 
                          ? "opacity-60 cursor-not-allowed" 
                          : "hover:shadow-lg"
                      } bg-blue-600 text-white`}
                    >
                      {loadingRecords ? "Loading..." : "Search Fees"}
                    </button>
                  </div>
                </div>

                {/* Results */}
                {classStudents.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Fee Records for {viewData.selectedClass?.name} - {getMonthName(viewData.month)} {viewData.year}
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Due Date
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
                          {classStudents.map((studentData) => (
                            <tr key={studentData._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {studentData.fullname}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {studentData.feeRecord ? `$${studentData.feeRecord.amount}` : 'No fee set'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {studentData.feeRecord 
                                    ? new Date(studentData.feeRecord.dueDate).toLocaleDateString()
                                    : '-'
                                  }
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {studentData.feeRecord ? (
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    studentData.feeRecord.paid
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {studentData.feeRecord.paid ? 'Paid' : 'Unpaid'}
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                    No Record
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {studentData.feeRecord && (
                                  <button
                                    onClick={() => handlePaymentToggle(studentData.feeRecord)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                      studentData.feeRecord.paid
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  >
                                    Mark as {studentData.feeRecord.paid ? 'Unpaid' : 'Paid'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : viewData.selectedClass && !loadingRecords ? (
                  <div className="text-center py-8 text-gray-500">
                    <FiSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm">
                      {viewData.selectedClass 
                        ? "No students found in this class or no fee records for the selected period."
                        : "Please select a class to view fee records."
                      }
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

export default FeeFile;