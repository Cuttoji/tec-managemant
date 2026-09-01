-- CreateTable: AuditLog
CREATE TABLE "AuditLog" (
    "id"         SERIAL       NOT NULL,
    "userId"     INTEGER,
    "action"     TEXT         NOT NULL,
    "targetType" TEXT         NOT NULL,
    "targetId"   INTEGER      NOT NULL,
    "before"     JSONB,
    "after"      JSONB,
    "ip"         TEXT,
    "userAgent"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");
CREATE INDEX "AuditLog_userId_idx"              ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx"           ON "AuditLog"("createdAt");
