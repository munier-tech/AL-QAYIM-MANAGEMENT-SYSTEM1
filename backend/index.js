import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { connectDb } from "./lib/connectdb.js"
import AuthRouter from "./routes/authRoute.js"
import TeacherRouter from "./routes/teacherRoute.js"
import StudentsRouter from "./routes/studentsRoute.js"
import attendanceRouter from "./routes/attendanceRoute.js"
import classRouter from "./routes/classRoute.js"
import healthRouter from "./routes/healthRouter.js"
import examRouter from "./routes/examRouter.js"
import subjectsRouter from "./routes/subjectsRoute.js"
import disciplineRouter from "./routes/disciplineRoute.js"
import teachersAttendanceRouter from "./routes/teachersAttendanceRoute.js"
import financeRouter from "./routes/financeRoute.js"
import cookieParser from "cookie-parser";

dotenv.config()
const app = express()

const PORT = process.env.PORT || 5000

// Configure CORS for different environments
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      'https://al-qayim-management-system.vercel.app',
      'https://al-qayim-management-system-git-main-munier-tech.vercel.app',
      'https://al-qayim-management-system-munier-tech.vercel.app'
    ];
    
    // Add custom frontend URL if provided
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // Add Vercel preview URLs
    if (process.env.VERCEL_URL) {
      allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    console.log('CORS - Request origin:', origin);
    console.log('CORS - Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('CORS - Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.use(express.json())
app.use(cookieParser()); // ✅ This makes req.cookies available
app.use(express.urlencoded({ extended: true }))

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API test endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Al-Qayim Management System API is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: {
      allowedOrigins: corsOptions.origin.toString(),
      credentials: corsOptions.credentials
    }
  });
});

app.use("/api/auth", AuthRouter);
app.use("/api/teachers", TeacherRouter);
app.use("/api/students", StudentsRouter);
app.use("/api/classes", classRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/health", healthRouter);
app.use("/api/exams", examRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/teachersAttendance", teachersAttendanceRouter);
app.use("/api/discipline", disciplineRouter);
app.use("/api/finance", financeRouter);

// Connect to database immediately
connectDb().then(() => {
  console.log("Connected to MongoDB successfully");
}).catch(err => {
  console.error("Failed to connect to MongoDB:", err);
});

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`CORS enabled for: ${corsOptions.origin.toString()}`);
  });
}

// Export app for Vercel serverless
export default app;