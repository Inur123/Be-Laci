/*
  Warnings:

  - A unique constraint covering the columns `[userId,nama]` on the table `Periode` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Periode_userId_nama_key" ON "Periode"("userId", "nama");
