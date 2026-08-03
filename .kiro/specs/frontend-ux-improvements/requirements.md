# Requirements: Frontend UX Improvements

## Overview

ปรับปรุง UX ของ TechManage frontend ใน 4 ด้าน:
1. Toast notification แทน native `alert()` / `confirm()`
2. Responsive layout รองรับหน้าจอเล็ก
3. Loading skeleton แทน spinner เดิม
4. Filter/sort ที่ละเอียดขึ้นในหน้า Assets และ Maintenance

---

## Requirement 1 — Toast Notification System

### User Stories
- **US-1.1** As a user เมื่อทำ action สำเร็จ ฉันต้องการเห็น toast notification สีเขียว
- **US-1.2** As a user เมื่อเกิด error ฉันต้องการเห็น toast notification สีแดง แทน native browser `alert()`
- **US-1.3** As a user เมื่อต้องการยืนยัน destructive action ฉันต้องการเห็น confirm dialog ที่ styled ภายใน UI
- **US-1.4** Toast หายไปอัตโนมัติใน 4 วินาที และมีปุ่ม × ปิดได้ทันที

### Acceptance Criteria
- **AC-1.1** มี `ToastProvider` ใน `_app.tsx` และ `useToast()` hook ที่ทุก page ใช้ได้
- **AC-1.2** `alert(err.message)` ทุกจุดถูกแทนด้วย `toast.error(err.message)`
- **AC-1.3** `confirm()` ทุกจุดถูกแทนด้วย `ConfirmDialog` component
- **AC-1.4** Toast 3 variant: `success`, `error`, `info`
- **AC-1.5** Toast stack สูงสุด 3 อัน มี slide-in/out animation

---

## Requirement 2 — Responsive Layout

### User Stories
- **US-2.1** As a mobile user ฉันต้องการเข้าถึงทุกหน้าได้โดยไม่ต้อง scroll แนวนอน
- **US-2.2** As a mobile user ฉันต้องการให้ sidebar ซ่อน/แสดงได้ด้วยปุ่ม hamburger
- **US-2.3** As a mobile user ฉันต้องการให้ตารางเลื่อน horizontal ได้

### Acceptance Criteria
- **AC-2.1** ที่ `max-width: 768px` sidebar ซ่อนเป็น overlay drawer และมี hamburger button
- **AC-2.2** ที่ `max-width: 768px` login page ซ่อน left branding panel
- **AC-2.3** `.form-grid-2` และ `.form-grid-3` collapse เป็น 1 column ที่ `max-width: 600px`
- **AC-2.4** layout 2 คอลัมน์ (import, asset detail) collapse เป็น 1 คอลัมน์บน mobile

---

## Requirement 3 — Loading Skeleton

### User Stories
- **US-3.1** As a user ขณะรอโหลด ฉันต้องการเห็น skeleton placeholder แทน spinner กลางหน้า
- **US-3.2** Skeleton มี shimmer animation

### Acceptance Criteria
- **AC-3.1** มี `<Skeleton>` component รับ `width`, `height`, `rows` props
- **AC-3.2** มี `<TableSkeleton rows>` สำหรับแทน table loading
- **AC-3.3** หน้า Assets, Maintenance, Users, Locations ใช้ skeleton แทน spinner
- **AC-3.4** Skeleton มี `@keyframes shimmer` ใน globals.css

---

## Requirement 4 — Advanced Filters

### User Stories
- **US-4.1** As a user ค้นหา asset ด้วย Asset Tag หรือ Serial Number นอกเหนือจาก model
- **US-4.2** As a user กรอง assets ตาม type (PRINTER/COMPUTER/SCANNER/OTHER)
- **US-4.3** As a user กรอง maintenance ตามช่วงวันที่
- **US-4.4** As a user เห็น active filter badges ที่กดลบได้

### Acceptance Criteria
- **AC-4.1** หน้า Assets มี search ที่ match กับ model, assetTag, serialNumber
- **AC-4.2** หน้า Assets มี dropdown กรอง `type`
- **AC-4.3** หน้า Maintenance มี date range picker (from/to)
- **AC-4.4** Active filters แสดงเป็น badge + ปุ่ม ×
- **AC-4.5** Filter state sync กับ URL query params

---

## Non-Functional Requirements
- **NFR-1** ไม่เพิ่ม npm dependency ใหม่
- **NFR-2** TypeScript strict
- **NFR-3** Accessible labels บน interactive elements
- **NFR-4** ไม่ break functionality เดิม
- **NFR-5** Backend API ไม่ต้องเปลี่ยน

## Out of Scope
- Dark mode, Analytics dashboard, PWA
