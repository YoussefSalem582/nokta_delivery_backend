import { IdempotencyInterceptor } from './idempotency.interceptor';
import { of, lastValueFrom } from 'rxjs';

describe('IdempotencyInterceptor', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
  };

  const interceptor = new IdempotencyInterceptor(mockRedis as never);

  const createContext = (headers: Record<string, string>, user?: { sub: string }) => ({
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        headers,
        user,
      }),
    }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes through when no idempotency key is provided', async () => {
    const result = await lastValueFrom(
      interceptor.intercept(createContext({}) as never, {
        handle: () => of({ ok: true }),
      }),
    );

    expect(result).toEqual({ ok: true });
    expect(mockRedis.get).not.toHaveBeenCalled();
  });

  it('returns cached response for duplicate requests', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ body: { id: 'ride-1' } }));

    const result = await lastValueFrom(
      interceptor.intercept(
        createContext({ 'idempotency-key': 'abc-123' }, { sub: 'user-1' }) as never,
        { handle: () => of({ id: 'ride-new' }) },
      ),
    );

    expect(result).toMatchObject({
      success: true,
      messageKey: 'sync.duplicate',
      data: { id: 'ride-1' },
    });
  });

  it('caches successful responses', async () => {
    mockRedis.get.mockResolvedValue(null);

    await lastValueFrom(
      interceptor.intercept(
        createContext({ 'idempotency-key': 'abc-456' }, { sub: 'user-2' }) as never,
        { handle: () => of({ id: 'ride-2' }) },
      ),
    );

    expect(mockRedis.set).toHaveBeenCalledWith(
      'idempotency:user-2:abc-456',
      JSON.stringify({ body: { id: 'ride-2' } }),
      'EX',
      86400,
    );
  });
});
