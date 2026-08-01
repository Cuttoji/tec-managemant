/*
  Warnings:

  - You are about to drop the column `rawData` on the `ImportLog` table. All the data in the column will be lost.
  - The `status` column on the `MaintenanceLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `filePath` to the `ImportLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED');

-- AlterTable
ALTER TABLE "ImportLog" DROP COLUMN "rawData",
ADD COLUMN     "filePath" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MaintenanceLog" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "loanerAssetId" INTEGER,
ADD COLUMN     "loanerPageEnd" INTEGER,
ADD COLUMN     "loanerPageStart" INTEGER,
ADD COLUMN     "partReplacedAt" TIMESTAMP(3),
ADD COLUMN     "symptom" TEXT,
ADD COLUMN     "totalPageAtRepair" INTEGER,
ADD COLUMN     "usedLoaner" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "status",
ADD COLUMN     "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'TECHNICIAN';

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permission" TEXT NOT NULL,
    "grantedBy" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permission_key" ON "UserPermission"("userId", "permission");

-- CreateIndex
CREATE INDEX "MaintenanceLog_assetId_status_idx" ON "MaintenanceLog"("assetId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceLog_technicianId_status_idx" ON "MaintenanceLog"("technicianId", "status");

-- CreateIndex
CREATE INDEX "MaintenanceLog_status_idx" ON "MaintenanceLog"("status");

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_loanerAssetId_fkey" FOREIGN KEY ("loanerAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
