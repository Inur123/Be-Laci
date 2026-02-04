const express = require("express");
const {
  listPeriode,
  getPeriode,
  createPeriode,
  updatePeriode,
  deletePeriode,
  activatePeriode,
} = require("../controllers/periodeController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

router.get("/", authRequired, listPeriode);
router.get("/:id", authRequired, getPeriode);
router.post("/", authRequired, createPeriode);
router.put("/:id", authRequired, updatePeriode);
router.delete("/:id", authRequired, deletePeriode);
router.post("/:id/activate", authRequired, activatePeriode);

module.exports = router;
