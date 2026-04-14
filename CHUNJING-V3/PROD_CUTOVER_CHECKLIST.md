# Production Cutover Checklist

## 1) High-risk items already fixed in this update
- `auth.html`: passwords are now stored as `passwordHash + passwordSalt` (no new plaintext password persistence).
- `auth.html`: legacy plaintext user records are migrated to hashed records on startup.
- `profile.html`: toast rendering no longer uses `innerHTML` with raw message text.
- Backup created on Desktop before changes.

## 2) Demo-only modules (must be removed/replaced before go-live)
- `auth.html`:
  - `LocalAuthAPI` (browser-side auth with localStorage).
  - `window.USE_LOCAL_MOCK` + `demoAuth` query switch.
  - hardcoded verification code `123456`.
  - test account initializer (`13800138000 / 123456`).
- `js/data.js`, `js/cloudbase.js`:
  - localStorage-first data persistence and mock data flows.
- `tools/scripts/check-*.js`:
  - mostly smoke/demo scripts, not compliance-grade security checks.

## 3) Go-live replacement targets
- Replace `LocalAuthAPI` with server-side auth API:
  - login/register/forgot password handled by backend.
  - token issuance and refresh handled by backend.
- Replace hardcoded SMS code flow with real OTP service.
- Replace localStorage user/order/wallet source with backend APIs.
- Keep only non-sensitive client cache in localStorage.

## 4) Pre-launch delete list (hard block)
- Any code path that allows browser-side account creation/login without backend.
- Any hardcoded credentials or verification codes.
- Any plaintext secret persistence path.

## 5) Recommended release gates
- Security gate: fail build on new `innerHTML =` sinks using untrusted input.
- Auth gate: fail build if demo auth switch is enabled in production bundle.
- Data gate: fail build if user credentials are read from or written to localStorage.
