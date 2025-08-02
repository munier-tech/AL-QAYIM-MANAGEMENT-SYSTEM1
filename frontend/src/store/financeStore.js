import { create } from 'zustand';
import axios from '../config/axios';
import toast from 'react-hot-toast';

const useFinanceStore = create((set, get) => ({
  // State
  finances: [],
  currentFinance: null,
  loading: false,
  error: null,
  successMessage: null,

  // Add Finance
  addFinance: async (financeData) => {
    try {
      set({ loading: true, error: null, successMessage: null });
      
      const response = await axios.post('/finance/create', financeData);
      
      set({ 
        loading: false, 
        successMessage: response.data.message,
        finances: [response.data.finance, ...get().finances]
      });
      
      toast.success(response.data.message);
      return { success: true, finance: response.data.finance };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Khalad ayaa dhacay markii la abuurayay maalgelinta';
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Get All Finance
  getAllFinance: async () => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.get('/finance/getAll');
      
      set({ 
        loading: false, 
        finances: response.data.finance,
        successMessage: response.data.message
      });
      
      return { success: true, finances: response.data.finance };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Khalad ayaa dhacay markii la soo dejiniyay maalgelinta';
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Get Finance by ID
  getFinanceById: async (financeId) => {
    try {
      set({ loading: true, error: null });
      
      const response = await axios.get(`/finance/get/${financeId}`);
      
      set({ 
        loading: false, 
        currentFinance: response.data.finance,
        successMessage: response.data.message
      });
      
      return { success: true, finance: response.data.finance };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Khalad ayaa dhacay markii la soo dejiniyay maalgelinta';
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // Clear messages
  clearMessages: () => set({ error: null, successMessage: null }),

  // Calculate totals
  getTotalIncome: () => {
    const finances = get().finances;
    return finances.reduce((total, finance) => total + (finance.income || 0), 0);
  },

  getTotalExpenses: () => {
    const finances = get().finances;
    return finances.reduce((total, finance) => total + (finance.expenses || 0), 0);
  },

  getTotalDebt: () => {
    const finances = get().finances;
    return finances.reduce((total, finance) => total + (finance.debt || 0), 0);
  },

  getNetProfit: () => {
    const totalIncome = get().getTotalIncome();
    const totalExpenses = get().getTotalExpenses();
    return totalIncome - totalExpenses;
  }
}));

export default useFinanceStore;