import {
  QualificationVersion,
  NOS,
  Criterion,
  AssessmentScheme,
  AssessmentPolicy,
  AssessmentTask
} from '@sih26242/contracts';
import {
  SEWING_MACHINE_OPERATOR_QP,
  SEWING_MACHINE_OPERATOR_NOS,
  SEWING_MACHINE_OPERATOR_CRITERIA,
  SEWING_MACHINE_OPERATOR_SCHEME,
  RPL_A_POLICY,
  SEWING_MACHINE_OPERATOR_TASKS
} from './target-qp.js';
import { QUALIFICATION_POOL } from './pool.js';

export interface QualificationPackage {
  qualification: QualificationVersion;
  nos: NOS[];
  criteria: Criterion[];
  scheme: AssessmentScheme;
  policy: AssessmentPolicy;
  tasks: AssessmentTask[];
}

export class QualificationRepository {
  private static packages: Map<string, QualificationPackage> = new Map();

  static {
    // Register target QP
    QualificationRepository.registerPackage({
      qualification: SEWING_MACHINE_OPERATOR_QP,
      nos: SEWING_MACHINE_OPERATOR_NOS,
      criteria: SEWING_MACHINE_OPERATOR_CRITERIA,
      scheme: SEWING_MACHINE_OPERATOR_SCHEME,
      policy: RPL_A_POLICY,
      tasks: SEWING_MACHINE_OPERATOR_TASKS
    });
  }

  static registerPackage(pkg: QualificationPackage) {
    this.packages.set(pkg.qualification.id, pkg);
    this.packages.set(pkg.qualification.externalCode, pkg);
  }

  static getPackage(idOrCode: string): QualificationPackage | undefined {
    return this.packages.get(idOrCode);
  }

  static getPool(): QualificationVersion[] {
    return QUALIFICATION_POOL;
  }

  static getLiveDemoPool(): {
    target: QualificationVersion;
    distractors: QualificationVersion[];
  } {
    return {
      target: SEWING_MACHINE_OPERATOR_QP,
      distractors: QUALIFICATION_POOL.filter(
        q => q.externalCode === 'AMH/Q1001' || q.externalCode === 'AMH/Q1947' || q.externalCode === 'ELE/Q6001'
      )
    };
  }
}
