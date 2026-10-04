# REAL EVIDENCE CAPTURE & UPLOAD IMPLEMENTATION REPORT

**Smart India Hackathon 2026 — Problem Statement PS26242**  
**AI-Assisted Skill Assessment Tool for Recognition of Prior Learning (RPL)**  
**Target Qualification:** Sewing Machine Operator (`AMH/Q0301`, NSQF Level 3)  
**Date:** 2026-10-04  
**Author:** Antigravity Autonomous Pair Programmer  

---

## 1. Executive Summary

This report documents the end-to-end implementation of **Real Browser Evidence Capture and Upload** for the PS26242 RPL Assessment Platform. 

Previously, the platform utilized a simulated media capture flow that stored synthetic metadata (`fileUri: demo/...`, client-generated SHA string) without accepting genuine file streams, verifying bytes, or rendering captured media. 

This implementation replaces the simulated media portion with a **production-grade, dual-mode browser capture pipeline** supporting:
1. **Real File Selection & Upload** via standard `<input type="file" accept="image/*,video/*">`
2. **Real In-Browser Camera Capture** via WebRTC `navigator.mediaDevices.getUserMedia(...)` with a live viewfinder, capture preview, and retake controls
3. **Client-Side SHA-256 Digesting** via Web Crypto API (`window.crypto.subtle.digest`) on exact file bytes
4. **Multipart Binary Upload** to NestJS API (`POST /api/assessments/:id/tasks/:taskId/evidence/upload`)
5. **Server-Side Magic Bytes & Format Verification** (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `52 49 46 46`, WebM `1A 45 DF A3`, MP4 `ftyp`)
6. **Server-Side Independent SHA-256 Recomputation & Tamper Rejection** (`INTEGRITY_MISMATCH` 400 Bad Request on hash divergence)
7. **Persistent Durable Storage** via `EvidenceStorageService` writing to Docker volume `/app/storage/evidence`
8. **Real Visual Media Rendering** (`<img>` and `<video>` tags) and full inspection modal with full 64-character SHA verification badge
9. **Tamper-Evident Audit Logging** (`AuditEvent` row with `EVIDENCE_CAPTURED`, SHA-256, and storage URI)
10. **Preservation of Existing Domain Invariants**: Assessor authority, RPL-A 70% rule, 400-mark evaluation scheme, immutable locking, and state machines are 100% unaltered.

---

## 2. Evidence Architecture & Pipeline Flow

The active evidence pipeline strictly follows the authoritative design:

```
[Browser Camera (getUserMedia) / File Input (<input type="file">)]
                       │
                       ▼
              [Actual File / Blob]
                       │
                       ▼
       [Client SHA-256 (window.crypto.subtle)]
                       │
                       ▼ (multipart/form-data)
              [NestJS Upload API]
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
[Magic Bytes & MIME Check]   [Server SHA-256 Recomputation]
         │                           │
         └─────────────┬─────────────┘
                       ▼
         [SHA Comparison (Client vs Server)]
          ├── MISMATCH ──► [HTTP 400 INTEGRITY_MISMATCH Rejected]
          └── MATCH
                       │
                       ▼
        [Durable Filesystem Storage]
          (/app/storage/evidence/:assessment/:task/:evidenceId.ext)
                       │
                       ▼
        [PostgreSQL Evidence Record]
          (sha256, storageUri, mimeType, sizeBytes, taskCode)
                       │
                       ▼
        [AuditEvent Record (EVIDENCE_CAPTURED)]
                       │
                       ▼
        [AI Analysis Advisory Boundary]
          ("AI visual analysis unavailable in current synthetic demo provider")
                       │
                       ▼
        [Authoritative Assessor Review & Scoring]
```

---

## 3. Storage Choice & Rationale

- **Storage Solution Chosen:** Local Durable Filesystem Storage (`EvidenceStorageService`) backed by Docker persistent volume `evidence_storage:/app/storage/evidence`.
- **Rationale:** 
  - Meets hackathon resilience, dockerization, and isolation requirements without introducing external cloud or object-storage dependencies (like MinIO) that add unnecessary container overhead.
  - The storage boundary is strictly abstracted behind `EvidenceStorageService`, exposing standard methods (`storeEvidenceFile`, `readEvidenceFile`, `deleteEvidenceFile`, `validateFileFormat`).
  - Storage paths are strictly sanitized against path traversal using alphanumeric-and-hyphen regex guards (`sanitizeIdentifier`).
  - Storage keys are deterministic and human-auditable: `/evidence/{assessmentId}/{taskCode}/{evidenceId}.{ext}`.
  - Development absolute paths (e.g. `C:\Users\...` or `/app/...`) are never exposed across the public REST API.

---

## 4. Summary of Files Changed & Created

| Path | Action | Description |
| :--- | :--- | :--- |
| [`apps/api/src/evidence/evidence-storage.service.ts`](file:///c:/Users/Gues/Desktop/sih26242/apps/api/src/evidence/evidence-storage.service.ts) | **Created** | Durable storage service with magic bytes validation, path traversal guards, SHA-256 file stream computation, and demo fixture generation. |
| [`apps/api/src/evidence/evidence.service.ts`](file:///c:/Users/Gues/Desktop/sih26242/apps/api/src/evidence/evidence.service.ts) | **Modified** | Added `uploadEvidence()` with server-side SHA verification, `getEvidenceFile()` retrieval stream, and audit logging. Preserved `submitEvidence()` for JSON sync. |
| [`apps/api/src/evidence/evidence.controller.ts`](file:///c:/Users/Gues/Desktop/sih26242/apps/api/src/evidence/evidence.controller.ts) | **Modified** | Added `POST :id/tasks/:taskId/evidence/upload` multipart endpoint and `GET :id/evidence/:evidenceId/file` media streaming endpoint. |
| [`apps/api/src/evidence/evidence.module.ts`](file:///c:/Users/Gues/Desktop/sih26242/apps/api/src/evidence/evidence.module.ts) | **Modified** | Registered `EvidenceStorageService` as a provider and exported it. |
| [`apps/web/src/app/page.tsx`](file:///c:/Users/Gues/Desktop/sih26242/apps/web/src/app/page.tsx) | **Modified** | Added `<input type="file">`, live camera viewfinder modal, thumbnail previews (`<img>`/`<video>`), media inspection modal, and real upload state machine. |
| [`docker-compose.yml`](file:///c:/Users/Gues/Desktop/sih26242/docker-compose.yml) | **Modified** | Configured `evidence_storage` named volume and mapped to `/app/storage/evidence` on `api` container. |
| [`tests/fixtures/test_evidence_fixture.jpg`](file:///c:/Users/Gues/Desktop/sih26242/tests/fixtures/test_evidence_fixture.jpg) | **Created** | Valid JPEG binary test fixture for automated testing. |
| [`tests/e2e/real-evidence-upload.test.ts`](file:///c:/Users/Gues/Desktop/sih26242/tests/e2e/real-evidence-upload.test.ts) | **Created** | Comprehensive 8-test Node.js integration test suite verifying binary upload, SHA verification, tamper rejection, task isolation, persistence, and audit. |
| [`tests/e2e/real-evidence-ui.spec.ts`](file:///c:/Users/Gues/Desktop/sih26242/tests/e2e/real-evidence-ui.spec.ts) | **Created** | Playwright E2E browser test verifying camera/upload controls, preview rendering, SHA display, and browser reload persistence. |
| [`docs/IMPLEMENTATION_STATUS.md`](file:///c:/Users/Gues/Desktop/sih26242/docs/IMPLEMENTATION_STATUS.md) | **Modified** | Updated status, test results, and evidence capture verification details. |
| [`README.md`](file:///c:/Users/Gues/Desktop/sih26242/README.md) | **Modified** | Updated Evidence Storage Architecture, upload flow, and hardware/AI disclosures. |

---

## 5. API Specification

### 5.1 Real Evidence Upload
- **Route:** `POST /api/assessments/:id/tasks/:taskId/evidence/upload`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file`: Binary file (image or video, max 25 MB)
  - `evidenceType`: `IMAGE` | `VIDEO`
  - `clientSha256`: Optional client-computed hex digest (e.g. `460709ea79b09218...`)
  - `latitude`: Optional GPS latitude
  - `longitude`: Optional GPS longitude
  - `gpsAccuracy`: Optional GPS accuracy in meters
  - `isSimulatedGps`: Boolean string (`true` | `false`)
- **Responses:**
  - `201 Created`: Evidence record persisted with verified `sha256`, `storageUri`, `sizeBytes`, `mimeType`, and `fileUrl`.
  - `400 Bad Request`: `INTEGRITY_MISMATCH: Client-provided SHA-256 does not match server-computed digest`
  - `400 Bad Request`: `UNSUPPORTED_MEDIA_TYPE: File header does not match expected image/video magic bytes`
  - `400 Bad Request`: `ASSESSMENT_LOCKED: Cannot add evidence to finalized assessment`
  - `404 Not Found`: Assessment or Task does not exist.

### 5.2 Evidence Media Streaming
- **Route:** `GET /api/assessments/:id/evidence/:evidenceId/file`
- **Response:** Raw binary media buffer.
- **Headers:**
  - `Content-Type`: `image/jpeg` | `image/png` | `image/webp` | `video/mp4` | `video/webm`
  - `Content-Length`: Bytes size
  - `ETag`: `"${sha256}"`
  - `Cache-Control`: `private, max-age=3600`
  - `Content-Disposition`: `inline; filename="..."`

---

## 6. Client-Side & Server-Side SHA-256 Verification

### Client-Side Hashing
In `apps/web/src/app/page.tsx`, when a file or camera blob is selected, the browser computes the exact SHA-256 hash using the Web Crypto API:
```typescript
const arrayBuffer = await file.arrayBuffer();
const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
const hashArray = Array.from(new Uint8Array(hashBuffer));
const clientSha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
```

### Server-Side Independent Verification
In `EvidenceService.uploadEvidence()`:
```typescript
const serverSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

if (dto.clientSha256) {
  const normalizedClientSha = dto.clientSha256.toLowerCase().trim();
  if (normalizedClientSha !== serverSha256) {
    throw new BadRequestException(
      `INTEGRITY_MISMATCH: Client-provided SHA-256 (${normalizedClientSha}) does not match server-computed digest (${serverSha256})`
    );
  }
}
```

---

## 7. Dynamic Task UI & Multi-Evidence Rendering

- **Dynamic Task UI:** The UI dynamically loads all qualification tasks (T1 to T5) configured in `@sih26242/qualification` for `AMH/Q0301`.
- **Status Indicators:**
  - `No Evidence` (Gray) — 0 files captured
  - `Pending Capture` (Amber) — Selected for capture
  - `Evidence Captured` (Green) — Persisted with verified SHA-256
- **Preview Display:**
  - For image uploads: rendered via `<img src="/api/assessments/:id/evidence/:evidenceId/file">` with thumbnail zoom and full inspection modal.
  - For video uploads: rendered via `<video controls>` with inline playback.
- **Metadata Cards:** Shows filename, byte size, MIME type, capture timestamp, and short SHA-256 (`460709...c75b90`). Clicking opens the full inspection dialog showing the complete 64-character hash and download link.

---

## 8. Offline & Synchronization Architecture

- **Strategy Implemented:** **Option B (Conservative & Reliable)**.
- **Behavior:**
  - Real binary file upload requires active server connectivity.
  - If the assessor attempts to upload while offline, the UI clearly displays:
    > *"Real media upload requires network connectivity to verify SHA-256 integrity and persist bytes. Offline mode preserves scoring and declaration metadata; capture media when reconnected."*
  - This prevents corrupting local browser IndexedDB storage with huge video blobs or falsely claiming binary synchronization when only metadata was retained.

---

## 9. AI Analysis Boundary & Disclosures

- **Status:** **SIMULATED / ADVISORY ONLY**.
- **Visual Analysis Boundary:** The current AI service uses deterministic synthetic responses (`MockAIProvider`). It does not perform neural computer vision or visual reasoning.
- **UI Disclosure:** When inspecting evidence, the system explicitly displays:
  > *"AI visual analysis unavailable in current synthetic demo provider. Assessor review is authoritative."*
- **Audit Compliance:** AI observations are strictly marked `isAuthoritative: false` and require human assessor sign-off.

---

## 10. Security Audit & Controls

1. **Path Traversal Protection:** Identifiers are checked against `^[a-zA-Z0-9_\-]+$`. Any path containing `..`, `/`, `\`, or null bytes is rejected immediately.
2. **File Content Magic Bytes:** Uploads claiming to be images or videos must match real binary file signatures (`FF D8 FF` for JPEG, `89 50 4E 47` for PNG, etc.).
3. **Tenant & Assessment Isolation:** Evidence can only be accessed or modified under its parent `assessmentId`. Candidate B cannot view or tamper with Candidate A's evidence.
4. **Immutable Assessment Locking:** Once an assessment is finalized (`SIGNED_OFF` or `REPORT_FINALIZED_NOT_RECOMMENDED`), `uploadEvidence()` rejects further mutations with `400 ASSESSMENT_LOCKED`.
5. **No Filesystem Leakage:** Storage URIs stored in PostgreSQL follow the virtual format `/evidence/{assessmentId}/{taskCode}/{evidenceId}.{ext}`. Internal server disk paths are never exposed.

---

## 11. Verification Test Matrix

| Test Suite / ID | Description | Result | Status |
| :--- | :--- | :--- | :--- |
| **Test 1** | Upload known test image -> HTTP 201 -> File exists in storage -> SHA matches | PASSED | **VERIFIED** |
| **Test 2** | Upload second image with different bytes -> Hashes differ | PASSED | **VERIFIED** |
| **Test 3** | Tamper client SHA -> Server detects divergence -> HTTP 400 `INTEGRITY_MISMATCH` | PASSED | **VERIFIED** |
| **Test 4** | Task Association -> Upload T1 -> T1=captured, T2=pending | PASSED | **VERIFIED** |
| **Test 5** | Reload Persistence -> Stored media buffer matches uploaded buffer byte-for-byte | PASSED | **VERIFIED** |
| **Test 6** | Tenant Isolation -> Candidate A evidence inaccessible under Candidate B assessment | PASSED | **VERIFIED** |
| **Test 7** | Finalization & Audit -> `AuditEvent` records `EVIDENCE_CAPTURED` with valid SHA | PASSED | **VERIFIED** |
| **Test 8** | Locked Assessment -> Reject uploads after finalization (`ASSESSMENT_LOCKED`) | PASSED | **VERIFIED** |
| **Browser E2E** | Playwright candidate creation, real file upload, preview display, reload | PASSED | **END-TO-END VERIFIED** |
| **Domain Tests** | 30 / 30 domain scoring & state transition unit tests | 30/30 PASSED | **VERIFIED** |
| **Evaluation Tests** | 4 / 4 crossover study & Krippendorff's alpha tests | 4/4 PASSED | **VERIFIED** |

---

## 12. Claim Gate Classification

| Claim | Status | Disclosure |
| :--- | :--- | :--- |
| **Real Browser Camera Capture** | **VERIFIED** | Demonstrated via WebRTC `getUserMedia()`. Physical field-device validation remains pending. |
| **Real File Upload & Storage** | **VERIFIED** | Actual binary bytes transferred, verified, and saved to durable Docker volume `/app/storage/evidence`. |
| **SHA-256 Integrity Verification** | **VERIFIED** | Independent server-side computation rejects mismatched or tampered digests. |
| **Visual Media Rendering** | **VERIFIED** | Real previews rendered via `<img>` and `<video>` tags from verified media stream. |
| **GPS Geolocation** | **SIMULATED** | Geolocation fields are labeled `DEMO / SIMULATED GPS` pending dedicated GNSS hardware. |
| **AI Computer Vision** | **NOT IMPLEMENTED** | Current AI provider is synthetic/advisory. Visual reasoning is explicitly marked unavailable. |
| **Assessor Authority** | **VERIFIED** | Assessor is the sole authoritative decision-maker. AI cannot certify. |

---

## 13. Conclusion

The real evidence capture and upload feature is **fully implemented, tested, and verified**. Real media bytes are captured, hashed on both client and server, verified for cryptographic integrity, persisted to durable storage, and rendered dynamically in the UI without compromising the domain invariants, evaluation metrics, or governance of the PS26242 platform.
