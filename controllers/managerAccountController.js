
import bcrypt from "bcrypt";
import { User } from "../models/index.js";

// Admin - Manager Account Page
export const managerAccountPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  res.render("create-manager-account", {
    title: "Create Manager Account"
  });
};

// Create Manager Account
export const createManagerAccount = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.send("Please complete all required fields.");
    }

    if (password.length < 8) {
      return res.send("Password must contain at least 8 characters.");
    }

    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.send("Email is already registered.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "manager",
      employee_id: null
    });

    res.redirect("/dashboard");

  } catch (error) {
    console.error("CREATE MANAGER ACCOUNT ERROR:", error);
    res.send("Failed to create manager account.");
  }
};
