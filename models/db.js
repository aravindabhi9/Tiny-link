const { Sequelize } = require('sequelize');

let sequelize;

// If DATABASE_URL exists (future), use it
if (process.env.DATABASE_URL) {
  console.log("Using cloud database from DATABASE_URL");
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: false,
    dialectOptions: {
      // uncomment this if using SSL DB in future:
      // ssl: { require: true, rejectUnauthorized: false }
    }
  });
} else {
  // SQLite fallback
  console.warn("No DATABASE_URL found. Using SQLite local database (Render-safe).");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
  });
}

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");
  } catch (err) {
    console.log("❌ Database connection failed:", err.message);
  }
}

module.exports = { sequelize, testConnection };
