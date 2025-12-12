"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
var common_1 = require("@nestjs/common");
var ConfigService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var ConfigService = _classThis = /** @class */ (function () {
        function ConfigService_1(configService) {
            this.configService = configService;
        }
        Object.defineProperty(ConfigService_1.prototype, "appName", {
            // App configuration
            get: function () {
                return this.configService.get('app.name');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "appVersion", {
            get: function () {
                return this.configService.get('app.version');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "port", {
            get: function () {
                return this.configService.get('app.port');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "environment", {
            get: function () {
                return this.configService.get('app.environment');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "isDevelopment", {
            get: function () {
                return this.environment === 'development';
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "isProduction", {
            get: function () {
                return this.environment === 'production';
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "isTest", {
            get: function () {
                return this.environment === 'test';
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "databaseHost", {
            // Database configuration
            get: function () {
                return this.configService.get('database.host');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "databasePort", {
            get: function () {
                return this.configService.get('database.port');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "databaseUsername", {
            get: function () {
                return this.configService.get('database.username');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "databasePassword", {
            get: function () {
                return this.configService.get('database.password');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "databaseName", {
            get: function () {
                return this.configService.get('database.database');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "databaseSynchronize", {
            get: function () {
                return this.configService.get('database.synchronize');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "databaseLogging", {
            get: function () {
                return this.configService.get('database.logging');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "databaseSsl", {
            get: function () {
                return this.configService.get('database.ssl');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "jwtSecret", {
            // JWT configuration
            get: function () {
                return this.configService.get('jwt.secret');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "jwtExpiresIn", {
            get: function () {
                return this.configService.get('jwt.expiresIn');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "jwtRefreshSecret", {
            get: function () {
                return this.configService.get('jwt.refreshSecret');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "jwtRefreshExpiresIn", {
            get: function () {
                return this.configService.get('jwt.refreshExpiresIn');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "bcryptRounds", {
            // Security configuration
            get: function () {
                return this.configService.get('security.bcryptRounds');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "corsOrigins", {
            get: function () {
                return this.configService.get('security.corsOrigins');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "rateLimitTtl", {
            get: function () {
                return this.configService.get('security.rateLimit.ttl');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "rateLimitLimit", {
            get: function () {
                return this.configService.get('security.rateLimit.limit');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "maxFileSize", {
            // File upload configuration
            get: function () {
                return this.configService.get('upload.maxFileSize');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "allowedMimeTypes", {
            get: function () {
                return this.configService.get('upload.allowedMimeTypes');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "uploadPath", {
            get: function () {
                return this.configService.get('upload.uploadPath');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "emailHost", {
            // Email configuration
            get: function () {
                return this.configService.get('email.host');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "emailPort", {
            get: function () {
                return this.configService.get('email.port');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "emailSecure", {
            get: function () {
                return this.configService.get('email.secure');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "emailUser", {
            get: function () {
                return this.configService.get('email.auth.user');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "emailPass", {
            get: function () {
                return this.configService.get('email.auth.pass');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "emailFrom", {
            get: function () {
                return this.configService.get('email.from');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "redisHost", {
            // Redis configuration
            get: function () {
                return this.configService.get('redis.host');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "redisPort", {
            get: function () {
                return this.configService.get('redis.port');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "redisPassword", {
            get: function () {
                return this.configService.get('redis.password');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "redisTtl", {
            get: function () {
                return this.configService.get('redis.ttl');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "logLevel", {
            // Logging configuration
            get: function () {
                return this.configService.get('logging.level');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "logFile", {
            get: function () {
                return this.configService.get('logging.file');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "logMaxFiles", {
            get: function () {
                return this.configService.get('logging.maxFiles');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "logMaxSize", {
            get: function () {
                return this.configService.get('logging.maxSize');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "sentryDsn", {
            // Monitoring configuration
            get: function () {
                return this.configService.get('monitoring.sentryDsn');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "enableMetrics", {
            get: function () {
                return this.configService.get('monitoring.enableMetrics');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "metricsPort", {
            get: function () {
                return this.configService.get('monitoring.metricsPort');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "enableRegistration", {
            // Feature flags
            get: function () {
                return this.configService.get('features.enableRegistration');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "enableEmailVerification", {
            get: function () {
                return this.configService.get('features.enableEmailVerification');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "enableSocialLogin", {
            get: function () {
                return this.configService.get('features.enableSocialLogin');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "enableTwoFactor", {
            get: function () {
                return this.configService.get('features.enableTwoFactor');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "enableApiDocs", {
            get: function () {
                return this.configService.get('features.enableApiDocs');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "maxQuestionnairesPerOrg", {
            // Business rules
            get: function () {
                return this.configService.get('business.maxQuestionnairesPerOrg');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "maxQuestionsPerQuestionnaire", {
            get: function () {
                return this.configService.get('business.maxQuestionsPerQuestionnaire');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "maxExpenseAmount", {
            get: function () {
                return this.configService.get('business.maxExpenseAmount');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "reportRetentionDays", {
            get: function () {
                return this.configService.get('business.reportRetentionDays');
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(ConfigService_1.prototype, "passwordMinLength", {
            get: function () {
                return this.configService.get('business.passwordMinLength');
            },
            enumerable: false,
            configurable: true
        });
        // Helper methods
        ConfigService_1.prototype.getDatabaseUrl = function () {
            var _a = this, databaseUsername = _a.databaseUsername, databasePassword = _a.databasePassword, databaseHost = _a.databaseHost, databasePort = _a.databasePort, databaseName = _a.databaseName, databaseSsl = _a.databaseSsl;
            var credentials = databaseUsername && databasePassword
                ? "".concat(databaseUsername, ":").concat(databasePassword, "@")
                : '';
            var ssl = databaseSsl ? '?sslmode=require' : '';
            return "postgresql://".concat(credentials).concat(databaseHost, ":").concat(databasePort, "/").concat(databaseName).concat(ssl);
        };
        ConfigService_1.prototype.getFrontendUrl = function () {
            return this.configService.get('app.frontendUrl');
        };
        ConfigService_1.prototype.getBackendUrl = function () {
            return this.configService.get('app.backendUrl');
        };
        ConfigService_1.prototype.getApiUrl = function (path) {
            if (path === void 0) { path = ''; }
            return "".concat(this.getBackendUrl(), "/api").concat(path);
        };
        ConfigService_1.prototype.getCorsConfig = function () {
            return {
                origin: this.corsOrigins,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
            };
        };
        ConfigService_1.prototype.validateConfig = function () {
            var required = [
                'jwt.secret',
                'database.host',
                'database.database',
            ];
            for (var _i = 0, required_1 = required; _i < required_1.length; _i++) {
                var key = required_1[_i];
                var value = this.configService.get(key);
                if (!value) {
                    throw new Error("Configuration key \"".concat(key, "\" is required"));
                }
            }
            if (this.isProduction) {
                var productionRequired = [
                    'jwt.secret',
                    'jwt.refreshSecret',
                    'database.password',
                ];
                for (var _a = 0, productionRequired_1 = productionRequired; _a < productionRequired_1.length; _a++) {
                    var key = productionRequired_1[_a];
                    var value = this.configService.get(key);
                    if (!value || value.includes('change-in-production')) {
                        throw new Error("Production configuration key \"".concat(key, "\" must be properly set"));
                    }
                }
            }
        };
        return ConfigService_1;
    }());
    __setFunctionName(_classThis, "ConfigService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        ConfigService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return ConfigService = _classThis;
}();
exports.ConfigService = ConfigService;
