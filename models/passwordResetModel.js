
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const PasswordReset = sequelize.define(
  "PasswordReset",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    reset_method: {
      type: DataTypes.ENUM("email", "admin"),
      allowNull: false
    },

    otp_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "verified",
        "completed",
        "rejected"
      ),
      allowNull: false,
      defaultValue: "pending"
    },

    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    handled_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "password_resets",
    timestamps: true
  }
);
