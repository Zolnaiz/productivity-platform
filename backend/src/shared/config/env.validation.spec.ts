import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  it('allows development defaults', () => {
    const result = envValidationSchema.validate({});

    expect(result.error).toBeUndefined();
    expect(result.value.NODE_ENV).toBe('development');
    expect(result.value.JWT_SECRET).toBe('dev-secret-change-me');
    expect(result.value.JWT_EXPIRES_IN).toBe('1h');
    expect(result.value.JWT_REFRESH_EXPIRES_IN).toBe('7d');
    expect(result.value.RATE_LIMIT_TTL_MS).toBe(60000);
    expect(result.value.RATE_LIMIT_LIMIT).toBe(120);
    expect(result.value.ENABLE_METRICS).toBe(false);
  });

  it('requires a strong JWT secret in production', () => {
    const result = envValidationSchema.validate({
      NODE_ENV: 'production',
      JWT_SECRET: 'dev-secret-change-me',
    });

    expect(result.error).toBeDefined();
  });

  it('accepts a strong JWT secret in production', () => {
    const result = envValidationSchema.validate({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-long-production-secret-with-at-least-32-chars',
    });

    expect(result.error).toBeUndefined();
  });

  it('rejects weak refresh secrets in production when explicitly configured', () => {
    const result = envValidationSchema.validate({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-long-production-secret-with-at-least-32-chars',
      JWT_REFRESH_SECRET: 'your-refresh-secret-key-change-in-production',
    });

    expect(result.error).toBeDefined();
  });

  it('allows an empty refresh secret in production so it can derive from JWT_SECRET', () => {
    const result = envValidationSchema.validate({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-long-production-secret-with-at-least-32-chars',
      JWT_REFRESH_SECRET: '',
    });

    expect(result.error).toBeUndefined();
  });

  it('rejects public operations access in production', () => {
    const result = envValidationSchema.validate({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-long-production-secret-with-at-least-32-chars',
      ALLOW_PUBLIC_OPERATIONS: 'true',
    });

    expect(result.error).toBeDefined();
  });

  it('rejects database synchronize in production', () => {
    const result = envValidationSchema.validate({
      NODE_ENV: 'production',
      JWT_SECRET: 'a-long-production-secret-with-at-least-32-chars',
      DB_SYNCHRONIZE: 'true',
    });

    expect(result.error).toBeDefined();
  });

  it('rejects invalid rate limit settings', () => {
    const result = envValidationSchema.validate({
      RATE_LIMIT_TTL_MS: 999,
      RATE_LIMIT_LIMIT: 0,
    });

    expect(result.error).toBeDefined();
  });

  it('keeps attachments on local disk when nothing says otherwise', () => {
    const result = envValidationSchema.validate({});

    expect(result.error).toBeUndefined();
    expect(result.value.ATTACHMENT_STORE).toBe('local');
    expect(result.value.UPLOAD_DIR).toBe('./uploads');
  });

  it('refuses an object store with no bucket named', () => {
    // A half-configured store has to fail at startup. The alternative is a
    // deployment that looks healthy until somebody photographs a red tag.
    const result = envValidationSchema.validate({ ATTACHMENT_STORE: 's3' });

    expect(result.error).toBeDefined();
  });

  it("accepts an object store on a customer's own hardware", () => {
    const result = envValidationSchema.validate({
      ATTACHMENT_STORE: 's3',
      S3_BUCKET: 'evidence',
      S3_ENDPOINT: 'https://minio.plant.local',
    });

    expect(result.error).toBeUndefined();
  });

  it('refuses a store nobody has written', () => {
    const result = envValidationSchema.validate({ ATTACHMENT_STORE: 'dropbox' });

    expect(result.error).toBeDefined();
  });
});
