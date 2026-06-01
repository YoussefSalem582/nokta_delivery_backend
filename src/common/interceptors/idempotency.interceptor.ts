import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of, from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../database/redis.constants';
import { MessageKeys } from '../messages/message-keys';
import { buildResponse } from '../responses/api-response';

const IDEMPOTENCY_HEADER = 'idempotency-key';
const CACHE_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; headers: Record<string, string>; user?: { sub: string } }>();

    const method = request.method.toUpperCase();
    if (!['POST', 'PATCH', 'PUT'].includes(method)) {
      return next.handle();
    }

    const idempotencyKey =
      request.headers[IDEMPOTENCY_HEADER] ?? request.headers['Idempotency-Key'];
    if (!idempotencyKey) {
      return next.handle();
    }

    const userId = request.user?.sub ?? 'anonymous';
    const cacheKey = `idempotency:${userId}:${idempotencyKey}`;

    return from(this.redis.get(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          const parsed = JSON.parse(cached) as { body: unknown };
          return of({
            ...buildResponse(MessageKeys.SYNC.DUPLICATE, parsed.body),
            _idempotentReplay: true,
          });
        }

        return next.handle().pipe(
          tap((body: unknown) => {
            void this.redis.set(cacheKey, JSON.stringify({ body }), 'EX', CACHE_TTL_SECONDS);
          }),
        );
      }),
    );
  }
}
