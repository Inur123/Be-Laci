const express = require("express");
const {
  listKegiatan,
  getKegiatan,
  createKegiatan,
  updateKegiatan,
  deleteKegiatan,
  statsKegiatan,
} = require("../controllers/kegiatanController");
const { authRequired, roleRequired } = require("../middlewares/auth");

const router = express.Router();

router.use(authRequired, roleRequired("SEKRETARIS_CABANG"));

/**
 * @openapi
 * /v1/kegiatan:
 *   get:
 *     tags:
 *       - Kegiatan
 *     summary: List kegiatan
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
 *         name: tanggal
 *         schema: { type: string, example: "2026-02-05" }
 *       - in: query
 *         name: periodeId
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
 *                     $ref: '#/components/schemas/Kegiatan'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags:
 *       - Kegiatan
 *     summary: Create kegiatan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [judul, tanggalPelaksanaan]
 *             properties:
 *               judul: { type: string }
 *               tanggalPelaksanaan: { type: string }
 *               lokasi: { type: string }
 *               waktuMulai: { type: string }
 *               waktuSelesai: { type: string }
 *               deskripsi: { type: string }
 *               warnaLabel: { type: string }
 *               periodeId: { type: string, nullable: true, description: "Opsional, otomatis pakai periode aktif" }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Created" }
 *                 data:
 *                   $ref: '#/components/schemas/Kegiatan'
 * /v1/kegiatan/stats:
 *   get:
 *     tags:
 *       - Kegiatan
 *     summary: Stats kegiatan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupBy
 *         schema: { type: string, example: "periode" }
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
 *                     byPeriode:
 *                       type: array
 *                       nullable: true
 *                       items:
 *                         type: object
 *                         properties:
 *                           periodeId: { type: string, nullable: true }
 *                           total: { type: integer, example: 1 }
 * /v1/kegiatan/{id}:
 *   get:
 *     tags:
 *       - Kegiatan
 *     summary: Get kegiatan detail
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
 *                   $ref: '#/components/schemas/Kegiatan'
 *   put:
 *     tags:
 *       - Kegiatan
 *     summary: Update kegiatan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               judul: { type: string }
 *               tanggalPelaksanaan: { type: string }
 *               lokasi: { type: string }
 *               waktuMulai: { type: string }
 *               waktuSelesai: { type: string }
 *               deskripsi: { type: string }
 *               warnaLabel: { type: string }
 *               periodeId: { type: string, nullable: true }
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
 *                   $ref: '#/components/schemas/Kegiatan'
 *   delete:
 *     tags:
 *       - Kegiatan
 *     summary: Delete kegiatan
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
 *                 data: { type: object }
 */
router.get("/", listKegiatan);
router.get("/stats", statsKegiatan);
router.get("/:id", getKegiatan);
router.post("/", createKegiatan);
router.put("/:id", updateKegiatan);
router.delete("/:id", deleteKegiatan);

module.exports = router;
