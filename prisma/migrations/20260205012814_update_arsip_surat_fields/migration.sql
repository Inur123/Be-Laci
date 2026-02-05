/*
  Warnings:

  - You are about to drop the column `judul` on the `ArsipSurat` table. All the data in the column will be lost.
  - You are about to drop the column `kategori` on the `ArsipSurat` table. All the data in the column will be lost.
  - You are about to drop the column `nomor` on the `ArsipSurat` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal` on the `ArsipSurat` table. All the data in the column will be lost.
  - Added the required column `jenisSurat` to the `ArsipSurat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomorSurat` to the `ArsipSurat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `penerimaPengirim` to the `ArsipSurat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `perihal` to the `ArsipSurat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tanggalSurat` to the `ArsipSurat` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JenisSurat" AS ENUM ('MASUK', 'KELUAR');

-- CreateEnum
CREATE TYPE "Organisasi" AS ENUM ('IPNU', 'IPPNU', 'BERSAMA');

-- AlterTable
ALTER TABLE "ArsipSurat" DROP COLUMN "judul",
DROP COLUMN "kategori",
DROP COLUMN "nomor",
DROP COLUMN "tanggal",
ADD COLUMN     "jenisSurat" "JenisSurat" NOT NULL,
ADD COLUMN     "nomorSurat" TEXT NOT NULL,
ADD COLUMN     "organisasi" "Organisasi",
ADD COLUMN     "penerimaPengirim" TEXT NOT NULL,
ADD COLUMN     "perihal" TEXT NOT NULL,
ADD COLUMN     "tanggalSurat" TIMESTAMP(3) NOT NULL;
