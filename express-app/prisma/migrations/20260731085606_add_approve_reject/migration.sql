-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assetTag" TEXT,
    "serialNumber" TEXT,
    "type" TEXT NOT NULL,
    "locationId" INTEGER,
    "approvedBy" INTEGER,
    "approvedAt" DATETIME,
    "rejectedBy" INTEGER,
    "rejectedAt" DATETIME,
    "purchaseDate" DATETIME,
    "cpu" TEXT,
    "ramGb" INTEGER,
    "storageType" TEXT,
    "storageGb" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "retiredAt" DATETIME,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Asset_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("assetTag", "cpu", "createdAt", "id", "isActive", "locationId", "needsReview", "purchaseDate", "ramGb", "retiredAt", "serialNumber", "storageGb", "storageType", "type") SELECT "assetTag", "cpu", "createdAt", "id", "isActive", "locationId", "needsReview", "purchaseDate", "ramGb", "retiredAt", "serialNumber", "storageGb", "storageType", "type" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE UNIQUE INDEX "Asset_assetTag_key" ON "Asset"("assetTag");
CREATE UNIQUE INDEX "Asset_serialNumber_key" ON "Asset"("serialNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
