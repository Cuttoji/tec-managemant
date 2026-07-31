-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ImportLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "rawData" TEXT NOT NULL,
    "parsed" TEXT NOT NULL,
    "unmatchedCount" INTEGER NOT NULL,
    "createdBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportLog_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ImportLog" ("createdAt", "filename", "id", "parsed", "rawData", "unmatchedCount") SELECT "createdAt", "filename", "id", "parsed", "rawData", "unmatchedCount" FROM "ImportLog";
DROP TABLE "ImportLog";
ALTER TABLE "new_ImportLog" RENAME TO "ImportLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
