-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_periodeId_fkey";

-- DropForeignKey
ALTER TABLE "Anggota" DROP CONSTRAINT "Anggota_userId_fkey";

-- DropForeignKey
ALTER TABLE "Kegiatan" DROP CONSTRAINT "Kegiatan_periodeId_fkey";

-- DropForeignKey
ALTER TABLE "Kegiatan" DROP CONSTRAINT "Kegiatan_userId_fkey";


-- CreateTable
CREATE TABLE "LogActivity" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LogActivity_userId_idx" ON "LogActivity"("userId");

-- CreateIndex
CREATE INDEX "LogActivity_createdAt_idx" ON "LogActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kegiatan" ADD CONSTRAINT "Kegiatan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kegiatan" ADD CONSTRAINT "Kegiatan_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogActivity" ADD CONSTRAINT "LogActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
