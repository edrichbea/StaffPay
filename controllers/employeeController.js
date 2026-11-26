
import bcrypt from "bcrypt";
import {
  Employee,
  User
} from "../models/index.js";

import { sequelize } from "../models/db.js";

// Register Employee Page
export const employeePage = (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  res.render("add-employee", {
    title: "Register Employee"
  });
};

// Register Employee + Create Staff Login Account
export const createEmployee = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  const {
    employee_code,
    first_name,
    last_name,
    position,
    contact_number,
    daily_rate,
    email,
    password
  } = req.body;

  if (
    !employee_code ||
    !first_name ||
    !last_name ||
    !position ||
    !contact_number ||
    !daily_rate ||
    !email ||
    !password
  ) {
    return res.send("Please complete all required fields.");
  }

  const rate = Number(daily_rate);

  if (!Number.isFinite(rate) || rate <= 0) {
    return res.send("Please enter a valid daily rate.");
  }

  if (password.length < 8) {
    return res.send("Password must contain at least 8 characters.");
  }

  let transaction;

  try {
    const existingEmail = await User.findOne({
      where: { email }
    });

    if (existingEmail) {
      return res.send("Email is already registered.");
    }

    transaction = await sequelize.transaction();

    const employee = await Employee.create({
      employee_code,
      first_name,
      last_name,
      position,
      contact_number,
      daily_rate: rate,
      employment_status: "active"
    }, { transaction });

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: `${first_name} ${last_name}`,
      email,
      password: hashedPassword,
      role: "staff",
      employee_id: employee.id
    }, { transaction });

    await transaction.commit();

    res.redirect("/employees");

  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error("EMPLOYEE REGISTRATION ERROR:", error);

    res.send(
      "Failed to register employee. Employee code or email may already exist."
    );
  }
};

// Employee List Page
export const employeeListPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  try {
    const employees = await Employee.findAll({
      order: [["createdAt", "DESC"]]
    });

    res.render("employees", {
      title: "Employee List",
      employees
    });

  } catch (error) {
    console.error("EMPLOYEE LIST ERROR:", error);
    res.send("Failed to load employees.");
  }
};

// Legacy Staff Account Page
export const staffAccountPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  try {
    const employees = await Employee.findAll({
      where: { employment_status: "active" },
      include: [{
        model: User,
        as: "user",
        required: false
      }]
    });

    const availableEmployees = employees.filter(
      employee => !employee.user
    );

    res.render("create-staff-account", {
      title: "Create Staff Account",
      employees: availableEmployees
    });

  } catch (error) {
    console.error("STAFF ACCOUNT PAGE ERROR:", error);
    res.send("Failed to load employees.");
  }
};

// Legacy Staff Account Creation
export const createStaffAccount = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  try {
    const { employee_id, email, password } = req.body;

    const employee = await Employee.findByPk(employee_id);

    if (!employee || employee.employment_status !== "active") {
      return res.send("Invalid or inactive employee.");
    }

    const existingAccount = await User.findOne({
      where: { employee_id }
    });

    if (existingAccount) {
      return res.send("This employee already has an account.");
    }

    const existingEmail = await User.findOne({
      where: { email }
    });

    if (existingEmail) {
      return res.send("Email is already registered.");
    }

    if (!password || password.length < 8) {
      return res.send("Password must contain at least 8 characters.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: `${employee.first_name} ${employee.last_name}`,
      email,
      password: hashedPassword,
      role: "staff",
      employee_id: employee.id
    });

    res.redirect("/employees");

  } catch (error) {
    console.error("CREATE STAFF ACCOUNT ERROR:", error);
    res.send("Failed to create staff account.");
  }
};
