MowList Customer Dashboard Pages — DROP-IN FILES
==================================================

Drag each file into the matching location in your mowlist/ project, replacing the old version:

  MyServices.tsx       ->  src/pages/dashboard/MyServices.tsx
  TrackService.tsx     ->  src/pages/dashboard/TrackService.tsx
  PaymentMethods.tsx   ->  src/pages/dashboard/PaymentMethods.tsx
  AccountSettings.tsx  ->  src/pages/dashboard/AccountSettings.tsx

After dropping in, Vite should hot-reload. Hard refresh the browser (Cmd+Shift+R).

What changed:
  - MyServices: shows your real bookings, with skip/cancel actions on recurring ones
  - TrackService: shows active/in-progress service with live status timeline
  - PaymentMethods: clean "coming soon" message (no payments table in DB yet)
  - AccountSettings: loads/saves real profile + address from database
