import Finance from "../models/financeModel.js";
import Fee from "../models/feeModel.js";
import Salary from "../models/salaryModel.js";

export const AddFinance = async ( req, res ) => {
  try {

    const { income , expenses , debt  , date } = req.body;

    if (!income || !expenses || !debt || !date) {
      return res.status(400).json({ message: "Fadlan buuxi dhammaan meelaha banan" });
    }

    


    const finance = new Finance({
      income,
      expenses,
      debt,
      date: date ? new Date(date) : new Date()
    });


    await finance.save();

    return res.status(201).json({ message: "Maalgelinta si guul leh ayaa loo abuuray", finance });
  } catch (error) {
    console.error("error in AddFinance function: ", error);
    return res.status(500).json({ message: error.message });
  }
}


export const getAllFinance = async ( req, res ) => {
  try {
    const finance = await Finance.find({}).sort({ createdAt: -1 });

    return res.status(200).json({ message: "Maalgelinta si guul leh ayaa loo helay", finance });
  } catch (error) {
    console.error("error in getAllFinance function: ", error);
    return res.status(500).json({ message: error.message });
  }
}

// Get automatic finance summary with student fees and teacher salaries
export const getFinanceSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: "Fadlan dooro bisha iyo sanadka" });
    }

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    // Get total student fees for the month (income)
    const studentFeesTotal = await Fee.aggregate([
      { 
        $match: { 
          month: monthNum, 
          year: yearNum, 
          paid: true 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Get total teacher salaries for the month (expenses)
    const teacherSalariesTotal = await Salary.aggregate([
      { 
        $match: { 
          month: monthNum, 
          year: yearNum, 
          paid: true 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Get manual finance records for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);
    
    const manualFinance = await Finance.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 });

    // Calculate totals
    const studentFeesIncome = studentFeesTotal[0]?.total || 0;
    const teacherSalariesExpense = teacherSalariesTotal[0]?.total || 0;
    
    const manualIncome = manualFinance.reduce((sum, record) => sum + record.income, 0);
    const manualExpenses = manualFinance.reduce((sum, record) => sum + record.expenses, 0);
    const totalDebt = manualFinance.reduce((sum, record) => sum + record.debt, 0);

    const totalIncome = studentFeesIncome + manualIncome;
    const totalExpenses = teacherSalariesExpense + manualExpenses;
    const netIncome = totalIncome - totalExpenses - totalDebt;

    return res.status(200).json({
      message: "Koobka maalgelinta si guul leh ayaa loo helay",
      summary: {
        month: monthNum,
        year: yearNum,
        income: {
          studentFees: studentFeesIncome,
          studentFeesCount: studentFeesTotal[0]?.count || 0,
          manual: manualIncome,
          total: totalIncome
        },
        expenses: {
          teacherSalaries: teacherSalariesExpense,
          teacherSalariesCount: teacherSalariesTotal[0]?.count || 0,
          manual: manualExpenses,
          total: totalExpenses
        },
        debt: totalDebt,
        netIncome,
        manualRecords: manualFinance
      }
    });

  } catch (error) {
    console.error("error in getFinanceSummary function: ", error);
    return res.status(500).json({ message: error.message });
  }
}


export const getFinanceById = async ( req, res ) => {
  try {
    const { financeId } = req.params;
    const finance = await Finance.findById(financeId);

    if (!finance) {
      return res.status(404).json({ message: "Maalgelinta lama helin" });
    }

    return res.status(200).json({ message: "Maalgelinta si guul leh ayaa loo helay", finance });
  } catch (error) {
    console.error("error in getFinanceById function: ", error);
    return res.status(500).json({ message: error.message });
  }
}

