const express = require("express");
const {
  listBerkasPimpinan,
  getBerkasPimpinan,
  createBerkasPimpinan,
  updateBerkasPimpinan,
  deleteBerkasPimpinan,
  downloadBerkasPimpinan,
  statsBerkasPimpinan,
} = require("../controllers/berkasPimpinanController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

/**
 * @openapi
 * /v1/berkas-pimpinan:
 *   get:
 *     tags:
 *       - Berkas Pimpinan
 *     summary: List berkas pimpinan
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
 *                     $ref: '#/components/schemas/BerkasPimpinan'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags:
 *       - Berkas Pimpinan
 *     summary: Create berkas pimpinan
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nama, tanggal]
 *             properties:
 *               nama: { type: string }
 *               tanggal: { type: string }
 *               catatan: { type: string }
 *               fileUrl: { type: string }
 *               fileName: { type: string }
 *               fileMime: { type: string }
 *               fileSize: { type: integer }
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
 *                   $ref: '#/components/schemas/BerkasPimpinan'
 * /v1/berkas-pimpinan/stats:
 *   get:
 *     tags:
 *       - Berkas Pimpinan
 *     summary: Stats berkas pimpinan
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
 * /v1/berkas-pimpinan/{id}:
 *   get:
 *     tags:
 *       - Berkas Pimpinan
 *     summary: Get berkas pimpinan detail
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
 *                   $ref: '#/components/schemas/BerkasPimpinan'
 *   put:
 *     tags:
 *       - Berkas Pimpinan
 *     summary: Update berkas pimpinan
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
 *               nama: { type: string }
 *               tanggal: { type: string }
 *               catatan: { type: string }
 *               fileUrl: { type: string }
 *               fileName: { type: string }
 *               fileMime: { type: string }
 *               fileSize: { type: integer }
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
 *                   $ref: '#/components/schemas/BerkasPimpinan'
 *   delete:
 *     tags:
 *       - Berkas Pimpinan
 *     summary: Delete berkas pimpinan
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
 * /v1/berkas-pimpinan/{id}/download:
 *   get:
 *     tags:
 *       - Berkas Pimpinan
 *     summary: Download berkas pimpinan
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
router.get("/", authRequired, listBerkasPimpinan);
router.get("/stats", authRequired, statsBerkasPimpinan);
router.get("/:id", authRequired, getBerkasPimpinan);
router.post("/", authRequired, createBerkasPimpinan);
router.put("/:id", authRequired, updateBerkasPimpinan);
router.delete("/:id", authRequired, deleteBerkasPimpinan);
router.get("/:id/download", authRequired, downloadBerkasPimpinan);

module.exports = router;
