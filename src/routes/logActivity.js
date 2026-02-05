const express = require("express");
const {
  listMyActivities,
  listAllActivities,
  statsMyActivities,
  statsAllActivities,
} = require("../controllers/logActivityController");
const { authRequired, roleRequired } = require("../middlewares/auth");

const router = express.Router();

/**
 * @openapi
 * /v1/log-activity:
 *   get:
 *     tags:
 *       - Log Activity
 *     summary: List log activity milik user
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
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: method
 *         schema: { type: string, example: "POST" }
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
 *                     $ref: '#/components/schemas/LogActivity'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 * /v1/log-activity/stats:
 *   get:
 *     tags:
 *       - Log Activity
 *     summary: Stats log activity milik user
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
 * /v1/log-activity/all:
 *   get:
 *     tags:
 *       - Log Activity
 *     summary: List log activity semua user (Cabang)
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
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: method
 *         schema: { type: string, example: "POST" }
 *       - in: query
 *         name: userId
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LogActivity'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 * /v1/log-activity/all/stats:
 *   get:
 *     tags:
 *       - Log Activity
 *     summary: Stats log activity semua user (Cabang)
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
 */
router.get("/", authRequired, listMyActivities);
router.get("/stats", authRequired, statsMyActivities);
router.get("/all", authRequired, roleRequired("SEKRETARIS_CABANG"), listAllActivities);
router.get(
  "/all/stats",
  authRequired,
  roleRequired("SEKRETARIS_CABANG"),
  statsAllActivities
);

module.exports = router;
