import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiSearch, FiXCircle } from "react-icons/fi";
import { useHealthStore } from "../store/healthStore";
import useStudentsStore from "../store/studentsStore";

const HealthFile = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [formData, setFormData] = useState({
    student: null, // Change to store student object
    date: "",
    condition: "",
    treated: false,
    note: "",
  });

  const [editRecord, setEditRecord] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const {
    addHealthRecord,
    getStudentHealthRecords,
    updateHealthRecord,
    deleteHealthRecord,
    loading: healthLoading,
  } = useHealthStore();

  const {
    students,
    fetchStudents,
    loading: studentsLoading,
  } = useStudentsStore();

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Handler for student selection in both tabs
  const selectStudent = (student) => {
    setStudentSearchQuery(student.fullname);
    setShowStudentDropdown(false);
    if (activeTab === "create") {
      setFormData({ ...formData, student });
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter(
    (student) =>
      student.fullname.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.student) {
      alert("Please select a student from the list.");
      return;
    }
    const payload = {
      ...formData,
      student: formData.student._id,
    };
    await addHealthRecord(payload);
    // Reset form after successful creation
    setFormData({
      student: null,
      date: "",
      condition: "",
      treated: false,
      note: "",
    });
    setStudentSearchQuery("");
  };

  const handleSearchRecords = async () => {
    if (!formData.student) {
      alert("Please select a student to search for records.");
      return;
    }
    setLoadingRecords(true);
    try {
      const records = await getStudentHealthRecords(formData.student._id);
      setHealthRecords(records || []);
    } catch (error) {
      console.error("Error fetching health records:", error);
      setHealthRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateHealthRecord(editRecord._id, editRecord);
    setEditRecord(null);
    if (formData.student) {
      const records = await getStudentHealthRecords(formData.student._id);
      setHealthRecords(records || []);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      await deleteHealthRecord(id);
      if (formData.student) {
        const records = await getStudentHealthRecords(formData.student._id);
        setHealthRecords(records || []);
      }
    }
  };

  const resetFormAndRecords = () => {
    setStudentSearchQuery("");
    setFormData({
      student: null,
      date: "",
      condition: "",
      treated: false,
      note: "",
    });
    setHealthRecords([]);
    setEditRecord(null);
  };

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    resetFormAndRecords();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold">Student Health Management</h1>
          <p className="mt-1 text-sm opacity-90">Manage and track student health records with ease.</p>
        </header>

        <nav className="flex justify-center bg-gray-50 p-2 border-b">
          <button
            onClick={() => handleTabChange("create")}
            className={`px-6 py-3 text-lg font-medium rounded-lg transition-all transform hover:scale-105 ${
              activeTab === "create"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Create New Record
          </button>
          <button
            onClick={() => handleTabChange("view")}
            className={`px-6 py-3 text-lg font-medium rounded-lg transition-all transform hover:scale-105 ml-4 ${
              activeTab === "view"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            View Records
          </button>
        </nav>

        <div className="p-8">
          {/* Student Search Input - Shared Component */}
          <div className="mb-6 relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Student</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by student name..."
                value={studentSearchQuery}
                onChange={(e) => {
                  setStudentSearchQuery(e.target.value);
                  // Ensure dropdown is shown when typing
                  setShowStudentDropdown(true);
                  // If the user clears the search, also clear the selected student
                  if (e.target.value === "") {
                    setFormData({ ...formData, student: null });
                  }
                }}
                onFocus={() => setShowStudentDropdown(true)}
                onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                className="w-full border-2 border-gray-300 px-5 py-3 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all text-lg pl-12"
              />
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              {studentSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentSearchQuery("");
                    setFormData({ ...formData, student: null });
                    setHealthRecords([]); // Clear records when search is cleared
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <FiXCircle size={20} />
                </button>
              )}
            </div>
            {showStudentDropdown && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {studentsLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading students...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No students found.</div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className="p-4 flex justify-between items-center hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                      onClick={() => selectStudent(student)}
                    >
                      <div>
                        <div className="font-medium text-gray-800">{student.fullname}</div>
                        <div className="text-sm text-gray-500">
                          Class: {student.class?.name || "N/A"}
                        </div>
                      </div>
                      {formData.student?._id === student._id && (
                        <span className="text-blue-500 text-sm font-semibold">Selected</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
            {formData.student && (
              <div className="mt-2 text-sm text-green-600 flex items-center">
                <span className="font-medium">Selected Student:</span>
                <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  {formData.student.fullname}
                </span>
              </div>
            )}
          </div>

          {/* Create Health Record Tab Content */}
          {activeTab === "create" && (
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Record Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border-2 border-gray-300 px-4 py-3 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
                  <input
                    type="text"
                    placeholder="Enter health condition..."
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full border-2 border-gray-300 px-4 py-3 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  placeholder="Add detailed notes here..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full border-2 border-gray-300 px-4 py-3 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all h-32"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.treated}
                  onChange={(e) => setFormData({ ...formData, treated: e.target.checked })}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-3 block text-sm font-medium text-gray-700">Treated?</label>
              </div>

              <button
                type="submit"
                disabled={healthLoading || !formData.student}
                className={`w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md ${
                  healthLoading || !formData.student ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"
                }`}
              >
                {healthLoading ? "Saving..." : "Save Health Record"}
              </button>
            </form>
          )}

          {/* View Health Records Tab Content */}
          {activeTab === "view" && (
            <div>
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleSearchRecords}
                  disabled={loadingRecords || !formData.student}
                  className={`bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md ${
                    loadingRecords || !formData.student ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg"
                  }`}
                >
                  {loadingRecords ? "Searching..." : "Search Records"}
                </button>
              </div>

              {loadingRecords ? (
                <div className="text-center py-12 text-gray-500 text-lg">Loading records...</div>
              ) : healthRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-lg border-2 border-dashed border-gray-300 rounded-xl p-8">
                  {formData.student
                    ? "No health records found for this student."
                    : "Please select a student and click 'Search Records'."}
                </div>
              ) : (
                <div className="space-y-6 mt-6">
                  {healthRecords.map((record) => (
                    <div
                      key={record._id}
                      className="p-6 border border-gray-200 rounded-xl bg-gray-50 shadow-sm hover:shadow-lg transition-shadow"
                    >
                      {editRecord?._id === record._id ? (
                        <form onSubmit={handleUpdate} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                              type="date"
                              value={editRecord.date?.substring(0, 10)}
                              onChange={(e) =>
                                setEditRecord({ ...editRecord, date: e.target.value })
                              }
                              className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                            <input
                              type="text"
                              value={editRecord.condition}
                              onChange={(e) =>
                                setEditRecord({ ...editRecord, condition: e.target.value })
                              }
                              className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                            />
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editRecord.treated}
                              onChange={(e) =>
                                setEditRecord({ ...editRecord, treated: e.target.checked })
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-700">Treated</label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                              value={editRecord.note}
                              onChange={(e) =>
                                setEditRecord({ ...editRecord, note: e.target.value })
                              }
                              className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                              rows={2}
                            />
                          </div>
                          <div className="flex space-x-3 pt-2">
                            <button
                              type="submit"
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditRecord(null)}
                              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-medium text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Record Date</p>
                              <p className="font-semibold text-gray-900">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Condition</p>
                              <p className="font-semibold text-gray-900">{record.condition}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Treated?</p>
                              <p
                                className={`font-semibold ${
                                  record.treated ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {record.treated ? "Yes" : "No"}
                              </p>
                            </div>
                          </div>
                          {record.note && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-500">Notes</p>
                              <p className="text-gray-700 mt-1 whitespace-pre-line">{record.note}</p>
                            </div>
                          )}
                          <div className="flex justify-end space-x-2 border-t pt-4">
                            <button
                              onClick={() => setEditRecord(record)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition-colors"
                              title="Edit Record"
                            >
                              <FiEdit2 size={20} />
                            </button>
                            <button
                              onClick={() => handleDelete(record._id)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors"
                              title="Delete Record"
                            >
                              <FiTrash2 size={20} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthFile;