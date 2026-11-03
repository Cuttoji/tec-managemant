# HANDOFF.md

> เอกสารนี้เขียนจากสถานะจริงของ repo ปัจจุบันเท่านั้น โดยอ้างอิงจากไฟล์ใน repo และผลลัพธ์คำสั่งที่รันจริงในเครื่อง หากไม่แน่ใจ/ยังไม่ตรวจพบ จะระบุว่า “ไม่ทราบ/ยังไม่ได้ตรวจ” และไม่สรุปว่าทำเสร็จเกินกว่าที่ตรวจได้

## 0. สถานะตรวจจริงล่าสุด (verified state)

| ตรวจ | คำสั่ง | ผลลัพธ์ |
| --- | --- | --- |
| Frontend build | `cd frontend && npm run build` | ✅ ผ่าน (Next.js 16.3.5 compiled successfully) |
| Frontend lint | `cd frontend && npm run lint` | ❌ ไม่ผ่านใน repo ปัจจุบัน: `next lint` error `Invalid project directory provided` |
| Prisma validate | `cd frontend && $env:DATABASE_URL='postgresql://appuser:apppassword@localhost:5432/repair_tracking_dev'; npx prisma validate --schema=prisma/schema.prisma` | ✅ ผ่าน |
| Backend tests | `cd express-app && npm test -- --runInBand` | ⚠️ ผ่าน 8 suites / 1 suite fail: `tests/assetsController.test.js` |
| เปิดหน้าเว็บ | http://localhost:3002 | ✅ โหลดหน้า login ได้และแสดง “เข้าสู่ระบบ” |

---

## 1. ภาพรวมระบบ

### 1.1 ระบบนี้คืออะไร
ระบบนี้คือแอปจัดการทรัพย์สิน/ครุภัณฑ์และงานซ่อมสำหรับศูนย์บริการ/หน่วยงานที่มีอุปกรณ์หลายประเภท โดยรวมถึง:

- จัดการ Asset / Printer / Computer / Scanner / Device
- บันทึกและติดตาม Maintenance Ticket / Work Order
- จัดการ User / Technician / Admin / permissions
- นำเข้าข้อมูลเครื่องจาก BRAdmin CSV/XML
- ตรวจสอบและสรุปการเปลี่ยน Toner / Drum รายเดือนและตามสถานที่
- อัปโหลดแผนผังอาคาร/ห้อง/สถานที่ติดตั้ง และวางเครื่องบนแผนผัง (มี map image upload แต่ไม่มีการเก็บ posX/posY ที่ตรวจพบใน repo ปัจจุบัน)
- มีการยืมเครื่องสำรอง (loaner asset) ในกระบวนการซ่อม

จากโค้ดจริง ระบบมีลักษณะเป็น “service operations + asset lifecycle tracking” มากกว่า pure asset inventory เท่านั้น ตัวชิ้นสำคัญที่เห็นคือ:

- [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts)
- [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts)
- [frontend/src/features/import/actions.ts](frontend/src/features/import/actions.ts)
- [frontend/src/features/printer-summary/queries.ts](frontend/src/features/printer-summary/queries.ts)
- [frontend/prisma/schema.prisma](frontend/prisma/schema.prisma)

### 1.2 Stack และเวอร์ชันที่ใช้จริง
จากไฟล์ package.json จริง:

- Root workspace: [package.json](package.json)
- Frontend: [frontend/package.json](frontend/package.json)
- Express app: [express-app/package.json](express-app/package.json)

เวอร์ชันที่ตรวจพบ:

- Next.js: `^16.3.5`
- React: `^18.3.1`
- TypeScript: `^5.4.5`
- Tailwind CSS: `^3.4.4`
- Prisma: `^5.13.0` (CLI), `@prisma/client` `^5.22.0`
- NextAuth: `^5.0.0-beta.19`
- zod: `^3.23.8`
- bcryptjs: `^2.4.3`
- Express: `^4.18.2`
- Jest: `^29.0.0`
- Supertest: `^7.2.2`
- PostgreSQL container: `postgres:16-alpine` จาก [docker-compose.yml](docker-compose.yml)

### 1.3 บทบาทผู้ใช้และสิทธิ์จริง
สิทธิ์ที่ปรากฏใน [frontend/src/lib/rbac.ts](frontend/src/lib/rbac.ts) / [frontend/src/lib/auth.ts](frontend/src/lib/auth.ts):

| บทบาท | สิทธิ์หลัก |
| --- | --- |
| ADMIN | `maintenance:claim`, `maintenance:complete`, `maintenance:edit`, `asset:edit`, `asset:approve`, `asset:retire`, `location:manage`, `user:manage`, `import:run` |
| TECHNICIAN | `maintenance:claim`, `maintenance:complete`, `maintenance:edit` |

การเช็กสิทธิ์ทำที่:

- [frontend/src/lib/rbac.ts](frontend/src/lib/rbac.ts)
- [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts)
- [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts)
- [frontend/src/features/users/actions.ts](frontend/src/features/users/actions.ts)
- [frontend/src/features/import/actions.ts](frontend/src/features/import/actions.ts)

Route-level protection จริง ๆ:

- [frontend/src/middleware.ts](frontend/src/middleware.ts): `/login` และ `/register` public, `/users` และ `/audit-logs` admin-only
- [frontend/src/app/(dashboard)/layout.tsx](frontend/src/app/(dashboard)/layout.tsx): ทุกหน้าใน dashboard ต้อง login ก่อน

---

## 2. สถานะความคืบหน้า (ตามฟีเจอร์)

| ฟีเจอร์ | สถานะ | ไฟล์หลักที่เกี่ยวข้อง | เกณฑ์ผ่านที่ตรวจแล้วหรือยัง | หมายเหตุ |
| --- | --- | --- | --- | --- |
| Auth + login + session | เสร็จ | [frontend/src/lib/auth.ts](frontend/src/lib/auth.ts), [frontend/src/middleware.ts](frontend/src/middleware.ts), [frontend/src/app/login/page.tsx](frontend/src/app/login/page.tsx) | ✅ build ผ่าน, ✅ เปิดหน้า login ได้, ✅ demo login verified (`newtech@demo.com` => password valid) | หน้า `/login` ปรากฏและ redirect ถูกต้อง |
| Dashboard + protected routes | เสร็จ | [frontend/src/app/(dashboard)/layout.tsx](frontend/src/app/(dashboard)/layout.tsx) | ✅ build ผ่าน, ✅ browser route render login protected | `/dashboard` redirect ถ้าไม่ได้ login |
| Maintenance tickets workflow | เสร็จ | [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts), [frontend/src/features/tickets/queries.ts](frontend/src/features/tickets/queries.ts) | ✅ build ผ่าน, ✅ backend maintenance tests pass | มี claim / complete / edit / review / add component |
| Asset management | เสร็จ | [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts), [frontend/src/features/assets/queries.ts](frontend/src/features/assets/queries.ts) | ✅ build ผ่าน, ⚠️ backend asset test 1 case fail | มี approve/reject/retire/update/create |
| User management + permissions | เสร็จ | [frontend/src/features/users/actions.ts](frontend/src/features/users/actions.ts) | ✅ build ผ่าน, ⚠️ ไม่ได้ run UI test แบบครบ | admin can create/update/deactivate/grant/revoke permission |
| BRAdmin CSV/XML import | เสร็จ | [frontend/src/features/import/actions.ts](frontend/src/features/import/actions.ts), [frontend/src/features/import/bradmin-parser.ts](frontend/src/features/import/bradmin-parser.ts) | ✅ tests: `tests/bradminCsvParser.test.js`, `tests/bradminCsvSanitize.test.js`, `tests/importController.test.js` pass | upsert by serial, create page counters |
| Printer summary / toner-drum report | เสร็จ | [frontend/src/features/printer-summary/queries.ts](frontend/src/features/printer-summary/queries.ts), [frontend/src/app/(dashboard)/printer-summary/page.tsx](frontend/src/app/(dashboard)/printer-summary/page.tsx) | ✅ build ผ่าน, ✅ UI route exists | สรุป Toner/Drum มี chart + counts |
| Location map upload | ทำบางส่วน | [frontend/src/features/locations/actions.ts](frontend/src/features/locations/actions.ts), [frontend/src/app/(dashboard)/locations/page.tsx](frontend/src/app/(dashboard)/locations/page.tsx) | ✅ build ผ่าน | มี `mapImageUrl`, upload base64; ยังไม่พบ `posX`/`posY` |
| Floor plan position / “แจ้งตำแหน่งไม่ตรง” | ยังไม่ได้ตรวจพบ | ไม่พบใน repo | ไม่ทราบ/ยังไม่ได้ตรวจ | คำอธิบายนี้ไม่ปรากฏในโค้ดที่ตรวจได้ |
| ConsumableChange model / tracking model | ไม่พบใน repo | [frontend/prisma/schema.prisma](frontend/prisma/schema.prisma) | ไม่ทราบ/ยังไม่ได้ตรวจ | โค้ดใช้ `ComponentLog` + printer summary แทน |
| Express legacy API | ทำบางส่วน | [express-app/src/index.js](express-app/src/index.js), [express-app/src/routes/auth.js](express-app/src/routes/auth.js) | ⚠️ jest: 8 pass, 1 fail | มีไฟล์/route backend แต่ app หลักคือ Next.js |
| Lint repo | ยังไม่ผ่าน | [frontend/package.json](frontend/package.json) | ❌ `npm run lint` fail | เนื่องจาก script `next lint` ใน Next 16 ปัจจุบันมีปัญหา |

---

## 3. โครงสร้างโปรเจกต์

### 3.1 โฟลเดอร์สำคัญ

```text
.
├── docker-compose.yml
├── .env
├── .env.example
├── package.json
├── README.md
├── project_info__1.md
├── HANDOFF.md  <- เอกสารนี้
├── frontend/
│   ├── .env.local
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── middleware.ts
│   │   └── types/
│   └── scripts/
├── express-app/
│   ├── package.json
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   └── scripts/
├── mobile/
│   └── Expo app scaffold
└── node_modules/
```

### 3.2 หน้าจอ/route ที่มีจริง
จากผล build จริง:

| Route | สิทธิ์/สถานะ |
| --- | --- |
| `/` | redirect ไป `/dashboard` ถ้า login, ถ้าไม่ login redirect `/login` |
| `/login` | public |
| `/register` | public |
| `/dashboard` | ต้อง login |
| `/assets` | ต้อง login |
| `/assets/[id]` | ต้อง login |
| `/tickets` | ต้อง login |
| `/review` | ต้อง login |
| `/printer-summary` | ต้อง login |
| `/import` | ต้อง login + permission `import:run` ที่ action level |
| `/locations` | ต้อง login + permission `location:manage` สำหรับการแก้ไข |
| `/users` | ต้อง login + admin-only ที่ middleware |
| `/audit-logs` | ต้อง login + admin-only ที่ middleware |
| `/api/auth/[...nextauth]` | NextAuth endpoints |
| `/api/auth/register` | public |
| `/api/assets`, `/api/locations`, `/api/maintenance`, `/api/users` | API routes |

หมายเหตุ: middleware มีการปกป้อง route แบบ `adminOnlyPaths` สำหรับ `/users` และ `/audit-logs` เท่านั้น; ส่วน action-level permission จะคุมหรือเช็กอีกชั้นใน server action.

### 3.3 Server Actions ที่มีจริง
จาก grep จริงใน [frontend/src/features](frontend/src/features):

| Server Action | ไฟล์ | สิทธิ์ที่ต้องมี | ทำอะไร |
| --- | --- | --- | --- |
| `createAssetAction` | [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts) | ADMIN | สร้าง asset ใหม่ |
| `updateAssetAction` | [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts) | `asset:edit` | อัปเดต asset |
| `retireAssetAction` | [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts) | `asset:retire` | ตั้ง isActive false + retiredAt |
| `approveAssetAction` | [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts) | `asset:approve` | approve asset ที่เข้าตรวจ review |
| `rejectAssetAction` | [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts) | `asset:approve` | reject asset และปิดใช้งาน |
| `createLocationAction` | [frontend/src/features/locations/actions.ts](frontend/src/features/locations/actions.ts) | `location:manage` | สร้าง location |
| `updateLocationAction` | [frontend/src/features/locations/actions.ts](frontend/src/features/locations/actions.ts) | `location:manage` | อัปเดต location |
| `deleteLocationAction` | [frontend/src/features/locations/actions.ts](frontend/src/features/locations/actions.ts) | ADMIN | ลบ location แต่บล็อกถ้ามี asset ที่ใช้อยู่ |
| `uploadLocationMapAction` | [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts) + [frontend/src/features/locations/actions.ts](frontend/src/features/locations/actions.ts) | `location:manage` | อัปโหลดแผนที่/ภาพ map |
| `createTicketAction` | [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts) | ADMIN | สร้าง ticket ใหม่ |
| `claimTicketAction` | [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts) | `maintenance:claim` | รับงานซ่อม |
| `completeTicketAction` | [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts) | `maintenance:complete` | ปิดงาน / คำนวณอัปเดต repair info |
| `editRepairDetailsAction` | [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts) | `maintenance:edit` | แก้ไขรายละเอียดงาน |
| `reviewTicketAction` | [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts) | ADMIN | approve/reject ผลงานซ่อม |
| `addComponentAction` | [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts) | ต้อง login (ไม่พบ admin check) | เพิ่ม component part/quantity |
| `importBrAdminCsvAction` | [frontend/src/features/import/actions.ts](frontend/src/features/import/actions.ts) | `import:run` | นำเข้า CSV BRAdmin และ upsert asset |
| `getImportLogsAction` | [frontend/src/features/import/actions.ts](frontend/src/features/import/actions.ts) | login | อ่านประวัติ import |
| `createUserAction` | [frontend/src/features/users/actions.ts](frontend/src/features/users/actions.ts) | ADMIN | สร้าง user ใหม่ |
| `updateUserAction` | [frontend/src/features/users/actions.ts](frontend/src/features/users/actions.ts) | ADMIN | แก้ไข user |
| `deactivateUserAction` | [frontend/src/features/users/actions.ts](frontend/src/features/users/actions.ts) | ADMIN | ปิดใช้งาน user แต่บล็อกตัวเอง |
| `grantPermissionAction` | [frontend/src/features/users/actions.ts](frontend/src/features/users/actions.ts) | ADMIN | เพิ่ม permission ต่อ user |
| `revokePermissionAction` | [frontend/src/features/users/actions.ts](frontend/src/features/users/actions.ts) | ADMIN | ลบ permission |

---

## 4. ฐานข้อมูล

### 4.1 Prisma schema ที่ใช้งานหลัก
ไฟล์ที่ใช้งานจริงใน app คือ [frontend/prisma/schema.prisma](frontend/prisma/schema.prisma)

| Model | ความหมาย | ฟิลด์สำคัญ | ความสัมพันธ์/Index |
| --- | --- | --- | --- |
| User | ผู้ใช้งานระบบ | `id`, `name`, `email`, `passwordHash`, `role`, `primarySkill`, `isActive` | `permissions`, `auditLogs`, `maintenanceLogs` และ relation กับ `approvedAssets`, `rejectedAssets` |
| UserPermission | permission per user | `userId`, `permission`, `grantedBy`, `grantedAt` | unique `[userId, permission]` |
| Location | สถานที่/ห้อง/อาคาร | `name`, `building`, `floor`, `mapImageUrl` | มีหลาย `Asset` |
| Asset | ทรัพย์สิน/เครื่อง | `assetTag`, `serialNumber`, `type`, `model`, `locationId`, `status flags`, `review flags` | unique serial + assetTag, index on type/isActive/locationId/needsReview |
| AssetImage | รูปภาพของ asset | `assetId`, `url`, `caption`, `sortOrder` | index on assetId |
| PageCounterLog | log จำนวนหน้า/total page | `assetId`, `total`, `source`, `recordedAt` | index assetId+recordedAt |
| MaintenanceLog | ใบงานซ่อม/maintenance | `assetId`, `dispatcherId`, `technicianId`, `status`, `issueDetails`, `repairDetails`, `usedLoaner`, `loanerAssetId`, timestamps | indexes status, assetId+status, technicianId+status, createdAt |
| ComponentLog | ชิ้นส่วนที่เปลี่ยนใน ticket | `maintenanceId`, `part`, `quantity`, `pageAtReplacement` | index maintenanceId |
| ImportLog | ประวัติการนำเข้า BRAdmin | `filename`, `filePath`, `parsed`, `unmatchedCount`, `createdBy` | tracked by user |
| AuditLog | log ทุกการเปลี่ยนแปลง | `userId`, `action`, `targetType`, `targetId`, `before`, `after`, `ip`, `userAgent` | index on targetType+targetId, userId, createdAt |

### 4.2 Enum และสถานะที่ใช้งานจริง
โค้ดใช้ String literals มากกว่า Prisma native enum เพราะ schema ไม่ประกาศ enum block ใน [frontend/prisma/schema.prisma](frontend/prisma/schema.prisma)

- Role: `ADMIN`, `TECHNICIAN`
- Maintenance status: `OPEN`, `IN_PROGRESS`, `COMPLETED`, `REVIEWED`
- Asset type: `PRINTER`, `COMPUTER`, `SCANNER`, `OTHER` (จริง ๆ ใช้ string อย่างหลวมใน code)

Mermaid สถานะ ticket:

```mermaid
stateDiagram-v2
    [*] --> OPEN
    OPEN --> IN_PROGRESS
    IN_PROGRESS --> COMPLETED
    COMPLETED --> REVIEWED
    COMPLETED --> OPEN: admin reject
    REVIEWED --> [*]
```

จากไฟล์จริง: [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts), [frontend/src/lib/rbac.ts](frontend/src/lib/rbac.ts)

### 4.3 Migration ที่มีจริง
มี migration จริง 2 กลุ่ม:

- [frontend/prisma/migrations/20261103032959_sync_schema/migration.sql](frontend/prisma/migrations/20261103032959_sync_schema/migration.sql)
- [express-app/prisma/migrations/20260918045230_init/migration.sql](express-app/prisma/migrations/20260918045230_init/migration.sql)

จาก repo ปัจจุบัน สถานะใช้ frontend schema เป็น primary schema สำหรับ app; express-app schema ดูเป็น legacy/duplicate และ drift บ้างไป.

### 4.4 วิธีรีเซ็ต/seed ข้อมูล
คำสั่งที่ใช้งานจริง/สามารถใช้ได้:

```bash
cd frontend
npm install
npm run seed
# หรือ node scripts/seedDemo.js
```

สำหรับฐานข้อมูล Postgres:

```bash
docker compose down -v
# แล้ว start ใหม่

docker compose up --build
```

หรือใช้ Prisma command: 

```bash
cd frontend
$env:DATABASE_URL='postgresql://appuser:apppassword@localhost:5432/repair_tracking_dev'
npx prisma migrate reset
npx prisma migrate dev
npm run seed
```

> ข้อสังเกต: Prisma CLI จะ fail หากไม่มี `DATABASE_URL` เหมือนที่เกิดขึ้นจริงตอน validate ก่อน

---

## 5. กฎธุรกิจที่ implement แล้ว

### 5.1 กฎที่เห็นชัดในโค้ด

1. รับงานซ่อมได้เฉพาะ `OPEN` และยังไม่ถูก assign
   - [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts)
   - `const result = await db.maintenanceLog.updateMany({ where: { id, status: 'OPEN', technicianId: null }, ... })`

2. ปิดงานซ่อมได้เฉพาะงานที่กำลัง `IN_PROGRESS` และ technician เป็นคนรับงาน
   - [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts)

3. Admin review ต้อง approve/reject ก่อนที่เรื่องจะได้ `REVIEWED`
   - [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts)
   - ถ้า reject จะ reset งานกลับเป็น `OPEN` และเคลียร์ข้อมูลซ่อมเก่าบางส่วน

4. แก้ไขรายละเอียดงานได้เฉพาะ technician ที่ถูก assign หรือ admin
   - [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts)

5. ไม่ให้ลบ location ถ้ายังมี asset ใช้งานอยู่
   - [frontend/src/features/locations/actions.ts](frontend/src/features/locations/actions.ts)
   - `const assetCount = await db.asset.count({ where: { locationId: id } })`

6. ไม่ให้ปิดการใช้งานตัวเองได้
   - [frontend/src/features/users/actions.ts](frontend/src/features/users/actions.ts)

7. Import BRAdmin CSV/XML uses `serial` as key and upserts asset; pageCounterLog จะถูกสร้างต่อ
   - [frontend/src/features/import/actions.ts](frontend/src/features/import/actions.ts)

8. Asset review workflow: `needsReview` / `approvedBy` / `rejectedBy` / `isActive`
   - [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts)

### 5.2 กฎที่ spec มีแต่ยังไม่ได้บังคับในโค้ดที่ตรวจพบ

- “ห้ามลบใบงานซ่อม” ไม่พบการ implement delete สำหรับ maintenance ใน repo ที่ตรวจได้
- “IP Address unique” ไม่พบ unique constraint หรือ validation สำหรับ `ip` ใน schema
- “posX/posY ตำแหน่งบน floor plan” ไม่พบใน repo โดยยืนยันจาก grep และ file content
- “ConsumableChange model” ไม่พบ; repo ใช้ `ComponentLog` + report summary แทน
- “การคำนวณหน้าพิมพ์ต่อถาด/ต่ออุปกรณ์” มีใน report แต่ไม่มี model ระดับ first-class ชื่อ `ConsumableChange` ตามคำอธิบายที่ต้องการ

---

## 6. ฟีเจอร์พิเศษ

### 6.1 นำเข้า BRAdmin CSV
โค้ดจริงที่เกี่ยวข้อง:

- [frontend/src/features/import/actions.ts](frontend/src/features/import/actions.ts)
- [frontend/src/features/import/bradmin-parser.ts](frontend/src/features/import/bradmin-parser.ts)
- [express-app/src/services/bradminCsvParser.js](express-app/src/services/bradminCsvParser.js)

สิ่งที่ตรวจพบจริง:

- แมปคอลัมน์จาก header โดยดู keyword เช่น `serial`, `node`, `hostname`, `model`, `page`, `location`, `ip`
- มีการตัด BOM ที่ express-app parser: `if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1)`
- ใช้ `serialNumber` เป็น unique key สำหรับ upsert
- `IP`/`MAC` จะถูก parse แต่ schema ไม่ใช่ unique constraint; ไม่พบ rule ว่า IP ต้อง unique
- มีเทสต์จริงใน:
  - [express-app/tests/bradminCsvParser.test.js](express-app/tests/bradminCsvParser.test.js)
  - [express-app/tests/bradminCsvSanitize.test.js](express-app/tests/bradminCsvSanitize.test.js)
  - [express-app/tests/importController.test.js](express-app/tests/importController.test.js)

> รูปแบบวันที่ `M/D/YYYY` ไม่พบใน repo ที่ตรวจได้; ไม่มี logic สำหรับ parse วันที่แบบนั้นใน BRAdmin import code ปัจจุบัน

### 6.2 แผนผังตำแหน่ง
โค้ดจริงที่ตรวจพบ:

- [frontend/src/features/locations/actions.ts](frontend/src/features/locations/actions.ts)
- [frontend/prisma/schema.prisma](frontend/prisma/schema.prisma) มี `Location.mapImageUrl`
- [frontend/src/app/(dashboard)/locations/page.tsx](frontend/src/app/(dashboard)/locations/page.tsx)

สิ่งที่พบจริง:

- มีการอัปโหลดแผนที่ (floor map) เป็นรูปภาพ/URL
- มี `building` และ `floor` ในโมเดล `Location`
- แต่ไม่พบฟิลด์ `posX`, `posY`, `mode`, หรือข้อความ “แจ้งตำแหน่งไม่ตรง” ใน repo

ดังนั้นรูปแบบ “ตำแหน่งบนแผนผังแบบเปอร์เซ็นต์และโหมดแก้ไข/ดู” ยังไม่ปรากฏใน code ปัจจุบัน

### 6.3 บันทึกและสรุปเปลี่ยน toner/drum
โค้ดจริงที่ตรวจพบ:

- [frontend/src/features/printer-summary/queries.ts](frontend/src/features/printer-summary/queries.ts)
- [frontend/src/app/(dashboard)/printer-summary/page.tsx](frontend/src/app/(dashboard)/printer-summary/page.tsx)
- [frontend/prisma/schema.prisma](frontend/prisma/schema.prisma) `ComponentLog.part`, `quantity`, `pageAtReplacement`
- [frontend/prisma/seed.js](frontend/prisma/seed.js) มี sample items เช่น Toner / Drum

จากโค้ดจริง:

- สรุปจะมองหา part names ที่มีคำว่า `toner` หรือ `drum`
- คำนวณจำนวนแบบรวมและรายเดือน
- รายงานแยก site/model ได้จาก `model` และ `site` logic ใน query

> Model ชื่อ `ConsumableChange` ไม่ปรากฏ; ปัจจุบันระบบใช้ `ComponentLog` + Report query เป็นตัวแทน

---

## 7. วิธีรันและทดสอบ

### 7.1 ตั้งค่าเครื่องใหม่ (จากสถานะจริง)
1. เปิด root repo และตรวจ `.env` / `.env.local`
2. ตรวจว่ามี `DATABASE_URL` ใน [frontend/.env.local](frontend/.env.local)
3. หากไม่มี ให้ใส่ค่า:

```env
DATABASE_URL="postgresql://appuser:apppassword@localhost:5432/repair_tracking_dev"
AUTH_SECRET="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3002"
```

4. เริ่ม Postgres:

```bash
docker compose up -d postgres
```

5. migrate + seed:

```bash
cd frontend
$env:DATABASE_URL='postgresql://appuser:apppassword@localhost:5432/repair_tracking_dev'
npx prisma migrate dev
npm run seed
```

6. รัน frontend:

```bash
cd frontend
npm run dev
```

7. เปิดหน้าเว็บ: http://localhost:3002

### 7.2 บัญชีทดสอบที่ seed ไว้
จาก [frontend/prisma/seed.js](frontend/prisma/seed.js) และผล seed จริงที่รันแล้ว:

| อีเมล | บทบาท | รหัสผ่าน (demo) |
| --- | --- | --- |
| `admin@demo.com` | ADMIN | `demo1234` |
| `tech@demo.com` | TECHNICIAN | `demo1234` |
| `tech2@demo.com` | TECHNICIAN | `demo1234` |
| `newtech@demo.com` | TECHNICIAN | `demo1234` |

> ผลตรวจจริงยืนยัน `newtech@demo.com` password valid เป็น `true`

### 7.3 คำสั่ง build / lint / test และผลลัพธ์ล่าสุด

| คำสั่ง | ผลลัพธ์ |
| --- | --- |
| `cd frontend && npm run build` | ✅ ผ่าน |
| `cd frontend && npm run lint` | ❌ ล้ม: `next lint` error due invalid project directory |
| `cd frontend && $env:DATABASE_URL='postgresql://appuser:apppassword@localhost:5432/repair_tracking_dev'; npx prisma validate --schema=prisma/schema.prisma` | ✅ ผ่าน |
| `cd express-app && npm test -- --runInBand` | ⚠️ 8 suites pass, 1 suite fail (`tests/assetsController.test.js`) |
| เปิด http://localhost:3002 | ✅ หน้า login render ได้ |

---

## 8. การตัดสินใจและเหตุผล

### 8.1 ทำไมใช้แอปเดียว Next.js แทนแยก Express
จาก repo ปัจจุบัน:

- Frontend Next.js มี App Router, server actions, auth, Prisma database access, route handlers ครบ
- มี [express-app](express-app) เป็น backend แบบแยกแยก แต่ชัดเจนว่า app หลักคือ Next.js เพราะ build/route/output ใช้ frontend package เป็น runtime app
- `docker-compose.yml` also runs `frontend` as `app` service, not express-app

ดังนั้นการเลือกใช้ Next.js เป็น app หลักถูกต้องในบริบท repo ปัจจุบัน แม้มี Express app ก็ตาม

### 8.2 ทำไมใช้ Server Actions
สิ่งที่เห็นจริง:

- [frontend/src/features/*/actions.ts](frontend/src/features) มี action หลักต่อ feature
- Auth/session checks และ audit log ถูกย้ายใกล้โค้ด business logic
- actions กระจายตาม feature ช่วยให้ DB + RBAC + revalidate cache ทำในที่เดียว

### 8.3 ทำไมใช้แผนผังรูปแทนแผนที่ภูมิศาสตร์
จาก schema จริง:

- `Location` มี `name`, `building`, `floor`, `mapImageUrl` เท่านั้น
- ไม่มี lat/long, geospatial fields, หรือ GIS metadata
- ดังนั้น “แผนผังรูป (floor plan)” เป็นตัวเลือกที่สอดคล้องกับข้อมูลจริงมากกว่า GIS stack

### 8.4 สิ่งที่ตัดออกโดยตั้งใจ (out of scope)
จากการค้นหา code จริง มีประเด็นต่อไปนี้ที่ยังไม่เห็นหรือยังไม่ได้ทำ:

- geospatial map / GPS locating
- unique IP enforcement
- explicit `ConsumableChange` model
- posX/posY floor coordinate tracking
- cloud storage for uploaded images (currently store as base64 data URL)
- full mobile parity with actual backend feature set

---

## 9. ปัญหาที่ค้างอยู่

### 9.1 Bug / issue ที่รู้ชัด

- `npm run lint` fail because Next 16 + `next lint` script is invalid in this repo state
- `express-app` backend test suite has 1 failing test: `tests/assetsController.test.js`
- Prisma CLI requires `DATABASE_URL` explicitly; without env command fails
- `Location.mapImageUrl` and asset image uploads are stored as base64 data URL, not object storage
- Legacy duplicate Prisma schemas between frontend and express-app can drift

### 9.2 TODO/FIXME ในโค้ด
จริง ๆ พบ 2 แหล่ง:

- [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts): `// TODO: Replace with Cloud Storage (R2/S3) upload when configured.`
- [frontend/src/features/locations/actions.ts](frontend/src/features/locations/actions.ts): `// TODO: Replace with Cloud Storage upload (R2/S3) when env vars are set.`

### 9.3 ความเสี่ยงด้านความปลอดภัย / ข้อมูล

- มีการเก็บ `passwordHash`, `email`, `serialNumber`, `assetTag` ใน database; ไฟล์ seed และ import data อาจมีข้อมูลที่ไม่ควร push หากเป็นข้อมูลจริงขององค์กร
- `mapImageUrl` เป็น data URL / base64 แบบ inline; ไม่ใช่ cloud storage ที่ควบคุม ACL
- `AuditLog.before/after` เก็บ JSON ข้อมูล; ต้องระวังไม่เก็บข้อมูลลูกค้า/เซ็นเซอร์เกินจำเป็น
- ยังไม่มีการตรวจสอบหรือยืนยันว่าผ่านการต้องเงื่อนไข `file upload` หรือ file sanitization อย่างเพียงพอ ที่ระดับ production

### 9.4 ข้อมูลตัวอย่างที่มีข้อมูลจริงขององค์กร
ไม่พบ evidence ว่าฐานข้อมูล repo ที่มีจริงเป็นข้อมูลจริงจากองค์กร; อย่างไรก็ตาม sample data และ import data ใน [express-app/imports](express-app/imports) ของ BRAdmin จะมี IP / serial / MAC / machine names ที่มีโอกาสเป็นข้อมูลจริงขององค์กร จึงควรถือว่า “ต้องไม่ push ขึ้น repo สาธารณะ” หากเป็นข้อมูลจริงจาก production

---

## 10. สิ่งที่ต้องทำต่อ (ordered priority)

| ลำดับ | งาน | เกณฑ์ผ่าน | หมายเหตุ |
| --- | --- | --- | --- |
| 1 | Fix failing backend test `assetsController.test.js` | backend `npm test` pass 100% | มีเคส filter model field fail ปัจจุบัน |
| 2 | Repair lint setup for Next 16 | `npm run lint` pass | แก้ script หรือ config ให้ใช้ ESLint แบบถูกต้อง |
| 3 | Standardize env config and Prisma commands | `DATABASE_URL` ตั้งชัด + `prisma validate` pass without manual env hack | ป้องกัน drift ต่อไป |
| 4 | Decide whether to keep or remove Express legacy app | route/test status, single source of truth defined | repo ปัจจุบันมี both frontend and express-app |
| 5 | Implement location map coordinate / floor plan editing requirement if needed | add `posX`/`posY` or remove requirement from roadmap | ยังไม่พบใน code |
| 6 | Move uploaded maps from base64 inline to object storage | production-safe storage solution configured | TODO exists in code |
| 7 | Add security hardening for uploaded files and customer data | validate file size/type, review PII exposure | risk remains |

---

## 11. คำสั่งเริ่มงานสำหรับ AI ตัวถัดไป

```text
อ่าน AGENTS.md และ HANDOFF.md แล้วทำ Task ถัดไปตามหัวข้อ 10
เริ่มจาก “Fix failing backend test assetsController.test.js”
อย่าทำงานที่ไม่เกี่ยวข้องกับ repo ปัจจุบัน
ใช้ข้อมูลจากโค้ดจริงเท่านั้น และระบุชัดว่าทำเสร็จผ่าน/ไม่ผ่านด้วย evidence จากคำสั่งจริง
```

---

## 12. สรุปสั้น ๆ

- แอปหลักเป็น Next.js + Prisma + Postgres; Express app คือ backup/legacy API
- Auth, RBAC, maintenance tickets, asset review, import BRAdmin, printer summary work in current repo
- Build front-end pass; lint fail; backend tests have 1 failing suite; Prisma validate passes when DATABASE_URL is set
- มี sample users และ demo credentials พร้อมใช้งาน
- จุดที่ยังไม่เสร็จ/ยังไม่ถูกใช้จริง: lint config, failing test, floor-plan coordinate feature, cloud storage for map upload

---

## 13. เอกสาร/ไฟล์อ้างอิงที่ควรอ่านต่อ

- [README.md](README.md)
- [package.json](package.json)
- [frontend/package.json](frontend/package.json)
- [frontend/prisma/schema.prisma](frontend/prisma/schema.prisma)
- [frontend/src/lib/auth.ts](frontend/src/lib/auth.ts)
- [frontend/src/lib/rbac.ts](frontend/src/lib/rbac.ts)
- [frontend/src/features/tickets/actions.ts](frontend/src/features/tickets/actions.ts)
- [frontend/src/features/assets/actions.ts](frontend/src/features/assets/actions.ts)
- [frontend/src/features/import/actions.ts](frontend/src/features/import/actions.ts)
- [frontend/src/features/printer-summary/queries.ts](frontend/src/features/printer-summary/queries.ts)
- [docker-compose.yml](docker-compose.yml)

