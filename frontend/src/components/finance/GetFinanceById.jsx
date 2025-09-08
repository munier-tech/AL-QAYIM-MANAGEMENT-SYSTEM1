import React, { useEffect, useState } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCreditCard,
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import useFinanceStore from '../../store/financeStore';
import PrintButton from '../common/PrintButton';

const GetFinanceById = () => {
  const { financeId } = useParams();
  const navigate = useNavigate();
  const {
    currentFinance,
    loading,
    getFinanceById,
    clearMessages,
    updateFinance,
    deleteFinance,
  } = useFinanceStore();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    income: 0,
    expenses: 0,
    debt: 0,
    date: '',
  });

  useEffect(() => {
    if (financeId) {
      getFinanceById(financeId);
    }
    return () => clearMessages();
  }, [financeId, getFinanceById, clearMessages]);

  useEffect(() => {
    if (currentFinance) {
      setFormData({
        income: currentFinance.income || 0,
        expenses: currentFinance.expenses || 0,
        debt: currentFinance.debt || 0,
        date: currentFinance.date ? currentFinance.date.split('T')[0] : '',
      });
    }
  }, [currentFinance]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('so-SO', {
      style: 'currency',
      currency: 'SOS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('so-SO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const calculateProfit = () =>
    currentFinance ? (currentFinance.income || 0) - (currentFinance.expenses || 0) : 0;

  const handleDelete = async () => {
    if (window.confirm('Ma hubtaa inaad tirtirayso maalgelintan?')) {
      const res = await deleteFinance(financeId);
      if (res.success) navigate('/finance/getAll');
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'date' ? value : Number(value) }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await updateFinance(financeId, formData);
    setIsEditOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Soo dejinta macluumaadka maalgelinta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentFinance) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FiDollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Maalgelinta lama helin</h3>
            <p className="mt-1 text-sm text-gray-500">
              Maalgelinta aad raadineyso ma jirto ama waxaa dhacay khalad
            </p>
            <button
              onClick={() => navigate('/finance/getAll')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <FiArrowLeft className="mr-2" />
              Dib ugu noqo maalgelinta
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profit = calculateProfit();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/finance/getAll')}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FiArrowLeft className="mr-2" />
            Dib ugu noqo
          </button>

          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-md"
            >
              <FiEdit className="mr-1" /> Cusboonaysii
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              <FiTrash2 className="mr-1" /> Tirtir
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 flex items-center mt-4">
          <FiDollarSign className="mr-3 text-green-600" />
          Macluumaadka Maalgelinta
        </h1>
        <p className="text-gray-600 mt-2">Eeg faahfaahinta maalgelinta</p>

        {/* Print Button */}
        {currentFinance && (
          <PrintButton
            title="Qoraal Maalgelinta"
            subtitle={`Maalgelinta ${formatDate(currentFinance.date)}`}
            className="bg-blue-600 hover:bg-blue-700 mt-4"
          >
            {`
              <div class="info-section">
                <div class="info-label">Macluumaadka Maalgelinta</div>
                <div class="info-grid">
                  <div class="info-item"><span class="info-key">Taariikhda:</span><span class="info-value">${formatDate(currentFinance.date)}</span></div>
                  <div class="info-item"><span class="info-key">Dakhliga:</span><span class="info-value">${formatCurrency(currentFinance.income)}</span></div>
                  <div class="info-item"><span class="info-key">Kharashka:</span><span class="info-value">${formatCurrency(currentFinance.expenses)}</span></div>
                  <div class="info-item"><span class="info-key">Qaansheega:</span><span class="info-value">${formatCurrency(currentFinance.debt)}</span></div>
                  <div class="info-item"><span class="info-key">Faahfaahin:</span><span class="info-value">${formatCurrency(profit)}</span></div>
                  <div class="info-item"><span class="info-key">Heerka Faahfaahinta:</span><span class="info-value">${profit >= 0 ? 'Wanaagsan' : 'Xun'}</span></div>
                </div>
              </div>
            `}
          </PrintButton>
        )}

        {/* Finance Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Maalgelinta {formatDate(currentFinance.date)}</h2>
          </div>

          <div className="p-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div><p className="text-green-100 text-sm font-medium">Dakhliga</p><p className="text-2xl font-bold">{formatCurrency(currentFinance.income)}</p></div>
                  <FiTrendingUp className="text-3xl text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div><p className="text-red-100 text-sm font-medium">Kharashka</p><p className="text-2xl font-bold">{formatCurrency(currentFinance.expenses)}</p></div>
                  <FiTrendingDown className="text-3xl text-red-200" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div><p className="text-orange-100 text-sm font-medium">Qaansheega</p><p className="text-2xl font-bold">{formatCurrency(currentFinance.debt)}</p></div>
                  <FiCreditCard className="text-3xl text-orange-200" />
                </div>
              </div>
              <div className={`rounded-lg shadow-lg p-6 text-white ${profit >= 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium opacity-90">Faahfaahin</p><p className="text-2xl font-bold">{formatCurrency(profit)}</p></div>
                  <FiDollarSign className="text-3xl opacity-80" />
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Faahfaahin Dhammeystiran</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Taariikhda:</span>
                    <span className="text-gray-900 font-semibold">{formatDate(currentFinance.date)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Dakhliga:</span>
                    <span className="text-green-600 font-semibold">{formatCurrency(currentFinance.income)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Kharashka:</span>
                    <span className="text-red-600 font-semibold">{formatCurrency(currentFinance.expenses)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Qaansheega:</span>
                    <span className="text-orange-600 font-semibold">{formatCurrency(currentFinance.debt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Faahfaahin:</span>
                    <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Heerka Faahfaahinta:</span>
                    <span className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profit >= 0 ? 'Wanaagsan' : 'Xun'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Macluumaad Dheeraad ah</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Maalgelintan waxay ku saabsan tahay {formatDate(currentFinance.date)}</p>
                <p>• Dakhliga wuxuu ka kooban yahay lacagta la soo galay</p>
                <p>• Kharashka wuxuu ka kooban yahay lacagta la bixiyay</p>
                <p>• Qaansheega wuxuu ka kooban yahay deynta la qaaday</p>
                <p>• Faahfaahinta waxay ka dhigantahay farqiga u dhexeeya dakhliga iyo kharashka</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsEditOpen(false)}
            >
              <FiX size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4">Cusboonaysii Maalgelinta</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Taariikhda</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Dakhliga</label>
                <input
                  type="number"
                  name="income"
                  value={formData.income}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Kharashka</label>
                <input
                  type="number"
                  name="expenses"
                  value={formData.expenses}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Qaansheega</label>
                <input
                  type="number"
                  name="debt"
                  value={formData.debt}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md p-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
              >
                <FiSave className="mr-2" /> Kaydi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GetFinanceById;
