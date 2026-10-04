import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EvidenceService, SubmitEvidenceDto, UploadEvidenceDto } from './evidence.service.js';

@Controller('assessments')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  /**
   * Real multipart evidence upload endpoint.
   * Receives actual binary file payload, validates magic bytes, computes server SHA-256,
   * performs strict client-vs-server hash comparison, stores media, and creates Evidence DB record.
   */
  @Post(':id/tasks/:taskId/evidence/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
    })
  )
  async uploadEvidence(
    @Param('id') assessmentId: string,
    @Param('taskId') taskId: string,
    @UploadedFile() file: any,
    @Body() dto: UploadEvidenceDto
  ) {
    const result = await this.evidenceService.uploadEvidence(assessmentId, taskId, file, dto);
    return result;
  }

  /**
   * Secure evidence media retrieval endpoint.
   * Serves actual persisted image or video buffer with verified MIME type and SHA-256 ETag.
   */
  @Get(':id/evidence/:evidenceId/file')
  async getEvidenceFile(
    @Param('id') assessmentId: string,
    @Param('evidenceId') evidenceId: string,
    @Res() res: any
  ) {
    const fileResult = await this.evidenceService.getEvidenceFile(assessmentId, evidenceId);

    res.set({
      'Content-Type': fileResult.mimeType,
      'Content-Length': fileResult.sizeBytes.toString(),
      'ETag': `"${fileResult.sha256}"`,
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': `inline; filename="${fileResult.filename}"`
    });

    return res.status(HttpStatus.OK).send(fileResult.buffer);
  }

  /**
   * Backward-compatible JSON evidence submission endpoint.
   */
  @Post(':id/tasks/:taskId/evidence')
  async submitEvidence(
    @Param('id') assessmentId: string,
    @Param('taskId') taskId: string,
    @Body() dto: SubmitEvidenceDto
  ) {
    const result = await this.evidenceService.submitEvidence(assessmentId, taskId, dto);
    return result;
  }
}
