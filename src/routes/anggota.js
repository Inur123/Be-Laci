const express = require("express");
const {
  listAnggota,
  getAnggota,
  createAnggota,
  updateAnggota,
  deleteAnggota,
  statsAnggota,
  getAnggotaImage,
} = require("../controllers/anggotaController");
const { authRequired } = require("../middlewares/auth");

const router = express.Router();

/**
 * @openapi
 * /v1/anggota:
 *   get:
 *     tags:
 *       - Anggota
 *     summary: List anggota
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
 *                     $ref: '#/components/schemas/Anggota'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *   post:
 *     tags:
 *       - Anggota
 *     summary: Create anggota
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [namaLengkap, jenisKelamin]
 *             properties:
 *               namaLengkap: { type: string }
 *               email: { type: string }
 *               nik: { type: string }
 *               nia: { type: string }
 *               jenisKelamin: { type: string }
 *               noHp: { type: string }
 *               tempatLahir: { type: string }
 *               tanggalLahir: { type: string }
 *               jabatan: { type: string }
 *               rfid: { type: string }
 *               hoby: { type: string }
 *               alamat: { type: string }
 *               foto: { type: string }
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
 *                   $ref: '#/components/schemas/Anggota'
 * /v1/anggota/stats:
 *   get:
 *     tags:
 *       - Anggota
 *     summary: Stats anggota
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
 * /v1/anggota/{id}:
 *   get:
 *     tags:
 *       - Anggota
 *     summary: Get anggota detail
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
 *                   $ref: '#/components/schemas/Anggota'
 *   put:
 *     tags:
 *       - Anggota
 *     summary: Update anggota
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
 *               namaLengkap: { type: string }
 *               email: { type: string }
 *               nik: { type: string }
 *               nia: { type: string }
 *               jenisKelamin: { type: string }
 *               noHp: { type: string }
 *               tempatLahir: { type: string }
 *               tanggalLahir: { type: string }
 *               jabatan: { type: string }
 *               rfid: { type: string }
 *               hoby: { type: string }
 *               alamat: { type: string }
 *               foto: { type: string }
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
 *                   $ref: '#/components/schemas/Anggota'
 *   delete:
 *     tags:
 *       - Anggota
 *     summary: Delete anggota
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
 * /v1/anggota/{id}/image:
 *   get:
 *     tags:
 *       - Anggota
 *     summary: Get image anggota
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
router.get("/", authRequired, listAnggota);
router.get("/stats", authRequired, statsAnggota);
router.get("/:id", authRequired, getAnggota);
router.post("/", authRequired, createAnggota);
router.put("/:id", authRequired, updateAnggota);
router.delete("/:id", authRequired, deleteAnggota);
router.get("/:id/image", authRequired, getAnggotaImage);

module.exports = router;
