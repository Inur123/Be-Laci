-- CreateTable
CREATE TABLE "Anggota" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "organisasi" "Organisasi" NOT NULL,
    "jenisKelamin" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "alamat" TEXT,
    "noHp" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "image" TEXT,
    "userId" TEXT NOT NULL,
    "periodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anggota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Anggota_userId_idx" ON "Anggota"("userId");

-- CreateIndex
CREATE INDEX "Anggota_periodeId_idx" ON "Anggota"("periodeId");

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id");

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id");
