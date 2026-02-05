const express = require("express");
const {
  getProfile,
  updateProfile,
  requestEmailVerification,
  verifyEmail,
} = require("../controllers/profileController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

router.get("/", authRequired, getProfile);
router.put("/", authRequired, updateProfile);
router.post("/verify/request", authRequired, requestEmailVerification);
router.post("/verify/confirm", authRequired, verifyEmail);

module.exports = router;
