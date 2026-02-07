import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.MYSQL_DB,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    dialect: "mysql",
    logging: false,
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("MySQL connected");
  } catch (error) {
    console.error("MySQL connection error:", error);
    process.exit(1);
  }
};
