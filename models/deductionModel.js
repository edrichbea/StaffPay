
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Deduction = sequelize.define(
  "Deduction",
  {
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    deduction_type: {
      type: DataTypes.STRING,
      allowNull: false
    },

    description: {
      type: DataTypes.STRING,
      allowNull: true
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },

    deduction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM("pending", "processed"),
      allowNull: false,
      defaultValue: "pending"
    }
  },
  {
    tableName: "deductions",
    timestamps: true
  }
);
