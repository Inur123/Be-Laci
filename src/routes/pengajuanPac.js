const express = require("express");
const {
  listPengajuanPac,
  listPengajuanPacCabang,
  getPengajuanPac,
  createPengajuanPac,
  updatePengajuanPac,
  deletePengajuanPac,
  downloadPengajuanPac,
  approvePengajuanPac,
  rejectPengajuanPac,
  statsPengajuanPac,
} = require("../controllers/pengajuanPacController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

/**
 * @openapi
 * /v1/pengajuan-pac:
 *   get:
 *     tags:
 *       - Pengajuan PAC
 *     summary: List pengajuan PAC (PAC)
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
 *         schema: { type: string, enum: [PENDING, DITERIMA, DITOLAK] }
 *       - in: query
 *         name: penerima
 *         schema: { type: string, enum: [IPNU, IPPNU, BERSAMA] }
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
 *                     $ref: '#/components/schemas/PengajuanPac'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags:
 *       - Pengajuan PAC
 *     summary: Create pengajuan PAC (PAC)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nomorSurat, penerima, tanggal, keperluan]
 *             properties:
 *               nomorSurat: { type: string }
 *               penerima: { type: string, enum: [IPNU, IPPNU, BERSAMA] }
 *               tanggal: { type: string }
 *               keperluan: { type: string }
 *               deskripsi: { type: string }
 *               fileUrl: { type: string }
 *               fileName: { type: string }
 *               fileMime: { type: string }
 *               fileSize: { type: integer }
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
 *                   $ref: '#/components/schemas/PengajuanPac'
 * /v1/pengajuan-pac/cabang:
 *   get:
 *     tags:
 *       - Pengajuan PAC
 *     summary: List pengajuan PAC (Cabang)
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
 *         schema: { type: string, enum: [PENDING, DITERIMA, DITOLAK] }
 *       - in: query
 *         name: penerima
 *         schema: { type: string, enum: [IPNU, IPPNU, BERSAMA] }
 *       - in: query
 *         name: pacId
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
 *                     $ref: '#/components/schemas/PengajuanPac'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 * /v1/pengajuan-pac/stats:
 *   get:
 *     tags:
 *       - Pengajuan PAC
 *     summary: Stats pengajuan PAC
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
 *                     ipnu: { type: integer, example: 0 }
 *                     ippnu: { type: integer, example: 0 }
 *                     bersama: { type: integer, example: 0 }
 *                     pending: { type: integer, example: 0 }
 *                     diterima: { type: integer, example: 0 }
 *                     ditolak: { type: integer, example: 0 }
 * /v1/pengajuan-pac/{id}:
 *   get:
 *     tags:
 *       - Pengajuan PAC
 *     summary: Get pengajuan PAC detail
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
 *                   $ref: '#/components/schemas/PengajuanPac'
 *   put:
 *     tags:
 *       - Pengajuan PAC
 *     summary: Update pengajuan PAC (PAC)
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
 *               penerima: { type: string, enum: [IPNU, IPPNU, BERSAMA] }
 *               tanggal: { type: string }
 *               keperluan: { type: string }
 *               deskripsi: { type: string }
 *               fileUrl: { type: string }
 *               fileName: { type: string }
 *               fileMime: { type: string }
 *               fileSize: { type: integer }
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
 *                   $ref: '#/components/schemas/PengajuanPac'
 *   delete:
 *     tags:
 *       - Pengajuan PAC
 *     summary: Delete pengajuan PAC (PAC)
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
 * /v1/pengajuan-pac/{id}/download:
 *   get:
 *     tags:
 *       - Pengajuan PAC
 *     summary: Download file pengajuan PAC
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
 * /v1/pengajuan-pac/{id}/approve:
 *   post:
 *     tags:
 *       - Pengajuan PAC
 *     summary: Approve pengajuan PAC (Cabang)
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
 *                   $ref: '#/components/schemas/PengajuanPac'
 * /v1/pengajuan-pac/{id}/reject:
 *   post:
 *     tags:
 *       - Pengajuan PAC
 *     summary: Reject pengajuan PAC (Cabang)
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
 *             required: [alasanPenolakan]
 *             properties:
 *               alasanPenolakan: { type: string }
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
 *                   $ref: '#/components/schemas/PengajuanPac'
 */

router.get("/", authRequired, listPengajuanPac);
router.get("/cabang", authRequired, listPengajuanPacCabang);
router.get("/stats", authRequired, statsPengajuanPac);
router.get("/:id", authRequired, getPengajuanPac);
router.post("/", authRequired, createPengajuanPac);
router.put("/:id", authRequired, updatePengajuanPac);
router.delete("/:id", authRequired, deletePengajuanPac);
router.get("/:id/download", authRequired, downloadPengajuanPac);
router.post("/:id/approve", authRequired, approvePengajuanPac);
router.post("/:id/reject", authRequired, rejectPengajuanPac);

module.exports = router;
