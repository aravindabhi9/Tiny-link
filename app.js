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
app.get('/healthz', async (req, res) => {
  const start = Date.now();
  const info = {
    ok: true,
    version: "1.0",                      // app version you can bump when releasing
    node: process.version,               // runtime node version
    uptimeSeconds: Math.floor(process.uptime()),
  };

  // Optional: lightweight DB check
  try {
    // `sequelize` comes from your models/db.js (you already have it)
    await sequelize.authenticate();
    info.db = { ok: true };
  } catch (err) {
    info.ok = false;
    info.db = { ok: false, error: String(err.message || err) };
  }

  // timing info (how long the health check took)
  info.checkMs = Date.now() - start;

  // respond 200 when ok true, otherwise 500 for unhealthy
  return res.status(info.ok ? 200 : 500).json(info);
});

app.use("/api/links", linksRouter);
app.use("/api/links", linksRouter);
app.use("/api/links", linksRouter);

app.use("/", redirectRouter);







(async () => {
  await testConnection();
  await sequelize.sync();       // <-- THIS CREATES THE TABLE !!!
  console.log("✅ Table synced");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();