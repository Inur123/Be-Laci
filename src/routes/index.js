const express = require("express");
const authRoutes = require("./auth");
const periodeRoutes = require("./periode");
const profileRoutes = require("./profile");
const arsipSuratRoutes = require("./arsipSurat");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Laci Digital API v1" });
});

router.use("/auth", authRoutes);
router.use("/periodes", periodeRoutes);
router.use("/profile", profileRoutes);
router.use("/arsip-surat", arsipSuratRoutes);

module.exports = router;
