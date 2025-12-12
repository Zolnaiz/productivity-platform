import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  // App configuration
  get appName(): string {
    return this.configService.get<string>('app.name');
  }

  get appVersion(): string {
    return this.configService.get<string>('app.version');
  }

  get port(): number {
    return this.configService.get<number>('app.port');
  }

  get environment(): string {
    return this.configService.get<string>('app.environment');
  }

  get isDevelopment(): boolean {
    return this.environment === 'development';
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  get isTest(): boolean {
    return this.environment === 'test';
  }

  // Database configuration
  get databaseHost(): string {
    return this.configService.get<string>('database.host');
  }

  get databasePort(): number {
    return this.configService.get<number>('database.port');
  }

  get databaseUsername(): string {
    return this.configService.get<string>('database.username');
  }

  get databasePassword(): string {
    return this.configService.get<string>('database.password');
  }

  get databaseName(): string {
    return this.configService.get<string>('database.database');
  }

  get databaseSynchronize(): boolean {
    return this.configService.get<boolean>('database.synchronize');
  }

  get databaseLogging(): boolean {
    return this.configService.get<boolean>('database.logging');
  }

  get databaseSsl(): boolean {
    return this.configService.get<boolean>('database.ssl');
  }

  // JWT configuration
  get jwtSecret(): string {
    return this.configService.get<string>('jwt.secret');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('jwt.expiresIn');
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>('jwt.refreshSecret');
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('jwt.refreshExpiresIn');
  }

  // Security configuration
  get bcryptRounds(): number {
    return this.configService.get<number>('security.bcryptRounds');
  }

  get corsOrigins(): string[] {
    return this.configService.get<string[]>('security.corsOrigins');
  }

  get rateLimitTtl(): number {
    return this.configService.get<number>('security.rateLimit.ttl');
  }

  get rateLimitLimit(): number {
    return this.configService.get<number>('security.rateLimit.limit');
  }

  // File upload configuration
  get maxFileSize(): number {
    return this.configService.get<number>('upload.maxFileSize');
  }

  get allowedMimeTypes(): string[] {
    return this.configService.get<string[]>('upload.allowedMimeTypes');
  }

  get uploadPath(): string {
    return this.configService.get<string>('upload.uploadPath');
  }

  // Email configuration
  get emailHost(): string {
    return this.configService.get<string>('email.host');
  }

  get emailPort(): number {
    return this.configService.get<number>('email.port');
  }

  get emailSecure(): boolean {
    return this.configService.get<boolean>('email.secure');
  }

  get emailUser(): string {
    return this.configService.get<string>('email.auth.user');
  }

  get emailPass(): string {
    return this.configService.get<string>('email.auth.pass');
  }

  get emailFrom(): string {
    return this.configService.get<string>('email.from');
  }

  // Redis configuration
  get redisHost(): string {
    return this.configService.get<string>('redis.host');
  }

  get redisPort(): number {
    return this.configService.get<number>('redis.port');
  }

  get redisPassword(): string {
    return this.configService.get<string>('redis.password');
  }

  get redisTtl(): number {
    return this.configService.get<number>('redis.ttl');
  }

  // Logging configuration
  get logLevel(): string {
    return this.configService.get<string>('logging.level');
  }

  get logFile(): string {
    return this.configService.get<string>('logging.file');
  }

  get logMaxFiles(): number {
    return this.configService.get<number>('logging.maxFiles');
  }

  get logMaxSize(): string {
    return this.configService.get<string>('logging.maxSize');
  }

  // Monitoring configuration
  get sentryDsn(): string {
    return this.configService.get<string>('monitoring.sentryDsn');
  }

  get enableMetrics(): boolean {
    return this.configService.get<boolean>('monitoring.enableMetrics');
  }

  get metricsPort(): number {
    return this.configService.get<number>('monitoring.metricsPort');
  }

  // Feature flags
  get enableRegistration(): boolean {
    return this.configService.get<boolean>('features.enableRegistration');
  }

  get enableEmailVerification(): boolean {
    return this.configService.get<boolean>('features.enableEmailVerification');
  }

  get enableSocialLogin(): boolean {
    return this.configService.get<boolean>('features.enableSocialLogin');
  }

  get enableTwoFactor(): boolean {
    return this.configService.get<boolean>('features.enableTwoFactor');
  }

  get enableApiDocs(): boolean {
    return this.configService.get<boolean>('features.enableApiDocs');
  }

  // Business rules
  get maxQuestionnairesPerOrg(): number {
    return this.configService.get<number>('business.maxQuestionnairesPerOrg');
  }

  get maxQuestionsPerQuestionnaire(): number {
    return this.configService.get<number>('business.maxQuestionsPerQuestionnaire');
  }

  get maxExpenseAmount(): number {
    return this.configService.get<number>('business.maxExpenseAmount');
  }

  get reportRetentionDays(): number {
    return this.configService.get<number>('business.reportRetentionDays');
  }

  get passwordMinLength(): number {
    return this.configService.get<number>('business.passwordMinLength');
  }

  // Helper methods
  getDatabaseUrl(): string {
    const { databaseUsername, databasePassword, databaseHost, databasePort, databaseName, databaseSsl } = this;
    
    const credentials = databaseUsername && databasePassword 
      ? `${databaseUsername}:${databasePassword}@`
      : '';
    
    const ssl = databaseSsl ? '?sslmode=require' : '';
    
    return `postgresql://${credentials}${databaseHost}:${databasePort}/${databaseName}${ssl}`;
  }

  getFrontendUrl(): string {
    return this.configService.get<string>('app.frontendUrl');
  }

  getBackendUrl(): string {
    return this.configService.get<string>('app.backendUrl');
  }

  getApiUrl(path: string = ''): string {
    return `${this.getBackendUrl()}/api${path}`;
  }

  getCorsConfig() {
    return {
      origin: this.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    };
  }

  validateConfig(): void {
    const required = [
      'jwt.secret',
      'database.host',
      'database.database',
    ];

    for (const key of required) {
      const value = this.configService.get(key);
      if (!value) {
        throw new Error(`Configuration key "${key}" is required`);
      }
    }

    if (this.isProduction) {
      const productionRequired = [
        'jwt.secret',
        'jwt.refreshSecret',
        'database.password',
      ];

      for (const key of productionRequired) {
        const value = this.configService.get(key);
        if (!value || value.includes('change-in-production')) {
          throw new Error(`Production configuration key "${key}" must be properly set`);
        }
      }
    }
  }
}