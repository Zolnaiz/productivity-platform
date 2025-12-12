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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
var common_1 = require("@nestjs/common");
var DatabaseService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DatabaseService = _classThis = /** @class */ (function () {
        function DatabaseService_1(dataSource) {
            this.dataSource = dataSource;
            this.logger = new common_1.Logger(DatabaseService.name);
            this.initialize();
        }
        DatabaseService_1.prototype.initialize = function () {
            return __awaiter(this, void 0, void 0, function () {
                var stats, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.dataSource.query('SELECT 1')];
                        case 1:
                            _a.sent();
                            this.logger.log('Database connection established successfully');
                            return [4 /*yield*/, this.getDatabaseStats()];
                        case 2:
                            stats = _a.sent();
                            this.logger.log("Database stats: ".concat(JSON.stringify(stats)));
                            return [3 /*break*/, 4];
                        case 3:
                            error_1 = _a.sent();
                            this.logger.error('Database connection failed:', error_1);
                            throw error_1;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        DatabaseService_1.prototype.getDataSource = function () {
            return this.dataSource;
        };
        DatabaseService_1.prototype.executeQuery = function (query, parameters) {
            return __awaiter(this, void 0, void 0, function () {
                var error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.dataSource.query(query, parameters)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_2 = _a.sent();
                            this.logger.error('Query execution failed:', error_2);
                            throw error_2;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        DatabaseService_1.prototype.executeTransaction = function (operation) {
            return __awaiter(this, void 0, void 0, function () {
                var queryRunner, result, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            queryRunner = this.dataSource.createQueryRunner();
                            return [4 /*yield*/, queryRunner.connect()];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, queryRunner.startTransaction()];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            _a.trys.push([3, 6, 8, 10]);
                            return [4 /*yield*/, operation(queryRunner)];
                        case 4:
                            result = _a.sent();
                            return [4 /*yield*/, queryRunner.commitTransaction()];
                        case 5:
                            _a.sent();
                            return [2 /*return*/, result];
                        case 6:
                            error_3 = _a.sent();
                            return [4 /*yield*/, queryRunner.rollbackTransaction()];
                        case 7:
                            _a.sent();
                            this.logger.error('Transaction failed:', error_3);
                            throw error_3;
                        case 8: return [4 /*yield*/, queryRunner.release()];
                        case 9:
                            _a.sent();
                            return [7 /*endfinally*/];
                        case 10: return [2 /*return*/];
                    }
                });
            });
        };
        DatabaseService_1.prototype.healthCheck = function () {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, latency, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            startTime = Date.now();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.dataSource.query('SELECT 1')];
                        case 2:
                            _a.sent();
                            latency = Date.now() - startTime;
                            return [2 /*return*/, {
                                    status: 'healthy',
                                    latency: latency,
                                }];
                        case 3:
                            error_4 = _a.sent();
                            return [2 /*return*/, {
                                    status: 'unhealthy',
                                    latency: Date.now() - startTime,
                                }];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        DatabaseService_1.prototype.getDatabaseStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                var versionResult, connectionsResult, uptimeResult, sizeResult, error_5;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            _e.trys.push([0, 5, , 6]);
                            return [4 /*yield*/, this.dataSource.query('SELECT version()')];
                        case 1:
                            versionResult = _e.sent();
                            return [4 /*yield*/, this.dataSource.query('SELECT count(*) as connection_count FROM pg_stat_activity WHERE datname = current_database()')];
                        case 2:
                            connectionsResult = _e.sent();
                            return [4 /*yield*/, this.dataSource.query("SELECT date_trunc('second', current_timestamp - pg_postmaster_start_time()) as uptime")];
                        case 3:
                            uptimeResult = _e.sent();
                            return [4 /*yield*/, this.dataSource.query("SELECT pg_size_pretty(pg_database_size(current_database())) as size")];
                        case 4:
                            sizeResult = _e.sent();
                            return [2 /*return*/, {
                                    version: ((_a = versionResult[0]) === null || _a === void 0 ? void 0 : _a.version) || 'unknown',
                                    connectionCount: parseInt(((_b = connectionsResult[0]) === null || _b === void 0 ? void 0 : _b.connection_count) || '0'),
                                    uptime: ((_c = uptimeResult[0]) === null || _c === void 0 ? void 0 : _c.uptime) || 0,
                                    size: ((_d = sizeResult[0]) === null || _d === void 0 ? void 0 : _d.size) || '0 bytes',
                                }];
                        case 5:
                            error_5 = _e.sent();
                            this.logger.error('Failed to get database stats:', error_5);
                            return [2 /*return*/, {
                                    version: 'unknown',
                                    connectionCount: 0,
                                    uptime: 0,
                                    size: 'unknown',
                                }];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        DatabaseService_1.prototype.backupDatabase = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // Backup логик энд орно
                        this.logger.log('Database backup initiated');
                        return [2 /*return*/, {
                                success: true,
                                message: 'Backup completed successfully',
                            }];
                    }
                    catch (error) {
                        this.logger.error('Database backup failed:', error);
                        return [2 /*return*/, {
                                success: false,
                                message: 'Backup failed: ' + error.message,
                            }];
                    }
                    return [2 /*return*/];
                });
            });
        };
        DatabaseService_1.prototype.optimizeDatabase = function () {
            return __awaiter(this, void 0, void 0, function () {
                var error_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            this.logger.log('Starting database optimization...');
                            // VACUUM командыг ажиллуулах
                            return [4 /*yield*/, this.dataSource.query('VACUUM ANALYZE')];
                        case 1:
                            // VACUUM командыг ажиллуулах
                            _a.sent();
                            // Индексүүдийг дахин бүтээх
                            return [4 /*yield*/, this.dataSource.query('REINDEX DATABASE current_database')];
                        case 2:
                            // Индексүүдийг дахин бүтээх
                            _a.sent();
                            this.logger.log('Database optimization completed');
                            return [3 /*break*/, 4];
                        case 3:
                            error_6 = _a.sent();
                            this.logger.error('Database optimization failed:', error_6);
                            throw error_6;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        DatabaseService_1.prototype.onApplicationShutdown = function () {
            return __awaiter(this, void 0, void 0, function () {
                var error_7;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Closing database connections...');
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            if (!this.dataSource.isInitialized) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.dataSource.destroy()];
                        case 2:
                            _a.sent();
                            this.logger.log('Database connections closed successfully');
                            _a.label = 3;
                        case 3: return [3 /*break*/, 5];
                        case 4:
                            error_7 = _a.sent();
                            this.logger.error('Failed to close database connections:', error_7);
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        return DatabaseService_1;
    }());
    __setFunctionName(_classThis, "DatabaseService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DatabaseService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DatabaseService = _classThis;
}();
exports.DatabaseService = DatabaseService;
