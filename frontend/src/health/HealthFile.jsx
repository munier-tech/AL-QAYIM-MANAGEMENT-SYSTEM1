import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";
import { useHealthStore } from "../store/healthStore";
import useStudentsStore from "../store/studentsStore";

const HealthFile = () => {
  const [activeTab, setActiveTab] = useState("create");

  // Form states
  const [formData, setFormData] = useState({
    student: "",
    date: "",
    condition: "",
    treated: false,
    note: "",
  });

  const [editRecord, setEditRecord] = useState(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Stores
  const {
    addHealthRecord,
    getStudentHealthRecords,
    updateHealthRecord,
    deleteHealthRecord,
    loading,
  } = useHealthStore();

  const {
    students,
    searchStudents,
    fetchStudents,
    loading: studentsLoading
  } = useStudentsStore();

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = searchStudents(studentSearchQuery);

  // Handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.student) {
      alert("Fadlan dooro ardayga");
      return;
    }
    await addHealthRecord(formData);
    setFormData({ student: "", date: "", condition: "", treated: false, note: "" });
    setStudentSearchQuery("");
    setSelectedStudent(null);
  };

  const handleSearchRecords = async () => {
    if (!selectedStudent) {
      alert("Fadlan dooro ardayga");
      return;
    }
    setLoadingRecords(true);
    try {
      const records = await getStudentHealthRecords(selectedStudent._id);
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
    // Refresh records
    if (selectedStudent) {
      const records = await getStudentHealthRecords(selectedStudent._id);
      setHealthRecords(records || []);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Ma hubtaa inaad mas'uulka tirtirto?")) {
      await deleteHealthRecord(id);
      // Refresh records
      if (selectedStudent) {
        const records = await getStudentHealthRecords(selectedStudent._id);
        setHealthRecords(records || []);
      }
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearchQuery(student.fullname);
    setShowStudentDropdown(false);
    if (activeTab === "create") {
      setFormData({...formData, student: student._id});
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Maareynta Caafimaadka Ardayga</h1>
      
      <div className="flex space-x-4 mb-6 border-b pb-4">
        <button
          onClick={() => {
            setActiveTab("create");
            setStudentSearchQuery("");
            setSelectedStudent(null);
            setHealthRecords([]);
          }}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "create" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Diiwaan Cusub
        </button>
        <button
          onClick={() => {
            setActiveTab("view");
            setStudentSearchQuery("");
            setSelectedStudent(null);
            setHealthRecords([]);
          }}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "view" 
              ? "bg-blue-600 text-white shadow-md" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Raadi Diiwaanka
        </button>
      </div>

      {/* Create Health Record Tab */}
      {activeTab === "create" && (
        <form onSubmit={handleCreate} className="space-y-4 bg-gray-50 p-6 rounded-lg">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Arday</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Raadi magaca ardayga..."
                value={studentSearchQuery}
                onChange={(e) => {
                  setStudentSearchQuery(e.target.value);
                  setShowStudentDropdown(true);
                }}
                onFocus={() => {
                  setShowStudentDropdown(true);
                  if (students.length === 0) {
                    fetchStudents();
                  }
                }}
                onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <FiSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
            
            {showStudentDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {studentsLoading ? (
                  <div className="p-2 text-center text-gray-500">Loading...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-2 text-center text-gray-500">Arday lama helin</div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                      onClick={() => selectStudent(student)}
                    >
                      <div className="font-medium">{student.fullname}</div>
                      <div className="text-sm text-gray-500">
                        {student.class?.name || 'No Class'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {formData.student && !studentSearchQuery && (
              <p className="text-red-500 text-sm mt-1">Fadlan dooro ardayga liistada</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taariikhda</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xaaladda</label>
            <input
              type="text"
              placeholder="Geli xaaladda caafimaadka..."
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.treated}
              onChange={(e) => setFormData({ ...formData, treated: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">La daweeyay</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Faahfaahin</label>
            <textarea
              placeholder="Geli faahfaahin dheeraad ah (ikhtiyaari)..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Kaydinaya..." : "Kaydi Diiwaanka"}
          </button>
        </form>
      )}

      {/* View Health Records Tab */}
      {activeTab === "view" && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="relative mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Raadi Ardayga</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Geli magaca ardayga..."
                value={studentSearchQuery}
                onChange={(e) => {
                  setStudentSearchQuery(e.target.value);
                  setShowStudentDropdown(true);
                }}
                onFocus={() => {
                  setShowStudentDropdown(true);
                  if (students.length === 0) {
                    fetchStudents();
                  }
                }}
                onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <FiSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
            
            {showStudentDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {studentsLoading ? (
                  <div className="p-2 text-center text-gray-500">Loading...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-2 text-center text-gray-500">Arday lama helin</div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                      onClick={() => selectStudent(student)}
                    >
                      <div className="font-medium">{student.fullname}</div>
                      <div className="text-sm text-gray-500">
                        {student.class?.name || 'No Class'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSearchRecords}
            disabled={loadingRecords || !selectedStudent}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all ${
              loadingRecords || !selectedStudent ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loadingRecords ? "Raadinaya..." : "Raadi Diiwaanka"}
          </button>

          {selectedStudent && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800">Ardayga La Raadiyay:</h3>
              <p>{selectedStudent.fullname} - {selectedStudent.class?.name || 'No Class'}</p>
            </div>
          )}

          {loadingRecords ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : healthRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedStudent 
                ? "Ma jiraan diiwaan caafimaad oo la helay." 
                : "Fadlan dooro ardayga si aad u raadiso diiwaanadiisa."}
            </div>
          ) : (
            <div className="space-y-4 mt-6">
              {healthRecords.map((record) => (
                <div key={record._id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                  {editRecord?._id === record._id ? (
                    <form onSubmit={handleUpdate} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taariikhda</label>
                        <input
                          type="date"
                          value={editRecord.date?.substring(0, 10)}
                          onChange={(e) =>
                            setEditRecord({ ...editRecord, date: e.target.value })
                          }
                          className="w-full border border-gray-300 px-3 py-1 rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Xaaladda</label>
                        <input
                          type="text"
                          value={editRecord.condition}
                          onChange={(e) =>
                            setEditRecord({ ...editRecord, condition: e.target.value })
                          }
                          className="w-full border border-gray-300 px-3 py-1 rounded-md"
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
                        <label className="ml-2 block text-sm text-gray-700">La daweeyay</label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Faahfaahin</label>
                        <textarea
                          value={editRecord.note}
                          onChange={(e) =>
                            setEditRecord({ ...editRecord, note: e.target.value })
                          }
                          className="w-full border border-gray-300 px-3 py-1 rounded-md"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <button 
                          type="submit" 
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Kaydi
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditRecord(null)}
                          className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-md text-sm"
                        >
                          Jooji
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Taariikhda</p>
                          <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Xaaladda</p>
                          <p className="font-medium">{record.condition}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Daawada</p>
                          <p className="font-medium">{record.treated ? "Haa" : "Maya"}</p>
                        </div>
                      </div>
                      
                      {record.note && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-500">Faahfaahin</p>
                          <p className="whitespace-pre-line">{record.note}</p>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2 border-t pt-2">
                        <button
                          onClick={() => setEditRecord(record)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                          title="Wax ka beddel"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                          title="Tirtir"
                        >
                          <FiTrash2 size={18} />
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
  );
};

export default HealthFile;