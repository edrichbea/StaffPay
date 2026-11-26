
import { Attendance } from "../models/index.js";

export const myAttendancePage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "staff") {
    return res.send("Access denied.");
  }

  try {
    const attendances = await Attendance.findAll({
      where: {
        employee_id: req.session.employeeId
      },
      order: [["attendance_date", "DESC"]]
    });

    res.render("my-attendance", {
      title: "My Attendance",
      attendances
    });

  } catch (error) {
    console.error("MY ATTENDANCE ERROR:", error);
    res.send("Failed to load attendance records.");
  }
};
