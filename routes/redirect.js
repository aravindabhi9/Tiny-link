// routes/redirect.js
const express = require("express");
const router = express.Router();
const linksController = require("../controllers/linksController");

router.get("/:code", linksController.redirectLink);

module.exports = router;
