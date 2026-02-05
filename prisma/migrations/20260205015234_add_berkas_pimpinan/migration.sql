-- CreateTable
CREATE TABLE "BerkasPimpinan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "catatan" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileMime" TEXT,
    "fileSize" INTEGER,
    "userId" TEXT NOT NULL,
    "periodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BerkasPimpinan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BerkasPimpinan_userId_idx" ON "BerkasPimpinan"("userId");

-- CreateIndex
CREATE INDEX "BerkasPimpinan_periodeId_idx" ON "BerkasPimpinan"("periodeId");

-- AddForeignKey
ALTER TABLE "BerkasPimpinan" ADD CONSTRAINT "BerkasPimpinan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BerkasPimpinan" ADD CONSTRAINT "BerkasPimpinan_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
