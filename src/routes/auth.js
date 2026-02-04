const express = require("express");
const {
  register,
  login,
  refresh,
  logout,
  me,
} = require("../controllers/authController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authRequired, me);

module.exports = router;
