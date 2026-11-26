
import bcrypt from "bcrypt";
import { User } from "../models/index.js";

// Display Admin Password Reset Page
export const adminPasswordResetPage = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    if (req.session.role !== "admin") {
      return res.send("Access denied. Admin only.");
    }

    const users = await User.findAll({
      where: {
        role: ["manager", "staff"]
      },
      attributes: ["id", "name", "email", "role"],
      order: [["name", "ASC"]]
    });

    return res.render("admin-password-reset", {
      title: "Admin Password Reset",
      users
    });

  } catch (error) {
    console.error("ADMIN PASSWORD RESET PAGE ERROR:", error);
    return res.send("Unable to load password reset page.");
  }
};

// Reset User Password Directly
export const adminDirectPasswordReset = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    if (req.session.role !== "admin") {
      return res.send("Access denied. Admin only.");
    }

    const { user_id, password, confirm_password } = req.body;

    if (!user_id || !password || !confirm_password) {
      return res.send("Please complete all fields.");
    }

    if (password.length < 8) {
      return res.send("Password must contain at least 8 characters.");
    }

    if (password !== confirm_password) {
      return res.send("Passwords do not match.");
    }

    const user = await User.findByPk(user_id);

    if (!user || !["manager", "staff"].includes(user.role)) {
      return res.send("Invalid employee account selected.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({
      password: hashedPassword
    });

    console.log(
      `ADMIN ${req.session.userId} RESET PASSWORD FOR USER ${user.id}`
    );

    return res.render("password-reset-success", {
  title: "Password Reset Successful"
});

  } catch (error) {
    console.error("ADMIN DIRECT PASSWORD RESET ERROR:", error);
    return res.send("Unable to reset password. Please try again.");
  }
};
