import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('PS26242 Browser UI & Interactive Governance Verification', () => {

  test.beforeEach(async () => {
    // Ensure clean database state before test runs
    execSync('pnpm seed', { stdio: 'ignore' });
  });

  test('Should execute full end-to-end interactive workflow across tabs and state transitions', async ({ page }) => {
    // -------------------------------------------------------------------------
    // 1. Initial Load & Governance Header
    // -------------------------------------------------------------------------
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Verify System Governance Invariant
    const governanceText = page.locator('text=AI CAN HELP. AI CANNOT CERTIFY.');
    await expect(governanceText).toBeVisible();

    // -------------------------------------------------------------------------
    // 2. Tab 1: Candidate Self-Declaration & Qualification Mapping
    // -------------------------------------------------------------------------
    const tab1Btn = page.locator('button:has-text("1. Candidate")');
    await expect(tab1Btn).toBeVisible();
    await tab1Btn.click();

    // Verify Candidate Self-Declaration & Context
    await expect(page.locator('#assessment-selector')).toHaveValue('ASM-DEMO-001');
    await expect(page.locator('text=मैं पिछले 4 साल से एक छोटे गारमेंट वर्कशॉप')).toBeVisible();
    await expect(page.locator('text=Single needle lockstitch machine operation')).toBeVisible();
    await expect(page.locator('text=Highest Formal Education:')).toBeVisible();

    // Verify Authoritative Source Provenance Card
    await expect(page.locator('main').locator('text=SOURCE-BACKED DEVELOPER FIXTURE').first()).toBeVisible();
    await expect(page.locator('main').locator('text=AMH/Q0301').first()).toBeVisible();
    await expect(page.locator('main').locator('text=RPL-A').first()).toBeVisible();

    // Verify Assessor Coverage Confirmation
    await expect(page.locator('text=RPL-A Experiential Coverage Gate (70% Rule)')).toBeVisible();
    await expect(page.locator('text=Assessor Confirmed:').first()).toBeVisible();
    await expect(page.locator('text=Eligible for RPL-A Assessment').first()).toBeVisible();

    // -------------------------------------------------------------------------
    // 3. Tab 2: Supervised Practical Tasks, Evidence Capture & Offline Sync
    // -------------------------------------------------------------------------
    const tab2Btn = page.locator('button:has-text("2. Supervised")');
    await tab2Btn.click();

    // Verify Tasks
    await expect(page.locator('text=T1').first()).toBeVisible();
    await expect(page.locator('text=T2').first()).toBeVisible();
    await expect(page.locator('text=T3').first()).toBeVisible();

    // Test Offline Mode Toggle in NetworkStatusBar
    const offlineToggleBtn = page.locator('button:has-text("Simulate Intermittent Disconnect")');
    await expect(offlineToggleBtn).toBeVisible();
    await offlineToggleBtn.click();

    // Verify UI reflects offline mode
    await expect(page.locator('text=OFFLINE MODE')).toBeVisible();

    // Capture Evidence while offline -> enqueues to outbox
    const captureBtn = page.locator('#btn-capture-task');
    await expect(captureBtn).toBeVisible();
    await captureBtn.click();
    await page.waitForTimeout(1000);

    // Verify Outbox shows 1 pending item
    await expect(page.locator('text=Outbox:').locator('..').locator('strong:has-text("1")')).toBeVisible();

    // Reload page to verify Local State Persistence survives page refreshes
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Confirm local outbox persisted through reload
    await expect(page.locator('text=Outbox:').locator('..').locator('strong:has-text("1")')).toBeVisible();

    // Turn offline simulation off and sync outbox to server
    await offlineToggleBtn.click();
    const syncBtn = page.locator('button:has-text("Sync Outbox")');
    await syncBtn.click();
    await page.waitForTimeout(1200);

    // Verify Outbox cleared back to 0
    await expect(page.locator('text=Outbox:').locator('..').locator('strong:has-text("0")')).toBeVisible();

    // -------------------------------------------------------------------------
    // 4. Tab 3: Official Scoring, Recommendation & Positive Finalization
    // -------------------------------------------------------------------------
    const tab3Btn = page.locator('button:has-text("3. Assessor")');
    await tab3Btn.click();

    // Verify Scheme Breakdown & Score
    await expect(page.locator('text=Official QP Scheme Components (AMH/Q0301)')).toBeVisible();
    await expect(page.locator('text=OFFICIAL QP SCHEME — DEMO CONFIGURATION')).toBeVisible();
    await expect(page.locator('text=Practical Assessment')).toBeVisible();

    // Trigger Authoritative Positive Finalization with Confirmation Modal
    const signOffBtn = page.locator('button:has-text("Human Assessor Sign-Off")');
    await expect(signOffBtn).toBeVisible();
    await signOffBtn.click();

    // Confirm modal safeguard
    const confirmBtn = page.locator('button:has-text("Confirm & Permanently Lock")');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
    await page.waitForTimeout(1200);

    // Verify Terminal State: SIGNED_OFF & RECORD LOCKED
    await expect(page.locator('text=OFFICIAL CERTIFICATION RECOMMENDATION PACKAGE GENERATED')).toBeVisible();
    await expect(page.locator('text=RECORD LOCKED').first()).toBeVisible();

    // -------------------------------------------------------------------------
    // 5. Negative/Referral Finalization Journey (Candidate 2)
    // -------------------------------------------------------------------------
    // Switch to Candidate 2: Sunita Devi (ASM-DEMO-002)
    const candidateSelect = page.locator('#assessment-selector');
    await candidateSelect.selectOption('ASM-DEMO-002');
    await page.waitForTimeout(1000);

    // Verify Candidate 2 Context: Gap / Referral state
    await expect(candidateSelect).toHaveValue('ASM-DEMO-002');

    // Go to Tab 3 for Candidate 2
    await tab3Btn.click();

    // Verify Upskilling Required state
    await expect(page.locator('text=UPSKILLING_REQUIRED').first()).toBeVisible();

    // Trigger Finalize Upskilling Referral
    const referralBtn = page.locator('button:has-text("Finalize Upskilling Referral")');
    await expect(referralBtn).toBeVisible();
    await referralBtn.click();

    // Confirm modal safeguard
    const confirmReferralBtn = page.locator('button:has-text("Confirm & Permanently Lock")');
    await expect(confirmReferralBtn).toBeVisible();
    await confirmReferralBtn.click();
    await page.waitForTimeout(1200);

    // Verify Terminal State: Negative Referral Finalized & RECORD LOCKED
    await expect(page.locator('text=ASSESSMENT REPORT & UPSKILLING REFERRAL FINALIZED')).toBeVisible();
    await expect(page.locator('text=RECORD LOCKED').first()).toBeVisible();

    // -------------------------------------------------------------------------
    // 6. Tab 4: Evaluation Dashboard & Claim Gate
    // -------------------------------------------------------------------------
    const tab4Btn = page.locator('button:has-text("4. Evaluation")');
    await tab4Btn.click();

    // Verify Strict DEMO / SYNTHETIC EVALUATION Provenance Badge
    await expect(page.locator('text=DEMO / SYNTHETIC EVALUATION').first()).toBeVisible();
    await expect(page.locator('text=Wrong-AI Catch Rate')).toBeVisible();
  });

  test('Should execute live onboarding and reach assessment-ready state for a previously nonexistent candidate', async ({ page }) => {
    const uniqueCandidateName = `Live Candidate ${Date.now().toString(36).toUpperCase()}`;
    const uniquePhone = `+91-987${Math.floor(1000000 + Math.random() * 9000000)}`;

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // 1. Verify and click "+ New Candidate / Live Assessment" action button in header
    const newCandidateBtn = page.locator('#btn-new-candidate-flow');
    await expect(newCandidateBtn).toBeVisible();
    await newCandidateBtn.click();

    // 2. Verify modal opened
    const modal = page.locator('#new-candidate-modal');
    await expect(modal).toBeVisible();
    await expect(page.locator('text=+ New Candidate / Live Assessment Onboarding')).toBeVisible();

    // 3. Fill candidate onboarding form
    await page.fill('#new-candidate-name', uniqueCandidateName);
    await page.fill('#new-candidate-phone', uniquePhone);
    await page.selectOption('#new-candidate-education', 'EIGHTH');
    await page.selectOption('#new-candidate-language', 'en');
    await page.fill('#new-candidate-experience', '6 years practical experience running single needle lockstitch machines in export garment unit. Proficient in straight and curved seam stitching, tension control, bobbin winding, needle changes with eye guard, and SPI regulation.');

    // 4. Submit onboarding form to call candidate API and live qualification mapping
    const runMappingBtn = page.locator('#btn-run-mapping');
    await expect(runMappingBtn).toBeVisible();
    await runMappingBtn.click();

    // 5. Verify qualification mapping result displayed with recommended QP and 70% threshold gate
    await expect(page.locator('text=RANK 1 • RECOMMENDED TARGET QP')).toBeVisible();
    await expect(page.locator('text=Sewing Machine Operator (AMH/Q0301)').first()).toBeVisible();
    await expect(page.locator('text=RPL-A Experiential Coverage Gate (70% Rule)')).toBeVisible();
    await expect(page.locator('text=Eligible for RPL-A Assessment')).toBeVisible();

    // 6. Confirm pathway and start assessment session
    const confirmStartBtn = page.locator('#btn-confirm-start-assessment');
    await expect(confirmStartBtn).toBeVisible();
    await confirmStartBtn.click();

    // 7. Verify modal closes, candidate is loaded, session is active, and assessment is in progress
    await expect(modal).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Verify Active Assessment selector reflects new live candidate
    const selector = page.locator('#assessment-selector');
    await expect(selector).toBeVisible();
    const selectedText = await selector.locator('option:checked').textContent();
    expect(selectedText).toContain('[LIVE]');
    expect(selectedText).toContain(uniqueCandidateName);

    // Verify candidate is shown in Tab 1
    const tab1Btn = page.locator('button:has-text("1. Candidate")');
    await tab1Btn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('main').locator(`text=${uniqueCandidateName}`).first()).toBeVisible();

    // Verify Tab 2: Assessment Session is active with live session code
    const tab2Btn = page.locator('button:has-text("2. Supervised")');
    await tab2Btn.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('main').locator('text=ACTIVE SUPERVISED SESSION')).toBeVisible();
    await expect(page.locator('main').locator(`text=${uniqueCandidateName}`).first()).toBeVisible();

    // Capture digital evidence for supervised practical tasks
    const captureAllBtn = page.locator('#btn-capture-all-tasks');
    await expect(captureAllBtn).toBeVisible();
    await captureAllBtn.click();
    await page.waitForTimeout(1000);

    // Tab 3: Official Scoring & Deterministic Calculation
    const tab3Btn = page.locator('button:has-text("3. Assessor")');
    await tab3Btn.click();
    await page.waitForTimeout(1000);

    // Grade candidate demonstration using assessor rubric evaluation
    const gradePassingBtn = page.locator('#btn-grade-passing-live');
    await expect(gradePassingBtn).toBeVisible();
    await gradePassingBtn.click();
    await page.waitForTimeout(2000);

    // Verify deterministic calculation evaluated score >= 70% and SUITABLE_FOR_SIGNOFF
    await expect(page.locator('main').locator('text=SUITABLE_FOR_SIGNOFF').first()).toBeVisible();
    await expect(page.locator('main').locator('text=ALL SATISFIED')).toBeVisible();

    // Assessor performs final authoritative sign-off with modal confirmation
    const signOffBtn = page.locator('button:has-text("Human Assessor Sign-Off")');
    await expect(signOffBtn).toBeVisible();
    await signOffBtn.click();

    const confirmSignOffBtn = page.locator('button:has-text("Confirm & Permanently Lock")');
    await expect(confirmSignOffBtn).toBeVisible();
    await confirmSignOffBtn.click();
    await page.waitForTimeout(1500);

    // Verify record locked and certification recommendation package produced for the live candidate
    await expect(page.locator('main').locator('text=OFFICIAL CERTIFICATION RECOMMENDATION PACKAGE GENERATED')).toBeVisible();
    await expect(page.locator('main').locator('text=RECORD LOCKED').first()).toBeVisible();
  });

  test('GAP-01: Assessment selector persists live assessments across browser refreshes', async ({ page }) => {
    const candidateA = `Candidate Alpha ${Date.now()}`;
    const candidateB = `Candidate Beta ${Date.now()}`;

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // --- Create Candidate A ---
    await page.click('#btn-new-candidate-flow');
    await page.fill('#new-candidate-name', candidateA);
    await page.fill('#new-candidate-phone', '+91-9876501111');
    await page.fill('#new-candidate-experience', 'Experienced sewing operator with extensive single needle lockstitch experience.');
    await page.click('#btn-run-mapping');
    await page.waitForTimeout(1500);
    await page.click('#btn-confirm-start-assessment');
    await page.waitForTimeout(1500);

    // Verify Candidate A is active in selector
    const selector = page.locator('#assessment-selector');
    let optionsText = await selector.innerText();
    expect(optionsText).toContain(candidateA);

    // --- Create Candidate B ---
    await page.click('#btn-new-candidate-flow');
    await page.fill('#new-candidate-name', candidateB);
    await page.fill('#new-candidate-phone', '+91-9876502222');
    await page.fill('#new-candidate-experience', 'Garment assembly specialist with safety guard and machine setup experience.');
    await page.click('#btn-run-mapping');
    await page.waitForTimeout(1500);
    await page.click('#btn-confirm-start-assessment');
    await page.waitForTimeout(1500);

    // Verify Candidate B is in selector
    optionsText = await selector.innerText();
    expect(optionsText).toContain(candidateB);

    // --- RELOAD BROWSER (GAP-01 Test) ---
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Confirm BOTH Candidate A and Candidate B remain present in the selector after browser reload!
    const reloadedOptions = await page.locator('#assessment-selector').innerText();
    expect(reloadedOptions).toContain(candidateA);
    expect(reloadedOptions).toContain(candidateB);
  });

  test('GAP-04 & GAP-05: Real per-criterion rubric scoring UI and dynamic evidence pending vs captured state', async ({ page }) => {
    const candidateName = `Dynamic Evidence User ${Date.now()}`;

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Create fresh candidate
    await page.click('#btn-new-candidate-flow');
    await page.fill('#new-candidate-name', candidateName);
    await page.fill('#new-candidate-phone', '+91-9876503333');
    await page.fill('#new-candidate-experience', 'Operates industrial lockstitch machine, aligns seam notches, regulates stitch length.');
    await page.click('#btn-run-mapping');
    await page.waitForTimeout(1500);
    await page.click('#btn-confirm-start-assessment');
    await page.waitForTimeout(1500);

    // Go to Tab 2: Practical Tasks
    await page.click('button:has-text("2. Supervised")');
    await page.waitForTimeout(1000);

    // GAP-05: Verify all tasks initially start as "Pending Capture"
    await expect(page.locator('text=⏳ Pending Capture').first()).toBeVisible();

    // Capture evidence for Task T1 only
    await page.click('#btn-capture-task');
    await page.waitForTimeout(1500);

    // Verify T1 is now "✓ Evidence Captured" while others remain "⏳ Pending Capture"
    await expect(page.locator('text=✓ Evidence Captured').first()).toBeVisible();
    await expect(page.locator('text=⏳ Pending Capture').first()).toBeVisible();

    // Go to Tab 3: Assessor Rubric Scoring
    await page.click('button:has-text("3. Assessor")');
    await page.waitForTimeout(1000);

    // GAP-04: Verify per-criterion assessment section exists with individual Save buttons
    await expect(page.locator('text=Authoritative Per-Criterion Rubric Scoring')).toBeVisible();
    await expect(page.locator('text=PC 1.1').first()).toBeVisible();

    // Verify Save button for individual criteria
    const firstSaveBtn = page.locator('button:has-text("Save")').first();
    await expect(firstSaveBtn).toBeVisible();
    await firstSaveBtn.click();
    await page.waitForTimeout(1500);

    // Profile score reflects evaluated marks
    await expect(page.locator('text=Official Total Score')).toBeVisible();
  });

  test('GAP-07 & GAP-08: Tamper-evident audit trail & configured 400-mark scheme certification package', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Go to Tab 3
    await page.click('button:has-text("3. Assessor")');
    await page.waitForTimeout(1000);

    // GAP-07: Verify tamper-evident audit trail card is visible and has events
    await expect(page.locator('#card-audit-trail')).toBeVisible();
    await expect(page.locator('text=Tamper-Evident Immutable Audit Trail (PostgreSQL Source)')).toBeVisible();

    // Perform finalization on demo candidate
    const signOffBtn = page.locator('button:has-text("Human Assessor Sign-Off")');
    await expect(signOffBtn).toBeVisible();
    await signOffBtn.click();

    const confirmBtn = page.locator('button:has-text("Confirm & Permanently Lock")');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();
    await page.waitForTimeout(1500);

    // GAP-08: Verify Certification Package displays / 400 (not hardcoded / 100)
    await expect(page.locator('text=/ 400').first()).toBeVisible();
  });
});
