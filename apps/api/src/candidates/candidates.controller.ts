import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param
} from '@nestjs/common';
import {
  CandidatesService,
  CreateCandidateDto,
  AddExperienceDto
} from './candidates.service.js';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  async createCandidate(@Body() dto: CreateCandidateDto) {
    const candidate = await this.candidatesService.createCandidate(dto);
    return { success: true, candidate };
  }

  @Get()
  async listCandidates() {
    const candidates = await this.candidatesService.listCandidates();
    return { success: true, count: candidates.length, candidates };
  }

  @Get(':id')
  async getCandidate(@Param('id') id: string) {
    const candidate = await this.candidatesService.getCandidate(id);
    return { success: true, candidate };
  }

  @Patch(':id')
  async updateCandidate(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCandidateDto>
  ) {
    const candidate = await this.candidatesService.updateCandidate(id, dto);
    return { success: true, candidate };
  }

  @Post(':id/experience')
  async addExperience(
    @Param('id') id: string,
    @Body() dto: AddExperienceDto
  ) {
    const statement = await this.candidatesService.addExperience(id, dto);
    return { success: true, statement };
  }
}
