const express = require("express");
const {
  getProfile,
  updateProfile,
  requestEmailVerification,
  verifyEmail,
} = require("../controllers/profileController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

/**
 * @openapi
 * /v1/profile:
 *   get:
 *     tags:
 *       - Profile
 *     summary: Get profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *   put:
 *     tags:
 *       - Profile
 *     summary: Update profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               image: { type: string }
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 * /v1/profile/verify/request:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Request email verification token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified: { type: boolean, example: false }
 *                     token: { type: string }
 *                     expiresAt: { type: string }
 * /v1/profile/verify/confirm:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Confirm email verification token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "OK" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified: { type: boolean, example: true }
 */
router.get("/", authRequired, getProfile);
router.put("/", authRequired, updateProfile);
router.post("/verify/request", authRequired, requestEmailVerification);
router.post("/verify/confirm", authRequired, verifyEmail);

module.exports = router;
