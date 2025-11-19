const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",
  logging: false,
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL connected successfully");
  } catch (err) {
    console.error("❌ MySQL connection error:", err);
  }
}

module.exports = { sequelize, testConnection };
