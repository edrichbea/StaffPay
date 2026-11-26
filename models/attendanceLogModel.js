import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const AttendanceLog = sequelize.define(
  "AttendanceLog",
  {
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    performed_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    action: {
      type: DataTypes.ENUM(
        "time_in",
        "time_out",
        "correction"
      ),
      allowNull: false
    },

    details: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    tableName: "attendance_logs",
    timestamps: true
  }
);