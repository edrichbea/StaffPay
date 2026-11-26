
import {
  Employee,
  Deduction
} from "../models/index.js";

// Admin Active Deduction Page
export const deductionPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  try {
    const employees = await Employee.findAll({
      where: {
        employment_status: "active"
      },
      order: [["last_name", "ASC"]]
    });

    const deductions = await Deduction.findAll({
      where: {
        status: "pending"
      },
      include: [{
        model: Employee,
        as: "employee"
      }],
      order: [["deduction_date", "DESC"]]
    });

    res.render("deductions", {
      title: "Deduction Management",
      employees,
      deductions
    });

  } catch (error) {
    console.error("DEDUCTION PAGE ERROR:", error);
    res.send("Failed to load deduction records.");
  }
};

// Deduction History Page
export const deductionHistoryPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  try {
    const deductions = await Deduction.findAll({
      where: {
        status: "processed"
      },
      include: [{
        model: Employee,
        as: "employee"
      }],
      order: [["deduction_date", "DESC"]]
    });

    res.render("deduction-history", {
      title: "Deduction History",
      deductions
    });

  } catch (error) {
    console.error("DEDUCTION HISTORY ERROR:", error);
    res.send("Failed to load deduction history.");
  }
};

// Add Employee Deduction
export const createDeduction = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  try {
    const {
      employee_id,
      deduction_type,
      description,
      amount,
      deduction_date
    } = req.body;

    if (
      !employee_id ||
      !deduction_type ||
      !amount ||
      !deduction_date
    ) {
      return res.send("Please complete all required fields.");
    }

    const employee = await Employee.findByPk(employee_id);

    if (!employee) {
      return res.send("Employee not found.");
    }

    const deductionAmount = Number(amount);

    if (
      !Number.isFinite(deductionAmount) ||
      deductionAmount <= 0
    ) {
      return res.send("Invalid deduction amount.");
    }

    await Deduction.create({
      employee_id,
      deduction_type,
      description,
      amount: deductionAmount.toFixed(2),
      deduction_date,
      status: "pending"
    });

    res.redirect("/deductions");

  } catch (error) {
    console.error("CREATE DEDUCTION ERROR:", error);
    res.send("Failed to add deduction.");
  }
};
