// controllers/linksController.js
const { Link } = require("../models"); // adjust path if needed

// validate URL (same as your function)
function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// generate a random alphanumeric code of requested length
function generateRandomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/links
// body: { targetUrl, code (optional) }
exports.createLink = async function (req, res) {
  const { targetUrl, code } = req.body;

  // 1. Validate URL
  if (!targetUrl || !isValidUrl(targetUrl)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  // 2. Validate custom code if provided (1..12 alnum)
  const CODE_REGEX = /^[A-Za-z0-9]{1,12}$/;
  if (code && !CODE_REGEX.test(code)) {
    return res.status(400).json({ error: "Custom code must be 1-12 letters/numbers" });
  }

  try {
    // 3. If custom code provided -> check uniqueness
    if (code) {
      const existing = await Link.findByPk(code);
      if (existing) {
        return res.status(409).json({ error: "Code already exists" });
      }
      // create with provided code
      const created = await Link.create({
        code,
        targetUrl,
        clicks: 0
      });

      return res.status(201).json({
        code: created.code,
        targetUrl: created.targetUrl,
        clicks: created.clicks,
        createdAt: created.createdAt || created.created_at,
        lastClicked: created.lastClicked || created.last_clicked || null
      });
    }

    // 4. No custom code -> generate random unique code (retry a few times)
    const CODE_LENGTH = 6; // you can change default generated length
    const MAX_TRIES = 6;
    let finalCode = null;
    let tries = 0;

    while (tries < MAX_TRIES && !finalCode) {
      const candidate = generateRandomCode(CODE_LENGTH);
      const exists = await Link.findByPk(candidate);
      if (!exists) finalCode = candidate;
      tries++;
    }

    if (!finalCode) {
      // extremely unlikely; fail fast
      return res.status(500).json({ error: "Could not generate unique code, try again" });
    }

    // 5. create DB record
    const created = await Link.create({
      code: finalCode,
      targetUrl,
      clicks: 0
    });

    return res.status(201).json({
      code: created.code,
      targetUrl: created.targetUrl,
      clicks: created.clicks,
      createdAt: created.createdAt || created.created_at,
      lastClicked: created.lastClicked || created.last_clicked || null
    });
  } catch (err) {
    // Sequelize unique constraint might still surface (race conditions)
    console.error("createLink error:", err && err.message ? err.message : err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Code already exists" });
    }
    return res.status(500).json({ error: "Server error" });
  }
};
// GET /api/links
exports.listLinks = async function (req, res) {
  try {
    const rows = await Link.findAll({
      order: [["created_at", "DESC"]],
    });

    const result = rows.map((link) => ({
      code: link.code,
      targetUrl: link.targetUrl,
      clicks: link.clicks,
      createdAt: link.created_at || link.createdAt,
      lastClicked: link.last_clicked || link.lastClicked,
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error("GET /api/links error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
// DELETE /api/links/:code
exports.deleteLink = async function (req, res) {
  const { code } = req.params;

  try {
    const link = await Link.findByPk(code);

    if (!link) {
      return res.status(404).json({ error: "Code not found" });
    }

    await link.destroy(); // remove record from DB

    return res.status(204).send();  // No content
  } catch (err) {
    console.error("DELETE /api/links/:code error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
// GET /api/links/:code
exports.getLink = async function (req, res) {
  const { code } = req.params;

  try {
    const link = await Link.findByPk(code);

    if (!link) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.status(200).json({
      code: link.code,
      targetUrl: link.targetUrl,
      clicks: link.clicks,
      createdAt: link.created_at || link.createdAt,
      lastClicked: link.last_clicked || link.lastClicked
    });

  } catch (err) {
    console.error("GET /api/links/:code error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
// GET /:code  (redirect short link)
exports.redirectLink = async function (req, res) {
  const { code } = req.params;

  try {
    const link = await Link.findByPk(code);

    if (!link) {
      return res.status(404).send("Short link not found");
    }

    // Increment click count and update last clicked timestamp
    link.clicks += 1;
    link.lastClicked = new Date();

    await link.save();

    return res.redirect(302, link.targetUrl);
  } catch (err) {
    console.error("Redirect error:", err);
    return res.status(500).send("Server error");
  }
};
