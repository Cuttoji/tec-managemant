/*
  Warnings:

  - You are about to drop the column `createdBy` on the `MaintenanceLog` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `MaintenanceLog` table. All the data in the column will be lost.
  - Added the required column `dispatcherId` to the `MaintenanceLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issueDetails` to the `MaintenanceLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MaintenanceLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MaintenanceLog" DROP COLUMN "createdBy",
DROP COLUMN "notes",
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dispatcherId" INTEGER NOT NULL,
ADD COLUMN     "issueDetails" TEXT NOT NULL,
ADD COLUMN     "repairDetails" TEXT,
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "technicianId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "MaintenanceLog_assetId_status_idx" ON "MaintenanceLog"("assetId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceLog_technicianId_status_idx" ON "MaintenanceLog"("technicianId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceLog_status_idx" ON "MaintenanceLog"("status");

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_dispatcherId_fkey" FOREIGN KEY ("dispatcherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
