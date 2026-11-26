
import crypto from "crypto";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

import { User, PasswordReset } from "../models/index.js";

// Display Forgot Password Page
export const forgotPasswordPage = (req, res) => {
  res.render("forgot-password", {
    title: "Forgot Password"
  });
};

// Display Email Verification Page
export const verifyOTPPage = (req, res) => {
  res.render("verify-otp", {
    title: "Email Verification"
  });
};

// Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const genericMessage =
      "If the account is eligible, an OTP will be sent to its recovery email.";

    if (!email) {
      return res.send("Please enter your registered email.");
    }

    const user = await User.findOne({
      where: { email: email.trim() }
    });

    if (!user || !user.recovery_email) {
      return res.send(genericMessage);
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.send("Email service is not configured.");
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await PasswordReset.update(
      { status: "rejected" },
      {
        where: {
          user_id: user.id,
          reset_method: "email",
          status: "pending"
        }
      }
    );

    const resetRequest = await PasswordReset.create({
      user_id: user.id,
      reset_method: "email",
      otp_hash: otpHash,
      expires_at: expiresAt,
      status: "pending",
      attempts: 0
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    try {
      await transporter.sendMail({
        from: `"StaffPay" <${process.env.EMAIL_USER}>`,
        to: user.recovery_email,
        subject: "StaffPay Password Reset OTP",
        text: `Hello ${user.name},

Your StaffPay password reset OTP is: ${otp}

This OTP will expire in 10 minutes.

If you did not request this password reset, please ignore this email.`
      });

      console.log("OTP EMAIL SENT SUCCESSFULLY.");

      return res.render("enter-otp", {
        title: "Verify OTP",
        email: email.trim(),
        message: "An OTP has been sent to your recovery email."
      });

    } catch (emailError) {
      await resetRequest.update({
        status: "rejected"
      });

      throw emailError;
    }

  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return res.send("Unable to send OTP. Please try again later.");
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.send("Please enter your email and OTP.");
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.send("Invalid OTP format.");
    }

    const user = await User.findOne({
      where: { email: email.trim() }
    });

    if (!user) {
      return res.send("Invalid or expired OTP.");
    }

    const resetRequest = await PasswordReset.findOne({
      where: {
        user_id: user.id,
        reset_method: "email",
        status: "pending"
      },
      order: [["createdAt", "DESC"]]
    });

    if (!resetRequest) {
      return res.send("Invalid or expired OTP.");
    }

    if (resetRequest.attempts >= 5) {
      await resetRequest.update({ status: "rejected" });
      return res.send("Too many attempts. Please request a new OTP.");
    }

    if (new Date() > new Date(resetRequest.expires_at)) {
      await resetRequest.update({ status: "rejected" });
      return res.send("OTP has expired. Please request a new one.");
    }

    const isValid = await bcrypt.compare(
      otp,
      resetRequest.otp_hash
    );

    if (!isValid) {
      const newAttempts = resetRequest.attempts + 1;

      await resetRequest.update({
        attempts: newAttempts,
        status: newAttempts >= 5 ? "rejected" : "pending"
      });

      return res.send(
        newAttempts >= 5
          ? "Too many attempts. Please request a new OTP."
          : `Incorrect OTP. Attempts remaining: ${5 - newAttempts}`
      );
    }

    await resetRequest.update({
      status: "verified",
      verified_at: new Date()
    });

    req.session.passwordResetId = resetRequest.id;
    req.session.passwordResetUserId = user.id;

    return res.redirect("/forgot-password/reset-password");

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.send("Unable to verify OTP.");
  }
};

// Display New Password Page
export const resetPasswordPage = async (req, res) => {
  try {
    if (
      !req.session.passwordResetId ||
      !req.session.passwordResetUserId
    ) {
      return res.redirect("/forgot-password");
    }

    const resetRequest = await PasswordReset.findOne({
      where: {
        id: req.session.passwordResetId,
        user_id: req.session.passwordResetUserId,
        status: "verified"
      }
    });

    if (
      !resetRequest ||
      new Date() > new Date(resetRequest.expires_at)
    ) {
      delete req.session.passwordResetId;
      delete req.session.passwordResetUserId;

      return res.send("Password reset session expired. Please request a new OTP.");
    }

    return res.render("reset-password", {
      title: "Create New Password"
    });

  } catch (error) {
    console.error("RESET PASSWORD PAGE ERROR:", error);
    return res.send("Unable to open password reset page.");
  }
};

// Save New Password
export const resetPassword = async (req, res) => {
  try {
    const { password, confirm_password } = req.body;

    if (
      !req.session.passwordResetId ||
      !req.session.passwordResetUserId
    ) {
      return res.redirect("/forgot-password");
    }

    if (!password || !confirm_password) {
      return res.send("Please complete both password fields.");
    }

    if (password.length < 8) {
      return res.send("Password must contain at least 8 characters.");
    }

    if (password !== confirm_password) {
      return res.send("Passwords do not match.");
    }

    const resetRequest = await PasswordReset.findOne({
      where: {
        id: req.session.passwordResetId,
        user_id: req.session.passwordResetUserId,
        status: "verified"
      }
    });

    if (
      !resetRequest ||
      new Date() > new Date(resetRequest.expires_at)
    ) {
      delete req.session.passwordResetId;
      delete req.session.passwordResetUserId;

      return res.send("Password reset session expired. Please request a new OTP.");
    }

    const user = await User.findByPk(
      req.session.passwordResetUserId
    );

    if (!user) {
      return res.send("User account not found.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({
      password: hashedPassword
    });

    await resetRequest.update({
      status: "completed"
    });

    delete req.session.passwordResetId;
    delete req.session.passwordResetUserId;

    return res.render("password-reset-success", {
  title: "Password Reset Successful"
});

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.send("Unable to reset password. Please try again.");
  }
};

// Admin Password Reset Page
export const adminPasswordResetPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  res.send("Admin password reset requests will be implemented next.");
};
