-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_periodeId_fkey";

-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_userId_fkey";

-- DropForeignKey
ALTER TABLE "PengajuanPac" DROP CONSTRAINT "PengajuanPac_periodePacId_fkey";

-- DropForeignKey
ALTER TABLE "PengajuanPac" DROP CONSTRAINT "PengajuanPac_userId_fkey";

-- CreateTable
CREATE TABLE "Kegiatan" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "tanggalPelaksanaan" TIMESTAMP(3) NOT NULL,
    "lokasi" TEXT,
    "waktuMulai" TEXT,
    "waktuSelesai" TEXT,
    "deskripsi" TEXT,
    "warnaLabel" TEXT,
    "userId" TEXT NOT NULL,
    "periodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kegiatan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Kegiatan_userId_idx" ON "Kegiatan"("userId");

-- CreateIndex
CREATE INDEX "Kegiatan_periodeId_idx" ON "Kegiatan"("periodeId");

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kegiatan" ADD CONSTRAINT "Kegiatan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kegiatan" ADD CONSTRAINT "Kegiatan_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanPac" ADD CONSTRAINT "PengajuanPac_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanPac" ADD CONSTRAINT "PengajuanPac_periodePacId_fkey" FOREIGN KEY ("periodePacId") REFERENCES "Periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
