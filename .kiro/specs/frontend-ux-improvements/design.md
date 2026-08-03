# Design: Frontend UX Improvements

## Architecture Overview

เพิ่ม/แก้ไขใน 3 layer โดยไม่เปลี่ยน backend และไม่เพิ่ม npm packages:
1. **Global providers** — `ToastProvider` ใน `_app.tsx`
2. **Shared components** — `Toast`, `ConfirmDialog`, `Skeleton`, `TopBar`
3. **Page-level changes** — replace alert/confirm, add skeleton, add filters

---

## 1. Toast Notification System
