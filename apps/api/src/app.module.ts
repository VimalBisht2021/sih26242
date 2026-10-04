import { Module } from '@nestjs/common';
import { QualificationsModule } from './qualifications/qualifications.module.js';
import { CandidatesModule } from './candidates/candidates.module.js';
import { MappingModule } from './mapping/mapping.module.js';
import { AssessmentsModule } from './assessments/assessments.module.js';
import { CriteriaModule } from './criteria/criteria.module.js';
import { EvidenceModule } from './evidence/evidence.module.js';
import { SyncModule } from './sync/sync.module.js';
import { AIModule } from './ai/ai.module.js';
import { ImportsModule } from './imports/imports.module.js';
import { EvaluationModule } from './evaluation/evaluation.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    QualificationsModule,
    CandidatesModule,
    MappingModule,
    AssessmentsModule,
    CriteriaModule,
    EvidenceModule,
    SyncModule,
    AIModule,
    ImportsModule,
    EvaluationModule,
    HealthModule
  ]
})
export class AppModule {}
