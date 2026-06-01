process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://nokta:nokta_secret@localhost:5432/nokta_test?schema=public';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret-minimum-32-chars';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-minimum-32-chars';
process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
