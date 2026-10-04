import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const API_BASE = 'http://localhost:4000/api';

describe('PS26242 Claim Gate & Provenance Enforcement Test Suite', () => {

  // Test 1: Missing or Invalid Provenance Rejected (HTTP 400 Bad Request)
  it('Should reject evaluation run creation when evaluationDataType is missing or unsupported', async () => {
    // Attempt with invalid/fabricated provenance
    const invalidRes = await fetch(`${API_BASE}/evaluation/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fabricated Field Evaluation Run',
        evaluationDataType: 'FABRICATED_FIELD_STUDY' // Not in allowed whitelist
      })
    });

    assert.equal(invalidRes.status, 400, 'Invalid provenance must return HTTP 400 Bad Request');
    const errBody = await invalidRes.json();
    assert.match(
      errBody.message || JSON.stringify(errBody),
      /Invalid evaluation/i,
      'Error message must state invalid evaluation category'
    );
  });

  // Test 2: Synthetic Demo Provenance Enforced
  it('Should accept SYNTHETIC_DEMO provenance and enforce synthetic metadata disclosure', async () => {
    const res = await fetch(`${API_BASE}/evaluation/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Synthetic Demo Crossover Run',
        caseCount: 36,
        randomSeed: 42,
        evaluationDataType: 'SYNTHETIC_DEMO'
      })
    });

    assert.equal(res.status, 201, 'Valid SYNTHETIC_DEMO run should be created successfully');
    const data = await res.json();
    assert.ok(data.runId, 'Must return runId');
    assert.equal(data.provenance?.evaluationDataType, 'SYNTHETIC_DEMO');
    assert.equal(data.provenance?.disclosureNotice, 'DEMO / SYNTHETIC EVALUATION - NOT REAL OPERATIONAL STUDY');

    // Fetch run metrics and ensure synthetic flag is preserved
    const metricsRes = await fetch(`${API_BASE}/evaluation/runs/${data.runId}/metrics`);
    assert.equal(metricsRes.status, 200);
    const metricsData = await metricsRes.json();
    assert.equal(metricsData.provenance?.evaluationDataType, 'SYNTHETIC_DEMO');
    assert.equal(metricsData.provenance?.isSynthetic, true);
    assert.ok(metricsData.primaryEndpoint, 'Must compute primary endpoint');
  });

  // Test 3: PILOT_STUDY Provenance Supported for Future Official Studies
  it('Should accept PILOT_STUDY provenance and enforce authentic study metadata', async () => {
    const res = await fetch(`${API_BASE}/evaluation/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Official MSDE Pilot Study Run',
        caseCount: 36,
        randomSeed: 101,
        evaluationDataType: 'PILOT_STUDY'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.provenance?.evaluationDataType, 'PILOT_STUDY');
    assert.equal(data.provenance?.disclosureNotice, 'OFFICIAL PILOT STUDY DATASET');

    // Verify metrics endpoint preserves PILOT_STUDY provenance
    const metricsRes = await fetch(`${API_BASE}/evaluation/runs/${data.runId}/metrics`);
    assert.equal(metricsRes.status, 200);
    const metricsData = await metricsRes.json();
    assert.equal(metricsData.provenance?.evaluationDataType, 'PILOT_STUDY');
    assert.equal(metricsData.provenance?.isSynthetic, false);
  });

  // Test 4: OPERATIONAL Provenance Supported for Live Production Runs
  it('Should accept OPERATIONAL provenance for live deployed assessment cohorts', async () => {
    const res = await fetch(`${API_BASE}/evaluation/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Live Operational Registry Study',
        caseCount: 36,
        randomSeed: 202,
        evaluationDataType: 'OPERATIONAL'
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.provenance?.evaluationDataType, 'OPERATIONAL');
    assert.equal(data.provenance?.disclosureNotice, 'OFFICIAL OPERATIONAL FIELD EVALUATION');

    const metricsRes = await fetch(`${API_BASE}/evaluation/runs/${data.runId}/metrics`);
    assert.equal(metricsRes.status, 200);
    const metricsData = await metricsRes.json();
    assert.equal(metricsData.provenance?.evaluationDataType, 'OPERATIONAL');
    assert.equal(metricsData.provenance?.isSynthetic, false);
  });
});
