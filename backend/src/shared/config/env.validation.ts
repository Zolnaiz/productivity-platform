import * as Joi from 'joi';

const weakSecrets = [
  'dev-secret-change-me',
  'your-super-secret-jwt-key-change-in-production',
  'your-refresh-secret-key-change-in-production',
];

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  RATE_LIMIT_TTL_MS: Joi.number().integer().min(1000).default(60000),
  RATE_LIMIT_LIMIT: Joi.number().integer().min(1).default(120),
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().allow('').default('postgres'),
  DB_DATABASE: Joi.string().default('questionnaire_db'),
  DB_SYNCHRONIZE: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.boolean().valid(false),
    }),
  DB_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_MIGRATIONS_RUN: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
  /*
    Where attachment bytes live.

    `local` writes to `UPLOAD_DIR`, which is correct for one machine with a
    real volume mounted there and wrong for a container that gets replaced —
    the photographs go and the rows that point at them stay. `s3` keeps them
    in an object store, which is the arrangement that survives a redeploy;
    `S3_ENDPOINT` points it at MinIO or Ceph on a customer's own hardware,
    for a plant that will not send its floor photographs to a public cloud.
  */
  ATTACHMENT_STORE: Joi.string().valid('local', 's3').default('local'),
  // Relative paths resolve from the backend's working directory.
  UPLOAD_DIR: Joi.string().default('./uploads'),
  // Required as soon as the object store is chosen, so a half-configured
  // bucket fails at startup rather than at the first upload.
  S3_BUCKET: Joi.string().allow('').default('').when('ATTACHMENT_STORE', {
    is: 's3',
    then: Joi.string().required(),
  }),
  S3_REGION: Joi.string().default('us-east-1'),
  S3_ENDPOINT: Joi.string().allow('').default(''),
  // MinIO and Ceph address buckets by path. Defaults to on when an endpoint
  // is given, which is the only reason to give one.
  S3_FORCE_PATH_STYLE: Joi.boolean().truthy('true').falsy('false'),
  // Left empty to use the SDK's own credential chain — an instance role or a
  // mounted credentials file — rather than writing a secret down twice.
  S3_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  S3_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  // The daily job that raises 5S audits whose frequency has come round. On by
  // default: a zone declaring a weekly audit should get one without anyone
  // remembering to press a button.
  ENABLE_AUDIT_SCHEDULER: Joi.boolean().truthy('true').falsy('false').default(true),
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .min(32)
      .invalid(...weakSecrets)
      .required(),
    otherwise: Joi.string().default('dev-secret-change-me'),
  }),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string()
    .allow('')
    .default('')
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.string()
        .allow('')
        .min(32)
        .invalid(...weakSecrets),
    }),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  ENABLE_SWAGGER: Joi.boolean().truthy('true').falsy('false').default(false),
  ENABLE_METRICS: Joi.boolean().truthy('true').falsy('false').default(false),
  ALLOW_PUBLIC_OPERATIONS: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.boolean().valid(false),
    }),
});
