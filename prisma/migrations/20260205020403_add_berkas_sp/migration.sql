-- CreateTable
CREATE TABLE "BerkasSp" (
    "id" TEXT NOT NULL,
    "namaPimpinan" TEXT NOT NULL,
    "organisasi" "Organisasi" NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalBerakhir" TIMESTAMP(3) NOT NULL,
    "catatan" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileMime" TEXT,
    "fileSize" INTEGER,
    "userId" TEXT NOT NULL,
    "periodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BerkasSp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BerkasSp_userId_idx" ON "BerkasSp"("userId");

-- CreateIndex
CREATE INDEX "BerkasSp_periodeId_idx" ON "BerkasSp"("periodeId");

-- AddForeignKey
ALTER TABLE "BerkasSp" ADD CONSTRAINT "BerkasSp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BerkasSp" ADD CONSTRAINT "BerkasSp_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
