// routes/links.js
const express = require("express");
const router = express.Router();
const linksController = require("../controllers/linksController");

// POST /api/links
router.post("/", linksController.createLink);
// GET /api/links → list all links
router.get("/", linksController.listLinks);
router.delete("/:code", linksController.deleteLink);
router.get("/:code", linksController.getLink);

module.exports = router;
