const express = require("express");
const {
  listBerkasSp,
  getBerkasSp,
  createBerkasSp,
  updateBerkasSp,
  deleteBerkasSp,
  downloadBerkasSp,
  statsBerkasSp,
} = require("../controllers/berkasSpController");
const { authRequired, roleRequired } = require("../middlewares/auth");

const router = express.Router();

router.use(authRequired, roleRequired("SEKRETARIS_CABANG"));

/**
 * @openapi
 * /v1/berkas-sp:
 *   get:
 *     tags:
 *       - Berkas SP
 *     summary: List berkas SP
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
 *                     $ref: '#/components/schemas/BerkasSp'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags:
 *       - Berkas SP
 *     summary: Create berkas SP
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [namaPimpinan, organisasi, tanggalMulai, tanggalBerakhir]
 *             properties:
 *               namaPimpinan: { type: string }
 *               organisasi: { type: string, enum: [IPNU, IPPNU] }
 *               tanggalMulai: { type: string }
 *               tanggalBerakhir: { type: string }
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
 *                   $ref: '#/components/schemas/BerkasSp'
 * /v1/berkas-sp/stats:
 *   get:
 *     tags:
 *       - Berkas SP
 *     summary: Stats berkas SP
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
 * /v1/berkas-sp/{id}:
 *   get:
 *     tags:
 *       - Berkas SP
 *     summary: Get berkas SP detail
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
 *                   $ref: '#/components/schemas/BerkasSp'
 *   put:
 *     tags:
 *       - Berkas SP
 *     summary: Update berkas SP
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
 *               namaPimpinan: { type: string }
 *               organisasi: { type: string, enum: [IPNU, IPPNU] }
 *               tanggalMulai: { type: string }
 *               tanggalBerakhir: { type: string }
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
 *                   $ref: '#/components/schemas/BerkasSp'
 *   delete:
 *     tags:
 *       - Berkas SP
 *     summary: Delete berkas SP
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
 * /v1/berkas-sp/{id}/download:
 *   get:
 *     tags:
 *       - Berkas SP
 *     summary: Download berkas SP
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
router.get("/", listBerkasSp);
router.get("/stats", statsBerkasSp);
router.get("/:id", getBerkasSp);
router.post("/", createBerkasSp);
router.put("/:id", updateBerkasSp);
router.delete("/:id", deleteBerkasSp);
router.get("/:id/download", downloadBerkasSp);

module.exports = router;
