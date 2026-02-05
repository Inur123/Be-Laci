const express = require("express");
const authRoutes = require("./auth");
const periodeRoutes = require("./periode");
const profileRoutes = require("./profile");
const arsipSuratRoutes = require("./arsipSurat");
const berkasPimpinanRoutes = require("./berkasPimpinan");
const berkasSpRoutes = require("./berkasSp");
const pengajuanPacRoutes = require("./pengajuanPac");
const userRoutes = require("./users");
const anggotaRoutes = require("./anggota");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ success: true, message: "Laci Digital API v1" });
});

router.use("/auth", authRoutes);
router.use("/periodes", periodeRoutes);
router.use("/profile", profileRoutes);
router.use("/arsip-surat", arsipSuratRoutes);
router.use("/berkas-pimpinan", berkasPimpinanRoutes);
router.use("/berkas-sp", berkasSpRoutes);
router.use("/pengajuan-pac", pengajuanPacRoutes);
router.use("/users", userRoutes);
router.use("/anggota", anggotaRoutes);

module.exports = router;
