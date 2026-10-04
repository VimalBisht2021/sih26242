# PS26242 Physical Device & Operational Field Test Checklist

This checklist documents the hardware verification procedures that require physical field equipment and mobile devices running the Progressive Web App (PWA) / native wrapper, which cannot be fully simulated via automated desktop browser testing.

---

## 1. Camera & Video Hardware Capture

- [ ] **Native Camera Access:** PWA invokes native camera capture prompt without browser sandboxing errors on Chrome Mobile (Android 12+) and Safari (iOS 16+).
- [ ] **Resolution & Frame Rate:** Captures practical task video at minimum 720p @ 24fps with acceptable compression (< 25MB per 60-second clip).
- [ ] **Low-Light / Glare Handling:** Video and image capture functions reliably under typical workshop/industrial lighting (fluorescent, 200–400 lux).
- [ ] **Continuous Recording:** Camera remains stable without thermal throttling or crash during 5 consecutive task demonstrations.
- [ ] **Hash Verification:** Client-side SHA-256 digest is generated immediately upon blob creation before storage in IndexedDB.

---

## 2. Real Hardware Geolocation (GPS / Cellular Network)

- [ ] **Hardware GPS Satellite Lock:** Device acquires GPS coordinates with accuracy radius $\le 15$ meters outdoors and $\le 50$ meters in semi-enclosed industrial shed.
- [ ] **Location Source Classification:** Client correctly classifies source:
  - `GPS`: High-precision GNSS lock ($\le 15$m).
  - `NETWORK`: Cell tower / Wi-Fi triangulation (> 15m, $\le 200$m).
  - `MANUAL`: Assessor-entered center code fallback with mandatory audit justification.
  - `UNAVAILABLE`: Geolocation permission denied or sensor hardware failure.
- [ ] **Geofence Enforcement:** Submissions occurring $> 500$ meters from accredited assessment site (`SITE-01`) trigger server-side location discrepancy flag in audit log.
- [ ] **Simulated Coordinate Guard:** Ensure production builds reject or flag hardcoded synthetic coordinates (`[Source: DEMO_FIXTURE]`).

---

## 3. Offline Storage & Local Persistence on Edge Devices

- [ ] **Storage Resilience:** Persistent-storage request (`navigator.storage.persist()`) succeeds; application gracefully handles browser quota and storage-pressure conditions without silently discarding acknowledged local state.
- [ ] **App Backgrounding / Low-Memory Termination:** If OS terminates browser process while offline, outbox queue and assessment drafts remain intact upon relaunch.
- [ ] **Airplane Mode Resilience:** Full assessment workflow (task inspection, video recording, criterion marking) operates seamlessly with cellular and Wi-Fi disabled.
- [ ] **Network Reconnection & Synchronization:** When network connectivity is restored (2G/3G/4G/Wi-Fi), queued evidence is recoverable and syncable. Background Sync may flush automatically where supported by the browser; Foreground Sync is the guaranteed reference path.
- [ ] **Clock Drift Detection:** Device detects/flags suspicious clock drift against server time during session sync rather than claiming absolute client clock freeze.

---

## 4. Assessor Proctoring & Identity Attestation

- [ ] **Assessor Credential Management:** National Assessor Registry integration is documented as an operational prerequisite. For the hackathon demonstration, credentials remain clearly labelled as `DEMO ASSESSOR CREDENTIAL`.
- [ ] **Candidate Identity Attestation:** In accordance with demo privacy boundaries, actual Aadhaar or Voter ID documents are NOT stored; assessor performs an in-person physical identity-attestation step with synthetic candidate identifiers.
- [ ] **Privacy Consent Recording:** Platform records `consentOrLawfulBasis`, `version`, `timestamp`, and `captureMethod`. Full legal/deployment DPDP verification remains an external operational prerequisite.

---

## 5. Security & Immutability Verification

- [ ] **Lock Enforcement:** Once finalized as `SIGNED_OFF` or `REPORT_FINALIZED_NOT_RECOMMENDED`, the assessment record becomes read-only; attempts to edit marks or upload evidence return HTTP 400 Bad Request.
- [ ] **Audit Trail Integrity:** All state transitions (evidence capture, AI suggestion accept/reject, assessor marks, sign-off) append immutable, hash-chained log events.
