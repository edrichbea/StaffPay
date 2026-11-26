
import { Op } from "sequelize";
import { Payroll, Deduction } from "../models/index.js";
import { sequelize } from "../models/db.js";

export const releasePayroll = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.send("Access denied.");
  }

  let transaction;

  try {
    transaction = await sequelize.transaction();

    const { payroll_id } = req.body;

    const payroll = await Payroll.findByPk(payroll_id, {
      transaction
    });

    if (!payroll) {
      await transaction.rollback();
      return res.send("Payroll record not found.");
    }

    // Release payroll if not yet released
    if (payroll.payment_status !== "released") {
      const now = new Date();

      const paymentDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
      ].join("-");

      payroll.payment_status = "released";
      payroll.payment_date = paymentDate;

      await payroll.save({ transaction });
    }

    // Automatically process deductions included in this payroll period
    await Deduction.update(
      {
        status: "processed"
      },
      {
        where: {
          employee_id: payroll.employee_id,
          status: "pending",
          deduction_date: {
            [Op.between]: [
              payroll.pay_period_start,
              payroll.pay_period_end
            ]
          }
        },
        transaction
      }
    );

    await transaction.commit();

    res.redirect("/payroll");

  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error("PAYROLL RELEASE ERROR:", error);
    res.send("Failed to release payroll.");
  }
};
