import React, { useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCreditCard, FiPlus, FiList, FiEye } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import useFinanceStore from '../../store/financeStore';

const Finance = () => {
  const { 
    finances, 
    loading, 
    getAllFinance, 
    getTotalIncome, 
    getTotalExpenses, 
    getTotalDebt, 
    getNetProfit 
  } = useFinanceStore();

  useEffect(() => {
    getAllFinance();
  }, [getAllFinance]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('so-SO', {
      style: 'currency',
      currency: 'SOS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const totalDebt = getTotalDebt();
  const netProfit = getNetProfit();

  const recentFinances = finances.slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FiDollarSign className="mr-3 text-green-600" />
            Maamulka Maalgelinta
          </h1>
          <p className="text-gray-600 mt-2">
            Eeg iyo maamul maalgelinta iskuulka
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Income */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Wadarta Dakhliga</p>
                <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
              </div>
              <FiTrendingUp className="text-3xl text-green-200" />
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Wadarta Kharashka</p>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
              <FiTrendingDown className="text-3xl text-red-200" />
            </div>
          </div>

          {/* Total Debt */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Wadarta Qaansheega</p>
                <p className="text-2xl font-bold">{formatCurrency(totalDebt)}</p>
              </div>
              <FiCreditCard className="text-3xl text-orange-200" />
            </div>
          </div>

          {/* Net Profit */}
          <div className={`rounded-lg shadow-lg p-6 text-white ${
            netProfit >= 0 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
              : 'bg-gradient-to-r from-red-500 to-red-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Faahfaahin</p>
                <p className="text-2xl font-bold">{formatCurrency(netProfit)}</p>
              </div>
              <FiDollarSign className="text-3xl opacity-80" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/finance/add"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-green-500"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <FiPlus className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Ku dar Maalgelin</h3>
                <p className="text-gray-600 text-sm">Ku dar maalgelin cusub</p>
              </div>
            </div>
          </Link>

          <Link
            to="/finance/getAll"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-500"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FiList className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Eeg Dhammaan</h3>
                <p className="text-gray-600 text-sm">Eeg dhammaan maalgelinta</p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <FiEye className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Tirakoobka</h3>
                <p className="text-gray-600 text-sm">Eeg tirakoobka maalgelinta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Finances */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Maalgelinta Ugu Dambeeyay</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Soo dejinta...</p>
            </div>
          ) : recentFinances.length === 0 ? (
            <div className="p-8 text-center">
              <FiDollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Maalgelin lama helin</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ku dar maalgelin cusub si aad u bilowdo
              </p>
              <Link
                to="/finance/add"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <FiPlus className="mr-2" />
                Ku dar Maalgelin
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taariikhda
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dakhliga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kharashka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qaansheega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faahfaahin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tallaabooyin
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentFinances.map((finance) => {
                    const profit = (finance.income || 0) - (finance.expenses || 0);
                    return (
                      <tr key={finance._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(finance.date).toLocaleDateString('so-SO')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(finance.income)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                          {formatCurrency(finance.expenses)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                          {formatCurrency(finance.debt)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                          profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(profit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/finance/get/${finance._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Eeg
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {recentFinances.length > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <Link
                to="/finance/getAll"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Eeg dhammaan maalgelinta →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Finance;