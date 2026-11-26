
import { Op } from "sequelize";
import {
  Employee,
  Attendance,
  Payroll,
  Deduction
} from "../models/index.js";

// Admin Payroll Page
export const payrollPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  try {
    const payrolls = await Payroll.findAll({
      include: [{
        model: Employee,
        as: "employee"
      }],
      order: [["createdAt", "DESC"]]
    });

    res.render("payroll", {
      title: "Payroll Management",
      payrolls
    });

  } catch (error) {
    console.error("PAYROLL PAGE ERROR:", error);
    res.send("Failed to load payroll records.");
  }
};


// Generate Payroll
export const generatePayroll = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  try {
    const { pay_period_start, pay_period_end } = req.body;

    if (!pay_period_start || !pay_period_end) {
      return res.send("Please provide the payroll period.");
    }

    const start = new Date(`${pay_period_start}T00:00:00`);
    const end = new Date(`${pay_period_end}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      pay_period_start > pay_period_end
    ) {
      return res.send("Invalid payroll period.");
    }

    const employees = await Employee.findAll({
      where: {
        employment_status: "active"
      }
    });

    for (const employee of employees) {

      // Prevent duplicate payroll
      const existingPayroll = await Payroll.findOne({
        where: {
          employee_id: employee.id,
          pay_period_start,
          pay_period_end
        }
      });

      if (existingPayroll) {
        continue;
      }

      // Get all attendance records within payroll period
      const attendances = await Attendance.findAll({
        where: {
          employee_id: employee.id,
          attendance_date: {
            [Op.between]: [
              pay_period_start,
              pay_period_end
            ]
          }
        }
      });

      const dailyRate = Number(employee.daily_rate);

      if (!Number.isFinite(dailyRate) || dailyRate < 0) {
        throw new Error(
          `Invalid daily rate for employee ${employee.id}`
        );
      }

      // COMPUTE PAID DAYS BASED ON ATTENDANCE STATUS
      let daysWorked = 0;

      for (const attendance of attendances) {
        switch (attendance.status) {
          case "present":
          case "late":
            daysWorked += 1;
            break;

          case "half_day":
            daysWorked += 0.5;
            break;

          case "excuse_letter":
          case "absent":
            daysWorked += 0;
            break;

          default:
            daysWorked += 0;
        }
      }

      // BASIC PAY
      const basicPay = dailyRate * daysWorked;

      // OVERTIME COMPUTATION
      let totalOvertimeHours = 0;

      for (const attendance of attendances) {

        // Overtime requires complete time-in and time-out
        if (!attendance.time_in || !attendance.time_out) {
          continue;
        }

        const [inHour, inMinute, inSecond] =
          attendance.time_in.split(":").map(Number);

        const [outHour, outMinute, outSecond] =
          attendance.time_out.split(":").map(Number);

        let timeInSeconds =
          inHour * 3600 +
          inMinute * 60 +
          inSecond;

        let timeOutSeconds =
          outHour * 3600 +
          outMinute * 60 +
          outSecond;

        // Support overnight shifts
        if (timeOutSeconds < timeInSeconds) {
          timeOutSeconds += 24 * 3600;
        }

        const totalHours =
          (timeOutSeconds - timeInSeconds) / 3600;

        // Overtime starts after 8 hours
        totalOvertimeHours += Math.max(
          0,
          totalHours - 8
        );
      }

      // OVERTIME PAY
      const hourlyRate = dailyRate / 8;

      const overtimePay =
        hourlyRate * 1.25 * totalOvertimeHours;

      // GET ACTUAL DEDUCTIONS
      const deductions = await Deduction.findAll({
        where: {
          employee_id: employee.id,
          deduction_date: {
            [Op.between]: [
              pay_period_start,
              pay_period_end
            ]
          }
        }
      });

      const totalDeductions = deductions.reduce(
        (total, deduction) => {
          return total + Number(deduction.amount);
        },
        0
      );

      // FINAL PAYROLL COMPUTATION
      const grossPay = basicPay + overtimePay;

      const netPay = Math.max(
        0,
        grossPay - totalDeductions
      );

      // SAVE PAYROLL
      await Payroll.create({
        employee_id: employee.id,
        pay_period_start,
        pay_period_end,
        daily_rate: dailyRate,
        days_worked: daysWorked.toFixed(2),
        basic_pay: basicPay.toFixed(2),
        overtime_hours: totalOvertimeHours.toFixed(2),
        overtime_pay: overtimePay.toFixed(2),
        total_deductions: totalDeductions.toFixed(2),
        net_pay: netPay.toFixed(2),
        payment_status: "pending"
      });
    }

    res.redirect("/payroll");

  } catch (error) {
    console.error("GENERATE PAYROLL ERROR:", error);
    res.send("Failed to generate payroll.");
  }
};
