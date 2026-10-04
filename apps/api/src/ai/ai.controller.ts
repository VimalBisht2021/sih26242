import { Controller, Post, Body } from '@nestjs/common';
import {
  AIService,
  TranscribeDto,
  AnalyzeEvidenceDto,
  LinkEvidenceDto,
  SuggestScoreDto
} from './ai.service.js';

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('transcribe')
  async transcribe(@Body() dto: TranscribeDto) {
    const result = await this.aiService.transcribe(dto);
    return result;
  }

  @Post('analyze-evidence')
  async analyzeEvidence(@Body() dto: AnalyzeEvidenceDto) {
    const result = await this.aiService.analyzeEvidence(dto);
    return result;
  }

  @Post('link-evidence')
  async linkEvidence(@Body() dto: LinkEvidenceDto) {
    const result = await this.aiService.linkEvidence(dto);
    return result;
  }

  @Post('suggest-score')
  async suggestScore(@Body() dto: SuggestScoreDto) {
    const result = await this.aiService.suggestScore(dto);
    return result;
  }
}
