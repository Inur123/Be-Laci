-- DropForeignKey
ALTER TABLE "PengajuanPac" DROP CONSTRAINT "PengajuanPac_periodePacId_fkey";

-- DropForeignKey
ALTER TABLE "PengajuanPac" DROP CONSTRAINT "PengajuanPac_userId_fkey";

-- AddForeignKey
ALTER TABLE "PengajuanPac" ADD CONSTRAINT "PengajuanPac_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PengajuanPac" ADD CONSTRAINT "PengajuanPac_periodePacId_fkey" FOREIGN KEY ("periodePacId") REFERENCES "Periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
