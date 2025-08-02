import express from "express";
import {
  AddFinance,
  getAllFinance,
  getFinanceById,
} from "../controllers/financeController.js";
import { protectedRoute } from "../middlewares/authorization.js";

const router = express.Router();

router.post("/create", protectedRoute, AddFinance);
router.get("/getAll", protectedRoute, getAllFinance);
router.get("/get/:financeId", protectedRoute, getFinanceById);

export default router;
