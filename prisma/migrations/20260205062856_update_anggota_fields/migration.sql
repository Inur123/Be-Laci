/*
  Warnings:

  - You are about to drop the column `image` on the `Anggota` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Anggota` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `Anggota` table. All the data in the column will be lost.
  - You are about to drop the column `organisasi` on the `Anggota` table. All the data in the column will be lost.
  - Added the required column `namaLengkap` to the `Anggota` table without a default value. This is not possible if the table is not empty.
  - Made the column `jenisKelamin` on table `Anggota` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_periodeId_fkey";

-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_userId_fkey";

-- DropForeignKey
ALTER TABLE "PengajuanPac" DROP CONSTRAINT "PengajuanPac_periodePacId_fkey";

-- DropForeignKey
ALTER TABLE "PengajuanPac" DROP CONSTRAINT "PengajuanPac_userId_fkey";

-- AlterTable
ALTER TABLE "Anggota" DROP COLUMN "image",
DROP COLUMN "isActive",
DROP COLUMN "nama",
DROP COLUMN "organisasi",
ADD COLUMN     "foto" TEXT,
ADD COLUMN     "hoby" TEXT,
ADD COLUMN     "jabatan" TEXT,
ADD COLUMN     "namaLengkap" TEXT NOT NULL,
ADD COLUMN     "nia" TEXT,
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "rfid" TEXT,
ADD COLUMN     "tempatLahir" TEXT,
ALTER COLUMN "jenisKelamin" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanPac" ADD CONSTRAINT "PengajuanPac_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanPac" ADD CONSTRAINT "PengajuanPac_periodePacId_fkey" FOREIGN KEY ("periodePacId") REFERENCES "Periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
