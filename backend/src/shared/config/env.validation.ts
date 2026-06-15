import * as Joi from 'joi';

const weakSecrets = ['dev-secret-change-me', 'your-super-secret-jwt-key-change-in-production'];

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
  JWT_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .min(32)
      .invalid(...weakSecrets)
      .required(),
    otherwise: Joi.string().default('dev-secret-change-me'),
  }),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_SECRET: Joi.string().allow('').default(''),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  ENABLE_SWAGGER: Joi.boolean().truthy('true').falsy('false').default(false),
  ALLOW_PUBLIC_OPERATIONS: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.boolean().valid(false),
    }),
});
