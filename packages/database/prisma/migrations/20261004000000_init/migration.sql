-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "WorkflowState" AS ENUM ('MAPPING_PENDING', 'PATHWAY_CONFIRMATION_PENDING', 'PATHWAY_SELECTED', 'ASSESSMENT_READY', 'ASSESSMENT_IN_PROGRESS', 'CRITERION_RESOLUTION_REQUIRED', 'REMEDIATION_REQUIRED', 'SIGNOFF_READY', 'ASSESSOR_DECISION_PENDING', 'FINAL_REPORT_READY', 'SIGNED_OFF', 'REPORT_FINALIZED_NOT_RECOMMENDED', 'LOCKED');

-- CreateEnum
CREATE TYPE "RecommendationOutcome" AS ENUM ('PATHWAY_CONFIRMATION_REQUIRED', 'UPSKILLING_REQUIRED', 'ASSESSMENT_REQUIRED', 'ASSESSMENT_INCOMPLETE', 'ASSESSMENT_REVIEW_REQUIRED', 'NOT_SUITABLE_FOR_SIGNOFF', 'SUITABLE_FOR_SIGNOFF');

-- CreateEnum
CREATE TYPE "AssessorDecision" AS ENUM ('ACCEPT_RECOMMENDATION', 'PATHWAY_ROUTING_OVERRIDE', 'RECOMMENDATION_OVERRIDE_DOWNGRADE', 'SECOND_REVIEW_REQUEST');

-- CreateEnum
CREATE TYPE "FinalDisposition" AS ENUM ('UPSKILLING_REFERRAL', 'SUITABLE_FOR_SIGNOFF', 'NOT_RECOMMENDED', 'REASSESSMENT_REQUIRED');

-- CreateEnum
CREATE TYPE "RPLPathway" AS ENUM ('RPL_A', 'RPL_B', 'RPL_C', 'RPL_D');

-- CreateEnum
CREATE TYPE "ThresholdOperator" AS ENUM ('GREATER_THAN_OR_EQUAL', 'GREATER_THAN');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('NONE', 'PRIMARY', 'FIFTH', 'EIGHTH', 'TENTH', 'TWELFTH', 'ITI', 'DIPLOMA', 'UG', 'PG', 'OTHER');

-- CreateEnum
CREATE TYPE "EnrolmentStatus" AS ENUM ('NONE', 'UG_PURSUING', 'PG_PURSUING', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicantContextSource" AS ENUM ('SELF_DECLARED', 'DOCUMENT_VERIFIED', 'ORGANIZER_DATA');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('VIDEO', 'IMAGE', 'DOCUMENT', 'NOTE');

-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'PERMISSION_DENIED');

-- CreateEnum
CREATE TYPE "ProctoringStatus" AS ENUM ('VERIFIED', 'FLAGGED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "AssessmentComponentType" AS ENUM ('THEORY', 'PRACTICAL', 'PROJECT', 'VIVA', 'OTHER');

-- CreateEnum
CREATE TYPE "CriterionStatus" AS ENUM ('NOT_DEMONSTRATED', 'PARTIAL', 'MEETS_ANCHOR', 'DEMONSTRATED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "QualificationVersion" (
    "id" TEXT NOT NULL,
    "externalCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "nsqfLevel" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "sourceUri" TEXT NOT NULL,
    "sourceChecksum" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'VERIFIED',
    "totalTheoryMarks" INTEGER NOT NULL DEFAULT 106,
    "totalPracticalMarks" INTEGER NOT NULL DEFAULT 246,
    "totalVivaMarks" INTEGER NOT NULL DEFAULT 48,
    "totalMarks" INTEGER NOT NULL DEFAULT 400,
    "passPercentage" INTEGER NOT NULL DEFAULT 70,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualificationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NOS" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "qualificationVersionId" TEXT NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NOS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criterion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "nosId" TEXT NOT NULL,
    "qualificationVersionId" TEXT NOT NULL,
    "theoryMarks" INTEGER NOT NULL DEFAULT 0,
    "practicalMarks" INTEGER NOT NULL DEFAULT 0,
    "vivaMarks" INTEGER NOT NULL DEFAULT 0,
    "projectMarks" INTEGER NOT NULL DEFAULT 0,
    "totalMarks" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Criterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentScheme" (
    "id" TEXT NOT NULL,
    "qualificationVersionId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "aggregatePassPercentage" INTEGER NOT NULL DEFAULT 70,
    "componentsJson" TEXT NOT NULL,

    CONSTRAINT "AssessmentScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "primaryLanguage" TEXT NOT NULL DEFAULT 'hi',
    "phone" TEXT,
    "consentRecordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentVersion" TEXT NOT NULL DEFAULT 'dpdp-2026-v1',
    "highestFormalEducation" "EducationLevel" NOT NULL DEFAULT 'NONE',
    "currentEnrolment" "EnrolmentStatus" NOT NULL DEFAULT 'NONE',
    "educationContextVerified" BOOLEAN NOT NULL DEFAULT false,
    "applicantContextSource" "ApplicantContextSource" NOT NULL DEFAULT 'SELF_DECLARED',
    "educationEvidenceRefs" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceStatement" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "audioRecordingUrl" TEXT,
    "detectedLanguage" TEXT NOT NULL DEFAULT 'hi',
    "normalizedSkills" TEXT[],
    "declaredTasks" TEXT[],
    "declaredTools" TEXT[],
    "declaredOutputs" TEXT[],
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'VOICE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperienceStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteType" TEXT NOT NULL DEFAULT 'FIXED_CENTER',
    "equipmentProfile" TEXT[],
    "environmentProfile" TEXT NOT NULL DEFAULT 'STANDARD',
    "networkProfile" TEXT NOT NULL DEFAULT 'INTERMITTENT',
    "geolocationPolicyVersion" TEXT NOT NULL DEFAULT 'v1',
    "siteLatitude" DOUBLE PRECISION NOT NULL,
    "siteLongitude" DOUBLE PRECISION NOT NULL,
    "locationAccuracyMeters" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "locationSource" TEXT NOT NULL DEFAULT 'GPS',

    CONSTRAINT "Site_pkey" PRIMARY KEY ("siteId")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "qualificationVersionId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "workflowState" "WorkflowState" NOT NULL DEFAULT 'MAPPING_PENDING',
    "rplPathway" "RPLPathway" NOT NULL DEFAULT 'RPL_A',
    "systemOutcome" "RecommendationOutcome",
    "assessorDecision" "AssessorDecision",
    "finalDisposition" "FinalDisposition",
    "aiProposedMappedCoverage" DOUBLE PRECISION,
    "assessorConfirmedMappedCoverage" DOUBLE PRECISION,
    "assessedCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "demonstratedCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "coverageThresholdValue" INTEGER NOT NULL DEFAULT 70,
    "coverageThresholdOperator" TEXT NOT NULL DEFAULT '>=',
    "policyVersion" TEXT NOT NULL DEFAULT '2024.1',
    "schemeVersion" TEXT NOT NULL DEFAULT '2.0',
    "orientationCompletedHours" INTEGER NOT NULL DEFAULT 15,
    "overrideRationale" TEXT,
    "reasonCode" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSession" (
    "id" TEXT NOT NULL,
    "sessionCode" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "proctoringAttested" BOOLEAN NOT NULL DEFAULT false,
    "proctoringAttestedAt" TIMESTAMP(3),
    "clientTimezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "clockSkewSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AssessmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "captureId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "evidenceType" "EvidenceType" NOT NULL,
    "fileUri" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "durationSeconds" DOUBLE PRECISION,
    "deviceId" TEXT NOT NULL,
    "evidenceVersion" INTEGER NOT NULL DEFAULT 1,
    "capturedAtClient" TIMESTAMP(3) NOT NULL,
    "capturedAtServer" TIMESTAMP(3),
    "clientTimezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "clockSkewSeconds" INTEGER NOT NULL DEFAULT 0,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationAccuracyMeters" DOUBLE PRECISION,
    "locationCapturedAt" TIMESTAMP(3),
    "locationStatus" "LocationStatus" NOT NULL DEFAULT 'AVAILABLE',
    "mockLocationFlag" BOOLEAN NOT NULL DEFAULT false,
    "geolocationIntegrityFlag" BOOLEAN NOT NULL DEFAULT true,
    "proctoringStatus" "ProctoringStatus" NOT NULL DEFAULT 'VERIFIED',
    "proctoringAttestedBy" TEXT,
    "proctoringAttestedAt" TIMESTAMP(3),
    "isSynced" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceTrace" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL DEFAULT 'SUPPORTING',
    "createdBy" TEXT NOT NULL DEFAULT 'ASSESSOR',
    "assessorApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIObservation" (
    "id" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "modelRunId" TEXT NOT NULL,
    "evidenceRefsJson" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "suggestedAssessment" "CriterionStatus" NOT NULL,
    "suggestedMark" INTEGER,
    "suggestedMarkBasis" TEXT NOT NULL DEFAULT 'OFFICIAL_ASSESSMENT_SCHEME',
    "rationale" TEXT NOT NULL,
    "assessorAction" TEXT,
    "editedMark" INTEGER,
    "assessorComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriterionAssessment" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "assessorId" TEXT NOT NULL,
    "status" "CriterionStatus" NOT NULL DEFAULT 'NOT_DEMONSTRATED',
    "theoryMarks" INTEGER NOT NULL DEFAULT 0,
    "practicalMarks" INTEGER NOT NULL DEFAULT 0,
    "vivaMarks" INTEGER NOT NULL DEFAULT 0,
    "totalAwardedMarks" INTEGER NOT NULL DEFAULT 0,
    "assessorNote" TEXT,
    "evidenceOpened" BOOLEAN NOT NULL DEFAULT true,
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriterionAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreSnapshot" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "theoryScore" INTEGER NOT NULL,
    "practicalScore" INTEGER NOT NULL,
    "vivaScore" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "scorePercentage" DOUBLE PRECISION NOT NULL,
    "componentTotalsJson" TEXT NOT NULL,
    "qualifyingRulePassed" BOOLEAN NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAuthoritative" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationSnapshot" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "workflowState" "WorkflowState" NOT NULL,
    "systemOutcome" "RecommendationOutcome" NOT NULL,
    "pathway" "RPLPathway" NOT NULL,
    "mappedCoverage" DOUBLE PRECISION NOT NULL,
    "assessedCoverage" DOUBLE PRECISION NOT NULL,
    "demonstratedCoverage" DOUBLE PRECISION NOT NULL,
    "mandatoryCriteriaPass" BOOLEAN NOT NULL,
    "minimumPassRulePass" BOOLEAN NOT NULL,
    "evidenceComplete" BOOLEAN NOT NULL,
    "unresolvedCriteriaCount" INTEGER NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeHash" TEXT,
    "afterHash" TEXT,
    "payloadJson" TEXT NOT NULL,
    "clientTimestamp" TIMESTAMP(3),
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "baseVersion" INTEGER NOT NULL,
    "clientSequence" INTEGER NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "serverVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QualificationVersion_externalCode_key" ON "QualificationVersion"("externalCode");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSession_sessionCode_key" ON "AssessmentSession"("sessionCode");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_captureId_key" ON "Evidence"("captureId");

-- CreateIndex
CREATE UNIQUE INDEX "CriterionAssessment_assessmentId_criterionId_key" ON "CriterionAssessment"("assessmentId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncEvent_eventId_key" ON "SyncEvent"("eventId");

-- AddForeignKey
ALTER TABLE "NOS" ADD CONSTRAINT "NOS_qualificationVersionId_fkey" FOREIGN KEY ("qualificationVersionId") REFERENCES "QualificationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Criterion" ADD CONSTRAINT "Criterion_nosId_fkey" FOREIGN KEY ("nosId") REFERENCES "NOS"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Criterion" ADD CONSTRAINT "Criterion_qualificationVersionId_fkey" FOREIGN KEY ("qualificationVersionId") REFERENCES "QualificationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentScheme" ADD CONSTRAINT "AssessmentScheme_qualificationVersionId_fkey" FOREIGN KEY ("qualificationVersionId") REFERENCES "QualificationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceStatement" ADD CONSTRAINT "ExperienceStatement_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_qualificationVersionId_fkey" FOREIGN KEY ("qualificationVersionId") REFERENCES "QualificationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSession" ADD CONSTRAINT "AssessmentSession_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AssessmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("siteId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceTrace" ADD CONSTRAINT "EvidenceTrace_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceTrace" ADD CONSTRAINT "EvidenceTrace_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIObservation" ADD CONSTRAINT "AIObservation_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionAssessment" ADD CONSTRAINT "CriterionAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriterionAssessment" ADD CONSTRAINT "CriterionAssessment_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "Criterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreSnapshot" ADD CONSTRAINT "ScoreSnapshot_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationSnapshot" ADD CONSTRAINT "RecommendationSnapshot_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
