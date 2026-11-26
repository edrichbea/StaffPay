import { sequelize } from "./models/db.js";
import "./models/index.js";

try {
  await sequelize.authenticate();

  console.log("DATABASE CONNECTED SUCCESSFULLY!");

  await sequelize.sync({ alter: false });

  console.log("STAFFPAY DATABASE TABLES CREATED SUCCESSFULLY!");
} catch (error) {
  console.error("DATABASE MIGRATION FAILED:", error);
} finally {
  await sequelize.close();
}