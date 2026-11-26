
import { User } from "./userModel.js";
import { Employee } from "./employeeModel.js";
import { Attendance } from "./attendanceModel.js";
import { Payroll } from "./payrollModel.js";
import { Deduction } from "./deductionModel.js";
import { AttendanceLog } from "./attendanceLogModel.js";
import { PasswordReset } from "./passwordResetModel.js";

// Employee and User
Employee.hasOne(User, { foreignKey: "employee_id", as: "user" });
User.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" });

// Employee and Attendance
Employee.hasMany(Attendance, { foreignKey: "employee_id", as: "attendances" });
Attendance.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" });

// Employee and Payroll
Employee.hasMany(Payroll, { foreignKey: "employee_id", as: "payrolls" });
Payroll.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" });

// Employee and Deduction
Employee.hasMany(Deduction, { foreignKey: "employee_id", as: "deductions" });
Deduction.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" });

// Employee and Attendance Logs
Employee.hasMany(AttendanceLog, { foreignKey: "employee_id", as: "attendanceLogs" });
AttendanceLog.belongsTo(Employee, { foreignKey: "employee_id", as: "employee" });

// User and Recorded Attendance
User.hasMany(Attendance, { foreignKey: "recorded_by", as: "recordedAttendances" });
Attendance.belongsTo(User, { foreignKey: "recorded_by", as: "recorder" });

// User and Attendance Logs
User.hasMany(AttendanceLog, { foreignKey: "performed_by", as: "performedLogs" });
AttendanceLog.belongsTo(User, { foreignKey: "performed_by", as: "performer" });

// User and Password Reset Requests
User.hasMany(PasswordReset, { foreignKey: "user_id", as: "passwordResetRequests" });
PasswordReset.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Admin who handles Password Reset Requests
User.hasMany(PasswordReset, { foreignKey: "handled_by", as: "handledPasswordResets" });
PasswordReset.belongsTo(User, { foreignKey: "handled_by", as: "handler" });

export {
  User,
  Employee,
  Attendance,
  Payroll,
  Deduction,
  AttendanceLog,
  PasswordReset
};
