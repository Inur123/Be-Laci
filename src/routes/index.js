const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Laci Digital API v1" });
});

module.exports = router;
