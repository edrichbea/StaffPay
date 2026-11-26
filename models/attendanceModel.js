
import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Attendance = sequelize.define(
  "Attendance",
  {
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    attendance_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    time_in: {
      type: DataTypes.TIME,
      allowNull: true
    },
    time_out: {
      type: DataTypes.TIME,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(
        "present",
        "late",
        "half_day",
        "excuse_letter",
        "absent"
      ),
      allowNull: false,
      defaultValue: "present"
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recorded_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    tableName: "attendance",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "attendance_date"]
      }
    ]
  }
);
