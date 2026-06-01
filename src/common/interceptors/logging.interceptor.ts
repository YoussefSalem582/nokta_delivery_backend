import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) ?? randomUUID();
    response.setHeader('X-Correlation-Id', correlationId);

    const { method, originalUrl } = request;
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - started;
          this.logger.log(
            `${method} ${originalUrl} ${response.statusCode} ${durationMs}ms [${correlationId}]`,
          );
        },
        error: () => {
          const durationMs = Date.now() - started;
          this.logger.warn(
            `${method} ${originalUrl} ${response.statusCode} ${durationMs}ms [${correlationId}]`,
          );
        },
      }),
    );
  }
}
