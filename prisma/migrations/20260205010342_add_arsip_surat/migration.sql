-- CreateTable
CREATE TABLE "ArsipSurat" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "nomor" TEXT,
    "tanggal" TIMESTAMP(3),
    "kategori" TEXT,
    "deskripsi" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileMime" TEXT,
    "fileSize" INTEGER,
    "userId" TEXT NOT NULL,
    "periodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArsipSurat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArsipSurat_userId_idx" ON "ArsipSurat"("userId");

-- CreateIndex
CREATE INDEX "ArsipSurat_periodeId_idx" ON "ArsipSurat"("periodeId");

-- AddForeignKey
ALTER TABLE "ArsipSurat" ADD CONSTRAINT "ArsipSurat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArsipSurat" ADD CONSTRAINT "ArsipSurat_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
