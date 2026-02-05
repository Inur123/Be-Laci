-- CreateTable
CREATE TABLE "PengajuanPac" (
    "id" TEXT NOT NULL,
    "nomorSurat" TEXT NOT NULL,
    "penerima" "Organisasi" NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "keperluan" TEXT NOT NULL,
    "deskripsi" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "alasanPenolakan" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileMime" TEXT,
    "fileSize" INTEGER,
    "userId" TEXT NOT NULL,
    "periodePacId" TEXT NOT NULL,
    "periodeCabangId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PengajuanPac_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PengajuanPac_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "PengajuanPac_periodePacId_fkey" FOREIGN KEY ("periodePacId") REFERENCES "Periode"("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "PengajuanPac_periodeCabangId_fkey" FOREIGN KEY ("periodeCabangId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PengajuanPac_userId_idx" ON "PengajuanPac"("userId");

-- CreateIndex
CREATE INDEX "PengajuanPac_periodePacId_idx" ON "PengajuanPac"("periodePacId");

-- CreateIndex
CREATE INDEX "PengajuanPac_periodeCabangId_idx" ON "PengajuanPac"("periodeCabangId");
