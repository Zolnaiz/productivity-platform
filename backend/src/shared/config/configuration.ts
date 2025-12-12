import configuration from './shared/config/configuration';
export default () => ({
  // App configuration
  app: {
    name: process.env.APP_NAME || 'Questionnaire Management System',
    version: process.env.APP_VERSION || '1.0.0',
    port: parseInt(process.env.PORT, 10) || 3000,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'questionnaire_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true',
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3001'],
    rateLimit: {
      ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
      limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
    },
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES
      ? process.env.ALLOWED_MIME_TYPES.split(',')
      : [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'user@gmail.com',
      pass: process.env.EMAIL_PASS || 'password',
    },
    from: process.env.EMAIL_FROM || 'noreply@questionnaire.com',
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: parseInt(process.env.REDIS_TTL, 10) || 3600,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 14,
    maxSize: process.env.LOG_MAX_SIZE || '20m',
  },

  // Monitoring configuration
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT, 10) || 9090,
  },

  // Third-party services
  services: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      s3Bucket: process.env.AWS_S3_BUCKET,
    },
  },

  // Feature flags
  features: {
    enableRegistration: process.env.ENABLE_REGISTRATION !== 'false',
    enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    enableSocialLogin: process.env.ENABLE_SOCIAL_LOGIN === 'true',
    enableTwoFactor: process.env.ENABLE_TWO_FACTOR === 'true',
    enableApiDocs: process.env.ENABLE_API_DOCS !== 'false',
  },

  // Business rules
  business: {
    maxQuestionnairesPerOrg: parseInt(process.env.MAX_QUESTIONNAIRES_PER_ORG, 10) || 100,
    maxQuestionsPerQuestionnaire: parseInt(process.env.MAX_QUESTIONS_PER_QUESTIONNAIRE, 10) || 50,
    maxExpenseAmount: parseInt(process.env.MAX_EXPENSE_AMOUNT, 10) || 1000000000,
    reportRetentionDays: parseInt(process.env.REPORT_RETENTION_DAYS, 10) || 365,
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
  },
});