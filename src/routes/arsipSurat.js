const express = require("express");
const {
  listArsipSurat,
  getArsipSurat,
  createArsipSurat,
  updateArsipSurat,
  deleteArsipSurat,
  downloadArsipSurat,
  statsArsipSurat,
} = require("../controllers/arsipSuratController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

/**
 * @openapi
 * /v1/arsip-surat:
 *   get:
 *     tags:
 *       - Arsip Surat
 *     summary: List arsip surat
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
 *                     $ref: '#/components/schemas/ArsipSurat'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags:
 *       - Arsip Surat
 *     summary: Create arsip surat
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nomorSurat, jenisSurat, tanggalSurat, penerimaPengirim, perihal]
 *             properties:
 *               nomorSurat: { type: string }
 *               jenisSurat: { type: string, enum: [MASUK, KELUAR] }
 *               organisasi: { type: string, enum: [IPNU, IPPNU, BERSAMA] }
 *               tanggalSurat: { type: string }
 *               penerimaPengirim: { type: string }
 *               perihal: { type: string }
 *               deskripsi: { type: string }
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
 *                   $ref: '#/components/schemas/ArsipSurat'
 * /v1/arsip-surat/stats:
 *   get:
 *     tags:
 *       - Arsip Surat
 *     summary: Stats arsip surat
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
 * /v1/arsip-surat/{id}:
 *   get:
 *     tags:
 *       - Arsip Surat
 *     summary: Get arsip surat detail
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
 *                   $ref: '#/components/schemas/ArsipSurat'
 *   put:
 *     tags:
 *       - Arsip Surat
 *     summary: Update arsip surat
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
 *               nomorSurat: { type: string }
 *               jenisSurat: { type: string, enum: [MASUK, KELUAR] }
 *               organisasi: { type: string, enum: [IPNU, IPPNU, BERSAMA] }
 *               tanggalSurat: { type: string }
 *               penerimaPengirim: { type: string }
 *               perihal: { type: string }
 *               deskripsi: { type: string }
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
 *                   $ref: '#/components/schemas/ArsipSurat'
 *   delete:
 *     tags:
 *       - Arsip Surat
 *     summary: Delete arsip surat
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
 * /v1/arsip-surat/{id}/download:
 *   get:
 *     tags:
 *       - Arsip Surat
 *     summary: Download arsip surat
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
router.get("/", authRequired, listArsipSurat);
router.get("/stats", authRequired, statsArsipSurat);
router.get("/:id", authRequired, getArsipSurat);
router.post("/", authRequired, createArsipSurat);
router.put("/:id", authRequired, updateArsipSurat);
router.delete("/:id", authRequired, deleteArsipSurat);
router.get("/:id/download", authRequired, downloadArsipSurat);

module.exports = router;
