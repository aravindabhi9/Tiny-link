require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;
const { sequelize, testConnection } = require("./models/db");
const LinkModel = require("./models/link");
const Link = LinkModel(sequelize);
// Parse JSON (you'll need it later for APIs)
app.use(express.json());

// Make "public" folder available (for CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});
app.get("/code/:code", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "code.html"));
});
const redirectRouter = require("./routes/redirect");
const linksRouter = require("./routes/links"); 
app.get("/healthz", async (req, res) => {
  const start = Date.now();
  const info = {
    ok: true,
    version: "1.0",
    node: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
  };

  try {
    await sequelize.authenticate();
    info.db = { ok: true };
  } catch (err) {
    info.ok = false;
    info.db = { ok: false, error: String(err.message || err) };
  }

  info.checkMs = Date.now() - start;
  return res.status(info.ok ? 200 : 500).json(info);
});

app.use("/api/links", linksRouter);
app.use("/api/links", linksRouter);
app.use("/api/links", linksRouter);

app.use("/", redirectRouter);






(async () => {
  try {
    await testConnection();
  } catch (err) {
    console.warn("DB testConnection failed (continuing):", err?.message || err);
  }

  try {
    // alter: true will try to keep tables in sync — safe for development/demo
    await sequelize.sync({ alter: true });
    console.log("✅ Table(s) synced");
  } catch (err) {
    console.error("⚠️ Sequelize sync error (continuing):", err?.message || err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT} (PORT=${PORT})`);
  });
})();