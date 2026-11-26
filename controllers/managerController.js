
import {
  Employee,
  Attendance,
  AttendanceLog
} from "../models/index.js";

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentTime = () => {
  const now = new Date();

  return [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join(":");
};


// MANAGER ATTENDANCE PAGE
export const managerAttendancePage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  try {
    const employees = await Employee.findAll({
      where: {
        employment_status: "active"
      },
      include: [{
        model: Attendance,
        as: "attendances",
        where: {
          attendance_date: getToday()
        },
        required: false
      }],
      order: [["last_name", "ASC"]]
    });

    res.render("manager-attendance", {
      title: "Manager Attendance",
      employees
    });

  } catch (error) {
    console.error("MANAGER ATTENDANCE ERROR:", error);
    res.send("Failed to load attendance page.");
  }
};


// RECORD TIME IN
export const recordTimeIn = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  try {
    const { employee_id } = req.body;
    const today = getToday();

    const employee = await Employee.findByPk(employee_id);

    if (!employee || employee.employment_status !== "active") {
      return res.send("Invalid or inactive employee.");
    }

    const existingAttendance = await Attendance.findOne({
      where: {
        employee_id,
        attendance_date: today
      }
    });

    if (existingAttendance) {
      return res.send("Attendance has already been recorded today.");
    }

    const attendance = await Attendance.create({
      employee_id,
      attendance_date: today,
      time_in: getCurrentTime(),
      status: "present",
      recorded_by: req.session.userId
    });

    await AttendanceLog.create({
      employee_id,
      performed_by: req.session.userId,
      action: "time_in",
      details: `Time-in recorded: ${attendance.time_in}`
    });

    res.redirect("/manager-attendance");

  } catch (error) {
    console.error("TIME IN ERROR:", error);
    res.send("Failed to record time-in.");
  }
};


// RECORD TIME OUT
export const recordTimeOut = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  try {
    const { employee_id, remarks } = req.body;
    const today = getToday();

    const attendance = await Attendance.findOne({
      where: {
        employee_id,
        attendance_date: today
      }
    });

    if (!attendance || !attendance.time_in) {
      return res.send("Please record time-in first.");
    }

    if (attendance.time_out) {
      return res.send("Time-out has already been recorded.");
    }

    attendance.time_out = getCurrentTime();

    const timeOutRemarks = remarks?.trim();

    if (timeOutRemarks) {
      attendance.remarks = attendance.remarks
        ? `${attendance.remarks}\nTime Out: ${timeOutRemarks}`
        : `Time Out: ${timeOutRemarks}`;
    }

    await attendance.save();

    await AttendanceLog.create({
      employee_id,
      performed_by: req.session.userId,
      action: "time_out",
      details:
        `Time-out recorded: ${attendance.time_out}` +
        (timeOutRemarks ? ` | Remarks: ${timeOutRemarks}` : "")
    });

    res.redirect("/manager-attendance");

  } catch (error) {
    console.error("TIME OUT ERROR:", error);
    res.send("Failed to record time-out.");
  }
};


// MARK EMPLOYEE AS ABSENT
export const markAbsent = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  try {
    const { employee_id, remarks } = req.body;
    const today = getToday();

    const employee = await Employee.findByPk(employee_id);

    if (!employee || employee.employment_status !== "active") {
      return res.send("Invalid or inactive employee.");
    }

    const existingAttendance = await Attendance.findOne({
      where: {
        employee_id,
        attendance_date: today
      }
    });

    if (existingAttendance) {
      return res.send("Attendance has already been recorded today.");
    }

    const attendance = await Attendance.create({
      employee_id,
      attendance_date: today,
      time_in: null,
      time_out: null,
      status: "absent",
      remarks: remarks?.trim() || null,
      recorded_by: req.session.userId
    });

    await AttendanceLog.create({
      employee_id,
      performed_by: req.session.userId,
      action: "correction",
      details:
        "Employee marked as absent" +
        (remarks?.trim() ? ` | Remarks: ${remarks.trim()}` : "")
    });

    res.redirect("/manager-attendance");

  } catch (error) {
    console.error("MARK ABSENT ERROR:", error);
    res.send("Failed to mark employee as absent.");
  }
};


// UPDATE ATTENDANCE STATUS
export const updateAttendanceStatus = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (!["admin", "manager"].includes(req.session.role)) {
    return res.send("Access denied.");
  }

  try {
    const { employee_id, status, remarks } = req.body;
    const today = getToday();

    const allowedStatuses = [
      "present",
      "late",
      "half_day",
      "excuse_letter"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.send("Invalid attendance status.");
    }

    const employee = await Employee.findByPk(employee_id);

    if (!employee || employee.employment_status !== "active") {
      return res.send("Invalid or inactive employee.");
    }

    const attendance = await Attendance.findOne({
      where: {
        employee_id,
        attendance_date: today
      }
    });

    if (!attendance) {
      return res.send("Attendance has not been recorded yet.");
    }

    attendance.status = status;
    attendance.remarks = remarks?.trim() || null;
    attendance.recorded_by = req.session.userId;

    await attendance.save();

    await AttendanceLog.create({
      employee_id,
      performed_by: req.session.userId,
      action: "correction",
      details:
        `Attendance status updated to ${status}` +
        (remarks?.trim()
          ? ` | Remarks: ${remarks.trim()}`
          : "")
    });

    res.redirect("/manager-attendance");

  } catch (error) {
    console.error("UPDATE ATTENDANCE STATUS ERROR:", error);
    res.send("Failed to update attendance status.");
  }
};
