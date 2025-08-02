import mongoose from "mongoose";



const FinanceSchema = mongoose.Schema({
  date : {
    type : Date,
    required : true,
    default : Date.now
  },
  income : {
    type : Number, 
    required : true,
    min : 0,
  },
  expenses : {
    type : Number,
    required : true,
    min : 0
  },
  debt : {
    type : Number,
    min : 0,
    required : true
  }
     
}, { timestamps: true });


const Finance = mongoose.model("Finance", FinanceSchema);

export default Finance;
