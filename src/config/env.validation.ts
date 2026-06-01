import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL!: string;

  @IsNotEmpty()
  @IsString()
  JWT_ACCESS_SECRET!: string;

  @IsNotEmpty()
  @IsString()
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsString()
  REDIS_PORT?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  const nodeEnv = (validated.NODE_ENV ?? 'development').toLowerCase();
  if (nodeEnv === 'production') {
    const missing: string[] = [];
    if (!validated.REDIS_HOST?.trim()) {
      missing.push('REDIS_HOST');
    }
    if (!validated.REDIS_PORT?.trim()) {
      missing.push('REDIS_PORT');
    }
    if (missing.length > 0) {
      throw new Error(
        `Environment validation failed: required in production: ${missing.join(', ')}`,
      );
    }
  }

  return validated;
}
