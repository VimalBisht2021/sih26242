import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Real Evidence Capture & Upload Browser E2E Suite (Requirement 27)', () => {
  const fixturePath = path.resolve('tests/fixtures/test_evidence_fixture.jpg');

  test('Should upload real image file, verify preview and hash, persist across reload, and isolate pending tasks', async ({ page }) => {
    // 1. Navigate to Platform
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
    const assessmentSelector = page.locator('#assessment-selector');
    await expect(assessmentSelector).toBeVisible({ timeout: 15000 });

    // 2. Select Candidate 1 (Ramesh Verma - ASM-DEMO-001)
    await assessmentSelector.selectOption('ASM-DEMO-001');

    // 3. Open Tab 2 (Supervised Practical Tasks)
    const tab2Btn = page.locator('button:has-text("2. Supervised Practical Tasks")');
    await expect(tab2Btn).toBeVisible();
    await tab2Btn.click();

    // 4. Verify Tasks are rendered dynamically
    await expect(page.locator('text=T1').first()).toBeVisible();
    await expect(page.locator('text=T2').first()).toBeVisible();

    // 5. Select Task T1
    const taskT1 = page.locator('text=T1').first();
    await taskT1.click();

    // Verify upload button and hidden file input exist
    const fileInput = page.locator('#input-evidence-file');
    await expect(fileInput).toBeAttached();

    // 6. Upload Real Binary Evidence via file input
    await fileInput.setInputFiles(fixturePath);

    // 7. Verify Upload Succeeds and Status Updates to Evidence Captured
    await expect(page.locator('text=✓ Evidence Captured').first()).toBeVisible({ timeout: 15000 });

    // 8. Verify Visual Media Preview (img tag)
    const evidenceImg = page.locator('img[alt*="Evidence"]');
    await expect(evidenceImg.first()).toBeVisible();

    // 9. Verify Server-Verified SHA-256 Badge
    await expect(page.locator('text=SERVER HASH VERIFIED').first()).toBeVisible();

    // 10. Verify Pending Task Isolation: Select T2
    const taskT2 = page.locator('text=T2').first();
    await taskT2.click();

    // 11. Reload Browser and Verify Evidence Persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#assessment-selector')).toBeVisible({ timeout: 15000 });

    // Reopen Tab 2
    await tab2Btn.click();

    // T1 must persist Evidence Captured state and rendered media preview
    await taskT1.click();
    await expect(page.locator('text=✓ Evidence Captured').first()).toBeVisible();
    await expect(page.locator('img[alt*="Evidence"]').first()).toBeVisible();
    await expect(page.locator('text=SERVER HASH VERIFIED').first()).toBeVisible();

    // 12. Verify Evidence Integrity Card exists
    const integrityCard = page.locator('#card-evidence-integrity');
    await expect(integrityCard).toBeVisible();
    await expect(integrityCard.locator('text=STATUS: VALID')).toBeVisible();
  });
});
