import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface StoredFileResult {
  storageKey: string;
  absolutePath: string;
  sizeBytes: number;
  mimeType: string;
}

@Injectable()
export class EvidenceStorageService {
  private readonly storageRoot: string;

  constructor() {
    let configuredRoot = process.env.EVIDENCE_STORAGE_DIR || path.resolve(process.cwd(), 'storage/evidence');
    try {
      this.ensureDirectory(configuredRoot);
      const testFile = path.join(configuredRoot, '.write_test');
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      this.storageRoot = configuredRoot;
    } catch (err: any) {
      console.warn(`[EvidenceStorageService] Configured storage root ${configuredRoot} is not writable (${err?.message}). Falling back to /tmp/storage/evidence`);
      this.storageRoot = '/tmp/storage/evidence';
      this.ensureDirectory(this.storageRoot);
    }

    try {
      this.ensureDemoFixtures();
    } catch (demoErr: any) {
      console.warn(`[EvidenceStorageService] Warning: Could not initialize demo fixtures: ${demoErr?.message}`);
    }
  }

  private ensureDemoFixtures(): void {
    const demoDir = path.join(this.storageRoot, 'demo');
    this.ensureDirectory(demoDir);

    const validJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x03, 0x02, 0x02, 0x03, 0x02, 0x02, 0x03, 0x03, 0x03, 0x03, 0x04,
      0x06, 0x04, 0x04, 0x04, 0x04, 0x04, 0x08, 0x06, 0x06, 0x05, 0x06, 0x09,
      0x08, 0x0a, 0x0a, 0x09, 0x08, 0x09, 0x09, 0x0a, 0x0c, 0x0f, 0x0c, 0x0a,
      0x0b, 0x0e, 0x0b, 0x09, 0x09, 0x0d, 0x11, 0x0d, 0x0e, 0x0f, 0x10, 0x10,
      0x11, 0x10, 0x0a, 0x0c, 0x12, 0x13, 0x12, 0x10, 0x13, 0x0f, 0x10, 0x10,
      0x10, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
      0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff,
      0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0x80, 0xff,
      0xd9
    ]);

    const validMp4 = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
      0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
      0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65
    ]);

    const demoFiles: Record<string, Buffer> = {
      'task1_prep.jpg': validJpeg,
      'task4_inspection.jpg': validJpeg,
      'task2_safety.mp4': validMp4,
      'task3_stitching.mp4': validMp4,
      'task5_problem_solving.mp4': validMp4
    };

    for (const [filename, content] of Object.entries(demoFiles)) {
      const filePath = path.join(demoDir, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, content);
      }
    }
  }

  public getStorageRoot(): string {
    return this.storageRoot;
  }

  private ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private sanitizeIdentifier(id: string): string {
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('Invalid storage identifier: identifier must be a non-empty string.');
    }
    // Allow alphanumeric characters, hyphens, and underscores only
    const sanitized = id.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitized) {
      throw new BadRequestException('Invalid storage identifier after sanitization.');
    }
    return sanitized;
  }

  public validateFileBuffer(buffer: Buffer, declaredMimeType: string): { extension: string; mimeType: string } {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Evidence upload error: Received empty file payload.');
    }

    const maxSize = 25 * 1024 * 1024; // 25 MB
    if (buffer.length > maxSize) {
      throw new BadRequestException(`Evidence upload error: File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed limit of 25 MB.`);
    }

    // Magic bytes verification
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return { extension: 'jpg', mimeType: 'image/jpeg' };
    }

    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return { extension: 'png', mimeType: 'image/png' };
    }

    // WEBP: RIFF....WEBP (52 49 46 46 ... 57 45 42 50)
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return { extension: 'webp', mimeType: 'image/webp' };
    }

    // WEBM: 1A 45 DF A3
    if (buffer.length >= 4 && buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
      return { extension: 'webm', mimeType: 'video/webm' };
    }

    // MP4: 'ftyp' at offset 4
    if (buffer.length >= 12) {
      const ftypTag = buffer.toString('latin1', 4, 8);
      if (ftypTag === 'ftyp') {
        return { extension: 'mp4', mimeType: 'video/mp4' };
      }
    }

    // Fallback: If declared MIME is an acceptable media type, verify extension
    if (declaredMimeType) {
      const norm = declaredMimeType.toLowerCase().trim();
      if (norm === 'image/jpeg' || norm === 'image/jpg') return { extension: 'jpg', mimeType: 'image/jpeg' };
      if (norm === 'image/png') return { extension: 'png', mimeType: 'image/png' };
      if (norm === 'image/webp') return { extension: 'webp', mimeType: 'image/webp' };
      if (norm === 'video/mp4') return { extension: 'mp4', mimeType: 'video/mp4' };
      if (norm === 'video/webm') return { extension: 'webm', mimeType: 'video/webm' };
    }

    throw new BadRequestException(
      `Unsupported media format. Allowed formats: JPEG, PNG, WebP, MP4, WebM. Received: ${declaredMimeType || 'unknown'}`
    );
  }

  public async saveEvidenceFile(
    assessmentId: string,
    taskCode: string,
    evidenceId: string,
    extension: string,
    buffer: Buffer
  ): Promise<StoredFileResult> {
    const safeAssessmentId = this.sanitizeIdentifier(assessmentId);
    const safeTaskCode = this.sanitizeIdentifier(taskCode);
    const safeEvidenceId = this.sanitizeIdentifier(evidenceId);
    const safeExt = this.sanitizeIdentifier(extension);

    const relativeDir = path.join(safeAssessmentId, safeTaskCode);
    const targetDir = path.join(this.storageRoot, relativeDir);
    this.ensureDirectory(targetDir);

    const filename = `${safeEvidenceId}.${safeExt}`;
    const absolutePath = path.join(targetDir, filename);

    await fs.promises.writeFile(absolutePath, buffer);

    const storageKey = `/evidence/${safeAssessmentId}/${safeTaskCode}/${filename}`;
    const stats = await fs.promises.stat(absolutePath);

    return {
      storageKey,
      absolutePath,
      sizeBytes: stats.size,
      mimeType: this.getMimeTypeForExt(safeExt)
    };
  }

  public resolvePathFromStorageKey(storageKey: string): string | null {
    if (!storageKey || typeof storageKey !== 'string') return null;

    // Handle standard storage key: /evidence/<assessmentId>/<taskCode>/<filename>
    if (storageKey.startsWith('/evidence/')) {
      const parts = storageKey.replace('/evidence/', '').split('/').filter(Boolean);
      if (parts.length >= 3) {
        const safeParts = parts.map(p => this.sanitizeIdentifier(p.replace(/\.[^.]+$/, '')) + (p.includes('.') ? path.extname(p) : ''));
        const resolved = path.join(this.storageRoot, ...safeParts);
        // Path traversal guard: must be inside storageRoot
        if (path.resolve(resolved).startsWith(path.resolve(this.storageRoot))) {
          return resolved;
        }
      }
    }

    // Handle demo media paths: /media/demo/<filename>
    if (storageKey.startsWith('/media/demo/')) {
      const filename = path.basename(storageKey);
      const demoPath = path.join(this.storageRoot, 'demo', filename);
      if (fs.existsSync(demoPath)) {
        return demoPath;
      }
    }

    return null;
  }

  public async getEvidenceFile(storageKey: string): Promise<{ buffer: Buffer; mimeType: string; sizeBytes: number } | null> {
    const absPath = this.resolvePathFromStorageKey(storageKey);
    if (!absPath || !fs.existsSync(absPath)) {
      return null;
    }

    const buffer = await fs.promises.readFile(absPath);
    const ext = path.extname(absPath).replace('.', '');
    const mimeType = this.getMimeTypeForExt(ext);

    return {
      buffer,
      mimeType,
      sizeBytes: buffer.length
    };
  }

  public getMimeTypeForExt(ext: string): string {
    const norm = ext.toLowerCase();
    switch (norm) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      default:
        return 'application/octet-stream';
    }
  }
}
