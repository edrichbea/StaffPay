
import bcrypt from "bcrypt";
import { User } from "../models/userModel.js";
import {
  Employee,
  Attendance
} from "../models/index.js";

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const loginPage = (req, res) => {
  res.render("login", { title: "Login" });
};

export const registerPage = (req, res) => {
  res.send("Public registration is disabled.");
};


// DASHBOARD
export const dashboardPage = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const user = await User.findByPk(req.session.userId);

    if (!user) {
      req.session.destroy();
      return res.redirect("/login");
    }

    const today = getToday();

    let managerAttendanceSummary = null;
    let staffAttendance = null;

    // MANAGER ATTENDANCE SUMMARY
    if (user.role === "manager") {
      const employees = await Employee.findAll({
        where: {
          employment_status: "active"
        },
        include: [{
          model: Attendance,
          as: "attendances",
          where: {
            attendance_date: today
          },
          required: false
        }]
      });

      managerAttendanceSummary = {
        total: employees.length,
        present: 0,
        late: 0,
        half_day: 0,
        excuse_letter: 0,
        absent: 0,
        not_recorded: 0
      };

      for (const employee of employees) {
        const attendance = employee.attendances?.[0];

        if (!attendance) {
          managerAttendanceSummary.not_recorded++;
        } else if (attendance.status === "present") {
          managerAttendanceSummary.present++;
        } else if (attendance.status === "late") {
          managerAttendanceSummary.late++;
        } else if (attendance.status === "half_day") {
          managerAttendanceSummary.half_day++;
        } else if (attendance.status === "excuse_letter") {
          managerAttendanceSummary.excuse_letter++;
        } else if (attendance.status === "absent") {
          managerAttendanceSummary.absent++;
        }
      }
    }

    // STAFF PERSONAL ATTENDANCE
    if (user.role === "staff") {
      const employeeId = user.employee_id || req.session.employeeId;

      if (employeeId) {
        staffAttendance = await Attendance.findOne({
          where: {
            employee_id: employeeId,
            attendance_date: today
          }
        });
      }

      if (!staffAttendance) {
        staffAttendance = {
          status: "not_recorded",
          time_in: null,
          time_out: null,
          remarks: null
        };
      }
    }

    res.render("dashboard", {
      title: "Dashboard",
      user: user,
      role: user.role,
      managerAttendanceSummary,
      staffAttendance
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.send("Failed to load dashboard.");
  }
};


// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.send("User not found");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.send("Incorrect password");
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.employeeId = user.employee_id;

    res.redirect("/dashboard");

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.send("Login failed.");
  }
};


// REGISTRATION DISABLED
export const registerUser = async (req, res) => {
  return res.send("Public registration is disabled.");
};


// LOGOUT
export const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
