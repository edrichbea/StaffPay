
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Payroll = sequelize.define(
  "Payroll",
  {
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    pay_period_start: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    pay_period_end: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },

    daily_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },

    days_worked: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },

    basic_pay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },

    overtime_hours: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0
    },

    overtime_pay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },

    total_deductions: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },

    net_pay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },

    payment_status: {
      type: DataTypes.ENUM("pending", "released"),
      allowNull: false,
      defaultValue: "pending"
    },

    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  },
  {
    tableName: "payroll",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "pay_period_start", "pay_period_end"]
      }
    ]
  }
);
