

import { AttendanceLog, Employee, User } from "../models/index.js";

export const attendanceLogsPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  try {
    const logs = await AttendanceLog.findAll({
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["employee_code", "first_name", "last_name"]
        },
        {
          model: User,
          as: "performer",
          attributes: ["name", "role"]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    const formattedLogs = logs.map((log) => {
      const date = new Date(log.createdAt);

      return {
        ...log.toJSON(),
        formattedDate: date.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        formattedTime: date.toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
      };
    });

    res.render("attendance-logs", {
      title: "Attendance Logs",
      logs: formattedLogs
    });

  } catch (error) {
    console.error("ATTENDANCE LOGS ERROR:", error);
    res.send("Failed to load attendance logs.");
  }
};
