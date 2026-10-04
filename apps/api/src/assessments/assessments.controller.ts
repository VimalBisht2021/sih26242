import {
  Controller,
  Get,
  Post,
  Body,
  Param
} from '@nestjs/common';
import {
  AssessmentsService,
  CreateAssessmentDto,
  PathwayOverrideDto,
  RecommendationDecisionDto,
  FinalizeAssessmentDto
} from './assessments.service.js';


@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  async createAssessment(@Body() dto: CreateAssessmentDto) {
    const assessment = await this.assessmentsService.createAssessment(dto);
    return { success: true, assessment };
  }

  @Get()
  async listAssessments() {
    const assessments = await this.assessmentsService.listAssessments();
    return { success: true, count: assessments.length, assessments };
  }

  @Get(':id')
  async getAssessment(@Param('id') id: string) {
    const assessment = await this.assessmentsService.getAssessment(id);
    return { success: true, assessment };
  }

  @Post(':id/start')
  async startAssessment(
    @Param('id') id: string,
    @Body() body: { assessorId: string; deviceId?: string }
  ) {
    const result = await this.assessmentsService.startAssessment(
      id,
      body.assessorId,
      body.deviceId
    );
    return result;
  }

  @Get(':id/profile')
  async getProfile(@Param('id') id: string) {
    const profile = await this.assessmentsService.getProfile(id);
    return { success: true, profile };
  }

  @Get(':id/recommendation')
  async getRecommendation(@Param('id') id: string) {
    const recommendation = await this.assessmentsService.getRecommendation(id);
    return { success: true, recommendation };
  }

  @Post(':id/pathway-override')
  async applyPathwayOverride(
    @Param('id') id: string,
    @Body() dto: PathwayOverrideDto
  ) {
    const result = await this.assessmentsService.applyPathwayOverride(id, dto);
    return result;
  }

  @Post(':id/recommendation-decision')
  async applyRecommendationDecision(
    @Param('id') id: string,
    @Body() dto: RecommendationDecisionDto
  ) {
    const result = await this.assessmentsService.applyRecommendationDecision(id, dto);
    return result;
  }


  @Get(':id/evidence-integrity')
  async getEvidenceIntegrity(@Param('id') id: string) {
    const integrity = await this.assessmentsService.getEvidenceIntegrity(id);
    return { success: true, integrity };
  }

  @Post(':id/finalize')
  async finalizeAssessment(
    @Param('id') id: string,
    @Body() dto: FinalizeAssessmentDto
  ) {
    const result = await this.assessmentsService.finalizeAssessment(id, dto);
    return result;
  }
}

