const express = require("express");
const authRoutes = require("./auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Laci Digital API v1" });
});

router.use("/auth", authRoutes);

module.exports = router;
