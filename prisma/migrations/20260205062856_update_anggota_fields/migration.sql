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


-- AlterTable
DROP TABLE IF EXISTS "Anggota";

CREATE TABLE "Anggota" (
    "id" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "email" TEXT,
    "nik" TEXT,
    "nia" TEXT,
    "jenisKelamin" TEXT NOT NULL,
    "noHp" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "jabatan" TEXT,
    "rfid" TEXT,
    "hoby" TEXT,
    "alamat" TEXT,
    "foto" TEXT,
    "userId" TEXT NOT NULL,
    "periodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anggota_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Anggota_userId_idx" ON "Anggota"("userId");
CREATE INDEX "Anggota_periodeId_idx" ON "Anggota"("periodeId");

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id");

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id");
