import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Employee = sequelize.define(
  "Employee",
  {
    employee_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    position: {
      type: DataTypes.STRING,
      allowNull: false
    },

    contact_number: {
      type: DataTypes.STRING,
      allowNull: false
    },

    daily_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },

    employment_status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active"
    }
  },
  {
    tableName: "employees",
    timestamps: true
  }
);
