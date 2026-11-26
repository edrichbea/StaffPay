
import express from "express";
import { homePage } from "../controllers/homeController.js";

import {
  loginPage,
  dashboardPage,
  loginUser,
  logoutUser
} from "../controllers/authController.js";

import {
  employeePage,
  createEmployee,
  employeeListPage,
  staffAccountPage,
  createStaffAccount
} from "../controllers/employeeController.js";

import { myAttendancePage } from "../controllers/staffController.js";

import {
  managerAttendancePage,
  recordTimeIn,
  recordTimeOut,
  markAbsent
} from "../controllers/managerController.js";

import {
  managerAccountPage,
  createManagerAccount
} from "../controllers/managerAccountController.js";

import { attendanceLogsPage } from "../controllers/attendanceLogController.js";

import {
  payrollPage,
  generatePayroll
} from "../controllers/payrollController.js";

import { myPayrollPage } from "../controllers/staffPayrollController.js";
import { releasePayroll } from "../controllers/payrollReleaseController.js";

import {
  deductionPage,
  deductionHistoryPage,
  createDeduction
} from "../controllers/deductionController.js";

import {
  forgotPasswordPage,
  verifyOTPPage,
  sendOTP,
  verifyOTP,
  resetPasswordPage,
  resetPassword
} from "../controllers/passwordResetController.js";

import {
  adminPasswordResetPage,
  adminDirectPasswordReset
} from "../controllers/adminPasswordResetController.js";

const router = express.Router();


// HOME
router.get("/", homePage);


// AUTHENTICATION
router.get("/login", loginPage);
router.post("/login", loginUser);
router.get("/dashboard", dashboardPage);
router.get("/logout", logoutUser);


// FORGOT PASSWORD - EMAIL OTP
router.get("/forgot-password", forgotPasswordPage);
router.get("/forgot-password/email", verifyOTPPage);
router.post("/forgot-password/email", sendOTP);
router.post("/forgot-password/verify-otp", verifyOTP);

router.get("/forgot-password/reset-password", resetPasswordPage);
router.post("/forgot-password/reset-password", resetPassword);


// ADMIN PASSWORD RESET
router.get("/forgot-password/admin", adminPasswordResetPage);
router.post("/admin/password-reset", adminDirectPasswordReset);


// EMPLOYEE MANAGEMENT
router.get("/add-employee", employeePage);
router.post("/add-employee", createEmployee);
router.get("/employees", employeeListPage);


// STAFF ACCOUNT MANAGEMENT
router.get("/create-staff-account", staffAccountPage);
router.post("/create-staff-account", createStaffAccount);


// MANAGER ACCOUNT MANAGEMENT
router.get("/create-manager-account", managerAccountPage);
router.post("/create-manager-account", createManagerAccount);


// STAFF ATTENDANCE
router.get("/my-attendance", myAttendancePage);


// MANAGER / ADMIN ATTENDANCE
router.get("/manager-attendance", managerAttendancePage);
router.post("/manager-attendance/time-in", recordTimeIn);
router.post("/manager-attendance/time-out", recordTimeOut);
router.post("/manager-attendance/absent", markAbsent);


// ATTENDANCE LOGS
router.get("/attendance-logs", attendanceLogsPage);


// PAYROLL MANAGEMENT
router.get("/payroll", payrollPage);
router.post("/payroll/generate", generatePayroll);
router.post("/payroll/release", releasePayroll);


// STAFF PAYROLL
router.get("/my-payroll", myPayrollPage);


// DEDUCTION MANAGEMENT
router.get("/deductions", deductionPage);
router.post("/deductions", createDeduction);
router.get("/deductions/history", deductionHistoryPage);


export default router;
