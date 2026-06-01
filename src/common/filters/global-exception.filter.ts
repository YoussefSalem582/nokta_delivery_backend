import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { MessageKeys } from '../messages/message-keys';
import { buildErrorResponse } from '../responses/api-response';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ThrottlerException) {
      response
        .status(HttpStatus.TOO_MANY_REQUESTS)
        .json(buildErrorResponse(MessageKeys.COMMON.RATE_LIMIT));
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as Record<string, unknown>;
        if (body.messageKey) {
          response.status(status).json(body);
          return;
        }
      }

      const messageKey =
        status === Number(HttpStatus.UNAUTHORIZED)
          ? MessageKeys.AUTH.UNAUTHORIZED
          : MessageKeys.COMMON.VALIDATION_ERROR;

      response.status(status).json(buildErrorResponse(messageKey));
      return;
    }

    this.logger.error(exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(buildErrorResponse(MessageKeys.COMMON.INTERNAL_ERROR));
  }
}
