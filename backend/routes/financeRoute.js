import express from "express";
import {
  AddFinance,
  getAllFinance,
  getFinanceById,
  getFinanceSummary,
} from "../controllers/financeController.js";
import { protectedRoute } from "../middlewares/authorization.js";

const router = express.Router();

router.post("/create", protectedRoute, AddFinance);
router.get("/getAll", protectedRoute, getAllFinance);
router.get("/get/:financeId", protectedRoute, getFinanceById);
router.get("/summary", protectedRoute, getFinanceSummary);

export default router;
