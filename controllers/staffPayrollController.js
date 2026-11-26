
import { Payroll } from "../models/index.js";

export const myPayrollPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "staff") {
    return res.send("Access denied.");
  }

  if (!req.session.employeeId) {
    return res.send("Your account is not linked to an employee record.");
  }

  try {
    const payrolls = await Payroll.findAll({
      where: {
        employee_id: req.session.employeeId
      },
      order: [["pay_period_start", "DESC"]]
    });

    res.render("my-payroll", {
      title: "My Payroll",
      payrolls
    });

  } catch (error) {
    console.error("MY PAYROLL ERROR:", error);
    res.send("Failed to load your payroll records.");
  }
};