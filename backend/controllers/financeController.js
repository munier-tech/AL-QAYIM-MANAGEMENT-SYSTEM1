import Finance from "../models/financeModel.js";

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

