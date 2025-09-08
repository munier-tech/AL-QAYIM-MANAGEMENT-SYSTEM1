import express from "express";
import {
  AddFinance,
  getAllFinance,
  getFinanceById,
  getFinanceSummary,
  generateMonthlyFinance,
  getYearlyFinanceBreakdown,
  updateFinance,
  deleteFinance,
} from "../controllers/financeController.js";
import { protectedRoute } from "../middlewares/authorization.js";

const router = express.Router();

router.post("/create", protectedRoute, AddFinance);
router.post("/generate-monthly", protectedRoute, generateMonthlyFinance);
router.get("/getAll", protectedRoute, getAllFinance);
router.get("/get/:financeId", protectedRoute, getFinanceById);
router.put("/update/:financeId", protectedRoute, updateFinance);   // ✅ update route
router.delete("/delete/:financeId", protectedRoute, deleteFinance); // ✅ delete route
router.get("/summary", protectedRoute, getFinanceSummary);
router.get("/yearly-breakdown", protectedRoute, getYearlyFinanceBreakdown);

export default router;
