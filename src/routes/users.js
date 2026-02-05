const express = require("express");
const {
  listUserPac,
  getUserPac,
  toggleActiveUserPac,
  resetPasswordUserPac,
  statsUserPac,
  getUserImage,
} = require("../controllers/userPacController");
const { authRequired, roleRequired } = require("../middlewares/auth");

const router = express.Router();

router.use(authRequired, roleRequired("SEKRETARIS_CABANG"));

/**
 * @openapi
 * /v1/users/pac:
 *   get:
 *     tags:
 *       - User PAC
 *     summary: List user PAC
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, example: "aktif" }
 *       - in: query
 *         name: emailVerified
 *         schema: { type: string, example: "terverifikasi" }
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPac'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 * /v1/users/pac/{id}:
 *   get:
 *     tags:
 *       - User PAC
 *     summary: Get user PAC detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *                   $ref: '#/components/schemas/UserPac'
 * /v1/users/pac/{id}/toggle-active:
 *   post:
 *     tags:
 *       - User PAC
 *     summary: Toggle active user PAC
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *                   $ref: '#/components/schemas/UserPac'
 * /v1/users/pac/{id}/reset-password:
 *   post:
 *     tags:
 *       - User PAC
 *     summary: Reset password user PAC
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *                     temporaryPassword: { type: string }
 *                     email: { type: string }
 * /v1/users/stats:
 *   get:
 *     tags:
 *       - User PAC
 *     summary: Stats user PAC
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
 *                     total: { type: integer, example: 1 }
 *                     aktif: { type: integer, example: 1 }
 *                     nonaktif: { type: integer, example: 0 }
 *                     terverifikasi: { type: integer, example: 1 }
 *                     belumVerifikasi: { type: integer, example: 0 }
 * /v1/users/{id}/image:
 *   get:
 *     tags:
 *       - User PAC
 *     summary: Get image user PAC
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: File
 */
router.get("/pac", listUserPac);
router.get("/pac/:id", getUserPac);
router.post("/pac/:id/toggle-active", toggleActiveUserPac);
router.post("/pac/:id/reset-password", resetPasswordUserPac);
router.get("/stats", statsUserPac);
router.get("/:id/image", getUserImage);

module.exports = router;
