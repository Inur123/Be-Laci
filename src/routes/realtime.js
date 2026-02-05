const express = require("express");
const { authRequired, roleRequired } = require("../middlewares/auth");
const {
  createSseResponse,
  addClient,
  removeClient,
} = require("../realtime/sse");

const router = express.Router();

const handleSse = (req, res) => {
  createSseResponse(res);
  const id = addClient({ userId: req.user.id, role: req.user.role, res });
  req.on("close", () => removeClient(id));
};

/**
 * @openapi
 * /v1/realtime/log-activity:
 *   get:
 *     tags:
 *       - Realtime
 *     summary: Stream log activity milik user (SSE)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SSE stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 * /v1/realtime/log-activity/all:
 *   get:
 *     tags:
 *       - Realtime
 *     summary: Stream log activity semua user (Cabang)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SSE stream
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 */
router.get("/log-activity", authRequired, handleSse);
router.get(
  "/log-activity/all",
  authRequired,
  roleRequired("SEKRETARIS_CABANG"),
  handleSse
);

module.exports = router;
