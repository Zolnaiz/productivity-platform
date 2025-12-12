"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@nestjs/core");
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var config_1 = require("@nestjs/config");
var compression = require("compression");
var helmet = require("helmet");
var morgan = require("morgan");
var app_module_1 = require("./app.module");
var http_exception_filter_1 = require("./shared/filters/http-exception.filter");
var transform_interceptor_1 = require("./shared/interceptors/transform.interceptor");
var logging_interceptor_1 = require("./shared/interceptors/logging.interceptor");
function bootstrap() {
    return __awaiter(this, void 0, void 0, function () {
        var app, configService, config, document, port;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, core_1.NestFactory.create(app_module_1.AppModule)];
                case 1:
                    app = _b.sent();
                    configService = app.get(config_1.ConfigService);
                    // Security middleware
                    app.use(helmet());
                    app.use(compression());
                    // Logging middleware
                    if (configService.get('NODE_ENV') === 'development') {
                        app.use(morgan('dev'));
                    }
                    // CORS configuration
                    app.enableCors({
                        origin: ((_a = configService.get('CORS_ORIGINS')) === null || _a === void 0 ? void 0 : _a.split(',')) || [
                            'http://localhost:3000',
                            'http://localhost:3001',
                            'http://localhost:8080',
                            'http://localhost:8081',
                            'http://10.0.2.2:3000',
                            'http://10.0.2.2:8080',
                        ],
                        credentials: true,
                        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                        allowedHeaders: [
                            'Content-Type',
                            'Authorization',
                            'X-Requested-With',
                            'Accept',
                            'Origin',
                            'X-Device-Id',
                            'X-App-Version',
                            'X-Platform',
                        ],
                        exposedHeaders: ['Content-Disposition'],
                    });
                    // Global pipes
                    app.useGlobalPipes(new common_1.ValidationPipe({
                        whitelist: true,
                        forbidNonWhitelisted: true,
                        transform: true,
                        transformOptions: {
                            enableImplicitConversion: true,
                        },
                        validationError: {
                            target: false,
                            value: false,
                        },
                    }));
                    // Global filters
                    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
                    // Global interceptors
                    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor(), new logging_interceptor_1.LoggingInterceptor());
                    // API prefix
                    app.setGlobalPrefix('api');
                    config = new swagger_1.DocumentBuilder()
                        .setTitle('Productivity Platform API')
                        .setDescription('Бүтээмж үнэлгээний платформын REST API документаци')
                        .setVersion('1.0')
                        .addBearerAuth()
                        .addTag('auth', 'Аутентикаци, бүртгэл')
                        .addTag('users', 'Хэрэглэгчийн менежмент')
                        .addTag('organizations', 'Байгууллагын менежмент')
                        .addTag('questionnaires', 'Асуулгын менежмент')
                        .addTag('responses', 'Хариултын менежмент')
                        .addTag('expenses', 'Зардлын менежмент')
                        .addTag('reports', 'Тайлангийн менежмент')
                        .addTag('system', 'Системийн тохиргоо')
                        .build();
                    document = swagger_1.SwaggerModule.createDocument(app, config);
                    swagger_1.SwaggerModule.setup('api/docs', app, document, {
                        swaggerOptions: {
                            persistAuthorization: true,
                            tagsSorter: 'alpha',
                            operationsSorter: 'alpha',
                            docExpansion: 'none',
                            filter: true,
                            showRequestDuration: true,
                        },
                        customSiteTitle: 'Productivity Platform API Documentation',
                        customfavIcon: '/favicon.ico',
                    });
                    port = configService.get('PORT') || 3000;
                    return [4 /*yield*/, app.listen(port)];
                case 2:
                    _b.sent();
                    console.log('🚀 ==========================================');
                    console.log('🚀 Productivity Platform Backend Started');
                    console.log("\uD83D\uDE80 Environment: ".concat(configService.get('NODE_ENV')));
                    console.log("\uD83D\uDE80 API Server: http://localhost:".concat(port));
                    console.log("\uD83D\uDE80 API Documentation: http://localhost:".concat(port, "/api/docs"));
                    console.log("\uD83D\uDE80 Database: ".concat(configService.get('DB_HOST'), ":").concat(configService.get('DB_PORT')));
                    console.log('🚀 ==========================================');
                    // Graceful shutdown
                    process.on('SIGTERM', function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log('SIGTERM signal received: closing HTTP server');
                                    return [4 /*yield*/, app.close()];
                                case 1:
                                    _a.sent();
                                    process.exit(0);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    process.on('SIGINT', function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log('SIGINT signal received: closing HTTP server');
                                    return [4 /*yield*/, app.close()];
                                case 1:
                                    _a.sent();
                                    process.exit(0);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
            }
        });
    });
}
bootstrap().catch(function (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
});
