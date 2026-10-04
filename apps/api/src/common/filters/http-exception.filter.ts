import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { logger } from '@sih26242/shared';

interface HttpResponse {
  req?: { url?: string };
  status(code: number): {
    json(body: unknown): void;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponse>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.message || exception.message
        : 'Internal server error occurred';

    const code =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.error || 'HTTP_ERROR'
        : 'INTERNAL_ERROR';

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    logger.error(`API Exception on ${response.req?.url}`, exception, {
      data: { status, message, code, requestId }
    });

    response.status(status).json({
      success: false,
      code,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      userActionGuidance:
        status === 401
          ? 'Offline authorization expired or invalid credentials. Reconnect and re-authenticate.'
          : status === 409
          ? 'Concurrent state mutation detected. Please reload current assessment state.'
          : 'Check request parameters or review system documentation.'
    });
  }
}
